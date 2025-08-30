import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Configuración de conexión simplificada
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/econeura';

// Cliente de postgres
const client = postgres(connectionString);

// Instancia de drizzle
export const db = drizzle(client);

// Función para cerrar la conexión
export const closeConnection = async () => {
  await client.end();
};
