const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const excludeDirs = new Set(['node_modules', '.git']);

const replacements = [
  { from: /\blate Night\b/g, to: 'skz_rayan23' },
  { from: /\bLate Night\b/g, to: 'skz_rayan23' },
  { from: /\blate night\b/gi, to: 'skz_rayan23' },
  { from: /\bPaul Dev\b/g, to: 'skz_rayan23' },
  { from: /skz_rayan23 🍷/g, to: 'skz_rayan23' }
];

const textFileExt = new Set(['.js', '.json', '.md', '.txt', '.ejs', '.html', '.css', '.mdown', '.mdx']);

function shouldProcess(filePath) {
  const rel = path.relative(root, filePath);
  if (rel.startsWith('..')) return false;
  if (rel.split(path.sep).some(p => excludeDirs.has(p))) return false;
  const ext = path.extname(filePath).toLowerCase();
  return textFileExt.has(ext) || ext === '' || filePath.includes('src');
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (excludeDirs.has(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      if (!shouldProcess(full)) continue;
      try {
        let content = fs.readFileSync(full, 'utf8');
        let original = content;
        for (const r of replacements) {
          content = content.replace(r.from, r.to);
        }
        if (content !== original) {
          fs.writeFileSync(full, content, 'utf8');
          console.log('[UPDATED]', path.relative(root, full));
        }
      } catch (err) {
        // skip binary or unreadable files
      }
    }
  }
}

console.log('Starting replacement run...');
walk(root);
console.log('Done.');
