# Plan de consolidación de migraciones (sin ejecutar)

Inventario (detectado en repo):
- ./apps/api/prisma/migrations - Prisma migrations for API app
- ./packages/db/src/migrations - Database package source migrations
- ./packages/db/migrations - Database package migrations
- ./apps/api/prisma/schema.prisma - Prisma schema file

Ruta canónica propuesta: apps/api/prisma/migrations (existe)

Ficheros/rutas a deprecar: 
- ./packages/db/src/migrations - duplicated migration source
- ./packages/db/migrations - duplicated migration files

DoD futuro:
- db:migrate verde en entorno controlado
- RLS/índices verificados  
- Historial unificado
- Consolidate migrations in single canonical location
- Remove duplicate migration directories
- Verify schema consistency across migration sources