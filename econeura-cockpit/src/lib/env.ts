// Configuración de entorno con validación - ECONEURA Cockpit
import { z } from 'zod';

const Env = z.object({
  NEXT_PUBLIC_LLM_PROVIDER: z.enum(['azure', 'mistral', 'mock']).default('mock'),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-02-15-preview'),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),
  NEXT_PUBLIC_MAKE_MODE: z.enum(['real', 'mock']).default('mock'),
  MAKE_BASE_URL: z.string().optional(),
  MAKE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_EU_DATACENTER: z.enum(['we', 'ne']).default('we'),
});

export const env = Env.parse(process.env);

export function assertRealProviders(): void {
  if (env.NEXT_PUBLIC_LLM_PROVIDER !== 'mock' && !(
    (env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_DEPLOYMENT && env.AZURE_OPENAI_API_KEY) ||
    (env.MISTRAL_API_KEY)
  )) {
    throw new Error('LLM credentials missing');
  }
  
  if (env.NEXT_PUBLIC_MAKE_MODE === 'real' && !(env.MAKE_BASE_URL && env.MAKE_TOKEN)) {
    throw new Error('Make credentials missing');
  }
}

