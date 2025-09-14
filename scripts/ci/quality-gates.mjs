#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const reportsDir = join(process.cwd(), 'reports');

function readJson(file) {
  const path = join(reportsDir, file);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return null;
  }
}

try {
  const openapiDiff = readJson('openapi-diff.json');
  const gitleaks = readJson('gitleaks.json');
  const jscpdSummary = readJson('jscpd.summary.json');
  const links = readJson('links.json'); // assuming lychee output
  const playwrightReport = readJson('playwright-report.json'); // if exists
  const k6Report = readJson('k6-report.json'); // if exists

  const openapiCount = openapiDiff?.hasChanges ? openapiDiff.added.length + openapiDiff.removed.length + openapiDiff.modified.length : 0;
  const gitleaksCount = Array.isArray(gitleaks) ? gitleaks.length : (gitleaks?.findings?.length || 0);
  const linksCount = links?.broken?.length || 0;
  const jscpdPct = jscpdSummary?.duplicatedPercent ? parseFloat(jscpdSummary.duplicatedPercent) : 0;
  const jscpdDup = jscpdSummary?.duplicatedTokens || 0;
  const visualPct = playwrightReport?.summary?.failed || 0; // assuming

  const real = (openapiCount > 0 || gitleaksCount > 0 || linksCount > 0) ? 'FAIL' : 'OK';
  const verify = (jscpdPct > 5 || jscpdDup > 50) ? 'FAIL' : 'PASS';

  let line = `REAL=${real} VERIFY=${verify} OPENAPI=${openapiCount} JSCPD=${jscpdPct}/${jscpdDup} GITLEAKS=${gitleaksCount} LINKS=${linksCount}`;
  if (visualPct > 0) line += ` VISUAL=${visualPct}%`;

  console.log(line);

  if (real === 'FAIL' || verify === 'FAIL') {
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error in quality gates:', error.message);
  process.exit(1);
}
