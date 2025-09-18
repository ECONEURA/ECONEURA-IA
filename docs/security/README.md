# Security Tools & SBOM Generation

Este directorio contiene las herramientas y scripts para verificación de seguridad, detección de secretos y generación de Software Bill of Materials (SBOM) para el proyecto ECONEURA.

## 🔐 Herramientas de Seguridad

### Anti-Secrets Scan

Script avanzado para detección de secretos con múltiples herramientas:

- **detect-secrets**: Herramienta principal para detección de secretos
- **TruffleHog**: Escáner de secretos en repositorios
- **GitLeaks**: Detección de secretos en Git
- **Patrones personalizados**: Detección de API keys, passwords, tokens, etc.

```bash
# Ejecutar escaneo anti-secretos
pnpm security:anti-secrets

# O directamente
node scripts/security/anti-secrets-scan.mjs
```

### SBOM Generation

Generador de Software Bill of Materials con múltiples formatos:

- **CycloneDX**: Formato estándar para SBOM
- **SPDX**: Formato de la Linux Foundation
- **Syft**: Herramienta de Anchore para análisis de paquetes
- **SBOM personalizado**: Generación customizada para el proyecto

```bash
# Generar SBOM
pnpm security:sbom

# O directamente
node scripts/security/sbom-generator.mjs
```

### Security CI

Script principal para ejecutar todas las verificaciones de seguridad:

```bash
# Ejecutar todas las verificaciones
pnpm security:ci

# O directamente
node scripts/security/security-ci.mjs
```

## 🛠️ Configuración

### Archivo de Configuración

El archivo `scripts/security/security-config.json` contiene toda la configuración:

```json
{
  "antiSecrets": {
    "enabled": true,
    "tools": {
      "detectSecrets": { "enabled": true },
      "trufflehog": { "enabled": true },
      "gitleaks": { "enabled": true }
    },
    "patterns": {
      "apiKeys": ["api[_-]?key\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}['\"]?"],
      "passwords": ["password\\s*[:=]\\s*['\"]?[^'\"]{8,}['\"]?"],
      "tokens": ["token\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}['\"]?"],
      "secrets": ["secret\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}['\"]?"]
    }
  },
  "sbom": {
    "enabled": true,
    "tools": {
      "cyclonedx": { "enabled": true },
      "spdx": { "enabled": true },
      "syft": { "enabled": true }
    }
  },
  "ci": {
    "thresholds": {
      "maxSecrets": 0,
      "maxVulnerabilities": 10,
      "minSecurityScore": 80
    }
  }
}
```

### Umbrales de Seguridad

- **Máximo de secretos**: 0 (falla si encuentra cualquier secreto)
- **Máximo de vulnerabilidades**: 10
- **Puntuación mínima de seguridad**: 80/100

## 📊 Reportes

### Tipos de Reportes

1. **JSON**: Reportes estructurados para procesamiento automatizado
2. **Texto**: Reportes legibles para humanos
3. **GitHub**: Reportes integrados con GitHub Actions

### Ubicación de Reportes

Todos los reportes se generan en el directorio `reports/`:

```
reports/
├── anti-secrets-scan.json
├── anti-secrets-scan.txt
├── sbom-report.json
├── sbom-report.txt
├── sbom-cyclonedx.json
├── sbom-spdx.json
├── sbom-syft.json
├── vulnerabilities.json
├── licenses.json
├── security-ci-report.json
└── security-ci-report.txt
```

## 🚀 CI/CD Integration

### GitHub Actions

El workflow `.github/workflows/security-scan.yml` ejecuta automáticamente:

1. **Anti-secrets scan** en cada PR
2. **SBOM generation** en cada push
3. **Dependency audit** con pnpm y npm
4. **Security summary** con resultados consolidados

### Comentarios en PR

Los resultados se comentan automáticamente en los Pull Requests:

- ✅ **Sin secretos**: "No secrets detected - Code is clean!"
- ⚠️ **Secretos encontrados**: Lista de archivos y tipos de secretos
- 📦 **SBOM**: Resumen de paquetes y vulnerabilidades
- 🔍 **Auditoría**: Resultados de vulnerabilidades

## 🔧 Instalación de Herramientas

### Herramientas Requeridas

```bash
# detect-secrets
pip install detect-secrets

# TruffleHog
wget https://github.com/trufflesecurity/trufflehog/releases/latest/download/trufflehog_3.63.1_linux_amd64.tar.gz
tar -xzf trufflehog_3.63.1_linux_amd64.tar.gz
sudo mv trufflehog /usr/local/bin/

# GitLeaks
wget https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# CycloneDX
npm install -g @cyclonedx/cyclonedx-npm

# SPDX
npm install -g spdx-sbom-generator

# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
```

### Instalación Automática

Las herramientas se instalan automáticamente en GitHub Actions:

```yaml
- name: Install security tools
  run: |
    pip install detect-secrets
    # ... instalación de otras herramientas
```

## 📋 Scripts Disponibles

### Package.json Scripts

```bash
# Escaneo anti-secretos
pnpm security:anti-secrets

# Generación de SBOM
pnpm security:sbom

# Verificaciones de seguridad CI
pnpm security:ci

# Todas las verificaciones
pnpm security:all

# Auditoría de dependencias
pnpm security:audit

# Escaneo con Snyk
pnpm security:scan
```

### Scripts Directos

```bash
# Anti-secrets scan
node scripts/security/anti-secrets-scan.mjs

# SBOM generation
node scripts/security/sbom-generator.mjs

# Security CI
node scripts/security/security-ci.mjs
```

## 🎯 Mejores Prácticas

### Para Desarrolladores

1. **Nunca hardcodear secretos** en el código
2. **Usar variables de entorno** para configuración sensible
3. **Revisar reportes de seguridad** en cada PR
4. **Actualizar dependencias** regularmente
5. **Ejecutar verificaciones locales** antes de hacer push

### Para CI/CD

1. **Ejecutar verificaciones** en cada PR
2. **Bloquear merge** si hay secretos o vulnerabilidades críticas
3. **Generar SBOM** en cada release
4. **Monitorear tendencias** de seguridad
5. **Actualizar umbrales** según necesidades del proyecto

## 🚨 Troubleshooting

### Problemas Comunes

#### Herramientas no encontradas

```bash
# Verificar instalación
which detect-secrets
which trufflehog
which gitleaks

# Reinstalar si es necesario
pip install --upgrade detect-secrets
```

#### Falsos positivos

1. **Actualizar baseline**: `detect-secrets audit .secrets.baseline`
2. **Agregar patrones de exclusión** en `security-config.json`
3. **Usar comentarios de exclusión** en el código

#### Timeouts en CI

1. **Aumentar timeouts** en `security-config.json`
2. **Ejecutar herramientas por separado**
3. **Optimizar patrones de exclusión**

### Logs y Debugging

```bash
# Ejecutar con verbose
node scripts/security/anti-secrets-scan.mjs --verbose

# Ver logs detallados
tail -f reports/anti-secrets-scan.txt

# Verificar configuración
cat scripts/security/security-config.json
```

## 📚 Referencias

- [detect-secrets Documentation](https://github.com/Yelp/detect-secrets)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [GitLeaks Documentation](https://github.com/zricethezav/gitleaks)
- [CycloneDX Specification](https://cyclonedx.org/)
- [SPDX Specification](https://spdx.dev/)
- [Syft Documentation](https://github.com/anchore/syft)
