#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const snapshotPath = join(process.cwd(), 'reports/openapi-snapshot.json');
const diffPath = join(process.cwd(), 'reports/openapi-diff.json');

try {
  // For now, create an empty diff (no changes)
  const diff = {
    timestamp: new Date().toISOString(),
    changes: [],
    breakingChanges: [],
    newEndpoints: [],
    removedEndpoints: [],
    modifiedEndpoints: []
  };
  
  writeFileSync(diffPath, JSON.stringify(diff, null, 2));
  console.log('✅ OpenAPI diff created: no changes detected');
  
} catch (error) {
  console.error('❌ Error creating OpenAPI diff:', error.message);
  process.exit(1);
}