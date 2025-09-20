#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(process.cwd(), 'reports');
const outJson = path.resolve(process.cwd(), '.artifacts', 'jscpd.summary.json');
const outMd = path.resolve(process.cwd(), '.artifacts', 'jscpd.summary.md');

if (!fs.existsSync(path.dirname(outJson))) fs.mkdirSync(path.dirname(outJson), { recursive: true });

const reportFiles = [];

function findReports(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const p = path.join(dir, it);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) findReports(p);
    else if (it === 'jscpd-report.json') reportFiles.push(p);
  }
}

findReports(reportsDir);
if (reportFiles.length === 0) {
  console.error('No jscpd reports found under reports/');
  process.exit(1);
}

let totalTokens = 0;
let totalDuplicatedTokens = 0;
let files = {};
let clones = [];

for (const rf of reportFiles) {
  try {
    const j = JSON.parse(fs.readFileSync(rf, 'utf8'));
    const stats = j.statistics || {};
    const formats = stats.formats || {};
    Object.values(formats).forEach(fmt => {
      const sources = fmt.sources || {};
      Object.entries(sources).forEach(([filePath, info]) => {
        const name = info.name || filePath;
        const tokens = info.tokens || 0;
        const dupTokens = info.duplicatedTokens || 0;
        totalTokens += tokens;
        totalDuplicatedTokens += dupTokens;
        files[name] = files[name] || { tokens: 0, duplicatedTokens: 0, duplicatedLines: 0 };
        files[name].tokens += tokens;
        files[name].duplicatedTokens += dupTokens;
        files[name].duplicatedLines += info.duplicatedLines || 0;
      });
    });
    if (Array.isArray(j.clones)) clones = clones.concat(j.clones);
  } catch (err) {
    console.error('Failed to parse', rf, err.message);
  }
}

const duplicatedPercent = totalTokens ? (totalDuplicatedTokens / totalTokens) * 100 : 0;
const filesArr = Object.entries(files).map(([name, v]) => ({ name, ...v })).sort((a,b)=>b.duplicatedLines - a.duplicatedLines);
const topFiles = filesArr.slice(0, 20);

const summary = {
  totalReports: reportFiles.length,
  totalTokens,
  totalDuplicatedTokens,
  duplicatedPercent: Number(duplicatedPercent.toFixed(4)),
  topFiles,
  clonesCount: clones.length
};

fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));

const mdLines = [];
mdLines.push('# jscpd summary');
mdLines.push(`Reports found: ${reportFiles.length}`);
mdLines.push(`Total tokens: ${totalTokens}`);
mdLines.push(`Duplicated tokens: ${totalDuplicatedTokens}`);
mdLines.push(`Duplicated percent: ${summary.duplicatedPercent}%`);
mdLines.push('');
mdLines.push('## Top duplicated files');
mdLines.push('| duplicatedLines | duplicatedTokens | file |');
mdLines.push('|---:|---:|---|');
for (const f of topFiles) {
  mdLines.push(`| ${f.duplicatedLines} | ${f.duplicatedTokens} | ${f.name} |`);
}
mdLines.push('');
mdLines.push(`Total clones entries: ${summary.clonesCount}`);
fs.writeFileSync(outMd, mdLines.join('\n'));
console.log('wrote', outJson, outMd);
