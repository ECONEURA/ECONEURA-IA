import { ECONEURAClient } from './index.js';
const client = new ECONEURAClient({
    baseURL: 'http://localhost:3001',
    apiKey: 'your-api-key-here',
    organizationId: 'demo-org-1'
});
export async function erpExamples() {
    try {
        const product = await client.erp.createProduct({
            name: 'Laptop Dell XPS 13',
            sku: 'DELL-XPS13-001',
            description: 'High-performance laptop for business use',
            price: 1299.99,
            currency: 'EUR',
            stock: 50,
            category: 'Electronics',
            tags: ['laptop', 'business', 'premium']
        });
        const products = await client.erp.listProducts(1, 20);
        const movement = await client.erp.createInventoryMovement({
            product_id: product.id,
            type: 'in',
            quantity: 10,
            reason: 'Initial stock',
            reference: 'PO-2024-001'
        });
        const report = await client.erp.getInventoryReport();
    }
    catch (error) {
        console.error('ERP Error:', error);
    }
}
export async function crmExamples() {
    try {
        const company = await client.crm.createCompany({
            name: 'Acme Corporation',
            industry: 'Technology',
            size: 'medium',
            website: 'https://acme.com',
            email: 'info@acme.com',
            phone: '+34 123 456 789',
            address: 'Calle Mayor 123, Madrid, Spain',
            country: 'ES',
            tags: ['prospect', 'enterprise']
        });
        const contact = await client.crm.createContact({
            first_name: 'Juan',
            last_name: 'Pérez',
            email: 'juan.perez@acme.com',
            phone: '+34 123 456 789',
            company_id: company.id,
            position: 'CEO',
            department: 'Executive',
            tags: ['decision-maker', 'hot-lead']
        });
        const deal = await client.crm.createDeal({
            title: 'Enterprise Software License',
            description: 'Annual license for 100 users',
            value: 50000,
            currency: 'EUR',
            stage: 'proposal',
            probability: 75,
            expected_close_date: '2024-12-31',
            contact_id: contact.id,
            company_id: company.id,
            owner_id: 'user-123',
            tags: ['enterprise', 'software']
        });
        const pipeline = await client.crm.getPipelineReport();
    }
    catch (error) {
        console.error('CRM Error:', error);
    }
}
export async function financeExamples() {
    try {
        const account = await client.finance.createAccount({
            name: 'Cash Account',
            type: 'asset',
            code: '1000',
            balance: 10000,
            currency: 'EUR',
            is_active: true
        });
        const transaction = await client.finance.createTransaction({
            account_id: account.id,
            description: 'Initial deposit',
            amount: 10000,
            type: 'debit',
            date: '2024-01-01',
            category: 'deposit'
        });
        const budget = await client.finance.createBudget({
            name: 'Marketing Budget 2024',
            account_id: account.id,
            period: 'yearly',
            amount: 50000,
            currency: 'EUR',
            start_date: '2024-01-01',
            end_date: '2024-12-31'
        });
        const summary = await client.finance.getFinancialSummary();
    }
    catch (error) {
        console.error('Finance Error:', error);
    }
}
export async function completeWorkflowExample() {
    try {
        const company = await client.crm.createCompany({
            name: 'TechStart Solutions',
            industry: 'Software',
            size: 'startup',
            email: 'hello@techstart.com'
        });
        const contact = await client.crm.createContact({
            first_name: 'María',
            last_name: 'García',
            email: 'maria@techstart.com',
            company_id: company.id,
            position: 'CTO'
        });
        const product = await client.erp.createProduct({
            name: 'Cloud Storage Service',
            sku: 'CLOUD-STORAGE-001',
            price: 29.99,
            currency: 'EUR',
            stock: 1000,
            category: 'SaaS'
        });
        const deal = await client.crm.createDeal({
            title: 'Cloud Storage Annual License',
            value: 359.88,
            currency: 'EUR',
            stage: 'negotiation',
            probability: 80,
            expected_close_date: '2024-12-15',
            contact_id: contact.id,
            company_id: company.id,
            owner_id: 'user-123'
        });
        const account = await client.finance.createAccount({
            name: 'Revenue Account',
            type: 'revenue',
            code: '4000',
            balance: 0,
            currency: 'EUR'
        });
        const [pipeline, inventory, financial] = await Promise.all([
            client.crm.getPipelineReport(),
            client.erp.getInventoryReport(),
            client.finance.getFinancialSummary()
        ]);
    }
    catch (error) {
        console.error('❌ Workflow Error:', error);
    }
}
export const examples = {
    erp: erpExamples,
    crm: crmExamples,
    finance: financeExamples,
    complete: completeWorkflowExample
};
//# sourceMappingURL=example-usage.js.map