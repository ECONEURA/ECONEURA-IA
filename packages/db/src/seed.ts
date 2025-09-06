// ============================================================================
// ECONEURA DATABASE SEED
// ============================================================================
// This file seeds the database with development data
// Includes sample organizations, users, companies, contacts, products, and invoices
// ============================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  organizations, 
  users, 
  companies, 
  contacts, 
  interactions, 
  products, 
  invoices, 
  invoiceItems,
  type NewOrganization,
  type NewUser,
  type NewCompany,
  type NewContact,
  type NewInteraction,
  type NewProduct,
  type NewInvoice,
  type NewInvoiceItem
} from './schema/index.js';
import bcrypt from 'bcryptjs';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://econeura_user:econeura_password@localhost:5432/econeura_dev';
const client = postgres(connectionString);
const db = drizzle(client);

// ============================================================================
// SEED DATA
// ============================================================================

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // ========================================================================
    // 1. ORGANIZATIONS
    // ========================================================================
    
    console.log('📊 Creating organizations...');
    
    const orgData: NewOrganization[] = [
      {
        name: 'ECONEURA Demo',
        slug: 'econeura-demo',
        settings: {
          timezone: 'Europe/Madrid',
          currency: 'EUR',
          language: 'es',
          features: {
            crm: true,
            erp: true,
            ai: true,
            analytics: true
          }
        },
        subscriptionTier: 'enterprise'
      },
      {
        name: 'Tech Startup Inc',
        slug: 'tech-startup',
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          features: {
            crm: true,
            erp: false,
            ai: true,
            analytics: false
          }
        },
        subscriptionTier: 'pro'
      }
    ];

    const createdOrgs = await db.insert(organizations).values(orgData).returning();
    console.log(`✅ Created ${createdOrgs.length} organizations`);

    // ========================================================================
    // 2. USERS
    // ========================================================================
    
    console.log('👥 Creating users...');
    
    const userData: NewUser[] = [
      {
        organizationId: createdOrgs[0].id,
        email: 'admin@econeura.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'owner',
        permissions: ['*'],
        mfaEnabled: true,
        isActive: true
      },
      {
        organizationId: createdOrgs[0].id,
        email: 'manager@econeura.com',
        passwordHash: await bcrypt.hash('manager123', 10),
        role: 'manager',
        permissions: ['crm:read', 'crm:write', 'erp:read', 'erp:write'],
        mfaEnabled: false,
        isActive: true
      }
    ];

    const createdUsers = await db.insert(users).values(userData).returning();
    console.log(`✅ Created ${createdUsers.length} users`);

    // ========================================================================
    // 3. COMPANIES
    // ========================================================================
    
    console.log('🏢 Creating companies...');
    
    const companyData: NewCompany[] = [
      {
        organizationId: createdOrgs[0].id,
        name: 'Microsoft Corporation',
        taxId: 'ES12345678A',
        industry: 'Technology',
        size: 'Large',
        address: {
          street: 'Calle de la Tecnología 123',
          city: 'Madrid',
          state: 'Madrid',
          zipCode: '28001',
          country: 'Spain'
        },
        contactInfo: {
          phone: '+34 91 123 4567',
          email: 'info@microsoft.com',
          website: 'https://microsoft.com'
        },
        tags: ['enterprise', 'technology', 'cloud'],
        isActive: true
      }
    ];

    const createdCompanies = await db.insert(companies).values(companyData).returning();
    console.log(`✅ Created ${createdCompanies.length} companies`);

    // ========================================================================
    // 4. CONTACTS
    // ========================================================================
    
    console.log('👤 Creating contacts...');
    
    const contactData: NewContact[] = [
      {
        organizationId: createdOrgs[0].id,
        companyId: createdCompanies[0].id,
        firstName: 'Satya',
        lastName: 'Nadella',
        email: 'satya.nadella@microsoft.com',
        phone: '+34 91 123 4567',
        position: 'CEO',
        isPrimary: true,
        isActive: true
      }
    ];

    const createdContacts = await db.insert(contacts).values(contactData).returning();
    console.log(`✅ Created ${createdContacts.length} contacts`);

    // ========================================================================
    // 5. PRODUCTS
    // ========================================================================
    
    console.log('📦 Creating products...');
    
    const productData: NewProduct[] = [
      {
        organizationId: createdOrgs[0].id,
        sku: 'ECONEURA-ENT-001',
        name: 'ECONEURA Enterprise License',
        description: 'Complete ERP+CRM solution with AI integration',
        category: 'subscription',
        price: '999.00',
        cost: '200.00',
        stockQuantity: 1000,
        minStockLevel: 10,
        isActive: true
      }
    ];

    const createdProducts = await db.insert(products).values(productData).returning();
    console.log(`✅ Created ${createdProducts.length} products`);

    // ========================================================================
    // SEED COMPLETE
    // ========================================================================
    
    console.log('🎉 Database seed completed successfully!');
    console.log('\n🔑 Default login credentials:');
    console.log('   admin@econeura.com / admin123 (Owner)');
    console.log('   manager@econeura.com / manager123 (Manager)');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
}

export { seed };