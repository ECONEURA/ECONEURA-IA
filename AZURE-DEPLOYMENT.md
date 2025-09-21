# 🚀 ECONEURA-IA Azure Deployment Guide

## 📋 Información de Azure Configurada

### Suscripción y Recursos
- **Suscripción**: "Suscripción de Azure 1"
- **ID de Suscripción**: `fc22ced4-6dc1-4f52-aac1-170a62f98c57`
- **Región**: North Europe
- **Resource Group**: `appsvc_linux_northeurope_basic`

### App Service Plan
- **Nombre**: `appsvc_linux_northeurope_basic`
- **SKU**: Basic (B1)
- **SO**: Linux
- **Instancias**: 1

### Aplicaciones Web
- **API**: `econeura-api-dev`
  - **URL**: https://econeura-api-dev.azurewebsites.net
  - **Estado**: Running
  - **Health Check**: 100.00% (1 ok / 0 degradado)
- **Web**: `econeura-web-dev`
  - **URL**: https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
  - **Estado**: Running
  - **Health Check**: 0.00% (0 ok / 1 degradado)

### Application Insights
- **Component Name**: "Habilitar Application Insights (en apps)"
- **Workspace**: `workspace-econeura-web-dev`
- **Workspace ID**: `ecbaab79-0b91-4a9d-b308-37112e1c9f45`
- **Instrumentation Key**: `fd107298-6cc0-4d42-b5ac-cd65326fb9f4`
- **Connection String**: `InstrumentationKey=fd107298-6cc0-4d42-b5ac-cd65326fb9f4;IngestionEndpoint=https://northeurope-2.in.applicationinsights.azure.com/;LiveEndpoint=https://northeurope.livediagnostics.monitor.azure.com/;ApplicationId=468ffe42-be05-4a0e-9ea8-b9e8ac4cc169`

## 🔧 Configuración de Deployment

### 1. Configurar GitHub Secrets

Ve a tu repositorio de GitHub → Settings → Secrets and variables → Actions

Agrega los siguientes secrets:

```bash
AZURE_API_PUBLISH_PROFILE  # Descargar de econeura-api-dev → Get Publish Profile
AZURE_WEB_PUBLISH_PROFILE  # Descargar de econeura-web-dev → Get Publish Profile
```

### 2. Variables de Entorno en Azure

Configura las siguientes variables en Azure App Service → Configuration:

#### Para econeura-api-dev:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=<tu-connection-string-postgresql>
REDIS_URL=<tu-connection-string-redis>
JWT_SECRET=<tu-jwt-secret>
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string-de-arriba>
CORS_ORIGIN=https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
```

#### Para econeura-web-dev:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://econeura-api-dev.azurewebsites.net
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string-de-arriba>
```

### 3. Deployment Automático

Una vez configurados los secrets, cada push a la rama `main` activará el deployment automático:

```bash
git add .
git commit -m "feat: azure deployment configuration"
git push origin main
```

Monitorea el progreso en: GitHub → Actions → "Deploy to Azure App Service"

## 📊 Monitoreo y Health Checks

### Application Insights
- **Dashboard**: Azure Portal → Application Insights → workspace-econeura-web-dev
- **Métricas**: Requests, Response times, Exceptions, Dependencies
- **Live Metrics**: Tiempo real durante desarrollo

### Health Checks
- **API Health**: https://econeura-api-dev.azurewebsites.net/health
- **Web Health**: https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/api/health

## 🔒 Seguridad

### Networking
- **Outbound IPs**: Configuradas en el App Service Plan
- **VNet Integration**: No configurado (puedes agregarlo si necesitas acceso a recursos internos)

### Secrets Management
- Usa Azure Key Vault para secrets sensibles
- Configura Managed Identity para acceso seguro a recursos Azure

## 🚀 Próximos Pasos

### Inmediatos
1. ✅ Configurar GitHub secrets
2. ✅ Push inicial para deployment
3. ✅ Verificar funcionamiento básico
4. ✅ Configurar base de datos PostgreSQL en Azure

### Futuros
1. 🔄 Configurar dominios personalizados
2. 🔄 Implementar Azure Front Door para CDN
3. 🔄 Configurar Azure Redis Cache
4. 🔄 Implementar Azure Key Vault para secrets
5. 🔄 Configurar Azure Monitor alerts
6. 🔄 Implementar CI/CD con Azure DevOps (opcional)

## 🐛 Troubleshooting

### Problemas Comunes

#### Deployment falla
```bash
# Verificar logs en Azure Portal
# App Service → Deployment Center → Logs

# Verificar GitHub Actions logs
# GitHub → Actions → Último workflow
```

#### Aplicación no responde
```bash
# Verificar Application Insights
# Azure Portal → Application Insights → Failures

# Verificar logs de aplicación
# App Service → App Service logs → Application logs
```

#### Variables de entorno no aplican
```bash
# Reiniciar la aplicación después de cambiar variables
# App Service → Overview → Restart
```

## 📞 Soporte

- **Azure Portal**: https://portal.azure.com
- **Application Insights**: Monitor → Application Insights
- **GitHub Actions**: Repository → Actions
- **App Service Logs**: App Service → App Service logs

---

**🎯 Tu ECONEURA-IA está lista para brillar en Azure!** 🚀
