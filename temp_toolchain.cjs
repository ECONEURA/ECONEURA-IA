const fs=require('fs');
if(!fs.existsSync('package.json')) process.exit(0);
const j=JSON.parse(fs.readFileSync('package.json','utf8'));
j.packageManager??='pnpm@8.15.5';
j.engines??={node:'>=20'};
j.workspaces??=['apps/*','packages/*','functions/*'];
j.scripts=j.scripts||{};
j.scripts.lint??='eslint . -f json --output-file reports/eslint.json';
j.scripts.test??='vitest --run --passWithNoTests --reporter=json';
j.scripts.dup??='jscpd --silent --reporters json --output reports .';
fs.writeFileSync('package.json',JSON.stringify(j,null,2));
if(!fs.existsSync('eslint.config.mjs')){
  fs.writeFileSync('eslint.config.mjs','import js from "@eslint/js";import ts from "typescript-eslint";export default ts.config(js.configs.recommended,...ts.configs.recommended,{ignores:["**/dist/**","**/.next/**","**/coverage/**"]});');
}
console.log('toolchain ok');