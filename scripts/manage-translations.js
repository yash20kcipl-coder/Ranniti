#!/usr/bin/env node

/**
 * UI Translation Management & Sync Utility for Ranniti Mobile Application
 *
 * Usage:
 *   node scripts/manage-translations.js add <key> "<enText>" "<hiText>" ["<guText>"]
 *   node scripts/manage-translations.js init-gu [jsonPath]
 *   node scripts/manage-translations.js check
 *   node scripts/manage-translations.js list [searchTerm]
 *   node scripts/manage-translations.js scan [filePathOrDir]
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EN_PATH = path.resolve(ROOT_DIR, 'app/src/languages/en.ts');
const HI_PATH = path.resolve(ROOT_DIR, 'app/src/languages/hi.ts');
const GU_PATH = path.resolve(ROOT_DIR, 'app/src/languages/gu.ts');

function parseLanguageFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = new Map();
  const regex = /^\s*([a-zA-Z0-9_$]+)\s*:\s*(['"`])([\s\S]*?)\2\s*,?\s*$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[3];
    entries.set(key, value);
  }
  return { content, entries };
}

function insertKeyIntoFile(filePath, key, value) {
  let content = fs.readFileSync(filePath, 'utf8');
  const safeValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const newEntry = `  ${key}: '${safeValue}',\n`;

  // Find closing of object
  const lastBraceIndex = content.lastIndexOf('};');
  if (lastBraceIndex === -1) {
    throw new Error(`Could not find closing '};' in ${filePath}`);
  }

  // Check if key already exists
  const keyRegex = new RegExp(`^\\s*${key}\\s*:`, 'm');
  if (keyRegex.test(content)) {
    // Replace existing key
    content = content.replace(
      new RegExp(`^\\s*${key}\\s*:\\s*(['"\`])[\\s\\S]*?\\1\\s*,?`, 'm'),
      `  ${key}: '${safeValue}',`
    );
  } else {
    // Insert right before closing '};'
    content = content.slice(0, lastBraceIndex) + newEntry + content.slice(lastBraceIndex);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function ensureGuFileExists() {
  if (!fs.existsSync(GU_PATH)) {
    const template = `import { TranslationKeys } from './en';\n\nexport const gu: Record<TranslationKeys, string> = {\n};\n`;
    fs.writeFileSync(GU_PATH, template, 'utf8');
  }
}

function addTranslation(key, enText, hiText, guText) {
  if (!key || !enText) {
    console.error('❌ Error: Both key and English text are required.\nUsage: node scripts/manage-translations.js add <key> "<enText>" "<hiText>" ["<guText>"]');
    process.exit(1);
  }

  // Validate key format (camelCase)
  if (!/^[a-zA-Z0-9_$]+$/.test(key)) {
    console.error(`❌ Error: Key "${key}" must be a valid alphanumeric identifier (camelCase).`);
    process.exit(1);
  }

  ensureGuFileExists();

  const resolvedHiText = hiText && hiText.trim() ? hiText.trim() : enText.trim();
  const resolvedGuText = guText && guText.trim() ? guText.trim() : enText.trim();

  insertKeyIntoFile(EN_PATH, key, enText.trim());
  insertKeyIntoFile(HI_PATH, key, resolvedHiText);
  insertKeyIntoFile(GU_PATH, key, resolvedGuText);

  console.log(`\n✅ Successfully added translation key: "${key}"`);
  console.log(`   🇺🇸 EN (${path.relative(ROOT_DIR, EN_PATH)}): "${enText.trim()}"`);
  console.log(`   🇮🇳 HI (${path.relative(ROOT_DIR, HI_PATH)}): "${resolvedHiText}"`);
  console.log(`   🇮🇳 GU (${path.relative(ROOT_DIR, GU_PATH)}): "${resolvedGuText}"`);
  if (!hiText || !hiText.trim()) {
    console.warn('   ⚠️  Note: Hindi text was not provided, used English text as fallback. Update it in hi.ts when available.');
  }
  if (!guText || !guText.trim()) {
    console.warn('   ⚠️  Note: Gujarati text was not provided, used English text as fallback. Update it in gu.ts when available.');
  }
}

function initGuFile(jsonPath) {
  let overrides = {};
  if (jsonPath) {
    const resolvedJsonPath = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(ROOT_DIR, jsonPath);
    if (!fs.existsSync(resolvedJsonPath)) {
      console.error(`❌ Error: JSON translation file not found: ${resolvedJsonPath}`);
      process.exit(1);
    }
    overrides = JSON.parse(fs.readFileSync(resolvedJsonPath, 'utf8'));
  }

  const enContent = fs.readFileSync(EN_PATH, 'utf8');
  const existingGu = fs.existsSync(GU_PATH) ? parseLanguageFile(GU_PATH).entries : new Map();

  // Preserve section comments and key order from en.ts
  const lines = enContent.split('\n');
  const outLines = [
    "import { TranslationKeys } from './en';",
    '',
    'export const gu: Record<TranslationKeys, string> = {',
  ];

  const keyLineRegex = /^\s*([a-zA-Z0-9_$]+)\s*:\s*(['"`])([\s\S]*?)\2\s*,?\s*$/;
  let translatedCount = 0;
  let totalCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      outLines.push(`  ${trimmed}`);
      continue;
    }
    const match = line.match(keyLineRegex);
    if (match) {
      const key = match[1];
      const enVal = match[3];
      totalCount++;
      const guVal = overrides[key] !== undefined
        ? overrides[key]
        : (existingGu.has(key) ? existingGu.get(key) : enVal);
      if (overrides[key] !== undefined || (existingGu.has(key) && existingGu.get(key) !== enVal)) {
        translatedCount++;
      }
      const safeValue = String(guVal).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      outLines.push(`  ${key}: '${safeValue}',`);
    }
  }

  outLines.push('};');
  outLines.push('');

  fs.writeFileSync(GU_PATH, outLines.join('\n'), 'utf8');
  console.log(`\n✅ Generated ${path.relative(ROOT_DIR, GU_PATH)} with ${totalCount} keys (${translatedCount} translated/updated).\n`);
}

function checkParity() {
  console.log('\n🔍 Checking translation parity across English, Hindi, and Gujarati...');
  const enData = parseLanguageFile(EN_PATH);
  const hiData = parseLanguageFile(HI_PATH);
  const guExists = fs.existsSync(GU_PATH);
  const guData = guExists ? parseLanguageFile(GU_PATH) : { entries: new Map() };

  const missingInHi = [];
  const missingInGu = [];
  const missingInEnFromHi = [];
  const missingInEnFromGu = [];

  for (const key of enData.entries.keys()) {
    if (!hiData.entries.has(key)) missingInHi.push(key);
    if (guExists && !guData.entries.has(key)) missingInGu.push(key);
  }

  for (const key of hiData.entries.keys()) {
    if (!enData.entries.has(key)) missingInEnFromHi.push(key);
  }

  if (guExists) {
    for (const key of guData.entries.keys()) {
      if (!enData.entries.has(key)) missingInEnFromGu.push(key);
    }
  }

  console.log(`   Total English keys:  ${enData.entries.size}`);
  console.log(`   Total Hindi keys:    ${hiData.entries.size}`);
  console.log(`   Total Gujarati keys: ${guExists ? guData.entries.size : 'MISSING FILE (gu.ts)'}`);

  let hasErrors = false;

  if (!guExists) {
    hasErrors = true;
    console.error('\n❌ app/src/languages/gu.ts does not exist. Run "node scripts/manage-translations.js init-gu" to create it.');
  }

  if (missingInHi.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in en.ts but MISSING in hi.ts (${missingInHi.length}):`);
    missingInHi.forEach((k) => console.error(`   - ${k}: "${enData.entries.get(k)}"`));
  }

  if (missingInGu.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in en.ts but MISSING in gu.ts (${missingInGu.length}):`);
    missingInGu.forEach((k) => console.error(`   - ${k}: "${enData.entries.get(k)}"`));
  }

  if (missingInEnFromHi.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in hi.ts but MISSING in en.ts (${missingInEnFromHi.length}):`);
    missingInEnFromHi.forEach((k) => console.error(`   - ${k}: "${hiData.entries.get(k)}"`));
  }

  if (missingInEnFromGu.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in gu.ts but MISSING in en.ts (${missingInEnFromGu.length}):`);
    missingInEnFromGu.forEach((k) => console.error(`   - ${k}: "${guData.entries.get(k)}"`));
  }

  if (!hasErrors) {
    console.log('\n🎉 Perfect! 100% translation key parity across English, Hindi, and Gujarati.\n');
  } else {
    console.log('\n⚠️  Please sync missing translation keys to avoid TypeScript compilation errors.\n');
    process.exit(1);
  }
}

function listTranslations(query) {
  const enData = parseLanguageFile(EN_PATH);
  const hiData = parseLanguageFile(HI_PATH);
  const guData = fs.existsSync(GU_PATH) ? parseLanguageFile(GU_PATH) : { entries: new Map() };
  const q = (query || '').toLowerCase();

  console.log(`\n📋 Translation Entries ${q ? `matching "${query}"` : ''}:`);
  let count = 0;
  for (const [key, enVal] of enData.entries.entries()) {
    const hiVal = hiData.entries.get(key) || '<MISSING>';
    const guVal = guData.entries.get(key) || '<MISSING>';
    if (
      !q ||
      key.toLowerCase().includes(q) ||
      enVal.toLowerCase().includes(q) ||
      hiVal.toLowerCase().includes(q) ||
      guVal.toLowerCase().includes(q)
    ) {
      console.log(` • ${key}`);
      console.log(`   EN: "${enVal}"`);
      console.log(`   HI: "${hiVal}"`);
      console.log(`   GU: "${guVal}"`);
      count++;
    }
  }
  console.log(`\nFound ${count} matching translation(s).\n`);
}

function scanFileForHardcodedText(targetPath) {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(ROOT_DIR, targetPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Path not found: ${fullPath}`);
    return;
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(fullPath);
    for (const f of files) {
      if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        scanFileForHardcodedText(path.join(fullPath, f));
      }
    }
    return;
  }

  if (!fullPath.endsWith('.tsx') || fullPath.includes('Skeleton') || fullPath.endsWith('styles.tsx')) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  const hardcoded = [];

  // Match string literals inside JSX Text tags (single-line or multiline): <Text...>Some text</Text>
  const textTagRegex = /<Text[^>]*>([^<{]+)<\/Text>/g;
  let match;
  while ((match = textTagRegex.exec(content)) !== null) {
    const raw = match[1].replace(/\s+/g, ' ').trim();
    if (raw && /[a-zA-Z]{2,}/.test(raw) && !/^(&nbsp;|&bull;|&middot;)$/.test(raw)) {
      hardcoded.push(`Text: "${raw}"`);
    }
  }

  // Match common UI props with string literals
  const propRegex = /\b(title|subtitle|label|placeholder|emptyText|emptyTitle|emptySubtitle|confirmText|cancelText|text1|text2)\s*[:=]\s*(['"])([^'"{}]+)\2/g;
  while ((match = propRegex.exec(content)) !== null) {
    const prop = match[1];
    const val = match[3].trim();
    if (val && /[a-zA-Z]{2,}/.test(val) && !val.startsWith('http') && !/^[a-z0-9_-]+$/.test(val)) {
      hardcoded.push(`${prop}: "${val}"`);
    }
  }

  // Match Alert.alert calls
  const alertRegex = /Alert\.alert\s*\(([^)]+)\)/g;
  while ((match = alertRegex.exec(content)) !== null) {
    hardcoded.push(`Alert.alert(${match[1].replace(/\s+/g, ' ').slice(0, 80)})`);
  }

  if (hardcoded.length > 0) {
    console.log(`\n📄 Hardcoded text in: ${path.relative(ROOT_DIR, fullPath)}`);
    hardcoded.forEach((t) => console.log(`   - ${t}`));
  }
}

// CLI Routing
const [command, arg1, arg2, arg3, arg4] = process.argv.slice(2);

switch (command) {
  case 'add':
    addTranslation(arg1, arg2, arg3, arg4);
    break;
  case 'init-gu':
    initGuFile(arg1);
    break;
  case 'check':
  case 'parity':
    checkParity();
    break;
  case 'list':
  case 'search':
    listTranslations(arg1);
    break;
  case 'scan':
    scanFileForHardcodedText(arg1 || 'app/src');
    break;
  default:
    console.log(`
Ranniti Translation Management CLI

Commands:
  node scripts/manage-translations.js add <key> "<enText>" "<hiText>" ["<guText>"]
      Add or update a translation key in en.ts, hi.ts, and gu.ts.

  node scripts/manage-translations.js init-gu [jsonPath]
      Generate or update gu.ts from en.ts keys (optionally applying a JSON map).

  node scripts/manage-translations.js check
      Verify 100% key parity across English, Hindi, and Gujarati language files.

  node scripts/manage-translations.js list [searchTerm]
      List or search all defined translation keys and values.

  node scripts/manage-translations.js scan [filePath]
      Scan React Native UI components for untranslated text strings.
`);
    break;
}
