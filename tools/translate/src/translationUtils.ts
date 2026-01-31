import * as fs from "fs/promises";
import * as path from "path";

export type TranslationObject = Record<string, unknown>;

export async function loadTranslationFile(
  filePath: string,
): Promise<TranslationObject> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export async function saveTranslationFile(
  filePath: string,
  translations: TranslationObject,
): Promise<void> {
  const content = JSON.stringify(translations, null, 2) + "\n";
  await fs.writeFile(filePath, content, "utf-8");
}

export function getAllKeys(
  obj: TranslationObject,
  prefix = "",
): Map<string, unknown> {
  const keys = new Map<string, unknown>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value as TranslationObject, fullKey);
      nestedKeys.forEach((v, k) => keys.set(k, v));
    } else {
      keys.set(fullKey, value);
    }
  }

  return keys;
}

export function getMissingKeys(
  sourceKeys: Map<string, unknown>,
  targetKeys: Map<string, unknown>,
): string[] {
  const missing: string[] = [];

  for (const key of sourceKeys.keys()) {
    if (!targetKeys.has(key)) {
      missing.push(key);
    }
  }

  return missing;
}

export function setNestedValue(
  obj: TranslationObject,
  keyPath: string,
  value: unknown,
): void {
  const keys = keyPath.split(".");
  let current: any = obj;

  // Guard against prototype pollution
  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;

    // Prevent prototype pollution
    if (dangerousKeys.includes(key)) {
      throw new Error(
        `Cannot set nested value: key "${key}" is not allowed for security reasons`,
      );
    }

    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1]!;

  // Prevent prototype pollution on the last key
  if (dangerousKeys.includes(lastKey)) {
    throw new Error(
      `Cannot set nested value: key "${lastKey}" is not allowed for security reasons`,
    );
  }

  current[lastKey] = value;
}

export async function listLanguageDirs(baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
