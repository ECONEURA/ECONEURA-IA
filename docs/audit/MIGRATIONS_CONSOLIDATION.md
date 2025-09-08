# Plan de consolidación de migraciones (sin ejecutar)

Inventario (detectado en repo):
- apps/api/prisma/migrations/ (Prisma migrations)
- packages/db/src/migrations/ (SQL migrations)
- packages/db/migrations/ (SQL migrations)

Ruta canónica propuesta: apps/api/prisma/migrations (si existe), else apps/api/prisma/migrations como ruta principal.

Ficheros/rutas a deprecar: 
- packages/db/src/migrations/
- packages/db/migrations/

DoD futuro:
- db:migrate verde en entorno controlado
- RLS/índices verificados
- Historial unificado