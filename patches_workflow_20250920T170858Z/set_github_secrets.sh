#!/usr/bin/env bash
set -euo pipefail
# Reemplaza los placeholders y ejecuta estos comandos para configurar secrets en GitHub (gh CLI autenticado).
# gh repo set-secret OWNER/REPO VAULT_ADDR --body "https://vault.example.local"
# gh repo set-secret OWNER/REPO VAULT_TOKEN --body "<VAULT_TOKEN_PLACEHOLDER>"
# gh repo set-secret OWNER/REPO VAULT_APPROVAL_KEY --body "<VAULT_APPROVAL_KEY_HEX>"
echo "Edita y ejecuta los comandos comentados dentro de este archivo para configurar secrets."
