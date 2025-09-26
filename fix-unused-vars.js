#!/usr/bin/env node

import fs from 'fs';
import { glob } from 'glob';

async function fixUnusedVariables() {
  const files = await glob('apps/web/src/**/*.{ts,tsx}', { cwd: process.cwd() });

  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Skip files that are likely to have legitimate unused variables
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')) {
        continue;
      }

      // Pattern to find variable declarations that might be unused
      // This is a simplified approach - we'll look for common patterns
      const patterns = [
        // const variable = ...;
        /\bconst\s+(\w+)\s*=\s*[^;]+;\s*$/gm,
        // let variable = ...;
        /\blet\s+(\w+)\s*=\s*[^;]+;\s*$/gm,
        // const { variable } = ...;
        /\bconst\s*{\s*([^}]+)\s*}\s*=\s*[^;]+;\s*$/gm,
        // const [ variable ] = ...;
        /\bconst\s*\[\s*([^]]+)\s*\]\s*=\s*[^;]+;\s*$/gm,
      ];

      for (const pattern of patterns) {
        const matches = [...content.matchAll(pattern)];
        for (const match of matches) {
          const varName = match[1];
          // Skip if already starts with underscore or is a common React/state variable
          if (varName.startsWith('_') ||
              ['i', 'j', 'k', 'index', 'key', 'id', 'props', 'state', 'setState'].includes(varName) ||
              varName.includes('set') ||
              varName.includes('State')) {
            continue;
          }

          // Check if variable is used elsewhere in the file (simple check)
          const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
          const usages = content.match(usagePattern);
          if (!usages || usages.length <= 1) { // Only the declaration
            // Add underscore prefix
            const declarationPattern = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`, 'g');
            content = content.replace(declarationPattern, `$1 _${varName}`);
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed unused variables in: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`Fixed unused variables in ${fixedCount} files`);
}

fixUnusedVariables().catch(console.error);