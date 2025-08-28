import { z } from 'zod';
import { OrgIdSchema, BaseTimestampsSchema } from './base';

// Tipos de empresa
export const CompanyTypeSchema = z.enum([
  'client',     // Cliente final
  'partner',    // Partner/distribuidor
  'supplier',   // Proveedor
  'competitor', // Competidor
  'other',      // Otro
]);

// Estados de empresa
export const CompanyStatusSchema = z.enum([
  'lead',      // Prospecto inicial
  'prospect',  // Prospecto calificado
  'active',    // Cliente activo
  'inactive',  // Cliente inactivo
  'churned',   // Cliente perdido
]);

// Empresa (cliente/partner/proveedor)
export const CompanySchema = z.object({
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  name: z.string().min(1).max(200),
  type: CompanyTypeSchema,
  status: CompanyStatusSchema,
  website: z.string().url().optional(),
  industry: z.string().optional(),
  employees: z.number().int().positive().optional(),
  annual_revenue: z.number().positive().optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).merge(BaseTimestampsSchema);

// Request para crear empresa
export const CreateCompanySchema = CompanySchema.omit({
  id: true, 
  org_id: true,
  created_at: true,
  updated_at: true,
});

// Request para actualizar empresa
export const UpdateCompanySchema = CreateCompanySchema.partial();

// Tipos de contacto
export const ContactTypeSchema = z.enum([
  'primary',    // Contacto principal
  'billing',    // Contacto de facturación
  'technical',  // Contacto técnico
  'sales',      // Contacto comercial
  'other',      // Otro tipo
]);

// Contacto 
export const ContactSchema = z.object({
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  company_id: z.string().uuid(),
  type: ContactTypeSchema,
  name: z.string().min(1).max(200),
  title: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_primary: z.boolean().default(false),
}).merge(BaseTimestampsSchema);

// Request para crear contacto
export const CreateContactSchema = ContactSchema.omit({
  id: true,
  org_id: true, 
  created_at: true,
  updated_at: true,
});

// Request para actualizar contacto
export const UpdateContactSchema = CreateContactSchema.partial();

// Etapas de oportunidad
export const DealStageSchema = z.enum([
  'lead',          // Lead inicial
  'qualification', // Calificación
  'proposal',      // Propuesta
  'negotiation',   // Negociación
  'closed_won',    // Ganada
  'closed_lost',   // Perdida
]);

// Oportunidad de venta
export const DealSchema = z.object({
  id: z.string().uuid(),
  org_id: OrgIdSchema,
  company_id: z.string().uuid(),
  contact_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  stage: DealStageSchema,
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217
  close_date: z.date(),
  probability: z.number().min(0).max(100),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).merge(BaseTimestampsSchema);

// Request para crear oportunidad
export const CreateDealSchema = DealSchema.omit({
  id: true,
  org_id: true,
  created_at: true,
  updated_at: true,
});

// Request para actualizar oportunidad  
export const UpdateDealSchema = CreateDealSchema.partial();

// Tipos exportados
export type CompanyType = z.infer<typeof CompanyTypeSchema>;
export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;

export type ContactType = z.infer<typeof ContactTypeSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

export type DealStage = z.infer<typeof DealStageSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
