import { z } from 'zod';

// Product schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  unit_price: z.number().positive('Unit price must be positive'),
  cost_price: z.number().positive('Cost price must be positive').optional(),
  currency: z.string().default('EUR'),
  unit: z.string().default('piece'),
  stock_quantity: z.number().int().min(0).default(0),
  min_stock_level: z.number().int().min(0).default(0),
  supplier_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Supplier schemas
export const SupplierSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  name: z.string().min(1, 'Supplier name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  tax_id: z.string().optional(),
  payment_terms: z.string().default('30 days'),
  credit_limit: z.number().positive('Credit limit must be positive').optional(),
  currency: z.string().default('EUR'),
  is_active: z.boolean().default(true),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateSupplierSchema = SupplierSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// Invoice schemas
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  supplier_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  issue_date: z.date(),
  due_date: z.date(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().min(0).default(0),
  total: z.number().positive('Total must be positive'),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  paid_at: z.date().optional(),
  created_by: z.string(),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

// Invoice Item schemas
export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
  unit: z.string().default('piece'),
  tax_rate: z.number().min(0).max(100).default(0),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax_amount: z.number().min(0).default(0),
  total: z.number().positive('Total must be positive'),
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
});

export const CreateInvoiceItemSchema = InvoiceItemSchema.omit({
  id: true,
  created_at: true,
});

export const UpdateInvoiceItemSchema = CreateInvoiceItemSchema.partial();

// Export types
export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;

export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type CreateInvoiceItem = z.infer<typeof CreateInvoiceItemSchema>;
export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>;
