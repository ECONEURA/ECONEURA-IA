import fs from 'fs';
if(!fs.existsSync('package.json')) process.exit(0);
const j=JSON.parse(fs.readFileSync('package.json','utf8'));
j.packageManager = j.packageManager || 'pnpm@8.15.5';
j.engines = j.engines || { node: ">=20" };
fs.writeFileSync('package.json', JSON.stringify(j,null,2));
console.log('package.json actualizado');