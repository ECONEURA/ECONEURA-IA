import { defineConfig } from 'drizzle-kit'
import { env } from '@econeura/shared'

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: env().PGHOST,
    user: env().PGUSER,
    password: env().PGPASSWORD,
    database: env().PGDATABASE,
    port: env().PGPORT,
  },
  verbose: true,
  strict: true,
})



