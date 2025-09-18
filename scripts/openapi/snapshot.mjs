#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const API_URL = 'http://127.0.0.1:3001';
const OUTPUT_DIR = path.join(process.cwd(), 'snapshots');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'openapi.runtime.json');

async function fetchOpenAPISpec() {
  try {
    console.log('📡 Fetching OpenAPI spec from runtime...');
    
    const response = await fetch(`${API_URL}/v1/openapi.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const spec = await response.json();
    
    // Validate it's a valid OpenAPI spec
    if (!spec.openapi && !spec.swagger) {
      throw new Error('Response is not a valid OpenAPI specification');
    }
    
    console.log(`✅ Fetched OpenAPI ${spec.openapi || spec.swagger} spec`);
    console.log(`   Title: ${spec.info?.title || 'Unknown'}`);
    console.log(`   Version: ${spec.info?.version || 'Unknown'}`);
    console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`);
    
    // Ensure output directory exists
    mkdirSync(OUTPUT_DIR, { recursive: true });
    
    // Write to file
    writeFileSync(OUTPUT_FILE, JSON.stringify(spec, null, 2));
    console.log(`💾 Saved snapshot to: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('❌ Failed to fetch OpenAPI spec:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

fetchOpenAPISpec();