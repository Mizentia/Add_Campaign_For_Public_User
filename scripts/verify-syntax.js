const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const rootDir = path.join(__dirname, '..');
const jsFiles = [
  ...walk(path.join(rootDir, 'js')),
  ...walk(path.join(rootDir, 'scripts')),
  path.join(rootDir, 'server.js')
];

let errors = 0;
jsFiles.forEach((file) => {
  try {
    execSync(`node --check "${file}"`);
  } catch (err) {
    console.error(`❌ Syntax error in ${file}:`, err.message);
    errors++;
  }
});

if (errors === 0) {
  console.log(`✅ All ${jsFiles.length} JavaScript files in Add Campaign (Public User) passed syntax verification!`);
} else {
  console.error(`❌ Found ${errors} syntax errors.`);
  process.exit(1);
}
