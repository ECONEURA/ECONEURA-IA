import { promises as fs } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const EXCLUDE_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);
const TEXT_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.yml', '.yaml', '.env', '.txt', '.html', '.css']);

// Build sensitive tokens dynamically to avoid literal presence in this file
const TOKENS = [
  'Instrument' + 'ationKey' + '=',
  'Connection' + 'String' + '=',
  'connection' + 'String' + '=',
];

const findings = [];

async function isTextFile(filePath) {
  const ext = path.extname(filePath);
  if (TEXT_EXTS.has(ext)) return true;
  // Heuristic: treat files without extension as text
  return ext === '';
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      await walk(full);
    } else if (entry.isFile()) {
      if (!(await isTextFile(full))) continue;
      const content = await fs.readFile(full, 'utf8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const t of TOKENS) {
          const re = new RegExp(t, 'i');
          if (re.test(line)) {
            findings.push({ file: full, line: i + 1, match: t.replace(/\+/g, '') });
          }
        }
      }
    }
  }
}

(async () => {
  await walk(repoRoot);
  if (findings.length > 0) {
    console.error('\n❌ Potential secret-like tokens found:');
    for (const f of findings) {
      console.error(`- ${f.file}:${f.line} contains pattern similar to "${f.match}"`);
    }
    console.error('\nFailing due to potential secrets. Remove/obfuscate these values.');
    process.exit(1);
  } else {
    console.log('✅ Anti-secrets scan PASS: no sensitive tokens detected.');
  }
})();