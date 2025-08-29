-- Enable RLS extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  stage TEXT NOT NULL DEFAULT 'prospecting',
  probability INTEGER NOT NULL DEFAULT 0,
  expected_close_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'completed',
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id),
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create audit_events table
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create idempotency_keys table
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  key TEXT NOT NULL,
  result_hash TEXT,
  ttl TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create ai_cost_usage table
CREATE TABLE ai_cost_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_eur DECIMAL(10,4) NOT NULL,
  request_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX users_org_id_idx ON users(org_id);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX companies_org_id_idx ON companies(org_id);
CREATE INDEX companies_status_idx ON companies(status);
CREATE INDEX contacts_org_id_idx ON contacts(org_id);
CREATE INDEX contacts_company_id_idx ON contacts(company_id);
CREATE INDEX contacts_status_idx ON contacts(status);
CREATE INDEX deals_org_id_idx ON deals(org_id);
CREATE INDEX deals_company_id_idx ON deals(company_id);
CREATE INDEX deals_stage_idx ON deals(stage);
CREATE INDEX deals_status_idx ON deals(status);
CREATE INDEX interactions_org_id_idx ON interactions(org_id);
CREATE INDEX interactions_company_id_idx ON interactions(company_id);
CREATE INDEX interactions_contact_id_idx ON interactions(contact_id);
CREATE INDEX interactions_type_idx ON interactions(type);
CREATE INDEX invoices_org_id_idx ON invoices(org_id);
CREATE INDEX invoices_company_id_idx ON invoices(company_id);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX invoices_due_date_idx ON invoices(due_date);
CREATE INDEX tasks_org_id_idx ON tasks(org_id);
CREATE INDEX tasks_assignee_id_idx ON tasks(assignee_id);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
CREATE INDEX audit_events_org_id_idx ON audit_events(org_id);
CREATE INDEX audit_events_actor_id_idx ON audit_events(actor_id);
CREATE INDEX audit_events_action_idx ON audit_events(action);
CREATE INDEX audit_events_created_at_idx ON audit_events(created_at);
CREATE INDEX idempotency_keys_org_id_key_idx ON idempotency_keys(org_id, key);
CREATE INDEX idempotency_keys_ttl_idx ON idempotency_keys(ttl);
CREATE INDEX ai_cost_usage_org_id_idx ON ai_cost_usage(org_id);
CREATE INDEX ai_cost_usage_model_idx ON ai_cost_usage(model);
CREATE INDEX ai_cost_usage_created_at_idx ON ai_cost_usage(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users table policies
CREATE POLICY "Users can only access their own organization" ON users
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Companies table policies
CREATE POLICY "Companies can only access their own organization" ON companies
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Contacts table policies
CREATE POLICY "Contacts can only access their own organization" ON contacts
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Deals table policies
CREATE POLICY "Deals can only access their own organization" ON deals
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Interactions table policies
CREATE POLICY "Interactions can only access their own organization" ON interactions
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Invoices table policies
CREATE POLICY "Invoices can only access their own organization" ON invoices
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Tasks table policies
CREATE POLICY "Tasks can only access their own organization" ON tasks
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Audit events table policies
CREATE POLICY "Audit events can only access their own organization" ON audit_events
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Idempotency keys table policies
CREATE POLICY "Idempotency keys can only access their own organization" ON idempotency_keys
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- AI cost usage table policies
CREATE POLICY "AI cost usage can only access their own organization" ON ai_cost_usage
  FOR ALL USING (org_id = current_setting('app.org_id', true));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



