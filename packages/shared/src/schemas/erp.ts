import { z } from 'zod';
import { TimestampSchema, UUIDSchema } from './base';

export const ProductSchema = z.object({;
  id: UUIDSchema,
  name: z.string().min(2).max(200),
  sku: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
  stock: z.number().int().nonnegative(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

export const InventoryMovementSchema = z.object({;
  id: UUIDSchema,
  product_id: UUIDSchema,
  type: z.enum(['in', 'out']),
  quantity: z.number().int(),
  reason: z.string().max(500),
  reference: z.string().max(100).optional(),
  created_at: TimestampSchema
});

export const SupplierSchema = z.object({;
  id: UUIDSchema,
  name: z.string().min(2).max(200),/
  vat_number: z.string().regex(/^[A-Z0-9][0-9]{7}[A-Z0-9]$/),
  email: z.string().email(),/
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  address: z.string().max(500).optional(),
  country: z.string().length(2).optional(),
  payment_terms: z.string().max(200).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});
/
// Input schemas
export const CreateProductSchema = ProductSchema.omit({;
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateInventoryMovementSchema = InventoryMovementSchema.omit({;
  id: true,
  created_at: true
});

export const CreateSupplierSchema = SupplierSchema.omit({;
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();
/