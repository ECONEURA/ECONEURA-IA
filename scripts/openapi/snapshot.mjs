#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const openapiPath = join(process.cwd(), 'apps/api/openapi/openapi.yaml');
const snapshotPath = join(process.cwd(), 'reports/openapi-snapshot.json');

try {
  const openapiContent = readFileSync(openapiPath, 'utf8');
  
  // Parse YAML and extract v1 endpoints
  const lines = openapiContent.split('\n');
  const v1Endpoints = [];
  let inPaths = false;
  
  for (const line of lines) {
    if (line.startsWith('paths:')) {
      inPaths = true;
      continue;
    }
    
    if (inPaths && line.startsWith('  /v1/')) {
      v1Endpoints.push(line.trim());
    }
    
    if (inPaths && line.startsWith('  /') && !line.startsWith('  /v1/')) {
      break; // End of v1 paths
    }
  }
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    v1Endpoints: v1Endpoints,
    totalEndpoints: v1Endpoints.length
  };
  
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`✅ OpenAPI snapshot created: ${v1Endpoints.length} v1 endpoints`);
  
} catch (error) {
  console.error('❌ Error creating OpenAPI snapshot:', error.message);
  process.exit(1);
}