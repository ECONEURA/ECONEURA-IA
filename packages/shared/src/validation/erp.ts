import { z } from 'zod';

// Validación de NIF/CIF español simple
const NIF_REGEX = /^[0-9]{8}[A-Z]$/;
const CURRENCY_CODES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'MXN', 'BRL'] as const;

  name: z.string().min(2),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  custom: z.record(z.string(), z.any()).optional(),
});

  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  nif: z.string().regex(NIF_REGEX, 'NIF inválido').optional(),
  custom: z.record(z.string(), z.any()).optional(),
});

export const invoiceSchema = z.object({
  customer_id: z.string(),
  status: z.string(),
  total: z.number().nonnegative(),
  issued_date: z.string(),
  due_date: z.string(),
  currency: z.enum(CURRENCY_CODES).default('EUR'),
  notes: z.string().max(2048).optional(),
  lines: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })),
}).superRefine((data, ctx) => {
  // issued_date <= due_date
  if (data.issued_date && data.due_date && new Date(data.issued_date) > new Date(data.due_date)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'issued_date debe ser anterior o igual a due_date',
      path: ['issued_date'],
    });
  }
  // suma de líneas debe coincidir con total
  const sum = data.lines.reduce((acc, l) => acc + l.price * l.quantity, 0);
  if (Math.abs(sum - data.total) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El total no coincide con la suma de líneas',
      path: ['total'],
    });
  }
});

export const inventorySchema = z.object({
  product_id: z.string(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  movements: z.array(z.object({
    date: z.string(),
    change: z.number().int(),
    reason: z.string(),
  })),
});

export const purchaseSchema = z.object({
  supplier: z.string().min(2),
  total: z.number().nonnegative(),
  date: z.string(),
  notes: z.string().max(2048).optional(),
});
