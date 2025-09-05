import { BaseClient, PaginatedResponse } from './base-client.js';

// ERP Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  vat_number: string;
  email: string;
  phone: string;
  address?: string;
  country?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  payment_terms?: string;
  credit_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Input Types
export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  category?: string;
  tags?: string[];
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  currency?: string;
  stock?: number;
  category?: string;
  tags?: string[];
}

export interface CreateInventoryMovementInput {
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
}

export interface CreateSupplierInput {
  name: string;
  vat_number: string;
  email: string;
  phone: string;
  address?: string;
  country?: string;
  payment_terms?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  payment_terms?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  payment_terms?: string;
  credit_limit?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  payment_terms?: string;
  credit_limit?: number;
}

export interface CreateInvoiceInput {
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  items: Omit<InvoiceItem, 'id'>[];
}

export interface UpdateInvoiceInput {
  customer_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items?: Omit<InvoiceItem, 'id'>[];
}

export class ERPClient extends BaseClient {
  // Products
  async listProducts(page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {
    return this.get('/v1/erp/products', { params: { page, pageSize } });
  }

  async getProduct(id: string): Promise<Product> {
    return this.get(`/v1/erp/products/${id}`);
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    return this.post('/v1/erp/products', data);
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    return this.patch(`/v1/erp/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete(`/v1/erp/products/${id}`);
  }

  // Inventory Movements
  async listInventoryMovements(page = 1, pageSize = 20): Promise<PaginatedResponse<InventoryMovement>> {
    return this.get('/v1/erp/inventory/movements', { params: { page, pageSize } });
  }

  async getInventoryMovement(id: string): Promise<InventoryMovement> {
    return this.get(`/v1/erp/inventory/movements/${id}`);
  }

  async createInventoryMovement(data: CreateInventoryMovementInput): Promise<InventoryMovement> {
    return this.post('/v1/erp/inventory/movements', data);
  }

  // Suppliers
  async listSuppliers(page = 1, pageSize = 20): Promise<PaginatedResponse<Supplier>> {
    return this.get('/v1/erp/suppliers', { params: { page, pageSize } });
  }

  async getSupplier(id: string): Promise<Supplier> {
    return this.get(`/v1/erp/suppliers/${id}`);
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    return this.post('/v1/erp/suppliers', data);
  }

  async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
    return this.patch(`/v1/erp/suppliers/${id}`, data);
  }

  async deleteSupplier(id: string): Promise<void> {
    return this.delete(`/v1/erp/suppliers/${id}`);
  }

  // Customers
  async listCustomers(page = 1, pageSize = 20): Promise<PaginatedResponse<Customer>> {
    return this.get('/v1/erp/customers', { params: { page, pageSize } });
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.get(`/v1/erp/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    return this.post('/v1/erp/customers', data);
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    return this.patch(`/v1/erp/customers/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.delete(`/v1/erp/customers/${id}`);
  }

  // Invoices
  async listInvoices(page = 1, pageSize = 20): Promise<PaginatedResponse<Invoice>> {
    return this.get('/v1/erp/invoices', { params: { page, pageSize } });
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.get(`/v1/erp/invoices/${id}`);
  }

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    return this.post('/v1/erp/invoices', data);
  }

  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
    return this.patch(`/v1/erp/invoices/${id}`, data);
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.delete(`/v1/erp/invoices/${id}`);
  }

  // Reports
  async getInventoryReport(): Promise<{
    total_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_value: number;
  }> {
    return this.get('/v1/erp/reports/inventory');
  }

  async getSalesReport(startDate: string, endDate: string): Promise<{
    total_sales: number;
    total_invoices: number;
    average_invoice_value: number;
    top_products: Array<{ product_id: string; name: string; quantity_sold: number; revenue: number }>;
  }> {
    return this.get('/v1/erp/reports/sales', { 
      params: { startDate, endDate } 
    });
  }
}
