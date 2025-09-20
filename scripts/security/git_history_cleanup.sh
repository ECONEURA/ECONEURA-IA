# Ejecutar en una copia del repo (mirror) y coordinar con el equipo
git clone --mirror "https://github.com/<OWNER>/<REPO>.git" repo-mirror.git
cd repo-mirror.git

# Reemplazar la clave expuesta por REDACTED en todo el historial
# Reemplaza <EXPOSED_KEY> por la clave comprometida (no la pegues en chats)
git filter-repo --replace-text <(printf "s/%s/REDACTED/g\n" "<EXPOSED_KEY>")

# Revisar, probar y luego push forzado (coordinar con equipo)
git push --force origin --all
git push --force origin --tags