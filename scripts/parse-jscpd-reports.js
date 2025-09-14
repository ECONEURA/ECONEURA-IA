#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findReports(dir) {
  const files = fs.readdirSync(dir);
  return files.filter(f => f.endsWith('.json') && f.includes('jscpd')).map(f => path.join(dir, f));
}

function main() {
  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    console.error('reports/ not found');
    process.exit(1);
  }

  const candidates = [];
  // also accept nested dirs like reports/*.json/jscpd-report.json
  const entries = fs.readdirSync(reportsDir);
  entries.forEach(e => {
    const p = path.join(reportsDir, e);
    if (fs.statSync(p).isDirectory()) {
      const inner = path.join(p, 'jscpd-report.json');
      if (fs.existsSync(inner)) candidates.push(inner);
    } else if (e.endsWith('.json')) {
      candidates.push(p);
    }
  });

  const allDuplicates = [];
  let totalTokens = 0;
  let totalDuplicatedTokens = 0;

  candidates.forEach(file => {
    try {
      const j = readJson(file);
      const stats = j.statistics || {};
      if (stats.formats) {
        Object.values(stats.formats).forEach(f => {
          if (f.sources) {
            Object.values(f.sources).forEach(s => {
              totalTokens += s.tokens || 0;
              totalDuplicatedTokens += s.duplicatedTokens || 0;
            });
          }
        });
      }
      if (Array.isArray(j.duplicates)) {
        j.duplicates.forEach(d => allDuplicates.push({
          lines: d.lines,
          tokens: d.tokens || 0,
          fragment: d.fragment ? d.fragment.replace(/\n/g, ' ') : '',
          first: d.firstFile && d.firstFile.name,
          second: d.secondFile && d.secondFile.name
        }));
      }
    } catch (e) {
      console.error('failed read', file, e.message);
    }
  });

  const summary = {
    scannedReports: candidates.length,
    totalTokens,
    totalDuplicatedTokens,
    duplicatedPercentage: totalTokens > 0 ? (totalDuplicatedTokens / totalTokens * 100) : 0,
    duplicateCount: allDuplicates.length
  };

  // write artifacts
  const artifactsDir = path.resolve(process.cwd(), '.artifacts');
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);
  fs.writeFileSync(path.join(artifactsDir, 'jscpd.summary.json'), JSON.stringify(summary, null, 2));

  // top 20 duplicates by lines then tokens
  allDuplicates.sort((a,b) => (b.lines - a.lines) || (b.tokens - a.tokens));
  const top20 = allDuplicates.slice(0,20);
  const md = ['# jscpd Top 20 Duplicates', '', `Scanned reports: ${candidates.length}`, '', '## Top 20', ''];
  top20.forEach((d, i) => {
    md.push(`${i+1}. ${d.lines} lines • ${d.tokens} tokens`);
    md.push(`   - files: ${d.first} ↔ ${d.second}`);
    md.push(`   - fragment: ${d.fragment.substring(0,200)}${d.fragment.length>200? '...':''}`);
    md.push('');
  });
  fs.writeFileSync(path.join(artifactsDir, 'jscpd.top20.md'), md.join('\n'));

  console.log('Wrote .artifacts/jscpd.summary.json and .artifacts/jscpd.top20.md');
}

main();
