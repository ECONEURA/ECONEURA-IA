# Conexión a Azure sin instalar `az` localmente

Este documento enumera alternativas para crear el Service Principal y el secreto `AZURE_CREDENTIALS` necesarios para que los workflows de GitHub Actions (autenticación OIDC o `AZURE_CREDENTIALS`) funcionen, sin requerir instalar `az` en tu macOS local.

Opciones soportadas

1) Usar Azure CLI dentro de Docker (recomendado si no quieres instalar `az`)

- Requiere: Docker Desktop instalado.
- Ventajas: No necesita instalar `az` ni Homebrew; la imagen oficial trae todo.
- Cómo usar (desde la raíz del repo):

```bash
# Inicia sesión usando un flujo interactivo (device code)
bash scripts/az-cli-in-docker.sh -- az login --use-device-code

# Crea un service principal y guarda el JSON para el secreto
bash scripts/az-cli-in-docker.sh -- az ad sp create-for-rbac \
  --name "sp-github-actions-ec" \
  --role "Contributor" \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RG> \
  --sdk-auth > sp-azure-credentials.json

# Copia el contenido y pégalo como secreto en GitHub (repository > Settings > Secrets > Actions > New repository secret)
# NOMBRE: AZURE_CREDENTIALS
# VALOR: contenido de sp-azure-credentials.json
```

2) Usar una máquina remota donde `az` ya esté instalado

- Puedes SSH a una VM en la que tengas `az` y ejecutar los mismos comandos.

3) Pedir a un admin que cree el Service Principal y añada el secreto por ti

- Proporciona a tu admin el nombre del SP y el scope exacto (subscription + resource group).
- Pídeles que creen el secreto `AZURE_CREDENTIALS` en GitHub.

4) Usar `gh` (GitHub CLI) + Azure Portal (manual)

- Crear el App Registration en el Portal de Azure y generar un secret. Luego crear manualmente el secreto en GitHub.

Comandos exactos para la creación del Service Principal (ejemplo)

```bash
# 1) Iniciar sesión
az login --use-device-code

# 2) Obtener el subscription id
az account show --query id -o tsv

# 3) Crear el service principal en el scope del resource group
aZ_SUBSCRIPTION_ID=<your-subscription-id>
az ad sp create-for-rbac \
  --name "sp-github-actions-ec" \
  --role "Contributor" \
  --scopes /subscriptions/$AZ_SUBSCRIPTION_ID/resourceGroups/<RG> \
  --sdk-auth > sp-azure-credentials.json

# 4) Añadir el secreto a GitHub (reemplaza OWNER/REPO y usa gh cli si quieres):
# echo "$(cat sp-azure-credentials.json)" | gh secret set AZURE_CREDENTIALS --repo OWNER/REPO
```

Notas de seguridad y accesos

- El JSON de `--sdk-auth` contiene credenciales sensibles; trátalo como secreto. No lo subas al repo.
- Si no quieres dar permisos de Contributor, ajusta el rol y scope a lo mínimo necesario (por ejemplo, roles para crear App Registrations o roles concretos en RG).

Flujo recomendado para este repo

1. Usa `bash scripts/az-cli-in-docker.sh` para crear el SP localmente.
2. Añade `AZURE_CREDENTIALS` en Settings > Secrets > Actions del repositorio.
3. Ejecuta el workflow `.github/workflows/setup-azure-oidc.yml` (dispatch) para crear el federated credential automáticamente.

Si necesitas que lo haga por ti, dime qué opción prefieres (Docker, pedir a admin, usar Portal) y te doy pasos exactos.
