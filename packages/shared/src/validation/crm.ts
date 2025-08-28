import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company_id: z.string().optional(),
});

export const companySchema = z.object({
  name: z.string().min(2),
  cif: z.string().optional(),
});

export const dealSchema = z.object({
  name: z.string().min(2),
  value: z.number().nonnegative(),
  stage: z.string(),
  close_date: z.string().optional(),
  company_id: z.string().optional(),
});

export const activitySchema = z.object({
  type: z.enum(['call', 'email', 'task', 'meeting']),
  subject: z.string().min(2),
  due_date: z.string().optional(),
  deal_id: z.string().optional(),
});
