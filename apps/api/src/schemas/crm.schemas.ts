/**
 * CRM Validation Schemas - Zod schemas for CRM entities
 * ECONEURA API - Request/Response validation
 */

import { z } from 'zod';

// ===== COMMON SCHEMAS =====

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const FilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  labels: z.string().optional(), // comma-separated label IDs
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

// ===== ORGANIZATION SCHEMAS =====

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'enterprise']).optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

// ===== USER SCHEMAS =====

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['admin', 'manager', 'user', 'viewer']).default('user'),
  avatar: z.string().url().optional(),
  password: z.string().min(8).max(128),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ===== CONTACT SCHEMAS =====

export const CreateContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  
  // Address
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  
  // Social
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().max(100).optional(),
  
  // CRM fields
  source: z.enum(['website', 'referral', 'event', 'cold_outreach', 'other']).optional(),
  rating: z.number().int().min(0).max(5).default(0),
  companyId: z.string().cuid().optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const ContactQuerySchema = FilterSchema.extend({
  companyId: z.string().cuid().optional(),
  source: z.string().optional(),
  rating: z.coerce.number().int().min(0).max(5).optional(),
}).merge(PaginationSchema);

// ===== COMPANY SCHEMAS =====

export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  revenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  
  // Address
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  
  // Social
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().max(100).optional(),
  
  // CRM fields
  type: z.enum(['prospect', 'customer', 'partner', 'competitor']).default('prospect'),
  rating: z.number().int().min(0).max(5).default(0),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CompanyQuerySchema = FilterSchema.extend({
  type: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  rating: z.coerce.number().int().min(0).max(5).optional(),
}).merge(PaginationSchema);

// ===== DEAL SCHEMAS =====

export const CreateDealSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  value: z.number().positive().optional(),
  currency: z.string().length(3).default('EUR'),
  stage: z.enum([
    'prospecting',
    'qualification', 
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost'
  ]).default('prospecting'),
  probability: z.number().int().min(0).max(100).default(0),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expectedCloseDate: z.string().datetime().optional(),
  contactId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const UpdateDealSchema = CreateDealSchema.partial();

export const DealQuerySchema = FilterSchema.extend({
  stage: z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  minValue: z.coerce.number().positive().optional(),
  maxValue: z.coerce.number().positive().optional(),
}).merge(PaginationSchema);

// ===== ACTIVITY SCHEMAS =====

export const CreateActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task', 'event']),
  subject: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  reminderAt: z.string().datetime().optional(),
  contactId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
});

export const UpdateActivitySchema = CreateActivitySchema.partial();

export const CompleteActivitySchema = z.object({
  completedAt: z.string().datetime().optional(),
});

export const ActivityQuerySchema = FilterSchema.extend({
  type: z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  completed: z.coerce.boolean().optional(),
}).merge(PaginationSchema);

// ===== LABEL SCHEMAS =====

export const CreateLabelSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  description: z.string().max(255).optional(),
});

export const UpdateLabelSchema = CreateLabelSchema.partial();

// ===== ATTACHMENT SCHEMAS =====

export const CreateAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive(),
  url: z.string().url().optional(),
  contactId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  activityId: z.string().cuid().optional(),
});

// ===== EXPORT TYPES =====

export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type ContactQuery = z.infer<typeof ContactQuerySchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;
export type CompanyQuery = z.infer<typeof CompanyQuerySchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
export type DealQuery = z.infer<typeof DealQuerySchema>;
export type CreateActivity = z.infer<typeof CreateActivitySchema>;
export type UpdateActivity = z.infer<typeof UpdateActivitySchema>;
export type CompleteActivity = z.infer<typeof CompleteActivitySchema>;
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;
export type CreateLabel = z.infer<typeof CreateLabelSchema>;
export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;
export type CreateAttachment = z.infer<typeof CreateAttachmentSchema>;