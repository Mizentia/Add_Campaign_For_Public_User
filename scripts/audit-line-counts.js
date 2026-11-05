const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const MAX_LINES = 100;
const ignoreDirs = new Set(['.git', 'node_modules', 'data', '.vercel']);
const allowedExts = new Set(['.js', '.css', '.html', '.json', '.md', '.bat']);

const violations = [];
let totalFilesChecked = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!allowedExts.has(ext)) continue;
      const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
      totalFilesChecked++;
      if (lines > MAX_LINES) {
        violations.push({ file: path.relative(rootDir, fullPath).replace(/\\/g, '/'), lines });
      }
    }
  }
}

walk(rootDir);

if (violations.length === 0) {
  console.log(`✅ 100% PASS: All ${totalFilesChecked} files in Add Campaign (Public User) are within ${MAX_LINES} lines! 🎉`);
  process.exit(0);
} else {
  console.error(`❌ Found ${violations.length} files exceeding ${MAX_LINES} lines:`);
  violations.forEach(v => console.error(`  - ${v.file}: ${v.lines} lines`));
  process.exit(1);
}
