#!/usr/bin/env node

import fs from 'fs';
import { glob } from 'glob';

async function fixExplicitAny() {
  const files = await glob('apps/web/src/**/*.{ts,tsx}', { cwd: process.cwd() });

  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Replace explicit any types with more specific types
      const replacements = [
        // : any -> : unknown
        [/: any\b/g, ': unknown'],
        // Record<string, any> -> Record<string, unknown>
        [/Record<[^>]*any[^>]*>/g, (match) => match.replace(/any/g, 'unknown')],
        // any[] -> unknown[]
        [/\bany\[\]/g, 'unknown[]'],
        // Promise<any> -> Promise<unknown>
        [/Promise<any>/g, 'Promise<unknown>'],
        // Array<any> -> Array<unknown>
        [/Array<any>/g, 'Array<unknown>'],
      ];

      for (const [pattern, replacement] of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed any types in: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`Fixed any types in ${fixedCount} files`);
}

fixExplicitAny().catch(console.error);