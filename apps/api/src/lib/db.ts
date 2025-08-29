import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@econeura/db/schema';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/econeura';

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Close database connection
export const closeDb = async () => {
  await client.end();
};
