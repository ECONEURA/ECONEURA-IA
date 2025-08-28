import { aiActiveRequests } from '../metrics';
import { calculateCostEUR } from './cost-utils';
import { z } from 'zod';

// Esquema Zod para la request de IA
export const aiRequestSchema = z.object({
  orgId: z.string(),
  providerId: z.string().optional(),
  model: z.string().optional(),
  tokensIn: z.number().int().nonnegative(),
  tokensOutEst: z.number().int().nonnegative().default(0),
  pricePer1KIn: z.number().nonnegative(),
  pricePer1KOut: z.number().nonnegative(),
  failedProviderId: z.string().optional(),
  limits: z.object({
    perRequestEUR: z.number().positive(),
    dailyEUR: z.number().positive(),
    monthlyEUR: z.number().positive(),
    emergencyStopEnabled: z.boolean().default(true),
    emergencyStopThresholdEUR: z.number().positive().default(1500),
  }),
});

// Preflight: chequeo de límites por EUR
export function preflightCostCheck(input: z.infer<typeof aiRequestSchema>) {
  const estCostIn = calculateCostEUR(input.tokensIn, input.pricePer1KIn);
  const estCostOut = calculateCostEUR(input.tokensOutEst, input.pricePer1KOut);
  const estTotal = estCostIn + estCostOut;
  if (input.limits.emergencyStopEnabled && input.limits.monthlyEUR >= input.limits.emergencyStopThresholdEUR) {
    throw new Error('Emergency stop: monthly threshold reached.');
  }
  if (estTotal > input.limits.perRequestEUR) {
    throw new Error(`Per-request cost limit exceeded: ${estTotal.toFixed(4)}€ > ${input.limits.perRequestEUR}€`);
  }
  return estTotal;
}

// Fallback por failedProviderId
export function filterProviders(providers: any[], failedProviderId?: string) {
  return failedProviderId
    ? providers.filter((p) => p.id !== failedProviderId)
    : providers;
}

// Scoring normalizado (menor es mejor)
export function computeScore(params: {
  cost: number; // normalizado 0..1 (0 mejor)
  health: number; // 0..1 (1 mejor)
  latencyMs: number; // ms
  maxLatencyMs: number; // para normalizar
  load: number; // 0..1 (1 peor)
}) {
  const perf = params.health * (1 / Math.max(params.latencyMs, 1));
  const perfMax = 1 / Math.max(1, params.maxLatencyMs);
  const perfNorm = 1 - Math.min(perf / perfMax, 1);
  const costNorm = Math.min(Math.max(params.cost, 0), 1);
  const loadNorm = Math.min(Math.max(params.load, 0), 1);
  return 0.45 * costNorm + 0.35 * perfNorm + 0.20 * loadNorm;
}

// Handler principal de ruteo IA (esqueleto)
// (El handler principal se implementa en la integración final)
