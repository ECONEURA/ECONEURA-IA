// import { Pool, PoolClient, QueryResult } from 'pg'
// import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('users_org_id_idx').on(table.orgId),
  emailIdx: index('users_email_idx').on(table.email),
}))

// Companies table (CRM)
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  address: jsonb('address').$type<{
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }>(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('companies_org_id_idx').on(table.orgId),
  statusIdx: index('companies_status_idx').on(table.status),
}))

// Contacts table (CRM)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  companyId: uuid('company_id').references(() => companies.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  position: text('position'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('contacts_org_id_idx').on(table.orgId),
  companyIdIdx: index('contacts_company_id_idx').on(table.companyId),
  statusIdx: index('contacts_status_idx').on(table.status),
}))

// Deals table (CRM)
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  companyId: uuid('company_id').references(() => companies.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  title: text('title').notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: text('currency').notNull().default('EUR'),
  stage: text('stage').notNull().default('prospecting'),
  probability: integer('probability').notNull().default(0),
  expectedCloseDate: timestamp('expected_close_date'),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('deals_org_id_idx').on(table.orgId),
  companyIdIdx: index('deals_company_id_idx').on(table.companyId),
  stageIdx: index('deals_stage_idx').on(table.stage),
  statusIdx: index('deals_status_idx').on(table.status),
}))

// Interactions table (CRM)
export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  companyId: uuid('company_id').references(() => companies.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  dealId: uuid('deal_id').references(() => deals.id),
  type: text('type').notNull(), // email, call, meeting, note
  subject: text('subject'),
  content: text('content'),
  direction: text('direction').notNull().default('outbound'), // inbound, outbound
  status: text('status').notNull().default('completed'),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('interactions_org_id_idx').on(table.orgId),
  companyIdIdx: index('interactions_company_id_idx').on(table.companyId),
  contactIdIdx: index('interactions_contact_id_idx').on(table.contactId),
  typeIdx: index('interactions_type_idx').on(table.type),
}))

// RLS Policies
export const rlsPolicies = {
  interactions: {
    enable: sql`ALTER TABLE interactions ENABLE ROW LEVEL SECURITY`,
    policy: sql`
      CREATE POLICY "Users can view interactions from their organization" ON interactions
      FOR ALL USING (org_id = current_setting('app.org_id')::text)
    `,
  },
  companies: {
    enable: sql`ALTER TABLE companies ENABLE ROW LEVEL SECURITY`,
    policy: sql`
      CREATE POLICY "Users can view companies from their organization" ON companies
      FOR ALL USING (org_id = current_setting('app.org_id')::text)
    `,
  },
  contacts: {
    enable: sql`ALTER TABLE contacts ENABLE ROW LEVEL SECURITY`,
    policy: sql`
      CREATE POLICY "Users can view contacts from their organization" ON contacts
      FOR ALL USING (org_id = current_setting('app.org_id')::text)
    `,
  },
  deals: {
    enable: sql`ALTER TABLE deals ENABLE ROW LEVEL SECURITY`,
    policy: sql`
      CREATE POLICY "Users can view deals from their organization" ON deals
      FOR ALL USING (org_id = current_setting('app.org_id')::text)
    `,
  },
};

// Invoices table (Finance)
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  companyId: uuid('company_id').references(() => companies.id),
  invoiceNumber: text('invoice_number').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  status: text('status').notNull().default('draft'), // draft, sent, paid, overdue, cancelled
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  items: jsonb('items').$type<Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>>().notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('invoices_org_id_idx').on(table.orgId),
  companyIdIdx: index('invoices_company_id_idx').on(table.companyId),
  statusIdx: index('invoices_status_idx').on(table.status),
  dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
}))

// Tasks table (Work Inbox)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent
  status: text('status').notNull().default('todo'), // todo, in_progress, done, cancelled
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('tasks_org_id_idx').on(table.orgId),
  assigneeIdIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
  statusIdx: index('tasks_status_idx').on(table.status),
  dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
}))

// Audit events table
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  payload: jsonb('payload').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('audit_events_org_id_idx').on(table.orgId),
  actorIdIdx: index('audit_events_actor_id_idx').on(table.actorId),
  actionIdx: index('audit_events_action_idx').on(table.action),
  createdAtIdx: index('audit_events_created_at_idx').on(table.createdAt),
}))

// Idempotency keys table
export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  key: text('key').notNull(),
  resultHash: text('result_hash'),
  ttl: timestamp('ttl').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdKeyIdx: index('idempotency_keys_org_id_key_idx').on(table.orgId, table.key),
  ttlIdx: index('idempotency_keys_ttl_idx').on(table.ttl),
}))

// AI cost usage table
export const aiCostUsage = pgTable('ai_cost_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  costEur: decimal('cost_eur', { precision: 10, scale: 4 }).notNull(),
  requestId: text('request_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('ai_cost_usage_org_id_idx').on(table.orgId),
  modelIdx: index('ai_cost_usage_model_idx').on(table.model),
  createdAtIdx: index('ai_cost_usage_created_at_idx').on(table.createdAt),
}))

// Suppliers table (Inventory)
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  name: text('name').notNull(),
  contact_person: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  address: jsonb('address').$type<{
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }>(),
  tax_id: text('tax_id'),
  payment_terms: text('payment_terms').default('30 days'),
  credit_limit: decimal('credit_limit', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR'),
  is_active: boolean('is_active').default(true),
  rating: integer('rating'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  suppliers_org_name_idx: uniqueIndex('suppliers_org_name_idx').on(table.orgId, table.name),
  suppliers_email_idx: index('suppliers_email_idx').on(table.orgId, table.email),
}))

// Products table (Inventory)
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // RLS key
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').notNull(),
  category: text('category'),
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  cost_price: decimal('cost_price', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR'),
  unit: text('unit').default('piece'),
  stock_quantity: integer('stock_quantity').default(0),
  min_stock_level: integer('min_stock_level').default(0),
  supplier_id: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  is_active: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  products_org_sku_idx: uniqueIndex('products_org_sku_idx').on(table.orgId, table.sku),
  products_supplier_idx: index('products_supplier_idx').on(table.orgId, table.supplier_id),
  products_category_idx: index('products_category_idx').on(table.orgId, table.category),
}))

// Invoice Items table (Finance)
export const invoice_items = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  product_id: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').default('piece'),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  invoice_items_invoice_idx: index('invoice_items_invoice_idx').on(table.invoice_id),
  invoice_items_product_idx: index('invoice_items_product_idx').on(table.product_id),
}))

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations)
export const selectOrganizationSchema = createSelectSchema(organizations)

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertCompanySchema = createInsertSchema(companies)
export const selectCompanySchema = createSelectSchema(companies)

export const insertContactSchema = createInsertSchema(contacts)
export const selectContactSchema = createSelectSchema(contacts)

export const insertDealSchema = createInsertSchema(deals)
export const selectDealSchema = createSelectSchema(deals)

export const insertInvoiceSchema = createInsertSchema(invoices)
export const selectInvoiceSchema = createSelectSchema(invoices)

// Types
export type Organization = z.infer<typeof selectOrganizationSchema>
export type User = z.infer<typeof selectUserSchema>
export type Company = z.infer<typeof selectCompanySchema>
export type Contact = z.infer<typeof selectContactSchema>
export type Deal = z.infer<typeof selectDealSchema>
export type Invoice = z.infer<typeof selectInvoiceSchema>



