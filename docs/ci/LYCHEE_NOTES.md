# Lychee Link Checker Notes

## Configuración

Lychee se ejecuta con `npx lychee docs --verbose` para verificar links rotos en la documentación.

## Archivos Ignorados

Los siguientes archivos/patrones están en `.lycheeignore`:

```
# Archivos locales que no deben ser verificados
*.local
*.dev
localhost:*
127.0.0.1:*

# URLs de desarrollo que pueden no estar disponibles
http://localhost:3000
http://localhost:3001
http://localhost:8080

# URLs de staging que pueden no estar disponibles
https://staging.econeura.com
https://dev.econeura.com

# URLs de Azure que requieren autenticación
https://*.azurewebsites.net
https://*.azurecontainerapps.io

# URLs de GitHub que pueden cambiar
https://github.com/ECONEURA/ECONEURA-IA/issues/*
https://github.com/ECONEURA/ECONEURA-IA/pull/*

# URLs de documentación externa que pueden estar temporalmente inaccesibles
https://docs.microsoft.com/*
https://learn.microsoft.com/*
```

## Justificación

### URLs Locales
- `localhost:*` - URLs de desarrollo local que no están disponibles en CI
- `127.0.0.1:*` - URLs de loopback que no están disponibles en CI

### URLs de Staging/Dev
- URLs de entornos de desarrollo que pueden no estar siempre disponibles
- URLs de staging que pueden estar en mantenimiento

### URLs de Azure
- URLs de Azure que requieren autenticación o están detrás de firewalls
- URLs de recursos que pueden no estar desplegados

### URLs de GitHub
- URLs de issues/PRs que pueden cambiar o ser eliminados
- URLs de releases que pueden cambiar

### URLs de Documentación Externa
- URLs de Microsoft Docs que pueden estar temporalmente inaccesibles
- URLs de documentación externa que pueden cambiar

## Comandos Útiles

```bash
# Verificar links con configuración personalizada
npx lychee docs --verbose --config .lycheerc

# Verificar solo links específicos
npx lychee docs --include "*.md" --exclude "node_modules"

# Generar reporte en formato JSON
npx lychee docs --output lychee-report.json --format json

# Verificar con timeout personalizado
npx lychee docs --timeout 10s
```

## Troubleshooting

### Error: "Too many requests"
- Aumentar el timeout: `--timeout 30s`
- Usar `--rate-limit 1` para limitar requests por segundo

### Error: "Connection timeout"
- Verificar que las URLs están accesibles
- Añadir URLs problemáticas a `.lycheeignore`

### Error: "SSL certificate error"
- Usar `--insecure` para ignorar errores de SSL (solo para desarrollo)

## Configuración en CI

En los workflows de GitHub Actions, Lychee se ejecuta con:

```yaml
- name: Check links
  run: npx lychee docs --verbose
  continue-on-error: true
```

El `continue-on-error: true` permite que el workflow continúe aunque haya links rotos, pero los resultados se reportan en el summary.
