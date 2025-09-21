## ASK: herramientas faltantes en el entorno

Contexto: Ejecutando la fase 0 y comprobaciones en el contenedor dev encontramos que `rg` (ripgrep) no está presente.

Acción requerida: instalar `ripgrep` en el entorno donde se ejecutarán las auditorías y CI.

Comando (scope: contenedor/dev runner Ubuntu):

```bash
sudo apk add ripgrep
# o en Debian/Ubuntu:
sudo apt-get update && sudo apt-get install -y ripgrep
```

Cómo verificar:

```bash
command -v rg >/dev/null && echo "rg:present" || echo "rg:missing"
```

Si no se desea instalar globalmente en runners de GitHub Actions, añadir un step en workflows que instale `ripgrep` antes de las comprobaciones.
