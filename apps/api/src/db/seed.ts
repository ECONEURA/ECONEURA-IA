#!/usr/bin/env tsx

import { db } from './connection.js';
import { logger } from '@econeura/shared/logging';
import { hashApiKey } from '@econeura/shared/security';

interface SeedData {
  organizations: Array<{
    org_id: string;
    name: string;
    api_key: string;
  }>;
  customers: Array<{
    org_id: string;
    email: string;
    name: string;
    phone?: string;
  }>;
  invoices: Array<{
    org_id: string;
    customer_email: string;
    amount: number;
    due_date: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  }>;
  interactions: Array<{
    org_id: string;
    customer_email: string;
    channel: 'email' | 'whatsapp' | 'teams' | 'phone' | 'system';
    payload: Record<string, unknown>;
  }>;
}

const SEED_DATA: SeedData = {
  organizations: [
    {
      org_id: 'org-demo',
      name: 'Demo Organization',
      api_key: 'key-demo-123456789abcdef',
    },
    {
      org_id: 'org-test',
      name: 'Test Organization',
      api_key: 'key-test-987654321fedcba',
    },
  ],
  
  customers: [
    { org_id: 'org-demo', email: 'john.doe@example.com', name: 'John Doe', phone: '+1-555-0101' },
    { org_id: 'org-demo', email: 'jane.smith@example.com', name: 'Jane Smith', phone: '+1-555-0102' },
    { org_id: 'org-demo', email: 'bob.johnson@example.com', name: 'Bob Johnson' },
    { org_id: 'org-demo', email: 'alice.brown@example.com', name: 'Alice Brown', phone: '+1-555-0104' },
    { org_id: 'org-demo', email: 'charlie.davis@example.com', name: 'Charlie Davis' },
    { org_id: 'org-demo', email: 'diana.wilson@example.com', name: 'Diana Wilson', phone: '+1-555-0106' },
    { org_id: 'org-demo', email: 'frank.miller@example.com', name: 'Frank Miller' },
    { org_id: 'org-demo', email: 'grace.taylor@example.com', name: 'Grace Taylor', phone: '+1-555-0108' },
    { org_id: 'org-demo', email: 'henry.anderson@example.com', name: 'Henry Anderson' },
    { org_id: 'org-demo', email: 'ivy.thomas@example.com', name: 'Ivy Thomas', phone: '+1-555-0110' },
    
    // Test org customers
    { org_id: 'org-test', email: 'test.user@test.com', name: 'Test User' },
  ],
  
  invoices: [
    // Current/future invoices
    { org_id: 'org-demo', customer_email: 'john.doe@example.com', amount: 1250.00, due_date: '2024-09-15', status: 'sent' },
    { org_id: 'org-demo', customer_email: 'jane.smith@example.com', amount: 750.50, due_date: '2024-09-20', status: 'sent' },
    { org_id: 'org-demo', customer_email: 'bob.johnson@example.com', amount: 2100.00, due_date: '2024-10-01', status: 'draft' },
    { org_id: 'org-demo', customer_email: 'alice.brown@example.com', amount: 890.25, due_date: '2024-10-10', status: 'sent' },
    { org_id: 'org-demo', customer_email: 'charlie.davis@example.com', amount: 1575.75, due_date: '2024-10-15', status: 'draft' },
    
    // Overdue invoices (for cobro proactivo testing)
    { org_id: 'org-demo', customer_email: 'diana.wilson@example.com', amount: 950.00, due_date: '2024-08-15', status: 'overdue' },
    { org_id: 'org-demo', customer_email: 'frank.miller@example.com', amount: 675.30, due_date: '2024-08-20', status: 'overdue' },
    { org_id: 'org-demo', customer_email: 'grace.taylor@example.com', amount: 1125.45, due_date: '2024-08-10', status: 'overdue' },
    { org_id: 'org-demo', customer_email: 'henry.anderson@example.com', amount: 2250.00, due_date: '2024-08-05', status: 'overdue' },
    { org_id: 'org-demo', customer_email: 'ivy.thomas@example.com', amount: 445.75, due_date: '2024-08-25', status: 'overdue' },
    
    // Some paid invoices for completeness
    { org_id: 'org-demo', customer_email: 'john.doe@example.com', amount: 800.00, due_date: '2024-07-15', status: 'paid' },
    { org_id: 'org-demo', customer_email: 'jane.smith@example.com', amount: 1200.00, due_date: '2024-07-20', status: 'paid' },
    { org_id: 'org-demo', customer_email: 'alice.brown@example.com', amount: 650.00, due_date: '2024-07-10', status: 'paid' },
    
    // Cancelled invoice
    { org_id: 'org-demo', customer_email: 'bob.johnson@example.com', amount: 1500.00, due_date: '2024-08-01', status: 'cancelled' },
    
    // Test org invoice
    { org_id: 'org-test', customer_email: 'test.user@test.com', amount: 100.00, due_date: '2024-09-01', status: 'sent' },
  ],
  
  interactions: [
    {
      org_id: 'org-demo',
      customer_email: 'john.doe@example.com',
      channel: 'email',
      payload: {
        subject: 'Welcome to EcoNeura',
        type: 'welcome',
        automated: true,
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'diana.wilson@example.com',
      channel: 'email',
      payload: {
        subject: 'Payment reminder for Invoice #INV-001',
        type: 'payment_reminder',
        invoice_id: 'will-be-set-after-creation',
        automated: true,
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'frank.miller@example.com',
      channel: 'whatsapp',
      payload: {
        message: 'Hi Frank, just a friendly reminder about your invoice due on 2024-08-20',
        type: 'payment_reminder',
        template_used: 'payment_reminder_friendly',
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'grace.taylor@example.com',
      channel: 'teams',
      payload: {
        message: 'Payment overdue notification posted to customer portal',
        type: 'system_notification',
        automated: true,
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'jane.smith@example.com',
      channel: 'phone',
      payload: {
        duration_seconds: 180,
        type: 'payment_discussion',
        outcome: 'payment_scheduled',
        notes: 'Customer will pay by end of week',
        agent: 'human',
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'henry.anderson@example.com',
      channel: 'email',
      payload: {
        subject: 'Final notice - Invoice payment overdue',
        type: 'final_notice',
        escalation_level: 3,
        automated: false,
        approved_by: 'cfo@demo-org.com',
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'alice.brown@example.com',
      channel: 'system',
      payload: {
        event: 'invoice_created',
        automated: true,
        timestamp: '2024-08-27T10:30:00Z',
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'bob.johnson@example.com',
      channel: 'email',
      payload: {
        subject: 'Invoice cancelled - Refund processed',
        type: 'cancellation_notice',
        refund_amount: 1500.00,
        automated: true,
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'charlie.davis@example.com',
      channel: 'whatsapp',
      payload: {
        message: 'Thank you for your business! Your invoice is ready for review.',
        type: 'invoice_notification',
        template_used: 'invoice_ready',
      },
    },
    {
      org_id: 'org-demo',
      customer_email: 'ivy.thomas@example.com',
      channel: 'teams',
      payload: {
        message: 'CFO Flow: Cobro Proactivo initiated for overdue invoice',
        type: 'flow_started',
        flow_id: 'will-be-generated',
        automated: true,
      },
    },
  ],
};

async function seedOrganizations(): Promise<void> {
  logger.info('Seeding organizations...');
  
  for (const org of SEED_DATA.organizations) {
    const apiKeyHash = hashApiKey(org.api_key);
    
    await db.query(
      `INSERT INTO organizations (org_id, name, api_key_hash) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (org_id) DO UPDATE SET 
         name = EXCLUDED.name,
         api_key_hash = EXCLUDED.api_key_hash`,
      [org.org_id, org.name, apiKeyHash]
    );
    
    // Also create org limits
    await db.query(
      `INSERT INTO org_limits (org_id, monthly_cost_cap_eur) 
       VALUES ($1, $2) 
       ON CONFLICT (org_id) DO NOTHING`,
      [org.org_id, 50.00]
    );
  }
  
  logger.info(`Seeded ${SEED_DATA.organizations.length} organizations`);
}

async function seedCustomers(): Promise<void> {
  logger.info('Seeding customers...');
  
  for (const customer of SEED_DATA.customers) {
    await db.query(
      `INSERT INTO customers (org_id, email, name, phone) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (org_id, email) DO UPDATE SET 
         name = EXCLUDED.name,
         phone = EXCLUDED.phone`,
      [customer.org_id, customer.email, customer.name, customer.phone || null]
    );
  }
  
  logger.info(`Seeded ${SEED_DATA.customers.length} customers`);
}

async function seedInvoices(): Promise<void> {
  logger.info('Seeding invoices...');
  
  // First, get customer IDs by email for each org
  const customerMap = new Map<string, string>();
  
  for (const invoice of SEED_DATA.invoices) {
    const key = `${invoice.org_id}:${invoice.customer_email}`;
    if (!customerMap.has(key)) {
      const result = await db.query<{ id: string }>(
        'SELECT id FROM customers WHERE org_id = $1 AND email = $2',
        [invoice.org_id, invoice.customer_email]
      );
      
      if (result.rows.length > 0) {
        customerMap.set(key, result.rows[0].id);
      }
    }
  }
  
  // Insert invoices
  for (const invoice of SEED_DATA.invoices) {
    const key = `${invoice.org_id}:${invoice.customer_email}`;
    const customerId = customerMap.get(key);
    
    if (customerId) {
      await db.query(
        `INSERT INTO invoices (org_id, customer_id, amount, due_date, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.org_id, customerId, invoice.amount, invoice.due_date, invoice.status]
      );
    } else {
      logger.warn(`Customer not found for invoice: ${invoice.customer_email} in ${invoice.org_id}`);
    }
  }
  
  logger.info(`Seeded ${SEED_DATA.invoices.length} invoices`);
}

async function seedInteractions(): Promise<void> {
  logger.info('Seeding interactions...');
  
  // Get customer IDs by email for each org
  const customerMap = new Map<string, string>();
  
  for (const interaction of SEED_DATA.interactions) {
    const key = `${interaction.org_id}:${interaction.customer_email}`;
    if (!customerMap.has(key)) {
      const result = await db.query<{ id: string }>(
        'SELECT id FROM customers WHERE org_id = $1 AND email = $2',
        [interaction.org_id, interaction.customer_email]
      );
      
      if (result.rows.length > 0) {
        customerMap.set(key, result.rows[0].id);
      }
    }
  }
  
  // Insert interactions
  for (const interaction of SEED_DATA.interactions) {
    const key = `${interaction.org_id}:${interaction.customer_email}`;
    const customerId = customerMap.get(key);
    
    if (customerId) {
      await db.query(
        `INSERT INTO interactions (org_id, customer_id, channel, payload) 
         VALUES ($1, $2, $3, $4)`,
        [interaction.org_id, customerId, interaction.channel, JSON.stringify(interaction.payload)]
      );
    }
  }
  
  logger.info(`Seeded ${SEED_DATA.interactions.length} interactions`);
}

async function runSeeding(): Promise<void> {
  try {
    logger.info('Starting database seeding...');
    
    // Check if we're in a fresh database
    const orgCount = await db.query('SELECT COUNT(*) as count FROM organizations');
    const existingOrgs = parseInt(orgCount.rows[0]?.count || '0');
    
    if (existingOrgs > 0) {
      logger.info(`Found ${existingOrgs} existing organizations, will update/insert as needed`);
    }
    
    await seedOrganizations();
    await seedCustomers();
    await seedInvoices();
    await seedInteractions();
    
    // Create some basic usage data
    await db.query(
      `INSERT INTO org_usage_daily (org_id, day, http_requests, ai_cost_eur) 
       VALUES ('org-demo', CURRENT_DATE, 150, 2.50),
              ('org-demo', CURRENT_DATE - 1, 89, 1.75),
              ('org-test', CURRENT_DATE, 25, 0.25)
       ON CONFLICT (org_id, day) DO NOTHING`
    );
    
    logger.info('Database seeding completed successfully!');
    
    // Show summary
    const stats = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM organizations'),
      db.query('SELECT COUNT(*) as count FROM customers'),
      db.query('SELECT COUNT(*) as count FROM invoices'),
      db.query('SELECT COUNT(*) as count FROM interactions'),
    ]);
    
    logger.info('Database summary:', {
      organizations: stats[0].rows[0]?.count,
      customers: stats[1].rows[0]?.count,
      invoices: stats[2].rows[0]?.count,
      interactions: stats[3].rows[0]?.count,
    });
    
  } catch (error) {
    logger.error('Seeding failed', error as Error);
    throw error;
  }
}

// Allow running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed', error);
      process.exit(1);
    });
}

export { runSeeding, SEED_DATA };