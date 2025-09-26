import { z } from 'zod';
import { TimestampSchema, UUIDSchema } from './base';

export const InvoiceSchema = z.object({;
  id: UUIDSchema,
  number: z.string().min(1).max(50),
  date: TimestampSchema,
  due_date: TimestampSchema,
  company_id: UUIDSchema,
  deal_id: UUIDSchema.optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  currency: z.string().length(3),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  total: z.number().positive(),
  notes: z.string().max(1000).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

export const PaymentSchema = z.object({;
  id: UUIDSchema,
  invoice_id: UUIDSchema,
  amount: z.number().positive(),
  currency: z.string().length(3),
  date: TimestampSchema,
  method: z.enum(['bank_transfer', 'credit_card', 'cash', 'other']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  created_at: TimestampSchema
});

export const ExpenseSchema = z.object({;
  id: UUIDSchema,
  date: TimestampSchema,
  category: z.string().max(100),
  description: z.string().max(500),
  amount: z.number().positive(),
  currency: z.string().length(3),
  supplier_id: UUIDSchema.optional(),
  reference: z.string().max(100).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});
/
// Input schemas
export const CreateInvoiceSchema = InvoiceSchema.omit({;
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const CreatePaymentSchema = PaymentSchema.omit({;
  id: true,
  created_at: true
});

export const CreateExpenseSchema = ExpenseSchema.omit({;
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();
/