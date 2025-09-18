export { BaseClient, type BaseClientConfig, type ApiResponse, type PaginatedResponse } from './base-client.js';
export { ERPClient, type Product, type InventoryMovement, type Supplier, type Customer, type Invoice, type InvoiceItem, type CreateProductInput, type UpdateProductInput, type CreateInventoryMovementInput, type CreateSupplierInput, type UpdateSupplierInput, type CreateCustomerInput, type UpdateCustomerInput, type CreateInvoiceInput, type UpdateInvoiceInput } from './erp-client.js';
export { CRMClient, type Contact, type Company, type Deal, type Activity, type Label, type CreateContactInput, type UpdateContactInput, type CreateCompanyInput, type UpdateCompanyInput, type CreateDealInput, type UpdateDealInput, type CreateActivityInput, type UpdateActivityInput, type CreateLabelInput, type UpdateLabelInput } from './crm-client.js';
export { FinanceClient, type Account, type Transaction, type Budget, type TaxRate, type PaymentTerm, type FinancialReport, type CreateAccountInput, type UpdateAccountInput, type CreateTransactionInput, type UpdateTransactionInput, type CreateBudgetInput, type UpdateBudgetInput, type CreateTaxRateInput, type UpdateTaxRateInput, type CreatePaymentTermInput, type UpdatePaymentTermInput } from './finance-client.js';
export declare class ECONEURAClient {
    private baseURL;
    private apiKey?;
    private organizationId?;
    constructor(config: {
        baseURL: string;
        apiKey?: string;
        organizationId?: string;
    });
    get erp(): ERPClient;
    get crm(): CRMClient;
    get finance(): FinanceClient;
    setApiKey(apiKey: string): void;
    setOrganizationId(organizationId: string): void;
}
export default ECONEURAClient;
//# sourceMappingURL=index.d.ts.map