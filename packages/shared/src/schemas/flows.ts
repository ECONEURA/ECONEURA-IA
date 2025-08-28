import { z } from 'zod';
import { OrgIdSchema, BaseTimestampsSchema } from './base';

// Estado de un proceso de flujo
export const FlowStatusSchema = z.enum([
  'pending',   // Pendiente de inicio
  'running',   // En ejecución
  'completed', // Completado con éxito
  'failed',    // Fallido
  'cancelled', // Cancelado por usuario
]);

// Tipos de flujo
export const FlowTypeSchema = z.enum([
  'cobro_proactivo', // Flujo de cobro proactivo
  'follow_up',       // Seguimiento comercial
  'reminder',        // Recordatorio
]);

// Ejecución de flujo
export const FlowExecutionSchema = z.object({
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  flow_type: FlowTypeSchema,
  status: FlowStatusSchema,
  input_data: z.record(z.string(), z.unknown()),
  output_data: z.record(z.string(), z.unknown()).optional(),
  steps_completed: z.array(z.string()),
  error_message: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).merge(BaseTimestampsSchema);

// Request para iniciar flujo
export const StartFlowSchema = z.object({
  flow_type: FlowTypeSchema,
  input_data: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Response de flujo iniciado
export const StartFlowResponseSchema = z.object({
  execution_id: z.string().uuid(),
  status: FlowStatusSchema,
  message: z.string(),
});

// Configuración de flujo
export const FlowConfigSchema = z.object({
  org_id: OrgIdSchema,
  flow_type: FlowTypeSchema,
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().default(true),
}).merge(BaseTimestampsSchema);

// Query de historial de flujos
export const FlowHistoryQuerySchema = z.object({
  org_id: OrgIdSchema.optional(),
  flow_type: FlowTypeSchema.optional(),
  status: FlowStatusSchema.optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

// Tipos exportados
export type FlowStatus = z.infer<typeof FlowStatusSchema>;
export type FlowType = z.infer<typeof FlowTypeSchema>;
export type FlowExecution = z.infer<typeof FlowExecutionSchema>;
export type StartFlow = z.infer<typeof StartFlowSchema>;
export type StartFlowResponse = z.infer<typeof StartFlowResponseSchema>;
export type FlowConfig = z.infer<typeof FlowConfigSchema>;
export type FlowHistoryQuery = z.infer<typeof FlowHistoryQuerySchema>;
