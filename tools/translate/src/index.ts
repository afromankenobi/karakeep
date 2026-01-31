#!/usr/bin/env node
import chalk from "chalk";
import * as path from "path";
import * as readline from "readline/promises";

import { langNameMappings } from "@karakeep/shared/langs";

import { config } from "./config";
import { TranslationService } from "./translationService";
import {
  getAllKeys,
  getMissingKeys,
  listLanguageDirs,
  loadTranslationFile,
  saveTranslationFile,
  setNestedValue,
  type TranslationObject,
} from "./translationUtils";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(question: string): Promise<string> {
  return await rl.question(question);
}

async function main() {
  console.log(chalk.cyan("\n🌍 Karakeep AI Translation Tool\n"));

  const translationsBaseDir = path.resolve(
    process.cwd(),
    config.TRANSLATIONS_DIR,
  );
  const sourceLanguage = "en";
  const sourceFile = path.join(
    translationsBaseDir,
    sourceLanguage,
    "translation.json",
  );

  console.log(chalk.gray(`Base directory: ${translationsBaseDir}`));
  console.log(chalk.gray(`Source language: ${sourceLanguage}\n`));

  // Load source translations
  console.log(chalk.blue("📖 Loading source translations..."));
  const sourceTranslations = await loadTranslationFile(sourceFile);
  const sourceKeys = getAllKeys(sourceTranslations);
  console.log(
    chalk.green(`✓ Loaded ${sourceKeys.size} keys from ${sourceLanguage}\n`),
  );

  // Get all available languages
  const availableLanguages = await listLanguageDirs(translationsBaseDir);
  const targetLanguages = availableLanguages.filter((lang) => lang !== "en");

  console.log(chalk.blue("Available target languages:"));
  targetLanguages.forEach((lang, index) => {
    const langName = langNameMappings[lang] || lang;
    console.log(chalk.gray(`  ${index + 1}. ${lang} (${langName})`));
  });

  // Ask which languages to translate
  console.log();
  const languageChoice = await askQuestion(
    chalk.yellow(
      "Which languages do you want to translate? (comma-separated codes, or 'all'): ",
    ),
  );

  let selectedLanguages: string[];
  if (languageChoice.trim().toLowerCase() === "all") {
    selectedLanguages = targetLanguages;
  } else {
    selectedLanguages = languageChoice
      .split(",")
      .map((l) => l.trim())
      .filter((l) => targetLanguages.includes(l));
  }

  if (selectedLanguages.length === 0) {
    console.log(chalk.red("\n✗ No valid languages selected. Exiting.\n"));
    rl.close();
    process.exit(1);
  }

  console.log(
    chalk.green(
      `\n✓ Selected ${selectedLanguages.length} language(s): ${selectedLanguages.join(", ")}\n`,
    ),
  );

  // Analyze missing keys
  console.log(chalk.blue("🔍 Analyzing missing translations...\n"));
  const missingByLanguage = new Map<string, string[]>();

  for (const lang of selectedLanguages) {
    const targetFile = path.join(
      translationsBaseDir,
      lang,
      "translation.json",
    );
    const targetTranslations = await loadTranslationFile(targetFile);
    const targetKeys = getAllKeys(targetTranslations);
    const missing = getMissingKeys(sourceKeys, targetKeys);

    if (missing.length > 0) {
      missingByLanguage.set(lang, missing);
      const langName = langNameMappings[lang] || lang;
      console.log(
        chalk.yellow(
          `  ${lang} (${langName}): ${missing.length} missing key(s)`,
        ),
      );
    } else {
      const langName = langNameMappings[lang] || lang;
      console.log(chalk.green(`  ${lang} (${langName}): ✓ Complete`));
    }
  }

  if (missingByLanguage.size === 0) {
    console.log(chalk.green("\n✓ All languages are complete! Nothing to do.\n"));
    rl.close();
    return;
  }

  console.log();
  const confirmTranslation = await askQuestion(
    chalk.yellow(
      "Do you want to generate missing translations using AI? (yes/no): ",
    ),
  );

  if (confirmTranslation.toLowerCase() !== "yes") {
    console.log(chalk.gray("\nTranslation cancelled.\n"));
    rl.close();
    return;
  }

  // Initialize translation service
  console.log(
    chalk.blue(`\n🤖 Initializing AI translation service (${config.OPENAI_MODEL})...\n`),
  );
  const translationService = new TranslationService();

  // Translate for each language
  for (const [lang, missingKeys] of missingByLanguage.entries()) {
    const langName = langNameMappings[lang] || lang;
    console.log(
      chalk.cyan(`\n📝 Translating ${missingKeys.length} keys to ${langName}...`),
    );

    const targetFile = path.join(
      translationsBaseDir,
      lang,
      "translation.json",
    );
    const targetTranslations = await loadTranslationFile(targetFile);

    // Prepare texts for batch translation
    const textsToTranslate = missingKeys.map((key) => {
      const value = sourceKeys.get(key);
      return {
        key,
        value: String(value),
        context: key, // Use the key path as context
      };
    });

    // Translate in batches
    console.log(chalk.gray("  Translating... (this may take a while)"));
    const translations = await translationService.translateBatch(
      textsToTranslate,
      "English",
      langName,
    );

    // Update target translations
    let successCount = 0;
    for (const [key, translatedValue] of translations.entries()) {
      setNestedValue(targetTranslations, key, translatedValue);
      successCount++;
    }

    // Save updated translations
    await saveTranslationFile(targetFile, targetTranslations);
    console.log(
      chalk.green(`  ✓ Saved ${successCount} new translation(s) to ${lang}`),
    );
  }

  console.log(chalk.green("\n✓ Translation completed successfully!\n"));
  rl.close();
}

main().catch((error) => {
  console.error(chalk.red("\n✗ Error:"), error);
  rl.close();
  process.exit(1);
});
