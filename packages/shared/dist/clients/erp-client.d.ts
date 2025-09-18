import { BaseClient, PaginatedResponse } from './base-client.js';
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
export declare class ERPClient extends BaseClient {
    listProducts(page?: number, pageSize?: number): Promise<PaginatedResponse<Product>>;
    getProduct(id: string): Promise<Product>;
    createProduct(data: CreateProductInput): Promise<Product>;
    updateProduct(id: string, data: UpdateProductInput): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
    listInventoryMovements(page?: number, pageSize?: number): Promise<PaginatedResponse<InventoryMovement>>;
    getInventoryMovement(id: string): Promise<InventoryMovement>;
    createInventoryMovement(data: CreateInventoryMovementInput): Promise<InventoryMovement>;
    listSuppliers(page?: number, pageSize?: number): Promise<PaginatedResponse<Supplier>>;
    getSupplier(id: string): Promise<Supplier>;
    createSupplier(data: CreateSupplierInput): Promise<Supplier>;
    updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier>;
    deleteSupplier(id: string): Promise<void>;
    listCustomers(page?: number, pageSize?: number): Promise<PaginatedResponse<Customer>>;
    getCustomer(id: string): Promise<Customer>;
    createCustomer(data: CreateCustomerInput): Promise<Customer>;
    updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer>;
    deleteCustomer(id: string): Promise<void>;
    listInvoices(page?: number, pageSize?: number): Promise<PaginatedResponse<Invoice>>;
    getInvoice(id: string): Promise<Invoice>;
    createInvoice(data: CreateInvoiceInput): Promise<Invoice>;
    updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice>;
    deleteInvoice(id: string): Promise<void>;
    getInventoryReport(): Promise<{
        total_products: number;
        low_stock_products: number;
        out_of_stock_products: number;
        total_value: number;
    }>;
    getSalesReport(startDate: string, endDate: string): Promise<{
        total_sales: number;
        total_invoices: number;
        average_invoice_value: number;
        top_products: Array<{
            product_id: string;
            name: string;
            quantity_sold: number;
            revenue: number;
        }>;
    }>;
}
//# sourceMappingURL=erp-client.d.ts.map