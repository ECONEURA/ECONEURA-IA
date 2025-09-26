# F7-seal-final PowerShell script
param()

# === F7-seal-final — micro-proxy + smoke + leaks + resumen ===
Write-Host "=== F7-SEAL-FINAL START ==="

# Verificar git
try {
    & git rev-parse --is-inside-work-tree | Out-Null
    Write-Host "Git repo OK"
} catch {
    Write-Host "ERROR: Not in git repo"
    exit 1
}

# Crear rama
try {
    & git checkout -B hardening/f7-seal-final 2>$null
    Write-Host "Branch hardening/f7-seal-final created/checked out"
} catch {
    Write-Host "Warning: Could not create/checkout branch"
}

# Crear directorios
New-Item -ItemType Directory -Force -Path reports, docs/audit | Out-Null

# 0) Entorno local de servidor (NO se commitea)
$ENVF = ".env.f7.local"
if (!(Test-Path $ENVF)) {
    @"
NEURA_GATEWAY_BASE=$($env:NEURA_GATEWAY_BASE ?? "")   # ej: https://tu-neura-gw
NEURA_TOKEN=$($env:NEURA_TOKEN ?? "")                 # ej: eyJhbGciOi...
MAKE_GATEWAY_BASE=$($env:MAKE_GATEWAY_BASE ?? "")     # ej: https://tu-make-gw
MAKE_TOKEN=$($env:MAKE_TOKEN ?? "")                   # ej: eyJhbGciOi...
PORT=$($env:PORT ?? "3001")
"@ | Out-File -FilePath $ENVF -Encoding UTF8
    Write-Host "Created $ENVF"
}

# 1) Micro-proxy sin dependencias (Node 20)
$PROXY_JS = "tmp-f7-proxy.js"
if (!(Test-Path $PROXY_JS)) {
    $proxyCode = @"
const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT||3001);
const NEURA = process.env.NEURA_GATEWAY_BASE||"";
const MAKE  = process.env.MAKE_GATEWAY_BASE||"";
const NTOK  = process.env.NEURA_TOKEN||"";
const MTOK  = process.env.MAKE_TOKEN||"";

function json(res, code, obj){ res.writeHead(code,{"content-type":"application/json"}); res.end(JSON.stringify(obj)); }

async function forward(targetBase, req, res, bearer){
  try{
    if(!targetBase) return json(res, 500, { ok:false, error:"TARGET_BASE_MISSING" });
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;

    const u = new URL(req.url.replace(/^\/api/,""), targetBase);
    const headers = {
      "content-type":"application/json",
      "x-correlation-id": req.headers["x-correlation-id"] || Date.now().toString(16),
      ...(bearer ? { authorization: `Bearer \${bearer}` } : {})
    };
    const r = await fetch(u, { method: req.method, headers, body });
    const text = await r.text();
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(text);
  }catch(e){ json(res, 500, { ok:false, error:String(e) }); }
}

const server = http.createServer(async (req,res)=>{
  const url = req.url || "/";
  if(url==="/healthz") return json(res,200,{ ok:true, ts:new Date().toISOString() });

  // Rutas Make opcionales: /api/make/*
  if(url.startsWith("/api/make/")) return forward(MAKE, req, res, MTOK);

  // Resto: NEURA
  if(url.startsWith("/api/")) return forward(NEURA, req, res, NTOK);

  json(res,404,{ ok:false, error:"NOT_FOUND" });
});

server.listen(PORT,"127.0.0.1",()=>console.log("F7 proxy on",PORT));
"@
    $proxyCode | Out-File -FilePath $PROXY_JS -Encoding UTF8
    Write-Host "Created $PROXY_JS"
}

# 2) Cargar .env y lanzar proxy en background
Write-Host "Loading environment variables..."
Get-Content $ENVF | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVar = $matches[1].Trim()
        $envValue = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($envVar, $envValue)
        Write-Host "Set $envVar = $envValue"
    }
}

$PORT = $env:PORT ?? "3001"
Write-Host "Starting proxy on port $PORT..."
$proxyProcess = Start-Process -FilePath "node" -ArgumentList $PROXY_JS -NoNewWindow -PassThru
Start-Sleep -Seconds 2

# 3) Smoke tests (rápidos, con timeout)
Write-Host "Running smoke tests..."
$SMOKE_H = $false
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$PORT/healthz" -TimeoutSec 4 -ErrorAction Stop
    $SMOKE_H = $true
    Write-Host "✓ Health check PASSED"
} catch {
    $SMOKE_H = $false
    Write-Host "✗ Health check FAILED: $($_.Exception.Message)"
}

$INV_OK = $false
if ($SMOKE_H -and $env:NEURA_GATEWAY_BASE -and $env:NEURA_TOKEN) {
    try {
        $headers = @{ "Content-Type" = "application/json" }
        $body = '{"input":"ping"}'
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$PORT/api/invoke/a-ceo-01" -Method POST -Headers $headers -Body $body -TimeoutSec 4 -ErrorAction Stop
        $INV_OK = $true
        Write-Host "✓ Invoke test PASSED"
    } catch {
        $INV_OK = $false
        Write-Host "✗ Invoke test FAILED: $($_.Exception.Message)"
    }
} else {
    Write-Host "⚠ Invoke test SKIPPED (missing credentials)"
}

# 4) Verificación: ¿el front usa proxy (/api)?
Write-Host "Checking if frontend uses proxy..."
$FRONT_PROXY = $false
$frontProxyCheck = @"
const fs=require("fs"),gl=require("glob");
const files=gl.sync("**/*.{ts,tsx,js,jsx,env,env.*}",{ignore:["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/out/**","**/coverage/**","reports/**",".git/**"]});
const hit = files.some(f=>{
  try{
    const s=fs.readFileSync(f,"utf8");
    return /VITE_NEURA_GW_URL\s*=\s*\/api\b/.test(s) || /readVar\([^)]*VITE_NEURA_GW_URL/.test(s);
  }catch{return false}
});
process.stdout.write(hit?"true":"false");
"@

$frontProxyCheck | Out-File -FilePath "tmp_front_check.js" -Encoding UTF8
try {
    $frontProxyResult = & node tmp_front_check.js
    $FRONT_PROXY = $frontProxyResult -eq "true"
    Write-Host "Frontend uses proxy: $FRONT_PROXY"
} catch {
    Write-Host "Error checking frontend proxy: $($_.Exception.Message)"
}

# 5) Escaneo rápido de leaks (sin historia, sin node_modules)
Write-Host "Scanning for leaks..."
$LEAKS = 0
$leaksCheck = @"
const fs=require("fs"),gl=require("glob");
const re=/\b(NEURA_TOKEN|MAKE_TOKEN|SharedKey\s+[A-Za-z0-9+/=]{10,}|Bearer\s+[A-Za-z0-9._-]{20,})\b/;
const out=[];
gl.sync("**/*.*",{ignore:["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/out/**","**/coverage/**","reports/**",".git/**"]})
  .forEach(f=>{ try{ const s=fs.readFileSync(f,"utf8"); if(re.test(s)) out.push(f); }catch{} });
process.stdout.write(JSON.stringify(out));
"@

$leaksCheck | Out-File -FilePath "tmp_leaks_check.js" -Encoding UTF8
try {
    $leaksResult = & node tmp_leaks_check.js
    $leaksResult | Out-File -FilePath "reports/leaks_f7.json" -Encoding UTF8
    $LEAKS = ($leaksResult | ConvertFrom-Json).Count
    Write-Host "Leaks detected: $LEAKS"
} catch {
    Write-Host "Error scanning leaks: $($_.Exception.Message)"
}

# 6) Summary y GAP
Write-Host "Generating summary..."
$OK = $SMOKE_H -and $FRONT_PROXY -and ($LEAKS -eq 0)
$credentialsReady = ($env:NEURA_GATEWAY_BASE -and $env:NEURA_TOKEN -and $env:MAKE_GATEWAY_BASE -and $env:MAKE_TOKEN)

$summary = @"
{
  "phase": "F7-seal-final",
  "wiring_ready": true,
  "front_uses_proxy": $($FRONT_PROXY.ToString().ToLower()),
  "runtime_smoke_ready": $($SMOKE_H.ToString().ToLower()),
  "invoke_ok": $($INV_OK.ToString().ToLower()),
  "credentials_ready": $($credentialsReady.ToString().ToLower()),
  "secret_leaks_detected": $LEAKS,
  "ok": $($OK.ToString().ToLower()),
  "ts": "$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"
}
"@

$summary | Out-File -FilePath "reports/summary.json" -Encoding UTF8

# GAP si algo falla
if (!$OK) {
    $gapContent = "# GAP F7`n"
    if (!$SMOKE_H) { $gapContent += "`n- Smoke /healthz falló (proxy no levantó o puerto $PORT ocupado)." }
    if (!$INV_OK) { $gapContent += "`n- POST /api/invoke/a-ceo-01 falló (rellena NEURA_GATEWAY_BASE y NEURA_TOKEN en $ENVF)." }
    if (!$FRONT_PROXY) { $gapContent += "`n- El front no usa /api (configura VITE_NEURA_GW_URL=/api)." }
    if ($LEAKS -ne 0) {
        $leaksFiles = ($leaksResult | ConvertFrom-Json) -join ", "
        $gapContent += "`n- Posibles leaks en: $leaksFiles"
    }

    $gapContent | Out-File -FilePath "docs/audit/GAP_F7.md" -Encoding UTF8
    Write-Host "Created GAP file: docs/audit/GAP_F7.md"
}

# 7) Parada y commit seguro (sin .env ni tmp)
Write-Host "Stopping proxy..."
if ($proxyProcess) {
    Stop-Process -Id $proxyProcess.Id -ErrorAction SilentlyContinue
}

# Limpiar archivos temporales
Remove-Item -Path $PROXY_JS, "tmp_front_check.js", "tmp_leaks_check.js" -ErrorAction SilentlyContinue

# Git operations
Write-Host "Committing changes..."
& git add -A ":!$ENVF" ":!$PROXY_JS" 2>$null
& git commit -m "feat(F7-seal-final): micro-proxy Node, smoke, proxy-check, fast leaks, summary [no_deploy]" 2>$null

# 8) Salida
Write-Host "`n=== F7-SEAL-FINAL RESULTS ==="
Get-Content reports/summary.json
Write-Host "`nARTIFACTS:"
Write-Host "- reports/summary.json"
Write-Host "- reports/leaks_f7.json"
if (Test-Path "docs/audit/GAP_F7.md") { Write-Host "- docs/audit/GAP_F7.md (GAP detected)" }
Write-Host "- $ENVF (local, NO commit)"

Write-Host "`n=== F7-SEAL-FINAL COMPLETE ==="