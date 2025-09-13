# Variables
$RG  = "appsvc_linux_northeurope_basic"
$WEB = "econeura-web-dev"
$API = "econeura-api-dev"

# 1) QUITAR cualquier regla "allow all" (0.0.0.0/0)
$rules = az webapp config access-restriction show -g $RG -n $API `
  --query "ipSecurityRestrictions" -o json | ConvertFrom-Json
$open = $rules | Where-Object { $_.ipAddress -eq "0.0.0.0/0" -and $_.action -eq "Allow" }
foreach ($r in $open) {
  az webapp config access-restriction remove -g $RG -n $API --rule-name $r.name | Out-Null
}

# 2) AÑADIR solo IPs salientes de la WebApp
$webOut = (az webapp show -g $RG -n $WEB --query possibleOutboundIpAddresses -o tsv).Split(",")
$prio = 100
foreach ($ip in $webOut) {
  az webapp config access-restriction add -g $RG -n $API `
    --rule-name "allow-web-$ip" --action Allow --ip-address "$ip/32" --priority $prio | Out-Null
  $prio += 1
}

# (Opcional) tu IP admin
try {
  $myip = (Invoke-WebRequest -Uri "https://ifconfig.me" -TimeoutSec 5).Content.Trim()
  az webapp config access-restriction add -g $RG -n $API `
    --rule-name "allow-admin" --action Allow --ip-address "$myip/32" --priority 50 | Out-Null
} catch {}

# Aplicar mismas restricciones al sitio SCM/Kudu
az webapp config access-restriction set -g $RG -n $API --use-same-restrictions-for-scm-site true | Out-Null

# 3) CORS mínimo + verificación
$WEB_FQDN = az webapp show -g $RG -n $WEB --query defaultHostName -o tsv
az webapp cors remove -g $RG -n $API --all | Out-Null
az webapp cors add    -g $RG -n $API --allowed-origins "https://www.econeura.com" "https://$WEB_FQDN" | Out-Null
az webapp cors show   -g $RG -n $API --query allowedOrigins -o tsv

# 4) HealthCheckPath (mantener /health; cambia a /healthz si tu app lo expone)
# az webapp update -g $RG -n $API --set siteConfig.healthCheckPath="/healthz"

# 5) Warmup + resumen corto
(1..3) | ForEach-Object { Invoke-WebRequest -Uri "https://$API.azurewebsites.net/health" -Method Get -UseBasicParsing | Out-Null; Start-Sleep 1 }
Invoke-WebRequest -Uri "https://$API.azurewebsites.net/health" -Method Options -UseBasicParsing -Headers @{ "Origin"="https://$WEB_FQDN"; "Access-Control-Request-Method"="GET" } -ErrorAction SilentlyContinue | Select-Object StatusCode,Headers
az webapp config access-restriction show -g $RG -n $API -o table
