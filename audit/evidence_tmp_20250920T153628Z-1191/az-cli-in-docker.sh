#!/usr/bin/env bash
# Ejecuta Azure CLI dentro de un contenedor Docker para evitar instalar az localmente.
# Uso:
#   bash scripts/az-cli-in-docker.sh -- az login --use-device-code
# o para crear un service principal y guardar el JSON:
#   bash scripts/az-cli-in-docker.sh -- az ad sp create-for-rbac --name "sp-github-actions-ec" --role "Contributor" --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RG> --sdk-auth > sp.json

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado. Instala Docker Desktop para macOS: https://www.docker.com/products/docker-desktop"
  exit 2
fi

if [ "$#" -lt 2 ] || [ "$1" != "--" ]; then
  echo "Uso: bash scripts/az-cli-in-docker.sh -- <az-commands...>"
  echo "Ejemplo: bash scripts/az-cli-in-docker.sh -- az login --use-device-code"
  exit 1
fi

# Construir el comando az a ejecutar dentro del contenedor
shift
AZ_CMD=("$@")

# Montar el directorio actual en /work
WORKDIR_HOST=$(pwd)
WORKDIR_CONTAINER=/work

# Ejecutar contenedor con la imagen oficial de Azure CLI
# Mantener HOME y credenciales persistentes en ./.azure (opcional)
mkdir -p .azure

docker run --rm -it \
  -v "$WORKDIR_HOST":"$WORKDIR_CONTAINER" \
  -v "$WORKDIR_HOST/.azure":"/root/.azure" \
  -w "$WORKDIR_CONTAINER" \
  mcr.microsoft.com/azure-cli:latest \
  "${AZ_CMD[@]}"
