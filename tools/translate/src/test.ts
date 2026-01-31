import { strict as assert } from "assert";
import * as fs from "fs/promises";
import * as path from "path";

import type { TranslationObject } from "../src/translationUtils";
import {
  getAllKeys,
  getMissingKeys,
  setNestedValue,
} from "../src/translationUtils";

async function runTests() {
  console.log("Running translation utility tests...\n");

  // Test 1: getAllKeys
  console.log("Test 1: getAllKeys");
  const testObj: TranslationObject = {
    common: {
      name: "Name",
      email: "Email",
    },
    actions: {
      save: "Save",
      delete: "Delete",
    },
  };
  const keys = getAllKeys(testObj);
  assert.equal(keys.size, 4, "Should have 4 keys");
  assert.equal(keys.get("common.name"), "Name");
  assert.equal(keys.get("actions.save"), "Save");
  console.log("✓ getAllKeys works correctly\n");

  // Test 2: getMissingKeys
  console.log("Test 2: getMissingKeys");
  const sourceKeys = new Map([
    ["common.name", "Name"],
    ["common.email", "Email"],
    ["actions.save", "Save"],
  ]);
  const targetKeys = new Map([
    ["common.name", "Nom"],
    ["actions.save", "Enregistrer"],
  ]);
  const missing = getMissingKeys(sourceKeys, targetKeys);
  assert.equal(missing.length, 1, "Should have 1 missing key");
  assert.equal(missing[0], "common.email");
  console.log("✓ getMissingKeys works correctly\n");

  // Test 3: setNestedValue
  console.log("Test 3: setNestedValue");
  const targetObj: TranslationObject = {
    common: {
      name: "Nom",
    },
  };
  setNestedValue(targetObj, "common.email", "E-mail");
  setNestedValue(targetObj, "actions.save", "Enregistrer");
  assert.equal(
    (targetObj.common as any).email,
    "E-mail",
    "Should set nested value",
  );
  assert.equal(
    (targetObj.actions as any).save,
    "Enregistrer",
    "Should create new nested object",
  );

  // Test prototype pollution prevention
  try {
    setNestedValue(targetObj, "__proto__.polluted", "bad");
    assert.fail("Should have thrown error for __proto__");
  } catch (error: any) {
    assert.ok(
      error.message.includes("not allowed for security reasons"),
      "Should prevent __proto__ pollution",
    );
  }

  try {
    setNestedValue(targetObj, "constructor.polluted", "bad");
    assert.fail("Should have thrown error for constructor");
  } catch (error: any) {
    assert.ok(
      error.message.includes("not allowed for security reasons"),
      "Should prevent constructor pollution",
    );
  }

  console.log("✓ setNestedValue works correctly (with security checks)\n");

  // Test 4: Real file analysis
  console.log("Test 4: Real file analysis");
  const baseDir = path.resolve(
    process.cwd(),
    "../../apps/web/lib/i18n/locales",
  );

  try {
    // Load English translations
    const enFile = path.join(baseDir, "en", "translation.json");
    const enContent = await fs.readFile(enFile, "utf-8");
    const enTranslations = JSON.parse(enContent);
    const enKeys = getAllKeys(enTranslations);
    console.log(`  English has ${enKeys.size} keys`);

    // Load French translations
    const frFile = path.join(baseDir, "fr", "translation.json");
    const frContent = await fs.readFile(frFile, "utf-8");
    const frTranslations = JSON.parse(frContent);
    const frKeys = getAllKeys(frTranslations);
    console.log(`  French has ${frKeys.size} keys`);

    // Find missing keys
    const missingInFr = getMissingKeys(enKeys, frKeys);
    console.log(`  French is missing ${missingInFr.length} keys`);

    if (missingInFr.length > 0) {
      console.log("  Sample missing keys:");
      missingInFr.slice(0, 5).forEach((key) => {
        console.log(`    - ${key}: "${enKeys.get(key)}"`);
      });
    }

    console.log("✓ Real file analysis works\n");
  } catch (error) {
    console.log("  ⚠ Could not analyze real files (this is OK in test env)");
    console.log(`  Error: ${error}\n`);
  }

  console.log("All tests passed! ✅");
}

runTests().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
