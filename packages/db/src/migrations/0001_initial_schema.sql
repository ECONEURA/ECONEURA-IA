-- ============================================================================
-- ECONEURA DATABASE SCHEMA - INITIAL MIGRATION
-- ============================================================================
-- This migration creates the complete database schema for ECONEURA
-- Implements multi-tenant architecture with Row Level Security (RLS)
-- Optimized for performance with strategic indexes
-- ============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS econeura;

-- Set search path
SET search_path TO econeura, public;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'user', 'viewer');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE interaction_type AS ENUM ('email', 'phone', 'meeting', 'note', 'task');
CREATE TYPE product_category AS ENUM ('service', 'product', 'subscription', 'consulting');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import');

-- ============================================================================
-- ORGANIZATIONS (Multi-tenant root)
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier subscription_tier DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- USERS (RBAC with MFA)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    permissions JSONB DEFAULT '[]',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- COMPANIES (CRM Core)
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    industry VARCHAR(100),
    size VARCHAR(50),
    address JSONB,
    contact_info JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- CONTACTS (CRM with Deduplication)
-- ============================================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INTERACTIONS (CRM Timeline)
-- ============================================================================

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type interaction_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- PRODUCTS (ERP Core)
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category product_category NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INVOICES (ERP with SEPA)
-- ============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    status invoice_status DEFAULT 'draft',
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_date TIMESTAMP WITH TIME ZONE,
    sepa_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INVOICE ITEMS (ERP Line Items)
-- ============================================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- AUDIT LOG (Compliance & Security)
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- SESSIONS (Security & Auth)
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- API KEYS (External Integrations)
-- ============================================================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STRATEGIC INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Users indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Companies indexes
CREATE INDEX idx_companies_organization_id ON companies(organization_id);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Contacts indexes
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary);
CREATE INDEX idx_contacts_is_active ON contacts(is_active);

-- Interactions indexes
CREATE INDEX idx_interactions_organization_id ON interactions(organization_id);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);

-- Products indexes
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);

-- Invoices indexes
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_issued_date ON invoices(issued_date);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_organization_id ON invoice_items(organization_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_organization_id ON audit_log(organization_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Sessions indexes
CREATE INDEX idx_sessions_organization_id ON sessions(organization_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

-- API keys indexes
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policy
CREATE POLICY org_isolation_policy ON organizations
    FOR ALL TO authenticated
    USING (id = current_setting('app.current_organization_id')::UUID);

-- Users RLS Policy
CREATE POLICY users_org_isolation_policy ON users
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Companies RLS Policy
CREATE POLICY companies_org_isolation_policy ON companies
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Contacts RLS Policy
CREATE POLICY contacts_org_isolation_policy ON contacts
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Interactions RLS Policy
CREATE POLICY interactions_org_isolation_policy ON interactions
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Products RLS Policy
CREATE POLICY products_org_isolation_policy ON products
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Invoices RLS Policy
CREATE POLICY invoices_org_isolation_policy ON invoices
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Invoice items RLS Policy
CREATE POLICY invoice_items_org_isolation_policy ON invoice_items
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Audit log RLS Policy
CREATE POLICY audit_log_org_isolation_policy ON audit_log
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Sessions RLS Policy
CREATE POLICY sessions_org_isolation_policy ON sessions
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- API keys RLS Policy
CREATE POLICY api_keys_org_isolation_policy ON api_keys
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
    next_number INTEGER;
    invoice_number VARCHAR(100);
BEGIN
    -- Get next invoice number for organization
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE organization_id = org_id;
    
    -- Format invoice number
    invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check stock levels
CREATE OR REPLACE FUNCTION check_stock_levels(org_id UUID)
RETURNS TABLE(product_id UUID, product_name VARCHAR, current_stock INTEGER, min_stock INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.stock_quantity, p.min_stock_level
    FROM products p
    WHERE p.organization_id = org_id
    AND p.is_active = TRUE
    AND p.stock_quantity <= p.min_stock_level;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for company summary with contact count
CREATE VIEW company_summary AS
SELECT 
    c.id,
    c.organization_id,
    c.name,
    c.tax_id,
    c.industry,
    c.size,
    c.is_active,
    c.created_at,
    c.updated_at,
    COUNT(ct.id) as contact_count,
    COUNT(CASE WHEN ct.is_primary = TRUE THEN 1 END) as primary_contact_count
FROM companies c
LEFT JOIN contacts ct ON c.id = ct.company_id AND ct.is_active = TRUE
GROUP BY c.id, c.organization_id, c.name, c.tax_id, c.industry, c.size, c.is_active, c.created_at, c.updated_at;

-- View for invoice summary with item count
CREATE VIEW invoice_summary AS
SELECT 
    i.id,
    i.organization_id,
    i.company_id,
    i.invoice_number,
    i.status,
    i.total_amount,
    i.tax_amount,
    i.due_date,
    i.issued_date,
    i.paid_date,
    i.created_at,
    i.updated_at,
    COUNT(ii.id) as item_count,
    c.name as company_name
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN companies c ON i.company_id = c.id
GROUP BY i.id, i.organization_id, i.company_id, i.invoice_number, i.status, i.total_amount, i.tax_amount, i.due_date, i.issued_date, i.paid_date, i.created_at, i.updated_at, c.name;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA econeura TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA econeura TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA econeura TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA econeura TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA econeura IS 'ECONEURA database schema - Multi-tenant ERP+CRM system with AI integration';
COMMENT ON TABLE organizations IS 'Multi-tenant root table - Each organization is isolated';
COMMENT ON TABLE users IS 'Users with RBAC permissions and MFA support';
COMMENT ON TABLE companies IS 'CRM companies with contact information';
COMMENT ON TABLE contacts IS 'CRM contacts with deduplication support';
COMMENT ON TABLE interactions IS 'CRM interaction timeline';
COMMENT ON TABLE products IS 'ERP products with inventory management';
COMMENT ON TABLE invoices IS 'ERP invoices with SEPA integration';
COMMENT ON TABLE invoice_items IS 'ERP invoice line items';
COMMENT ON TABLE audit_log IS 'Compliance and security audit trail';
COMMENT ON TABLE sessions IS 'User sessions for authentication';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
