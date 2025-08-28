import { z } from 'zod';
import { OrgIdSchema, BaseTimestampsSchema } from './base';

// Tipos de webhook
export const WebhookSourceSchema = z.enum([
  'make',     // Make.com (ex Integromat)
  'zapier',   // Zapier
  'outlook',  // Microsoft Outlook/Graph
  'teams',    // Microsoft Teams  
  'custom',   // Webhook personalizado
]);

// Request base de webhook
export const WebhookPayloadSchema = z.object({
  source: WebhookSourceSchema,
  event_type: z.string().min(1).max(100),
  timestamp: z.number(),
  signature: z.string(),
  data: z.record(z.string(), z.unknown()),
});

// Tipos de canal de comunicación
export const ChannelTypeSchema = z.enum([
  'email',    // Correo electrónico
  'whatsapp', // WhatsApp Business API
  'teams',    // Microsoft Teams
  'webhook',  // Webhook genérico
]);

// Request para enviar mensaje
export const SendMessageSchema = z.object({
  channel: ChannelTypeSchema,
  recipient: z.string().min(1),
  message: z.string().min(1).max(4000),
  template_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Response de envío de mensaje
export const MessageResponseSchema = z.object({
  message_id: z.string(),
  channel: ChannelTypeSchema,
  recipient: z.string(),
  status: z.enum(['queued', 'sent', 'delivered', 'read', 'failed']),
  error: z.string().optional(),
}).merge(BaseTimestampsSchema);

// Configuración de integración
export const IntegrationConfigSchema = z.object({
  org_id: OrgIdSchema,
  type: z.enum(['email', 'whatsapp', 'teams', 'webhook']),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().default(true),
}).merge(BaseTimestampsSchema);

// Tipos exportados
export type WebhookSource = z.infer<typeof WebhookSourceSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;
