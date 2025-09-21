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

## ASK: `pnpm` / `npx` not available in this container

Context: Durante la ejecución automatizada de auditoría, el entorno carecía de `pnpm` y `npx`, lo que impedía la ejecución local de `pnpm install`, `pnpm audit`, `eslint`, `vitest` y `jscpd`.

Action (container / Ubuntu runner):

```bash
# Install Node.js (example for Debian/Ubuntu, adjust for your runner):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Install pnpm and npx (corepack + pnpm)
corepack enable
corepack prepare pnpm@8.15.5 --activate

# Verify
node -v
pnpm -v
npx -v
```

How to verify in CI job: add a step that runs the `node -v && pnpm -v` commands and fails early if missing.
