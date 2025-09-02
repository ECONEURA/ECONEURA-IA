#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const SRC = 'apps/api/openapi.json';
const OUT = '.openapi.checksum';

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function load(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }

const spec = load(SRC);
if (!spec) { console.error(`OpenAPI not found: ${SRC}`); process.exit(2); }
const digest = sha256(spec);

const mode = process.argv[2] || 'check'; // check | record
if (mode === 'record') {
  fs.writeFileSync(OUT, digest + '\n');
  console.log(`Recorded checksum: ${digest}`);
  process.exit(0);
}

const prev = (load(OUT) || '').trim();
if (!prev) {
  console.log('No checksum recorded. First time? Use: pnpm openapi:record');
  process.exit(3);
}

if (prev !== digest) {
  console.error(`OpenAPI drift detected!\n expected: ${prev}\n actual:   ${digest}`);
  process.exit(1);
}

console.log('OpenAPI checksum OK.');
process.exit(0);
