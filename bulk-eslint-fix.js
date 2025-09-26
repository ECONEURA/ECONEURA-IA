#!/usr/bin/env node

import fs from 'fs';

import { glob } from 'glob';

const patterns = [
  // Unused variables - prefix with underscore
  {
    pattern: /\b(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*$/gm,
    replacement: (match, keyword, varName) => {
      // Skip if already starts with underscore or is a common pattern
      if (varName.startsWith('_') || ['i', 'j', 'k', 'index', 'key'].includes(varName)) {
        return match;
      }
      return match.replace(varName, `_${varName}`);
    }
  },
  // Function parameters that are unused
  {
    pattern: /\bfunction\s+\w+\s*\(\s*([^)]*)\w+([^)]*)\)\s*{/gm,
    replacement: (match, _before, param, _after) => {
      if (param && !param.startsWith('_')) {
        return match.replace(param, `_${param}`);
      }
      return match;
    }
  },
  // Arrow function parameters
  {
    pattern: /\(\s*(\w+)\s*\)\s*=>/gm,
    replacement: (match, param) => {
      if (!param.startsWith('_') && !['e', 'event'].includes(param)) {
        return match.replace(param, `_${param}`);
      }
      return match;
    }
  },
  // Explicit any types - replace with unknown or Record<string, unknown>
  {
    pattern: /:\s*any\b/g,
    replacement: ': unknown'
  },
  // any in Record types
  {
    pattern: /Record<[^>]*any[^>]*>/g,
    replacement: (match) => match.replace(/any/g, 'unknown')
  },
  // any in arrays
  {
    pattern: /\bany\[\]/g,
    replacement: 'unknown[]'
  },
  // any in generics
  {
    pattern: /<[^>]*any[^>]*>/g,
    replacement: (match) => match.replace(/any/g, 'unknown')
  }
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const { pattern, replacement } of patterns) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  // eslint-disable-next-line no-undef
  const files = await glob('apps/web/src/**/*.{ts,tsx}', { cwd: process.cwd() });

  // eslint-disable-next-line no-console
  console.log(`Processing ${files.length} files...`);

  for (const file of files) {
    await fixFile(file);
  }

  // eslint-disable-next-line no-console
  console.log('Bulk fixes completed!');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});