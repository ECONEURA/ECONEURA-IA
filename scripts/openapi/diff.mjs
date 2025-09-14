#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const yamlPath = join(process.cwd(), 'apps/api/openapi/openapi.yaml');
const snapshotPath = join(process.cwd(), 'snapshots/openapi.runtime.json');
const diffPath = join(process.cwd(), 'reports/openapi-diff.json');

try {
  // Read YAML spec
  const yamlContent = readFileSync(yamlPath, 'utf8');
  const spec = parse(yamlContent);
  
  // Extract v1 paths from YAML
  const yamlV1Paths = {};
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    if (path.startsWith('/v1/')) {
      yamlV1Paths[path] = methods;
    }
  }
  
  // Read runtime snapshot
  const snapshotContent = readFileSync(snapshotPath, 'utf8');
  const snapshot = JSON.parse(snapshotContent);
  const runtimeV1Paths = snapshot.v1Paths || {};
  
  // Compare paths
  const added = [];
  const removed = [];
  const modified = [];
  
  // Check for added/removed paths
  const allPaths = new Set([...Object.keys(yamlV1Paths), ...Object.keys(runtimeV1Paths)]);
  
  for (const path of allPaths) {
    const yamlPath = yamlV1Paths[path];
    const runtimePath = runtimeV1Paths[path];
    
    if (yamlPath && !runtimePath) {
      added.push(path);
    } else if (!yamlPath && runtimePath) {
      removed.push(path);
    } else if (yamlPath && runtimePath) {
      // Deep compare methods
      const yamlMethods = Object.keys(yamlPath);
      const runtimeMethods = Object.keys(runtimePath);
      const allMethods = new Set([...yamlMethods, ...runtimeMethods]);
      
      let hasChanges = false;
      for (const method of allMethods) {
        if (!yamlPath[method] && runtimePath[method]) {
          hasChanges = true;
          break;
        }
        if (yamlPath[method] && !runtimePath[method]) {
          hasChanges = true;
          break;
        }
        // For now, just check if method exists; could add deeper comparison
      }
      
      if (hasChanges) {
        modified.push(path);
      }
    }
  }
  
  const diff = {
    timestamp: new Date().toISOString(),
    yamlV1PathsCount: Object.keys(yamlV1Paths).length,
    runtimeV1PathsCount: Object.keys(runtimeV1Paths).length,
    added,
    removed,
    modified,
    hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0
  };
  
  writeFileSync(diffPath, JSON.stringify(diff, null, 2));
  
  if (diff.hasChanges) {
    console.log('❌ OpenAPI diff detected:');
    if (added.length) console.log(`  Added: ${added.join(', ')}`);
    if (removed.length) console.log(`  Removed: ${removed.join(', ')}`);
    if (modified.length) console.log(`  Modified: ${modified.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ No OpenAPI diffs detected');
  }
  
} catch (error) {
  console.error('❌ Error creating OpenAPI diff:', error.message);
  process.exit(1);
}