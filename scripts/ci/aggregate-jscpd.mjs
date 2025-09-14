#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const reportsDir = path.resolve('reports');
const outDir = path.resolve('.artifacts');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.existsSync(reportsDir) ? fs.readdirSync(reportsDir).filter(f=>f.endsWith('jscpd-report.json')||f.endsWith('.json')):[];
let combined = { totalFiles:0, totalClones:0, totalDuplicatedLines:0, totalLines:0, duplicatedTokens:0, clones: [] };
for(const f of files){
  const full = path.join(reportsDir, f);
  try{
    const j = JSON.parse(fs.readFileSync(full,'utf8'));
    if(j.statistics){
      combined.totalFiles += j.statistics.files || 0;
      combined.totalClones += j.statistics.clones || 0;
      combined.totalDuplicatedLines += j.statistics.duplicatedLines || 0;
      combined.totalLines += j.statistics.lines || 0;
      combined.duplicatedTokens += j.statistics.duplicatedTokens || 0;
    }
    if(Array.isArray(j.clones)){
      for(const c of j.clones){
        combined.clones.push(c);
      }
    }
  }catch(e){
    // ignore non-json
  }
}
combined.clones = combined.clones.sort((a,b)=> (b.lines||0)-(a.lines||0)).slice(0,50);
combined.duplicatedPercent = combined.totalLines? ((combined.totalDuplicatedLines/combined.totalLines)*100).toFixed(2): '0.00';

fs.writeFileSync(path.join(outDir,'jscpd.summary.json'), JSON.stringify(combined,null,2));

// create a markdown summary
let md = `# jscpd summary\n\n`;
md += `Total files scanned: ${combined.totalFiles}\n\n`;
md += `Total clones: ${combined.totalClones}\n\n`;
md += `Total duplicated lines: ${combined.totalDuplicatedLines}\n\n`;
md += `Total lines: ${combined.totalLines}\n\n`;
md += `Duplicated tokens (approx): ${combined.duplicatedTokens}\n\n`;
md += `Duplicated percent: ${combined.duplicatedPercent}%\n\n`;
md += `## Top clones (by duplicated lines)\n\n`;
combined.clones.forEach((c, idx)=>{
  md += `### Clone ${idx+1}\n`;
  md += `- Lines: ${c.lines}\n`;
  md += `- Tokens: ${c.tokens||'N/A'}\n`;
  md += `- Fragment: \n\n`;
  md += '```\n'+(c.fragment||'')+'\n```\n\n';
  md += `- Occurrences: \n`;
  (c.occurrences||[]).forEach(o=>{
    md += `  - ${o.file}:${o.start.line}-${o.end.line}\n`;
  });
  md += '\n';
});
fs.writeFileSync(path.join(outDir,'jscpd.summary.md'), md);
console.log('Wrote .artifacts/jscpd.summary.json and .artifacts/jscpd.summary.md');
