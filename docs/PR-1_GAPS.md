# PR-1 GAPS: Valores faltantes y plan de acción

Al crear `.artifacts/context.json` el archivo quedó sin commitear porque la carpeta `.artifacts` está ignorada por `.gitignore` en este repositorio.

Valores dinámicos faltantes dentro de `.artifacts/context.json`:
- `pnpm`: versión de pnpm en el entorno de autor.
- `repoSizeBytes`: tamaño del repositorio en bytes.

Plan 3 pasos para completar y permitir rastreo idempotente:

1. Verificar si la inclusión de `.artifacts` en el repo está permitida. Si sí, remover la regla correspondiente en `.gitignore` o añadir `!/.artifacts/context.json` y commitear con `git add -f .artifacts/context.json` usando `git mv` si corresponde.
2. Ejecutar localmente:
   - `pnpm -v > .artifacts/pnpm_version.txt`
   - `du -sb . | cut -f1 > .artifacts/repo_size_bytes.txt`
   - Actualizar `.artifacts/context.json` con estos valores.
3. Crear un commit separado pequeño (`docs: add artifacts context`) que añada `.artifacts/context.json` con `git add -f` si la política lo permite, o mantener `.artifacts` fuera del repo y mover el artefacto a CI artefact storage (recomendado).

Si no se puede commitear el artefacto por política, usar el almacenamiento de CI (artifacts) y actualizar `.artifacts/README.md` con instrucciones para recuperar los valores.
