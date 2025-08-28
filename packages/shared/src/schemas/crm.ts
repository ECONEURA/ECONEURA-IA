import { z } from 'zod';

// Base schemas for common fields
const BaseEntity = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// Company schemas
export const CompanySchema = BaseEntity.extend({
  name: z.string().min(2).max(120),
  industry: z.string().max(80).optional(),
  website: z.string().url().optional(),
  employees: z.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
  taxId: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CompanyFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).optional(),
  industry: z.string().optional(),
  minEmployees: z.number().int().min(0).optional(),
  maxEmployees: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

// Contact schemas
export const ContactSchema = BaseEntity.extend({
  companyId: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  linkedinUrl: z.string().url().optional(),
  isPrimary: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const ContactFilterSchema = z.object({
  q: z.string().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'lead']).optional(),
  isPrimary: z.boolean().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Deal schemas
export const DealStage = z.enum([
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
]);

export const DealSchema = BaseEntity.extend({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  stage: DealStage.default('prospect'),
  amount: z.number().min(0).default(0),
  currency: z.string().length(3).default('EUR'),
  probability: z.number().min(0).max(100).default(0),
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().nullable().optional(),
  assignedUserId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  lostReason: z.string().max(500).optional(),
  wonDetails: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateDealSchema = DealSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateDealSchema = CreateDealSchema.partial();

export const DealFilterSchema = z.object({
  q: z.string().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  stage: DealStage.optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedUserId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const MoveDealStageSchema = z.object({
  stage: DealStage,
  reason: z.string().max(500).optional(),
});

// Activity schemas
export const ActivityTypeSchema = z.enum([
  'call',
  'meeting',
  'email',
  'task',
  'note',
  'demo',
  'follow_up'
]);

export const ActivitySchema = BaseEntity.extend({
  type: ActivityTypeSchema,
  subject: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  entityType: z.enum(['company', 'contact', 'deal']),
  entityId: z.string().uuid(),
  assignedUserId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  duration: z.number().int().min(0).optional(), // in minutes
  outcome: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateActivitySchema = ActivitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateActivitySchema = CreateActivitySchema.partial();

// Export types
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;
export type CompanyFilter = z.infer<typeof CompanyFilterSchema>;

export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type ContactFilter = z.infer<typeof ContactFilterSchema>;

export type Deal = z.infer<typeof DealSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
export type DealFilter = z.infer<typeof DealFilterSchema>;
export type MoveDealStage = z.infer<typeof MoveDealStageSchema>;

export type Activity = z.infer<typeof ActivitySchema>;
export type CreateActivity = z.infer<typeof CreateActivitySchema>;
export type UpdateActivity = z.infer<typeof UpdateActivitySchema>;
export type ActivityType = z.infer<typeof ActivityTypeSchema>;