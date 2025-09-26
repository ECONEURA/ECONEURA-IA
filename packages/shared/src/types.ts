import { z } from 'zod';
import {;
  CompanySchema,
  ContactSchema,
  DealSchema,
  ActivitySchema,
  ProductSchema,
  InventoryMovementSchema,
  SupplierSchema,
  InvoiceSchema,
  PaymentSchema,
  ExpenseSchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  CreateContactSchema,
  UpdateContactSchema,
  CreateDealSchema,
  UpdateDealSchema,
  CreateActivitySchema,
  UpdateActivitySchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateInventoryMovementSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  CreatePaymentSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  PaginationSchema
} from './schemas';
/
// CRM Types
export type Company = z.infer<typeof CompanySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type ActivityEvent = z.infer<typeof ActivitySchema>;

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
/
// ERP Types
export type Product = z.infer<typeof ProductSchema>;
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateInventoryMovementInput = z.infer<typeof CreateInventoryMovementSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
/
// Finance Types
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
/
// Common Types
export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {;
  items: T[];
  pagination: Pagination;
}
/