import { z } from 'zod';

// Company schemas
export const CompanySchema = z.object({;
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'customer']).default('prospect'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).default([]),
  orgId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const CreateCompanySchema = CompanySchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateCompanySchema = CompanySchema.partial().omit({ id: true, orgId: true });
/
// Contact schemas
export const ContactSchema = z.object({;
  id: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().uuid().optional(),
  isPrimary: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'bounced']).default('active'),
  tags: z.array(z.string()).default([]),
  orgId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const CreateContactSchema = ContactSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateContactSchema = ContactSchema.partial().omit({ id: true, orgId: true });
/
// Deal schemas
export const DealSchema = z.object({;
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('lead'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  probability: z.number().min(0).max(100).default(0),
  expectedCloseDate: z.string().datetime().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  orgId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const CreateDealSchema = DealSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateDealSchema = DealSchema.partial().omit({ id: true, orgId: true });
/
// Deal filter schema
export const DealFilterSchema = z.object({;
  q: z.string().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  assignedTo: z.string().uuid().optional(),
  expectedCloseDateFrom: z.string().datetime().optional(),
  expectedCloseDateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional()
});
/
// Move deal stage schema
export const MoveDealStageSchema = z.object({;
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  reason: z.string().optional(),
  notes: z.string().optional()
});
/
// Deal analytics schema
export const DealAnalyticsSchema = z.object({;
  totalDeals: z.number(),
  totalValue: z.number(),
  averageDealSize: z.number(),
  winRate: z.number(),
  averageSalesCycle: z.number(),
  dealsByStage: z.record(z.number()),
  dealsByStatus: z.record(z.number()),
  dealsByMonth: z.array(z.object({
    month: z.string(),
    count: z.number(),
    value: z.number()
  })),
  topPerformers: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    dealsCount: z.number(),
    totalValue: z.number(),
    winRate: z.number()
  })),
  pipelineHealth: z.object({
    healthy: z.boolean(),
    score: z.number(),
    issues: z.array(z.string())
  })
});
/
// Interaction schemas
export const InteractionSchema = z.object({;
  id: z.string().uuid().optional(),
  type: z.enum(['email', 'call', 'meeting', 'note', 'task']),
  subject: z.string().min(1),
  content: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
  orgId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const CreateInteractionSchema = InteractionSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateInteractionSchema = InteractionSchema.partial().omit({ id: true, orgId: true });
/
// Export types
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;

export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

export type Deal = z.infer<typeof DealSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
export type DealFilter = z.infer<typeof DealFilterSchema>;
export type MoveDealStage = z.infer<typeof MoveDealStageSchema>;
export type DealAnalytics = z.infer<typeof DealAnalyticsSchema>;

export type Interaction = z.infer<typeof InteractionSchema>;
export type CreateInteraction = z.infer<typeof CreateInteractionSchema>;
export type UpdateInteraction = z.infer<typeof UpdateInteractionSchema>;
/