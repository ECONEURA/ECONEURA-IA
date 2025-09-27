set -euo pipefail
mkdir -p .artifacts .github/workflows_disabled docs/audit

# 0) Helpers
mv_safe(){ src="$1"; dst="$2"; if command -v git >/dev/null && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git mv "$src" "$dst" || mv "$src" "$dst"; else mv "$src" "$dst"; fi; }
DRY="${DRY_RUN:-0}"

# 1) Desactivar staging-deploy.yml con DRY-RUN
if [ -f .github/workflows/staging-deploy.yml ]; then
  [ "$DRY" = "1" ] || mv_safe .github/workflows/staging-deploy.yml .github/workflows_disabled/staging-deploy.yml
fi

# 2) Toolchain sólo si faltan claves
node - <<'NODE'
const fs=require('fs'); if(!fs.existsSync('package.json')) process.exit(0);
const j=JSON.parse(fs.readFileSync('package.json','utf8'));
j.packageManager = j.packageManager || 'pnpm@8.15.5';
j.engines = j.engines || { node: ">=20" };
fs.writeFileSync('package.json', JSON.stringify(j,null,2));
console.log('package.json actualizado');
NODE

# 3) Evidencia NO_DEPLOY y veredicto
node - <<'NODE'
const fs=require('fs'), p=require('path');
const dir='.github/workflows'; const DANG=/\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i; const ND=/DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i;
let flags=[], dang=[];
if (fs.existsSync(dir)) for(const f of fs.readdirSync(dir)){ if(!/\.(ya?ml)$/i.test(f)) continue;
  const q=p.join(dir,f), t=fs.readFileSync(q,'utf8');
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
NODE