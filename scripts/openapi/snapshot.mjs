import fs from 'node:fs'

const url = 'http://127.0.0.1:3001/v1/openapi.json'
const out = 'snapshots/openapi.runtime.json'
const res = await fetch(url).catch(()=>null)
if(!res || !res.ok){ console.error('No runtime OpenAPI'); process.exit(1) }
const json = await res.json()
fs.mkdirSync('snapshots',{recursive:true})
fs.writeFileSync(out, JSON.stringify(json, null, 2))
console.log('Wrote', out)
#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const snapshotPath = join(process.cwd(), 'snapshots/openapi.runtime.json');

async function fetchOpenAPI() {
  try {
    const response = await fetch('http://localhost:3000/v1/openapi.json');
    if (!response.ok) throw new Error('Server not running');
    return await response.json();
  } catch (error) {
    console.log('Server not running, using builder TS');
    // Import builder TS if available
    try {
      const { buildOpenAPI } = await import('../apps/api/src/lib/openapi-builder.js');
      return await buildOpenAPI();
    } catch (e) {
      throw new Error('Cannot generate OpenAPI: server not running and no builder available');
    }
  }
}

try {
  const openapi = await fetchOpenAPI();
  
  // Extract v1 paths only, no signatures
  const v1Paths = {};
  for (const [path, methods] of Object.entries(openapi.paths || {})) {
    if (path.startsWith('/v1/')) {
      v1Paths[path] = methods;
    }
  }
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    v1Paths: v1Paths,
    totalV1Paths: Object.keys(v1Paths).length
  };
  
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`✅ OpenAPI runtime snapshot created: ${Object.keys(v1Paths).length} v1 paths`);
  
} catch (error) {
  console.error('❌ Error creating OpenAPI snapshot:', error.message);
  process.exit(1);
}