#!/usr/bin/env bash
set -euo pipefail
# Busca y reemplaza pnpm/action-setup en todo el repo
find . -type f \( -name '*.yml' -o -name '*.yaml' -o -name '*.md' -o -name '*.sh' \) -print0 | xargs -0 sed -i '' -e 's/uses: pnpm\/action-setup@[^\n]*/run: corepack enable && corepack prepare pnpm@8.15.6 --activate/g'

git add .
git commit -m "ci: replace pnpm/action-setup with corepack prepare globally"
git push origin pr/bootstrapping/local-setup

echo "Reemplazo global completado. Revisa los workflows en GitHub Actions."
