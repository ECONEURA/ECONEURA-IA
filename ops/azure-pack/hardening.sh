#!/bin/bash
# Azure App Service Hardening Script

echo "🔒 Aplicando hardening de Azure App Service..."

# HTTPS only
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-web-dev --https-only true
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-api-dev --https-only true

# TLS 1.2 minimum
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-web-dev --min-tls-version 1.2
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-api-dev --min-tls-version 1.2

# HTTP/2 enabled
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-web-dev --http20-enabled true
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-api-dev --http20-enabled true

# Health check path
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-web-dev --health-check-path /health
az webapp config set --resource-group appsvc_linux_northeurope_basic --name econeura-api-dev --health-check-path /health

# App settings (claves vacías por seguridad)
az webapp config appsettings set --resource-group appsvc_linux_northeurope_basic --name econeura-web-dev --settings \
  "NEXT_PUBLIC_API_URL=https://econeura-api-dev.azurewebsites.net" \
  "NODE_ENV=production"

az webapp config appsettings set --resource-group appsvc_linux_northeurope_basic --name econeura-api-dev --settings \
  "ALLOWED_ORIGINS=https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net,https://www.econeura.com" \
  "NODE_ENV=production"

echo "✅ Hardening completado"
