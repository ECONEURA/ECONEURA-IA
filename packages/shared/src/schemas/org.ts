import { z } from 'zod';
import { OrgIdSchema, BaseTimestampsSchema } from './base';

// Estado de una organización
export const OrgStatusSchema = z.enum([
  'active',    // Activa y funcionando
  'suspended', // Suspendida temporalmente
  'cancelled', // Cancelada/eliminada
]);

// Plan de suscripción
export const SubscriptionPlanSchema = z.enum([
  'free',      // Plan gratuito
  'starter',   // Plan básico
  'pro',       // Plan profesional
  'enterprise' // Plan empresarial
]);

// Organización/tenant
export const OrganizationSchema = z.object({
  org_id: OrgIdSchema,
  name: z.string().min(1).max(200),
  status: OrgStatusSchema.default('active'),
  plan: SubscriptionPlanSchema.default('free'),
  api_key_hash: z.string(),
  api_key_last_digits: z.string().length(4),
  api_key_expires_at: z.date().optional(),
  domain: z.string().optional(),
  contact_email: z.string().email(),
  billing_email: z.string().email().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).merge(BaseTimestampsSchema);

// Request para crear organización
export const CreateOrgSchema = z.object({
  name: z.string().min(1).max(200),
  plan: SubscriptionPlanSchema.optional(),
  domain: z.string().optional(),
  contact_email: z.string().email(),
  billing_email: z.string().email().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Límites de uso por organización
export const OrgLimitsSchema = z.object({
  org_id: OrgIdSchema,
  rps_limit: z.number().int().positive(),
  burst: z.number().int().positive(),
  monthly_cost_cap_eur: z.number().positive(),
  max_parallel_jobs: z.number().int().positive(),
  storage_quota_gb: z.number().int().positive(),
}).merge(BaseTimestampsSchema);

// Request para actualizar límites
export const UpdateOrgLimitsSchema = z.object({
  rps_limit: z.number().int().positive().optional(),
  burst: z.number().int().positive().optional(),
  monthly_cost_cap_eur: z.number().positive().optional(),
  max_parallel_jobs: z.number().int().positive().optional(),
  storage_quota_gb: z.number().int().positive().optional(),
});

// Feature flag 
export const FeatureFlagSchema = z.object({
  org_id: OrgIdSchema,
  flag: z.string(),
  enabled: z.boolean(),
}).merge(BaseTimestampsSchema);

// Request para actualizar feature flag
export const UpdateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

// API key
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  name: z.string().min(1).max(100),
  key_hash: z.string(),
  last_used_at: z.date().optional(),
  expires_at: z.date().optional(),
  revoked: z.boolean().default(false),
}).merge(BaseTimestampsSchema);

// Request para crear API key
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expires_at: z.date().optional(),
});

// Tipos exportados
export type OrgStatus = z.infer<typeof OrgStatusSchema>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrg = z.infer<typeof CreateOrgSchema>;
export type OrgLimits = z.infer<typeof OrgLimitsSchema>;
export type UpdateOrgLimits = z.infer<typeof UpdateOrgLimitsSchema>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type UpdateFeatureFlag = z.infer<typeof UpdateFeatureFlagSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
