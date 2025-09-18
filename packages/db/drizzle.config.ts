import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://econeura_user:econeura_password@localhost:5432/econeura_dev',
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp'
  }
});
