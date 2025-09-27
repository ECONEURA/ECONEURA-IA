import fs from 'fs';
import path from 'path';
const dir='.github/workflows'; const DANG=/\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i; const ND=/DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i;
let flags=[], dang=[];
if (fs.existsSync(dir)) for(const f of fs.readdirSync(dir)){ if(!/\.(ya?ml)$/i.test(f)) continue;
  const q=path.join(dir,f), t=fs.readFileSync(q,'utf8');
  if (ND.test(t)) flags.push(q);
  if (DANG.test(t)) dang.push(q);
}
fs.mkdirSync('docs/audit',{recursive:true});
fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',[
  '# NO_DEPLOY_EVIDENCE',
  `flags(${flags.length}):`, ...flags, '',
  `dangerous(${dang.length}):`, ...dang, ''
].join('\n'));
const ok = dang.length===0 && flags.length>0;
console.log(JSON.stringify({NO_DEPLOY_OK:ok, flags:flags.length, dangerous:dang.length},null,2));
process.exit(ok?0:1);