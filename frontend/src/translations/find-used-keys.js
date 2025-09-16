const fs = require('fs');
const path = require('path');

// Function to recursively find all files with specific extensions
function findFiles(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to extract translation keys from file content
function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  
  // Patterns to match t('key') or t("key")
  const patterns = [
    /t\(['"`]([^'"`]+)['"`]\)/g,
    /t\(['"`]([^'"`]*\.[^'"`]+)['"`]\)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].includes('.')) {
        keys.add(match[1]);
      }
    }
  });
  
  return keys;
}

// Main execution
const frontendSrcDir = '..';
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

console.log('Scanning frontend source code for translation keys...\n');

const files = findFiles(frontendSrcDir, extensions);
const allUsedKeys = new Set();

files.forEach(file => {
  const keys = extractKeysFromFile(file);
  keys.forEach(key => allUsedKeys.add(key));
});

// Convert to sorted array
const sortedKeys = Array.from(allUsedKeys).sort();

console.log('=== USED TRANSLATION KEYS ===');
console.log(`Total unique keys found: ${sortedKeys.length}\n`);

sortedKeys.forEach(key => {
  console.log(key);
});

// Now let's compare with existing keys in translation files
console.log('\n\n=== COMPARING WITH TRANSLATION FILES ===\n');

// Read translation files
const enContent = fs.readFileSync('en.js', 'utf8');
const viContent = fs.readFileSync('vi.js', 'utf8');

// Extract keys from translation files
function extractKeysFromTranslation(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...extractKeysFromTranslation(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

const enMatch = enContent.match(/export\s+const\s+en\s*=\s*({[\s\S]*});/);
const viMatch = viContent.match(/export\s+const\s+vi\s*=\s*({[\s\S]*});/);

if (enMatch && viMatch) {
  const en = eval('(' + enMatch[1] + ')');
  const vi = eval('(' + viMatch[1] + ')');

  const enKeys = new Set(extractKeysFromTranslation(en));
  const viKeys = new Set(extractKeysFromTranslation(vi));

  // Find unused keys in English
  const unusedEnKeys = Array.from(enKeys).filter(key => !allUsedKeys.has(key)).sort();
  
  // Find unused keys in Vietnamese
  const unusedViKeys = Array.from(viKeys).filter(key => !allUsedKeys.has(key)).sort();

  // Find missing keys (used but not defined)
  const missingKeys = Array.from(allUsedKeys).filter(key => !enKeys.has(key) || !viKeys.has(key)).sort();

  console.log('=== UNUSED KEYS IN ENGLISH ===');
  console.log(`Count: ${unusedEnKeys.length}`);
  unusedEnKeys.forEach(key => console.log(key));

  console.log('\n=== UNUSED KEYS IN VIETNAMESE ===');
  console.log(`Count: ${unusedViKeys.length}`);
  unusedViKeys.forEach(key => console.log(key));

  console.log('\n=== MISSING KEYS (Used but not defined) ===');
  console.log(`Count: ${missingKeys.length}`);
  missingKeys.forEach(key => console.log(key));

  // Export for further processing
  module.exports = {
    usedKeys: sortedKeys,
    unusedEnKeys,
    unusedViKeys,
    missingKeys
  };
}
