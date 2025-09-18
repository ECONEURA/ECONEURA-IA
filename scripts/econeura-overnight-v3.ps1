param(
  [string]$ResourceGroup = "appsvc_linux_northeurope_basic",
  [string]$WebApp       = "econeura-web-dev",
  [string]$ApiApp       = "econeura-api-dev",
  [string]$HealthPath   = "/health",
  [double]$DurationHours = 6,
  [int]$IntervalMinutes  = 5,
  [bool]$RunAudit        = $true,
  [bool]$RunLighthouse   = $false,
  [bool]$DoGit           = $true,
  [string]$GitBranch     = ""
)

$ErrorActionPreference = "Stop"

function Retry {
  param([scriptblock]$Action,[int]$Max=5)
  for($i=1;$i -le $Max;$i++){
    try { return & $Action } catch {
      if($i -eq $Max){ throw }
      Start-Sleep -Seconds ([math]::Min([int][math]::Pow(2,$i),30))
    }
  }
}

function NowTs { (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") }
function New-Dir($p){ if(!(Test-Path $p)){ New-Item -Type Directory -Path $p | Out-Null } }

# 0) Descubrimiento de URLs
$webFqdn = Retry { az webapp show -g $ResourceGroup -n $WebApp --query defaultHostName -o tsv }
$WEB_URL = "https://$webFqdn"
$API_URL = "https://$ApiApp.azurewebsites.net"

# 1) Artefactos
$runId = (Get-Date -Format "yyyyMMdd-HHmmss")
$root = ".artifacts/run-$runId"
New-Dir $root
$csv = Join-Path $root "samples.csv"
"ts,kind,url,method,status,latency_ms,ok,extra" | Out-File -Encoding UTF8 $csv

# 2) Helpers HTTP
function SampleHttp {
  param([string]$Kind,[string]$Url,[string]$Method="GET",[hashtable]$Headers=@{})
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 20 -UseBasicParsing
    $sw.Stop()
    $ok = $true
    $status = $resp.StatusCode.value__
    $extra = ""
    if($Method -eq "OPTIONS"){
      $acao = $resp.Headers["Access-Control-Allow-Origin"]
      $extra = "acao=$acao"
    }
  } catch {
    $sw.Stop()
    $ok = $false
    $status = ($_?.Exception?.Response?.StatusCode.value__)
    if(-not $status){ $status = 0 }
    $extra = "err=" + $_.Exception.Message.Replace(",",";")
  }
  $line = "{0},{1},{2},{3},{4},{5},{6}" -f (NowTs),$Kind,$Url,$Method,$status,[int]$sw.Elapsed.TotalMilliseconds,($ok?"1":"0")
  if($extra){ $line += (","+$extra) } else { $line += "," }
  Add-Content -Path $csv -Value $line
  return @{ status=$status; ms=[int]$sw.Elapsed.TotalMilliseconds; ok=$ok; extra=$extra }
}

# 3) Lecturas Azure (con retry)
$fxApi = Retry { az webapp show -g $ResourceGroup -n $ApiApp --query siteConfig.linuxFxVersion -o tsv }
$healthCfg = Retry { az webapp show -g $ResourceGroup -n $ApiApp --query siteConfig.healthCheckPath -o tsv }
$cors = Retry { az webapp cors show -g $ResourceGroup -n $ApiApp -o json | ConvertFrom-Json }
$origins = @()
if($cors -and $cors.allowedOrigins){ $origins = $cors.allowedOrigins }
$restr = Retry { az webapp config access-restriction show -g $ResourceGroup -n $ApiApp -o json | ConvertFrom-Json }
$rules = @()
if($restr -and $restr.ipSecurityRestrictions){ $rules = $restr.ipSecurityRestrictions }

# 4) Warmup
1..3 | ForEach-Object { SampleHttp "warmup" "$API_URL/" "GET" | Out-Null; Start-Sleep -s 1 }

# 5) Bucle de muestreo
$end = (Get-Date).AddHours($DurationHours)
$iter = 0
while([DateTime]::UtcNow -lt $end.ToUniversalTime()){
  $iter++

  # GETs
  SampleHttp "api_root"   "$API_URL/" "GET" | Out-Null
  SampleHttp "api_health" "$API_URL$HealthPath" "GET" | Out-Null
  SampleHttp "web_root"   "$WEB_URL" "GET" | Out-Null

  # HEADs
  SampleHttp "api_root"   "$API_URL/" "HEAD" | Out-Null
  SampleHttp "web_root"   "$WEB_URL"  "HEAD" | Out-Null

  # OPTIONS preflight (con el Origin de la WebApp y el dominio público)
  SampleHttp "api_preflight_web" "$API_URL/" "OPTIONS" @{ "Origin"=$WEB_URL; "Access-Control-Request-Method"="GET" } | Out-Null
  SampleHttp "api_preflight_pub" "$API_URL/" "OPTIONS" @{ "Origin"="https://www.econeura.com"; "Access-Control-Request-Method"="GET" } | Out-Null

  # Azure snapshots cada 15 min
  if(($iter % [int](15/$IntervalMinutes)) -eq 0){
    $snap = Join-Path $root ("restrictions-"+(Get-Date -Format "HHmmss")+".json")
    Retry { az webapp config access-restriction show -g $ResourceGroup -n $ApiApp -o json > $snap } | Out-Null
  }

  Start-Sleep -Seconds ([int](60*$IntervalMinutes))
}

# 6) Auditorías opcionales
$warnings = @()

if($RunAudit){
  try {
    pushd .
    if(Test-Path "apps/web/package.json"){
      pushd "apps/web"; npm ci --omit=optional; npm audit --audit-level=high || $warnings += "npm audit (web) encontró issues"; popd
    }
    if(Test-Path "apps/api/package.json"){
      pushd "apps/api"; npm ci --omit=optional; npm audit --audit-level=high || $warnings += "npm audit (api) encontró issues"; popd
    }
    popd
  } catch { $warnings += "npm audit falló: $($_.Exception.Message)" }
}

if($RunLighthouse){
  try {
    npx -y @lhci/cli autorun --collect.url="$WEB_URL" --upload.target=filesystem --upload.outputDir="$root/lhci" `
      || $warnings += "Lighthouse bajo umbral o error"
  } catch { $warnings += "Lighthouse no disponible: $($_.Exception.Message)" }
}

# 7) Resumen y criterios de PASS
# Cargar CSV y computar métricas simples
$rows = Import-Csv -Path $csv
function Pct($a){ if($a.Count -eq 0){ return 0 } [math]::Round((($a | Where-Object {$_.ok -eq "1"}).Count*100.0)/$a.Count,2) }
function P95ms($a){ if($a.Count -eq 0){ return 0 } ([int](($a.ms | Sort-Object {[int]$_}) | Select-Object -Last ([math]::Ceiling($a.Count*0.95))) ) }

$apiRoot  = $rows | Where-Object { $_.kind -eq "api_root" -and $_.method -eq "GET" }
$apiHlth  = $rows | Where-Object { $_.kind -eq "api_health" }
$webRoot  = $rows | Where-Object { $_.kind -eq "web_root" -and $_.method -eq "GET" }
$preWeb   = $rows | Where-Object { $_.kind -eq "api_preflight_web" }
$prePub   = $rows | Where-Object { $_.kind -eq "api_preflight_pub" }

$pass = $true
$reasons = @()

# Reglas duras
if($fxApi -ne "NODE|20-lts"){ $pass=$false; $reasons += "Runtime API != NODE|20-lts ($fxApi)" }
if(($apiRoot | Where-Object {$_.status -ne "200"}).Count -gt 0){ $pass=$false; $reasons += "API / con códigos !=200" }
if(($apiHlth | Where-Object {$_.status -ne "200"}).Count -gt 0){ $pass=$false; $reasons += "API $HealthPath con códigos !=200" }
if(($webRoot | Where-Object {$_.status -ne "200"}).Count -gt 0){ $pass=$false; $reasons += "WEB / con códigos !=200" }

# CORS preflight debe devolver 200 y un ACAO no vacío
function HasACAO($r){ return ($r.status -eq "200" -and $r.extra -match "acao=https?://") }
if(-not (HasACAO ($preWeb | Select-Object -Last 1))){ $pass=$false; $reasons += "Preflight (web) sin ACAO válido" }
if(-not (HasACAO ($prePub | Select-Object -Last 1))){ $warnings += "Preflight (público) sin ACAO válido (tolerado si no procede)" }

# Access Restrictions: no 0.0.0.0/0
if($rules | Where-Object { $_.ipAddress -match "^0\.0\.0\.0/0$" }){
  $pass=$false; $reasons += "Access Restrictions permite 0.0.0.0/0"
}

# Latencia p95 (umbrales conservadores)
if(P95ms $apiRoot -gt 1500){ $warnings += "API / p95 > 1500 ms" }
if(P95ms $apiHlth -gt 800){  $warnings += "API $HealthPath p95 > 800 ms" }
if(P95ms $webRoot -gt 2000){ $warnings += "WEB / p95 > 2000 ms" }

# 8) Final y salida
$final = Join-Path $root "final.txt"
$report = @()
$report += "RESULTADOS"
$report += "WEB_URL=$WEB_URL"
$report += "API_URL=$API_URL"
$report += "FX_API=$fxApi"
$report += "HEALTH_CFG=$healthCfg"
$report += "CORS_ALLOWED=" + ($origins -join ", ")
$report += "SAMPLES_FILE=$csv"
$report += "api_root: count=$($apiRoot.Count) ok%=$(Pct $apiRoot) p95ms=$(P95ms $apiRoot)"
$report += "api_health: count=$($apiHlth.Count) ok%=$(Pct $apiHlth) p95ms=$(P95ms $apiHlth)"
$report += "web_root: count=$($webRoot.Count) ok%=$(Pct $webRoot) p95ms=$(P95ms $webRoot)"
$report += "preflight_web_last=" + (($preWeb | Select-Object -Last 1 | ForEach-Object { "$($_.status) [$($_.extra)]" }))
$report += "preflight_pub_last=" + (($prePub | Select-Object -Last 1 | ForEach-Object { "$($_.status) [$($_.extra)]" }))
$report += "AccessRules_Count=" + ($rules.Count)
$report += "AccessRules_ZeroCIDR=" + ((($rules | Where-Object { $_.ipAddress -eq "0.0.0.0/0" }).Count) )
if($warnings.Count -gt 0){ $report += "WARNINGS=" + ($warnings -join " | ") }
if($reasons.Count -gt 0){  $report += "REASONS="  + ($reasons  -join " | ") }
$report += "RESULTADO: " + ($(if($pass){"PASS"}else{"FAIL"}))

$report | Out-File -Encoding UTF8 $final
Write-Host ($report -join "`n")

# 9) Git opcional
if($DoGit){
  try {
    if($GitBranch){
      git checkout -b $GitBranch 2>$null
    }
    git add $root | Out-Null
    git commit -m ("chore(ops): overnight check {0} → {1}" -f $runId,($(if($pass){"PASS"}else{"FAIL"}))) | Out-Null
    git push --set-upstream origin $(git branch --show-current) | Out-Null
  } catch {
    Write-Warning "Git push falló: $($_.Exception.Message)"
  }
}

if(-not $pass){ exit 1 } else { exit 0 }

### ¿Qué hace durante ~6 h (y por qué sirve)

# Muestreo periódico cada N minutos (por defecto 5) a WEB /, API / y API /health, con GET/HEAD y OPTIONS (preflight) real con Origin.

# Percentiles y estabilidad: calcula ok% y p95 por endpoint para detectar degradación nocturna.

# CORS real: comprueba Access-Control-Allow-Origin para el FQDN y el dominio público.

# Restricciones de acceso: hace snapshot periódico y falla si aparece 0.0.0.0/0.

# Runtime: verifica que el API corre NODE|20-lts.

# Auditorías (opcionales): npm audit en apps/web y apps/api; Lighthouse opcional (no bloquea el job si no está instalado).

# Artefactos: CSV con todas las muestras + final.txt con criterios de PASS/FAIL.

# Git (opcional): comitea artefactos a una branch overnight/ops-<ts> para que los tengas al despertar.

# Umbrales/criterios (resumen)

# FAIL si:

# runtime API ≠ NODE|20-lts

# GET / o GET /health devuelven códigos ≠ 200 en algún sample

# preflight web sin ACAO válido

# aparece 0.0.0.0/0 en restricciones

# WARN si:

# p95 API / > 1500 ms, health > 800 ms, web / > 2000 ms

# npm audit alto/crítico (no corta el job; queda en WARN)
