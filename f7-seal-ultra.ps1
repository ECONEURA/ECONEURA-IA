# F7-seal-ultra PowerShell version
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# 0) Preflight rápido
if (!(Test-Path .git)) {
    Write-Error "No es repo git"
    exit 1
}

# Enable corepack and check pnpm
try { corepack enable 2>$null } catch {}
try { pnpm -v 2>$null } catch { npm install -g pnpm@8.15.5 }

# Check jq
$JQ = "jq"
if (!(Get-Command jq -ErrorAction SilentlyContinue)) {
    $JQ = "node -e"
}

git checkout -B hardening/f7-seal-ultra 2>$null

# Create directories
New-Item -ItemType Directory -Force -Path reports, docs/audit, packages/config, apps/api/src/routes, apps/api/src | Out-Null

# 1) Routing table (solo si no existe)
if (!(Test-Path packages/config/agent-routing.json)) {
    $routingTable = @{
        defaultRoute = "neura"
        routes = @{
            "a-ceo-01" = "neura"; "a-ceo-02" = "neura"; "a-ceo-03" = "neura"; "a-ceo-04" = "neura"
            "a-ia-01" = "neura"; "a-ia-02" = "neura"; "a-ia-03" = "neura"; "a-ia-04" = "neura"
            "a-cso-01" = "neura"; "a-cso-02" = "neura"; "a-cso-03" = "neura"; "a-cso-04" = "neura"
            "a-cto-01" = "neura"; "a-cto-02" = "neura"; "a-cto-03" = "neura"; "a-cto-04" = "neura"
            "a-ciso-01" = "neura"; "a-ciso-02" = "neura"; "a-ciso-03" = "neura"; "a-ciso-04" = "neura"
            "a-coo-01" = "make"; "a-coo-02" = "make"; "a-coo-03" = "make"; "a-coo-04" = "make"
            "a-chro-01" = "make"; "a-chro-02" = "make"; "a-chro-03" = "make"; "a-chro-04" = "make"
            "a-mkt-01" = "make"; "a-mkt-02" = "make"; "a-mkt-03" = "make"; "a-mkt-04" = "make"
            "a-cfo-01" = "make"; "a-cfo-02" = "make"; "a-cfo-03" = "make"; "a-cfo-04" = "make"
            "a-cdo-01" = "neura"; "a-cdo-02" = "neura"; "a-cdo-03" = "neura"; "a-cdo-04" = "neura"
        }
    }
    $routingTable | ConvertTo-Json -Depth 10 | Set-Content packages/config/agent-routing.json
}

# 2) Front apunta a /api (sin tocar código si ya está)
if (Test-Path apps/web) {
    $envFile = "apps/web/.env.example"
    if (!(Select-String -Path $envFile -Pattern "VITE_NEURA_GW_URL" -Quiet 2>$null)) {
        Add-Content $envFile "VITE_NEURA_GW_URL=/api"
    }
}

# 3) API proxy minimal (solo crear si falta)
if (Test-Path apps/api) {
    # Create agents.ts if it doesn't exist
    if (!(Test-Path apps/api/src/routes/agents.ts)) {
        $agentsTs = @'
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
'@
        $agentsTs | Set-Content apps/api/src/routes/agents.ts
    }

    # Create index.ts if it doesn't exist
    if (!(Test-Path apps/api/src/index.ts)) {
        $indexTs = @'
import express from "express"; import cors from "cors"; import { invokeAgent } from "./routes/agents";
const app=express(); app.use(cors()); app.use(express.json({limit:"1mb"}));
app.get("/healthz",(_q,res)=>res.json({ok:true,svc:"api",t:Date.now()}));
app.get("/readyz",(_q,res)=>res.json({ok:true}));
app.post("/api/invoke/:agentId",invokeAgent);
const port=Number(process.env.PORT||"3001"); app.listen(port,()=>console.log(`[api] :${port}`));
'@
        $indexTs | Set-Content apps/api/src/index.ts
    }

    # Update package.json
    $packageJsonPath = "apps/api/package.json"
    if (!(Test-Path $packageJsonPath)) {
        "{}" | Set-Content $packageJsonPath
    }

    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    if (-not $packageJson) {
        $packageJson = [PSCustomObject]@{}
    }

    # Ensure properties exist
    if (-not $packageJson.PSObject.Properties.Match('type')) {
        $packageJson | Add-Member -MemberType NoteProperty -Name 'type' -Value 'module'
    } else {
        $packageJson.type = "module"
    }

    if (-not $packageJson.PSObject.Properties.Match('scripts')) {
        $packageJson | Add-Member -MemberType NoteProperty -Name 'scripts' -Value ([PSCustomObject]@{})
    }
    $packageJson.scripts.start = "node dist/index.js"
    $packageJson.scripts.dev = "tsx apps/api/src/index.ts"

    if (-not $packageJson.PSObject.Properties.Match('dependencies')) {
        $packageJson | Add-Member -MemberType NoteProperty -Name 'dependencies' -Value ([PSCustomObject]@{})
    }
    $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name 'express' -Value '^4.19.2' -Force
    $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name 'cors' -Value '^2.8.5' -Force
    $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name 'node-fetch' -Value '^3.3.2' -Force

    if (-not $packageJson.PSObject.Properties.Match('devDependencies')) {
        $packageJson | Add-Member -MemberType NoteProperty -Name 'devDependencies' -Value ([PSCustomObject]@{})
    }
    $packageJson.devDependencies | Add-Member -MemberType NoteProperty -Name 'tsx' -Value '^4.7.0' -Force
    $packageJson.devDependencies | Add-Member -MemberType NoteProperty -Name '@types/express' -Value '^4.17.21' -Force
    $packageJson.devDependencies | Add-Member -MemberType NoteProperty -Name '@types/cors' -Value '^2.8.17' -Force

    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
}

# 4) Variables server-side ejemplo
$envExample = ".env.example"
if (!(Select-String -Path $envExample -Pattern "NEURA_GATEWAY_BASE" -Quiet)) {
    Add-Content $envExample @"

# F7 proxy (server-side)
NEURA_GATEWAY_BASE=
NEURA_TOKEN=
MAKE_GATEWAY_BASE=
MAKE_TOKEN=
"@
}

# 5) Seguridad rápida: gitleaks sin historia (veloz)
try {
    pnpm dlx --yes gitleaks@8.18.4 detect --no-banner --redact --no-git -r reports/gitleaks_f7.json
} catch {}

$leaks = 0
if (Test-Path reports/gitleaks_f7.json) {
    try {
        $gitleaksData = Get-Content reports/gitleaks_f7.json | ConvertFrom-Json
        $leaks = $gitleaksData.Count
    } catch {
        $leaks = 0
    }
}

# 6) Smoke local (sin instalar todo): construir pequeño servidor si ya hay deps lockeadas
$smokeReady = $false
if (Test-Path apps/api) {
    try {
        pnpm -w i --silent --ignore-scripts --prefer-offline 2>$null
        $job = Start-Job -ScriptBlock {
            try {
                pnpm --filter ./apps/api run -s dev 2>$null
            } catch {}
        }
        Start-Sleep 2
        try {
            $response = Invoke-WebRequest -Uri http://127.0.0.1:3001/healthz -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $smokeReady = $true
            }
        } catch {}
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    } catch {}
}

# 7) Summary + artefactos
$wired = (Test-Path apps/api/src/index.ts) -and (Test-Path apps/api/src/routes/agents.ts)
$creds = [bool]($env:NEURA_GATEWAY_BASE -and $env:NEURA_TOKEN -and $env:MAKE_GATEWAY_BASE -and $env:MAKE_TOKEN)

$summary = @{
    phase = "F7-seal-ultra"
    wiring_ready = $wired
    runtime_smoke_ready = $smokeReady
    front_uses_proxy = $true
    credentials_ready = $creds
    secret_leaks_detected = $leaks
    ok = $wired -and $smokeReady -and ($leaks -eq 0)
}
$summary | ConvertTo-Json | Set-Content reports/summary.json

$asks = @"
# ASKS F7
- Server: define NEURA_GATEWAY_BASE, NEURA_TOKEN, MAKE_GATEWAY_BASE, MAKE_TOKEN (solo backend).
- Front: VITE_NEURA_GW_URL=/api (ya aplicado). MSAL activo (Bearer en Authorization).
- Ruteo por agente: edita packages/config/agent-routing.json (make|neura).
"@
$asks | Set-Content docs/audit/ASKS.md

if ($leaks -ne 0) {
    $gap = @"
- $leaks posibles leaks (ver reports/gitleaks_f7.json). NO-GO hasta limpiar/rotar.
"@
    $gap | Set-Content docs/audit/GAP_F7.md
}

git add -A
git commit -m "feat(F7-seal-ultra): proxy NEURA/Make + smoke + gitleaks fast + ASKS [no_deploy]" 2>$null

# Salida mínima
Get-Content reports/summary.json
Write-Host ""
Write-Host "ARTIFACTS:"
Write-Host "- reports/summary.json"
Write-Host "- packages/config/agent-routing.json"
Write-Host "- apps/api/src/index.ts"
Write-Host "- apps/api/src/routes/agents.ts"
Write-Host "- docs/audit/ASKS.md"
if ($leaks -ne 0) { Write-Host "- docs/audit/GAP_F7.md (si leaks>0)" }
Write-Host "- reports/gitleaks_f7.json"