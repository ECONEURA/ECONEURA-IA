param(
  [Parameter(Mandatory=$true)][string]$ResourceGroup,
  [Parameter(Mandatory=$true)][string]$WebApp,
  [Parameter(Mandatory=$true)][string]$ApiApp,
  [string]$HealthPath = "/health",
  [double]$DurationHours = 10,
  [int]$IntervalMinutes = 5,
  [int]$RequestTimeoutSec = 10,
  [int]$MaxConnections = 50,
  [int]$WarmupRequests = 3,
  [int]$P95WarnMs = 1500,
  [double]$AvailWarnPct = 99.0,
  [string[]]$Origins = @("https://www.econeura.com"),
  [bool]$DoGit = $true,
  [string]$GitBranch = ("overnight/ops-{0}" -f (Get-Date -Format yyyyMMdd-HHmm))
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-RunFolder {
  $utc = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmssZ')
  $p = Join-Path ".artifacts" ("run-{0}" -f $utc)
  New-Item -ItemType Directory -Force -Path $p | Out-Null
  return $p
}

function Get-Percentile([int[]]$data, [double]$p){
  if(-not $data -or $data.Count -eq 0){ return 0 }
  $s = $data | Sort-Object
  $idx = [math]::Ceiling(($p/100.0)*$s.Count)-1
  if($idx -lt 0){ $idx = 0 }
  if($idx -ge $s.Count){ $idx = $s.Count-1 }
  return [int]$s[$idx]
}

# Resolver URLs
$webFqdn = (az webapp show -g $ResourceGroup -n $WebApp --query defaultHostName -o tsv)
if(-not $webFqdn){ throw "No se pudo resolver FQDN para $WebApp" }
$WEB_URL = "https://$webFqdn"
$API_URL = "https://$ApiApp.azurewebsites.net"

# Orígenes a probar en preflight (público + webapp)
$allOrigins = @($Origins + $WEB_URL) | Select-Object -Unique

# HttpClient
$handler = [System.Net.Http.SocketsHttpHandler]::new()
$handler.PooledConnectionLifetime      = [TimeSpan]::FromMinutes(15)
$handler.PooledConnectionIdleTimeout   = [TimeSpan]::FromMinutes(5)
$handler.MaxConnectionsPerServer       = $MaxConnections
$handler.SslOptions.EnabledSslProtocols = [System.Security.Authentication.SslProtocols]::Tls12
$Http = [System.Net.Http.HttpClient]::new($handler)
$Http.Timeout = [TimeSpan]::FromSeconds($RequestTimeoutSec)

function Invoke-Probe([string]$Url,[string]$Method="GET",[hashtable]$Headers){
  $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Url)
  if($Headers){
    foreach($kv in $Headers.GetEnumerator()){
      [void]$req.Headers.TryAddWithoutValidation($kv.Key, $kv.Value)
    }
  }
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = $Http.Send($req)
    $sw.Stop()
    return [pscustomobject]@{ status=[int]$resp.StatusCode; ms=[int]$sw.ElapsedMilliseconds; resp=$resp }
  } catch {
    $sw.Stop()
    return [pscustomobject]@{ status=0; ms=[int]$sw.ElapsedMilliseconds; err="$($_.Exception.Message)" }
  } finally {
    $req.Dispose()
  }
}

# Artefactos
$RunFolder   = New-RunFolder
$samplesCsv  = Join-Path $RunFolder "samples.csv"
$finalTxt    = Join-Path $RunFolder "final.txt"
$finalJson   = Join-Path $RunFolder "final.json"

"ts_utc,probe,status,ms,origin,notes" | Out-File -Encoding utf8 $samplesCsv

# Warmup
for($w=0; $w -lt $WarmupRequests; $w++){
  $null = Invoke-Probe "$API_URL$HealthPath"
  Start-Sleep -Seconds 1
}

# Iteraciones deterministas
$iterations = [int][math]::Floor(($DurationHours*60.0)/[double]$IntervalMinutes)
if($iterations -lt 1){ $iterations = 1 }

# Acumuladores
$apiTimes    = @()
$healthTimes = @()
$webTimes    = @()
$preflightOk = @{}
$allOrigins | ForEach-Object { $preflightOk[$_] = $false }

for($i=1; $i -le $iterations; $i++){
  $now = (Get-Date).ToUniversalTime().ToString("o")

  # API /
  $r1 = Invoke-Probe "$API_URL/"
  Add-Content $samplesCsv "$now,api_root,$($r1.status),$($r1.ms),,"
  if($r1.status -eq 200){ $apiTimes += $r1.ms }

  # API health
  $r2 = Invoke-Probe "$API_URL$HealthPath"
  Add-Content $samplesCsv "$now,api_health,$($r2.status),$($r2.ms),,"
  if($r2.status -eq 200){ $healthTimes += $r2.ms }

  # WEB /
  $r3 = Invoke-Probe "$WEB_URL/"
  Add-Content $samplesCsv "$now,web_root,$($r3.status),$($r3.ms),,"
  if($r3.status -eq 200){ $webTimes += $r3.ms }

  # Preflight OPTIONS para cada origin
  foreach($o in $allOrigins){
    $reqH = @{
      Origin = $o
      "Access-Control-Request-Method"  = "GET"
      "Access-Control-Request-Headers" = "content-type,authorization"
    }
    $rp = Invoke-Probe "$API_URL/" "OPTIONS" $reqH
    $acao = ""
    $acam = ""
    $acah = ""
    $acac = $false
    if($rp.resp){
      if($rp.resp.Headers.Contains("Access-Control-Allow-Origin")){ $acao = ($rp.resp.Headers.GetValues("Access-Control-Allow-Origin") -join ',') }
      if($rp.resp.Headers.Contains("Access-Control-Allow-Methods")){ $acam = ($rp.resp.Headers.GetValues("Access-Control-Allow-Methods") -join ',') }
      if($rp.resp.Headers.Contains("Access-Control-Allow-Headers")){ $acah = ($rp.resp.Headers.GetValues("Access-Control-Allow-Headers") -join ',') }
      $acac = $rp.resp.Headers.Contains("Access-Control-Allow-Credentials")
    }
    Add-Content $samplesCsv "$now,preflight,$($rp.status),$($rp.ms),$o,acao=$acao|acam=$acam|acah=$acah|acac=$acac"
    $okThis = ($rp.status -eq 200 -and [string]::IsNullOrEmpty($acao) -eq $false)
    $preflightOk[$o] = [bool]$preflightOk[$o] -or $okThis
  }

  $sleep = ($IntervalMinutes*60) + (Get-Random -Minimum -10 -Maximum 10)
  if($sleep -lt 0){ $sleep = 0 }
  Start-Sleep -Seconds $sleep
}

# Estadísticas
$okRoot   = [math]::Round(100.0 * ($apiTimes.Count  / [double]$iterations), 2)
$okHealth = [math]::Round(100.0 * ($healthTimes.Count/ [double]$iterations), 2)
$okWeb    = [math]::Round(100.0 * ($webTimes.Count  / [double]$iterations), 2)

$stats = @{
  api_root   = @{ count = $apiTimes.Count;    p95 = (Get-Percentile $apiTimes 95);    p99 = (Get-Percentile $apiTimes 99);    okpct = $okRoot }
  api_health = @{ count = $healthTimes.Count; p95 = (Get-Percentile $healthTimes 95); p99 = (Get-Percentile $healthTimes 99); okpct = $okHealth }
  web_root   = @{ count = $webTimes.Count;    p95 = (Get-Percentile $webTimes 95);    p99 = (Get-Percentile $webTimes 99);    okpct = $okWeb }
}

# Access Restrictions
$rulesTsv  = az webapp config access-restriction show -g $ResourceGroup -n $ApiApp --query "ipSecurityRestrictions[].{name:name,action:action,ip:ipAddress,prio:priority}" -o tsv 2>$null
$zeroCidr  = ($rulesTsv | Select-String -SimpleMatch "0.0.0.0/0").Count
$ruleCount = if($rulesTsv){ ($rulesTsv | Measure-Object -Line).Lines } else { 0 }

# Warnings / Fatales
$Warnings = @()
if($stats.api_root.p95   -gt $P95WarnMs){   $Warnings += "api_root p95>${P95WarnMs}ms ($($stats.api_root.p95))" }
if($stats.api_health.p95 -gt $P95WarnMs){   $Warnings += "api_health p95>${P95WarnMs}ms ($($stats.api_health.p95))" }
if($stats.web_root.p95   -gt $P95WarnMs){   $Warnings += "web_root p95>${P95WarnMs}ms ($($stats.web_root.p95))" }

$expected = $iterations
$tol = 0.10
if($expected -gt 0){
  if(([math]::Abs($expected - $stats.api_root.count)/$expected)   -gt $tol){ $Warnings += "api_root samples mismatch expected=$expected got=$($stats.api_root.count)" }
  if(([math]::Abs($expected - $stats.api_health.count)/$expected) -gt $tol){ $Warnings += "api_health samples mismatch expected=$expected got=$($stats.api_health.count)" }
  if(([math]::Abs($expected - $stats.web_root.count)/$expected)   -gt $tol){ $Warnings += "web_root samples mismatch expected=$expected got=$($stats.web_root.count)" }
}
if($okRoot   -lt $AvailWarnPct){ $Warnings += "api_root ok%<$AvailWarnPct ($okRoot)" }
if($okHealth -lt $AvailWarnPct){ $Warnings += "api_health ok%<$AvailWarnPct ($okHealth)" }
if($okWeb    -lt $AvailWarnPct){ $Warnings += "web_root ok%<$AvailWarnPct ($okWeb)" }

$fatalReasons = @()
if($zeroCidr -gt 0){ $fatalReasons += "AccessRestrictions incluye 0.0.0.0/0" }
$badOrigins = @()
foreach($o in $allOrigins){ if(-not $preflightOk[$o]){ $badOrigins += $o } }
if($badOrigins.Count -gt 0){ $fatalReasons += ("Preflight CORS no válido para: " + ($badOrigins -join ", ")) }
if($stats.api_root.count -eq 0 -or $stats.api_health.count -eq 0 -or $stats.web_root.count -eq 0){ $fatalReasons += "Sin muestras válidas en algún probe" }

$WARNINGS_STR = ($Warnings -join "; ")
$REASONS_STR  = ($fatalReasons -join "; ")
$PASS = ($fatalReasons.Count -eq 0)

# Final JSON/TXT
$finalObj = [pscustomobject]@{
  WEB_URL      = $WEB_URL
  API_URL      = $API_URL
  FX_API       = (az webapp show -g $ResourceGroup -n $ApiApp --query siteConfig.linuxFxVersion -o tsv)
  HEALTH_CFG   = $HealthPath
  ORIGINS      = $allOrigins
  SAMPLES_FILE = $samplesCsv
  stats        = $stats
  preflight_ok = $preflightOk
  AccessRules_Count    = $ruleCount
  AccessRules_ZeroCIDR = $zeroCidr
  WARNINGS     = $WARNINGS_STR
  REASONS      = $REASONS_STR
  RESULTADO    = ($PASS ? "PASS" : "FAIL")
}
$finalObj | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 $finalJson

$finalReport = @"
RESULTADOS
WEB_URL=$($finalObj.WEB_URL)
API_URL=$($finalObj.API_URL)
FX_API=$($finalObj.FX_API)
HEALTH_CFG=$($finalObj.HEALTH_CFG)
SAMPLES_FILE=$($finalObj.SAMPLES_FILE)
api_root:   count=$($stats.api_root.count)   ok%=$($stats.api_root.okpct)   p95ms=$($stats.api_root.p95)   p99ms=$($stats.api_root.p99)
api_health: count=$($stats.api_health.count) ok%=$($stats.api_health.okpct) p95ms=$($stats.api_health.p95) p99ms=$($stats.api_health.p99)
web_root:   count=$($stats.web_root.count)   ok%=$($stats.web_root.okpct)   p95ms=$($stats.web_root.p95)   p99ms=$($stats.web_root.p99)
preflight_ok:
$($allOrigins | ForEach-Object { "  - $_ : " + ($preflightOk[$_] ? "true" : "false") } | Out-String)
AccessRules_Count=$ruleCount
AccessRules_ZeroCIDR=$zeroCidr
WARNINGS=$WARNINGS_STR
REASONS=$REASONS_STR
RESULTADO: $($finalObj.RESULTADO)
"@
$finalReport | Out-File -Encoding utf8 $finalTxt
$finalReport | Write-Host
Write-Host "`nARTIFACTS: $RunFolder"

if($DoGit){
  try{
    git rev-parse --is-inside-work-tree 2>$null | Out-Null
    git checkout -b $GitBranch 2>$null
    git add $RunFolder
    git commit -m "ops(overnight): $($finalObj.RESULTADO) $(Split-Path $RunFolder -Leaf)"
    # push opcional si el repo tiene remoto configurado:
    git push -u origin $GitBranch 2>$null
  } catch {
    Write-Warning "Git no disponible o repo no inicializado: $($_.Exception.Message)"
  }
}

if($PASS){ exit 0 } else { exit 1 }

Comandos a ejecutar en VS Code

Smoke 15 min:

pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/econeura-overnight-v5.ps1 `
  -ResourceGroup "appsvc_linux_northeurope_basic" -WebApp "econeura-web-dev" `
  -ApiApp "econeura-api-dev" -HealthPath "/health" `
  -DurationHours 0.25 -IntervalMinutes 5 `
  -DoGit:$true -GitBranch "overnight/smoke-$(Get-Date -Format yyyyMMdd-HHmm)"


Job 10 h (cuando el smoke salga bien):

pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/econeura-overnight-v5.ps1 `
  -ResourceGroup "appsvc_linux_northeurope_basic" -WebApp "econeura-web-dev" `
  -ApiApp "econeura-api-dev" -HealthPath "/health" `
  -DurationHours 10 -IntervalMinutes 5 `
  -DoGit:$true -GitBranch "overnight/ops-$(Get-Date -Format yyyyMMdd-HHmm)"


Qué me devuelves al final: pega aquí el contenido completo de final.txt (y el exit code). Con eso cierro el panel de día y, si hay cualquier “fatal”, te dejo el parche inmediato.
