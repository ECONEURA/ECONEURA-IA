import { z } from "zod";

export const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().min(1).optional()
});

export const parseEnv = (e: NodeJS.ProcessEnv) => {
  const p = Env.safeParse(e);
  if (!p.success) throw new Error(p.error.message);
  return p.data;
};
