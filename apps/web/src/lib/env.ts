import { z } from 'zod'

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_GRAPH_BASE_URL: z.string().url().default('http://localhost:3002'),
  NEXT_PUBLIC_GRAPH_MOCK: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

export const env: ClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_GRAPH_BASE_URL: process.env.NEXT_PUBLIC_GRAPH_BASE_URL,
  NEXT_PUBLIC_GRAPH_MOCK: process.env.NEXT_PUBLIC_GRAPH_MOCK,
})

