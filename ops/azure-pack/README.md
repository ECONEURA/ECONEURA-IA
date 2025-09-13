# Azure Pack - ECONEURA

## Configuración

- **SUB**: fc22ced4-6dc1-4f52-aac1-170a62f98c57
- **TENANT**: a95d055a-f06e-445d-90da-c95415acc933
- **RG**: appsvc_linux_northeurope_basic
- **REGION**: northeurope

## Aplicaciones

- **WEB**: econeura-web-dev
- **API**: econeura-api-dev

## URLs

- **WEB_FQDN**: https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
- **API_URL**: https://econeura-api-dev.azurewebsites.net

## Deploy Manual

### Requisitos
- Azure CLI instalado
- Permisos de contribuidor en el resource group
- Secrets configurados en GitHub

### Pasos
1. Ejecutar hardening: `./hardening.sh`
2. Deploy manual via GitHub Actions: `workflow_dispatch`
3. Verificar deployment: `./validate.ps1`

### Notas Importantes
- **Next.js SSR**: Usar Oryx o contenedor, NO package: .next
- **Sin triggers**: Solo deploy manual
- **Pack congelado**: Listo pero no activo hasta "Entrega final"

## Scripts

- `hardening.sh`: Configuración de seguridad
- `access-restrictions.sh`: Restricciones de acceso
- `validate.ps1`: Validación post-deploy
- `deploy.yml`: Workflow de deploy manual
