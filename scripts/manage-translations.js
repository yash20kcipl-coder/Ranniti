#!/usr/bin/env node

/**
 * UI Translation Management & Sync Utility for Ranniti Mobile Application
 *
 * Usage:
 *   node scripts/manage-translations.js add <key> "<enText>" "<hiText>"
 *   node scripts/manage-translations.js check
 *   node scripts/manage-translations.js list [searchTerm]
 *   node scripts/manage-translations.js scan [filePathOrDir]
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EN_PATH = path.resolve(ROOT_DIR, 'app/src/languages/en.ts');
const HI_PATH = path.resolve(ROOT_DIR, 'app/src/languages/hi.ts');

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

function addTranslation(key, enText, hiText) {
  if (!key || !enText) {
    console.error('❌ Error: Both key and English text are required.\nUsage: node scripts/manage-translations.js add <key> "<enText>" "<hiText>"');
    process.exit(1);
  }

  // Validate key format (camelCase)
  if (!/^[a-zA-Z0-9_$]+$/.test(key)) {
    console.error(`❌ Error: Key "${key}" must be a valid alphanumeric identifier (camelCase).`);
    process.exit(1);
  }

  const resolvedHiText = hiText && hiText.trim() ? hiText.trim() : enText;

  insertKeyIntoFile(EN_PATH, key, enText.trim());
  insertKeyIntoFile(HI_PATH, key, resolvedHiText);

  console.log(`\n✅ Successfully added translation key: "${key}"`);
  console.log(`   🇺🇸 EN (${path.relative(ROOT_DIR, EN_PATH)}): "${enText.trim()}"`);
  console.log(`   🇮🇳 HI (${path.relative(ROOT_DIR, HI_PATH)}): "${resolvedHiText}"`);
  if (!hiText || !hiText.trim()) {
    console.warn('   ⚠️  Note: Hindi text was not provided, used English text as fallback. Update it in hi.ts when available.');
  }
}

function checkParity() {
  console.log('\n🔍 Checking translation parity between English and Hindi...');
  const enData = parseLanguageFile(EN_PATH);
  const hiData = parseLanguageFile(HI_PATH);

  const missingInHi = [];
  const missingInEn = [];

  for (const key of enData.entries.keys()) {
    if (!hiData.entries.has(key)) {
      missingInHi.push(key);
    }
  }

  for (const key of hiData.entries.keys()) {
    if (!enData.entries.has(key)) {
      missingInEn.push(key);
    }
  }

  console.log(`   Total English keys: ${enData.entries.size}`);
  console.log(`   Total Hindi keys:   ${hiData.entries.size}`);

  let hasErrors = false;

  if (missingInHi.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in en.ts but MISSING in hi.ts (${missingInHi.length}):`);
    missingInHi.forEach((k) => console.error(`   - ${k}: "${enData.entries.get(k)}"`));
  }

  if (missingInEn.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Keys in hi.ts but MISSING in en.ts (${missingInEn.length}):`);
    missingInEn.forEach((k) => console.error(`   - ${k}: "${hiData.entries.get(k)}"`));
  }

  if (!hasErrors) {
    console.log('\n🎉 Perfect! 100% translation key parity between English and Hindi.\n');
  } else {
    console.log('\n⚠️  Please sync missing translation keys to avoid TypeScript compilation errors.\n');
    process.exit(1);
  }
}

function listTranslations(query) {
  const enData = parseLanguageFile(EN_PATH);
  const hiData = parseLanguageFile(HI_PATH);
  const q = (query || '').toLowerCase();

  console.log(`\n📋 Translation Entries ${q ? `matching "${query}"` : ''}:`);
  let count = 0;
  for (const [key, enVal] of enData.entries.entries()) {
    const hiVal = hiData.entries.get(key) || '<MISSING>';
    if (!q || key.toLowerCase().includes(q) || enVal.toLowerCase().includes(q) || hiVal.toLowerCase().includes(q)) {
      console.log(` • ${key}`);
      console.log(`   EN: "${enVal}"`);
      console.log(`   HI: "${hiVal}"`);
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

  if (!fullPath.endsWith('.tsx')) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  // Match string literals inside JSX Text tags: <Text...>Some text</Text>
  const textTagRegex = /<Text[^>]*>([^{<>\n]+)<\/Text>/g;
  let match;
  const hardcoded = [];
  while ((match = textTagRegex.exec(content)) !== null) {
    const raw = match[1].trim();
    if (raw && !raw.startsWith('{') && isNaN(Number(raw))) {
      hardcoded.push(raw);
    }
  }

  if (hardcoded.length > 0) {
    console.log(`\n📄 Hardcoded text in: ${path.relative(ROOT_DIR, fullPath)}`);
    hardcoded.forEach((t) => console.log(`   - "${t}"`));
  }
}

// CLI Routing
const [command, arg1, arg2, arg3] = process.argv.slice(2);

switch (command) {
  case 'add':
    addTranslation(arg1, arg2, arg3);
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
  node scripts/manage-translations.js add <key> "<enText>" "<hiText>"
      Add or update a translation key in both en.ts and hi.ts.

  node scripts/manage-translations.js check
      Verify 100% key parity between English and Hindi language files.

  node scripts/manage-translations.js list [searchTerm]
      List or search all defined translation keys and values.

  node scripts/manage-translations.js scan [filePath]
      Scan React Native UI components for untranslated text strings.
`);
    break;
}
