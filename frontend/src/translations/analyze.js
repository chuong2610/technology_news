const fs = require('fs');

// Read both files
const enContent = fs.readFileSync('en.js', 'utf8');
const viContent = fs.readFileSync('vi.js', 'utf8');

// Function to extract keys from a translation object
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...extractKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

// Extract the export statements
const enMatch = enContent.match(/export\s+const\s+en\s*=\s*({[\s\S]*});/);
const viMatch = viContent.match(/export\s+const\s+vi\s*=\s*({[\s\S]*});/);

if (!enMatch || !viMatch) {
  console.log('Could not parse translation files');
  process.exit(1);
}

// Evaluate the objects (unsafe but for this purpose it works)
const en = eval('(' + enMatch[1] + ')');
const vi = eval('(' + viMatch[1] + ')');

const enKeys = extractKeys(en).sort();
const viKeys = extractKeys(vi).sort();

console.log('=== Keys missing in vi.js (present in en.js) ===');
const missingInVi = enKeys.filter(key => !viKeys.includes(key));
missingInVi.forEach(key => console.log(key));

console.log('\n=== Keys missing in en.js (present in vi.js) ===');
const missingInEn = viKeys.filter(key => !enKeys.includes(key));
missingInEn.forEach(key => console.log(key));

console.log(`\nSummary:`);
console.log(`- Keys missing in vi.js: ${missingInVi.length}`);
console.log(`- Keys missing in en.js: ${missingInEn.length}`);

// Export the missing keys for easy access
module.exports = { missingInVi, missingInEn };
