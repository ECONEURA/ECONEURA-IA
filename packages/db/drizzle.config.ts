import { defineConfig } from 'drizzle-kit'

// Use environment variables with fallbacks for development
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'econeura',
  port: parseInt(process.env.PGPORT || '5432'),
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: dbConfig,
  verbose: true,
  strict: true,
})



