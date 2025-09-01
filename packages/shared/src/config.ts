import { z } from 'zod';

// Esquema de validación de configuración
const configSchema = z.object({
  // Configuración del servidor
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Seguridad
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  ALLOWED_ORIGINS: z.string(),
  
  // Base de datos
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // Azure OpenAI
  AZURE_OPENAI_API_KEY: z.string(),
  AZURE_OPENAI_API_ENDPOINT: z.string().url(),
  AZURE_OPENAI_API_VERSION: z.string(),
  AZURE_OPENAI_DEFAULT_MODEL: z.string().default('gpt-4'),
  
  // Observabilidad
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  
  // Límites y cuotas
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AI_BUDGET_LIMIT_EUR: z.string().transform(Number).default('100'),
  AI_BUDGET_ALERT_THRESHOLD: z.string().transform(Number).default('80'),
});

// Función para cargar y validar la configuración
export function loadConfig() {
  try {
    const config = configSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid configuration');
  }
}

// Exportar la configuración validada
export const config = loadConfig();

// Tipos derivados del esquema
export type Config = z.infer<typeof configSchema>;

// Exportar constantes comunes
export const ENV = {
  isDev: config.NODE_ENV === 'development',
  isProd: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
} as const;

// Exportar helpers de configuración
export function getRequiredConfig<T>(key: keyof Config): T {
  const value = config[key];
  if (value === undefined) {
    throw new Error(`Missing required configuration: ${key}`);
  }
  return value as T;
}

export function getOptionalConfig<T>(key: keyof Config, defaultValue: T): T {
  const value = config[key];
  return (value === undefined ? defaultValue : value) as T;
}
