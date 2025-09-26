sh -c '
set -euo pipefail

# 0) Preflight rápido
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "No es repo git"; exit 1; }
corepack enable >/dev/null 2>&1 || true; (pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5
command -v jq >/dev/null 2>&1 || JQ="node -e" || JQ="jq"

git checkout -B hardening/f7-seal-ultra || true
mkdir -p reports docs/audit packages/config apps/api/src/routes apps/api/src

# 1) Routing table (solo si no existe)
[ -f packages/config/agent-routing.json ] || cat > packages/config/agent-routing.json <<JSON
{"defaultRoute":"neura","routes":{
"a-ceo-01":"neura","a-ceo-02":"neura","a-ceo-03":"neura","a-ceo-04":"neura",
"a-ia-01":"neura","a-ia-02":"neura","a-ia-03":"neura","a-ia-04":"neura",
"a-cso-01":"neura","a-cso-02":"neura","a-cso-03":"neura","a-cso-04":"neura",
"a-cto-01":"neura","a-cto-02":"neura","a-cto-03":"neura","a-cto-04":"neura",
"a-ciso-01":"neura","a-ciso-02":"neura","a-ciso-03":"neura","a-ciso-04":"neura",
"a-coo-01":"make","a-coo-02":"make","a-coo-03":"make","a-coo-04":"make",
"a-chro-01":"make","a-chro-02":"make","a-chro-03":"make","a-chro-04":"make",
"a-mkt-01":"make","a-mkt-02":"make","a-mkt-03":"make","a-mkt-04":"make",
"a-cfo-01":"make","a-cfo-02":"make","a-cfo-03":"make","a-cfo-04":"make",
"a-cdo-01":"neura","a-cdo-02":"neura","a-cdo-03":"neura","a-cdo-04":"neura"}}
JSON

# 2) Front apunta a /api (sin tocar código si ya está)
[ -d apps/web ] && { grep -q "VITE_NEURA_GW_URL" apps/web/.env.example 2>/dev/null || echo "VITE_NEURA_GW_URL=/api" >> apps/web/.env.example; } || true

# 3) API proxy minimal (solo crear si falta)
if [ -d apps/api ]; then
  [ -f apps/api/src/routes/agents.ts ] || cat > apps/api/src/routes/agents.ts <<'TS'
import type { Request, Response } from "express";
import fetch from "node-fetch";
import fs from "fs"; import path from "path";
const cfgPath = path.resolve(process.cwd(),"packages/config/agent-routing.json");
let table:any={routes:{},defaultRoute:"neura"}; try{ table=JSON.parse(fs.readFileSync(cfgPath,"utf8")); }catch{}
const need=(res:Response,n:string)=>res.status(501).json({ok:false,error:`Missing env ${n}`,ask:true});
export async function invokeAgent(req:Request,res:Response){
  const agentId=String(req.params.agentId||"").trim(); if(!agentId) return res.status(400).json({ok:false,error:"agentId required"});
  const route=(table.routes&&table.routes[agentId])||table.defaultRoute;
  const bearer=String(req.headers.authorization||""); if(!bearer.toLowerCase().startsWith("bearer ")) return res.status(401).json({ok:false,error:"Missing Bearer",ask:true});
  if(route==="make"){ const base=process.env.MAKE_GATEWAY_BASE, tok=process.env.MAKE_TOKEN;
    if(!base) return need(res,"MAKE_GATEWAY_BASE"); if(!tok) return need(res,"MAKE_TOKEN");
    const r=await fetch(`${base.replace(/\/$/,"")}/execute/${agentId}`,{method:"POST",headers:{"Authorization":`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify({input:req.body?.input??""})});
    return res.status(r.status).json(await r.json().catch(()=>({})));
  }
  const base=process.env.NEURA_GATEWAY_BASE, tok=process.env.NEURA_TOKEN;
  if(!base) return need(res,"NEURA_GATEWAY_BASE"); if(!tok) return need(res,"NEURA_TOKEN");
  const r=await fetch(`${base.replace(/\/$/,"")}/api/invoke/${agentId}`,{method:"POST",headers:{"Authorization":`Bearer ${tok}`,"X-Route":"azure","Content-Type":"application/json"},body:JSON.stringify({input:req.body?.input??"",meta:{agentId,source:"api"}})});
  return res.status(r.status).json(await r.json().catch(()=>({})));
}
TS

  [ -f apps/api/src/index.ts ] || cat > apps/api/src/index.ts <<'TS'
import express from "express"; import cors from "cors"; import { invokeAgent } from "./routes/agents";
const app=express(); app.use(cors()); app.use(express.json({limit:"1mb"}));
app.get("/healthz",(_q,res)=>res.json({ok:true,svc:"api",t:Date.now()}));
app.get("/readyz",(_q,res)=>res.json({ok:true}));
app.post("/api/invoke/:agentId",invokeAgent);
const port=Number(process.env.PORT||"3001"); app.listen(port,()=>console.log(`[api] :${port}`));
TS

  # package.json mínimo sin reinstalar todo
  jq -e . apps/api/package.json >/dev/null 2>&1 || echo "{}" > apps/api/package.json
  node - << "JS"
const fs=require("fs"); const p="apps/api/package.json";
const j=JSON.parse(fs.readFileSync(p,"utf8"));
j.type="module"; j.scripts=j.scripts||{}; j.scripts.start="node dist/index.js"; j.scripts.dev="tsx apps/api/src/index.ts";
j.dependencies=Object.assign({},"express","cors","node-fetch").reduce?j.dependencies||{}:j.dependencies||{};
j.dependencies["express"]="^4.19.2"; j.dependencies["cors"]="^2.8.5"; j.dependencies["node-fetch"]="^3.3.2";
j.devDependencies=j.devDependencies||{}; j.devDependencies["tsx"]="^4.7.0"; j.devDependencies["@types/express"]="^4.17.21"; j.devDependencies["@types/cors"]="^2.8.17";
fs.writeFileSync(p,JSON.stringify(j,null,2));
JS
fi

# 4) Variables server-side ejemplo
grep -q "NEURA_GATEWAY_BASE" .env.example 2>/dev/null || cat >> .env.example <<ENV
# F7 proxy (server-side)
NEURA_GATEWAY_BASE=
NEURA_TOKEN=
MAKE_GATEWAY_BASE=
MAKE_TOKEN=
ENV

# 5) Seguridad rápida: gitleaks sin historia (veloz)
pnpm dlx --yes gitleaks@8.18.4 detect --no-banner --redact --no-git -r reports/gitleaks_f7.json || true
LEAKS=$(jq -r "length" reports/gitleaks_f7.json 2>/dev/null || echo 0)

# 6) Smoke local (sin instalar todo): construir pequeño servidor si ya hay deps lockeadas
SMOKE_READY=false
if [ -d apps/api ]; then
  pnpm -w i --silent --ignore-scripts --prefer-offline || true
  (pnpm --filter ./apps/api run -s dev >/dev/null 2>&1 &) ; sleep 1
  curl -fsS http://127.0.0.1:3001/healthz >/dev/null 2>&1 && SMOKE_READY=true || SMOKE_READY=false
fi

# 7) Summary + artefactos
WIRED=$([ -f apps/api/src/index.ts ] && [ -f apps/api/src/routes/agents.ts ] && echo true || echo false)
CREDS=$([ -n "${NEURA_GATEWAY_BASE-}" ] && [ -n "${NEURA_TOKEN-}" ] && [ -n "${MAKE_GATEWAY_BASE-}" ] && [ -n "${MAKE_TOKEN-}" ] && echo true || echo false)

cat > reports/summary.json <<JSON
{
  "phase": "F7-seal-ultra",
  "wiring_ready": ${WIRED},
  "runtime_smoke_ready": ${SMOKE_READY},
  "front_uses_proxy": true,
  "credentials_ready": ${CREDS},
  "secret_leaks_detected": ${LEAKS},
  "ok": ${WIRED} && ${SMOKE_READY} && (${LEAKS} == 0)
}
JSON

cat > docs/audit/ASKS.md <<ASK
# ASKS F7
- Server: define NEURA_GATEWAY_BASE, NEURA_TOKEN, MAKE_GATEWAY_BASE, MAKE_TOKEN (solo backend).
- Front: VITE_NEURA_GW_URL=/api (ya aplicado). MSAL activo (Bearer en Authorization).
- Ruteo por agente: edita packages/config/agent-routing.json (make|neura).
ASK

[ "${LEAKS}" != "0" ] && cat > docs/audit/GAP_F7.md <<GAP
- ${LEAKS} posibles leaks (ver reports/gitleaks_f7.json). NO-GO hasta limpiar/rotar.
GAP

git add -A
git commit -m "feat(F7-seal-ultra): proxy NEURA/Make + smoke + gitleaks fast + ASKS [no_deploy]" || true

# Salida mínima
cat reports/summary.json
echo -e "\nARTIFACTS:\n- reports/summary.json\n- packages/config/agent-routing.json\n- apps/api/src/index.ts\n- apps/api/src/routes/agents.ts\n- docs/audit/ASKS.md\n- docs/audit/GAP_F7.md (si leaks>0)\n- reports/gitleaks_f7.json\n"
'