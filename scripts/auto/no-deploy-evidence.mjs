import fs from 'fs'
let out='# NO_DEPLOY EVIDENCE\n\n'; const d='.github/workflows'
if(fs.existsSync(d)){ for(const f of fs.readdirSync(d).filter(x=>/\.ya?ml$/.test(x))){
 const L=fs.readFileSync(`${d}/${f}`,'utf8').split('\n')
 L.forEach((l,i)=>{ if(l.includes('DEPLOY_ENABLED')||/\b(az |webapp|containerapp|deploy)\b/.test(l)) out+=`- ${f}: L${i+1}: ${l}\n` })
}}
fs.mkdirSync('docs/audit',{recursive:true}); fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',out.trim()+'\n')
console.log('NO_DEPLOY evidence -> docs/audit/NO_DEPLOY_EVIDENCE.md')