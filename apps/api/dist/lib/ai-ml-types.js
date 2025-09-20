import { z } from 'zod';
export const CreatePredictionRequestSchema = z.object({
    modelId: z.string().min(1),
    type: z.enum(['forecast', 'classification', 'regression', 'anomaly', 'recommendation', 'clustering']),
    input: z.record(z.unknown()),
    metadata: z.record(z.unknown()).optional(),
});
export const CreateForecastRequestSchema = z.object({
    modelId: z.string().min(1),
    series: z.string().min(1),
    horizon: z.number().int().positive().max(365),
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
    input: z.object({
        baseValue: z.number().optional(),
        trend: z.number().optional(),
        seasonality: z.number().optional(),
        confidenceLevel: z.number().min(0).max(1).optional(),
    }),
    metadata: z.record(z.unknown()).optional(),
});
export const RunAgentRequestSchema = z.object({
    agentId: z.string().min(1),
    inputs: z.record(z.unknown()),
    idempotencyKey: z.string().optional(),
    maxCostEUR: z.number().positive().optional(),
    providerHint: z.enum(['mistral', 'azure-openai']).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    metadata: z.record(z.unknown()).optional(),
});
export function isPrediction(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.modelId === 'string';
}
export function isForecast(obj) {
    return obj && typeof obj.id === 'string' && Array.isArray(obj.predictions);
}
export function isAgentRun(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.agentId === 'string';
}
//# sourceMappingURL=ai-ml-types.js.map