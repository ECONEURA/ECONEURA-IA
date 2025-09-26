#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixUnusedRequests() {
  // Find all route.ts files
  const files = await glob('apps/web/src/app/api/**/*.ts', { cwd: process.cwd() });

  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Fix unused request parameters in export functions
      const patterns = [
        // export async function GET(request: Request)
        /\bexport async function (GET|POST|PUT|DELETE|PATCH)\(request\b/g,
        // export async function GET(request
        /\bexport async function (GET|POST|PUT|DELETE|PATCH)\(request\b/g,
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `export async function $1(_request`);
          modified = true;
        }
      }

      // Also fix regular function parameters
      const funcPattern = /\bfunction\s+\w+\s*\([^)]*request[^)]*\)\s*{/g;
      if (funcPattern.test(content)) {
        content = content.replace(/(\w+)\s*:\s*Request/g, '_$1: Request');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`Fixed ${fixedCount} files with unused request parameters`);
}

fixUnusedRequests().catch(console.error);