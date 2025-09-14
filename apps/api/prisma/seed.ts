// import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getPrisma } from '@econeura/db/client.lazy'

const prisma = getPrisma();

// System permissions definition
const PERMISSIONS = [
  // CRM permissions
  { resource: 'crm:companies', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'crm:contacts', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'crm:deals', actions: ['view', 'create', 'edit', 'delete', 'move_stage'] },
  { resource: 'crm:activities', actions: ['view', 'create', 'edit', 'delete', 'complete'] },

  // ERP permissions
  { resource: 'erp:products', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'erp:inventory', actions: ['view', 'adjust', 'count', 'transfer'] },
  { resource: 'erp:suppliers', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'erp:warehouses', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'erp:purchase_orders', actions: ['view', 'create', 'edit', 'delete', 'approve'] },

  // Finance permissions
  { resource: 'finance:invoices', actions: ['view', 'create', 'edit', 'delete', 'submit', 'approve'] },
  { resource: 'finance:payments', actions: ['view', 'create', 'edit', 'delete', 'reconcile'] },
  { resource: 'finance:expenses', actions: ['view', 'create', 'edit', 'delete', 'submit', 'approve'] },
  { resource: 'finance:reports', actions: ['view', 'export'] },

  // AI permissions
  { resource: 'ai:router', actions: ['view', 'use'] },
  { resource: 'ai:insights', actions: ['view'] },

  // Admin permissions
  { resource: 'admin:users', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'admin:organizations', actions: ['view', 'edit'] },
  { resource: 'admin:roles', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'admin:audit', actions: ['view'] },
];

async function seedPermissions() {
  console.log('🔑 Seeding permissions...');

  const permissions = [];
  for (const perm of PERMISSIONS) {
    for (const action of perm.actions) {
      const slug = `${perm.resource}:${action}`;
      const permission = await prisma.permission.upsert({
        where: { slug },
        update: {},
        create: {
          name: `${perm.resource} - ${action}`,
          slug,
          resource: perm.resource,
          action,
          description: `Permission to ${action} ${perm.resource}`,
        },
      });
      permissions.push(permission);
    }
  }

  console.log(`✅ Created ${permissions.length} permissions`);
  return permissions;
}

async function seedSystemRoles(permissions: any[]) {
  console.log('👤 Seeding system roles...');

  const roles = [
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Full system access',
      permissionSlugs: ['*'], // Special case, will have all permissions
    },
    {
      name: 'Sales',
      slug: 'sales',
      description: 'CRM and sales management',
      permissionSlugs: [
        'crm:companies:*',
        'crm:contacts:*',
        'crm:deals:*',
        'crm:activities:*',
        'finance:invoices:view',
        'finance:invoices:create',
        'finance:reports:view',
      ],
    },
    {
      name: 'Operations',
      slug: 'ops',
      description: 'ERP and inventory management',
      permissionSlugs: [
        'erp:products:*',
        'erp:inventory:*',
        'erp:suppliers:*',
        'erp:warehouses:*',
        'erp:purchase_orders:*',
        'finance:invoices:view',
        'finance:reports:view',
      ],
    },
    {
      name: 'CFO',
      slug: 'cfo',
      description: 'Financial oversight',
      permissionSlugs: [
        'finance:*',
        'crm:deals:view',
        'erp:products:view',
        'erp:inventory:view',
      ],
    },
    {
      name: 'Viewer',
      slug: 'viewer',
      description: 'Read-only access',
      permissionSlugs: [
        'crm:companies:view',
        'crm:contacts:view',
        'crm:deals:view',
        'erp:products:view',
        'erp:inventory:view',
        'finance:invoices:view',
        'finance:reports:view',
      ],
    },
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: {
        slug_organizationId: {
          slug: roleData.slug,
          organizationId: null,
        },
      },
      update: {},
      create: {
        name: roleData.name,
        slug: roleData.slug,
        description: roleData.description,
        isSystem: true,
        organizationId: null,
      },
    });

    // Assign permissions to role
    const rolePermissions = roleData.permissionSlugs.includes('*')
      ? permissions
      : permissions.filter(p =>
          roleData.permissionSlugs.some(slug => {
            if (slug.endsWith(':*')) {
              const resource = slug.replace(':*', '');
              return p.slug.startsWith(resource + ':');
            }
            return p.slug === slug;
          })
        );

    for (const permission of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
          scope: 'ORGANIZATION',
        },
      });
    }

    createdRoles.push(role);
    console.log(`✅ Created role: ${role.name} with ${rolePermissions.length} permissions`);
  }

  return createdRoles;
}

async function seedOrganizations(roles: any[]) {
  console.log('🏢 Seeding organizations...');

  const organizations = [
    {
      slug: 'ecoretail',
      name: 'EcoRetail Mediterranean',
      description: 'Sustainable retail solutions for the Mediterranean market',
      email: 'info@ecoretail.med',
      phone: '+34 932 123 456',
      taxId: 'B12345678',
      plan: 'PROFESSIONAL',
      maxUsers: 25,
    },
    {
      slug: 'mediterraneo',
      name: 'Mediterráneo Trading Co.',
      description: 'Import/export specialists in Mediterranean products',
      email: 'contact@mediterraneo-trading.com',
      phone: '+34 937 654 321',
      taxId: 'B87654321',
      plan: 'ENTERPRISE',
      maxUsers: 50,
    },
  ];

  const createdOrgs = [];
  for (const orgData of organizations) {
    const org = await prisma.organization.upsert({
      where: { slug: orgData.slug },
      update: {},
      create: {
        ...orgData,
        billingAddress: {
          line1: '123 Main Street',
          city: 'Barcelona',
          postalCode: '08001',
          country: 'Spain',
        },
      },
    });
    createdOrgs.push(org);
    console.log(`✅ Created organization: ${org.name}`);
  }

  return createdOrgs;
}

async function seedUsers(organizations: any[], roles: any[]) {
  console.log('👥 Seeding users...');

  const defaultPassword = await bcrypt.hash('Password123!', 10);
  const adminRole = roles.find(r => r.slug === 'admin');
  const salesRole = roles.find(r => r.slug === 'sales');
  const opsRole = roles.find(r => r.slug === 'ops');
  const cfoRole = roles.find(r => r.slug === 'cfo');
  const viewerRole = roles.find(r => r.slug === 'viewer');

  const users = [
    // EcoRetail users
    {
      email: 'admin@ecoretail.med',
      firstName: 'Admin',
      lastName: 'EcoRetail',
      displayName: 'Admin EcoRetail',
      org: organizations[0],
      role: adminRole,
    },
    {
      email: 'sales@ecoretail.med',
      firstName: 'María',
      lastName: 'García',
      displayName: 'María García',
      org: organizations[0],
      role: salesRole,
    },
    {
      email: 'ops@ecoretail.med',
      firstName: 'Carlos',
      lastName: 'López',
      displayName: 'Carlos López',
      org: organizations[0],
      role: opsRole,
    },
    {
      email: 'cfo@ecoretail.med',
      firstName: 'Ana',
      lastName: 'Martínez',
      displayName: 'Ana Martínez',
      org: organizations[0],
      role: cfoRole,
    },
    {
      email: 'viewer@ecoretail.med',
      firstName: 'Juan',
      lastName: 'Rodríguez',
      displayName: 'Juan Rodríguez',
      org: organizations[0],
      role: viewerRole,
    },

    // Mediterráneo Trading users
    {
      email: 'admin@mediterraneo-trading.com',
      firstName: 'Admin',
      lastName: 'Mediterráneo',
      displayName: 'Admin Mediterráneo',
      org: organizations[1],
      role: adminRole,
    },
    {
      email: 'sales@mediterraneo-trading.com',
      firstName: 'Giuseppe',
      lastName: 'Rossi',
      displayName: 'Giuseppe Rossi',
      org: organizations[1],
      role: salesRole,
    },
    {
      email: 'ops@mediterraneo-trading.com',
      firstName: 'Sophia',
      lastName: 'Papadopoulos',
      displayName: 'Sophia Papadopoulos',
      org: organizations[1],
      role: opsRole,
    },
    {
      email: 'cfo@mediterraneo-trading.com',
      firstName: 'François',
      lastName: 'Dubois',
      displayName: 'François Dubois',
      org: organizations[1],
      role: cfoRole,
    },
    {
      email: 'viewer@mediterraneo-trading.com',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      displayName: 'Ahmed Hassan',
      org: organizations[1],
      role: viewerRole,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: defaultPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Create UserOrganization relationship
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: userData.org.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        organizationId: userData.org.id,
        roleId: userData.role.id,
        isPrimary: true,
        status: 'ACTIVE',
      },
    });

    createdUsers.push(user);
    console.log(`✅ Created user: ${user.email} (${userData.role.name} at ${userData.org.name})`);
  }

  return createdUsers;
}

async function seedBusinessData(organizations: any[]) {
  console.log('📊 Seeding business data...');

  for (const org of organizations) {
    // Seed Companies
    const companies = [];
    for (let i = 1; i <= 20; i++) {
      const company = await prisma.company.create({
        data: {
          orgId: org.id,
          name: `Company ${org.slug}-${i}`,
          industry: ['Retail', 'Manufacturing', 'Services', 'Technology', 'Healthcare'][i % 5],
          website: `https://company${i}-${org.slug}.com`,
          employees: Math.floor(Math.random() * 500) + 10,
          status: ['ACTIVE', 'PROSPECT', 'INACTIVE'][i % 3] as any,
          taxId: `TAX${org.slug.toUpperCase()}${i.toString().padStart(4, '0')}`,
          email: `contact@company${i}-${org.slug}.com`,
          phone: `+34 93${i.toString().padStart(7, '0')}`,
          address: `Street ${i}, Building ${i}`,
          city: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao'][i % 5],
          country: 'Spain',
          tags: [`tag${i % 3}`, `priority${i % 2}`],
        },
      });
      companies.push(company);
    }

    // Seed Contacts (3 per company)
    const contacts = [];
    for (const company of companies) {
      for (let j = 1; j <= 3; j++) {
        const contact = await prisma.contact.create({
          data: {
            orgId: org.id,
            companyId: company.id,
            firstName: ['Carlos', 'María', 'Antonio', 'Carmen', 'José'][j % 5],
            lastName: ['García', 'Rodríguez', 'González', 'Fernández', 'López'][j % 5],
            email: `contact${j}@${company.name.toLowerCase().replace(/\s/g, '')}.com`,
            phone: `+34 6${j}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
            position: ['CEO', 'CFO', 'CTO', 'Sales Manager', 'Operations Manager'][j % 5],
            department: ['Executive', 'Finance', 'Technology', 'Sales', 'Operations'][j % 5],
            isPrimary: j === 1,
            status: 'ACTIVE',
            tags: [`contact_tag${j}`],
          },
        });
        contacts.push(contact);
      }
    }

    // Seed Deals (25 deals in various stages)
    const deals = [];
    for (let i = 1; i <= 25; i++) {
      const company = companies[i % companies.length];
      const contact = contacts.find(c => c.companyId === company.id);
      const deal = await prisma.deal.create({
        data: {
          orgId: org.id,
          companyId: company.id,
          contactId: contact?.id,
          name: `Deal ${org.slug}-${i}: ${company.name} Project`,
          description: `Important deal for ${company.name}`,
          stage: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'][i % 6] as any,
          amount: Math.floor(Math.random() * 100000) + 5000,
          currency: 'EUR',
          probability: [10, 25, 50, 75, 100, 0][i % 6],
          expectedCloseDate: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)), // i weeks from now
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4] as any,
          tags: [`deal_${i % 3}`, `q${Math.ceil(i / 6)}`],
        },
      });
      deals.push(deal);
    }

    // Seed Products (50 products)
    const products = [];
    for (let i = 1; i <= 50; i++) {
      const product = await prisma.product.create({
        data: {
          orgId: org.id,
          sku: `SKU-${org.slug.toUpperCase()}-${i.toString().padStart(4, '0')}`,
          name: `Product ${i} - ${['Widget', 'Gadget', 'Tool', 'Component', 'Material'][i % 5]}`,
          description: `High quality product ${i} for various applications`,
          category: ['Electronics', 'Hardware', 'Software', 'Consumables', 'Raw Materials'][i % 5],
          unit: ['unit', 'kg', 'liter', 'box', 'pack'][i % 5],
          status: 'ACTIVE',
          barcode: `8${org.slug === 'ecoretail' ? '4' : '5'}${i.toString().padStart(11, '0')}`,
          weight: Math.random() * 10,
          costPrice: Math.floor(Math.random() * 100) + 10,
          sellingPrice: Math.floor(Math.random() * 200) + 50,
          taxRate: 21,
          minStockLevel: 10,
          reorderPoint: 20,
          reorderQuantity: 50,
          tags: [`product_cat_${i % 3}`],
        },
      });
      products.push(product);
    }

    // Seed Suppliers (15 suppliers)
    const suppliers = [];
    for (let i = 1; i <= 15; i++) {
      const supplier = await prisma.supplier.create({
        data: {
          orgId: org.id,
          code: `SUP-${org.slug.toUpperCase()}-${i.toString().padStart(3, '0')}`,
          name: `Supplier ${i} - ${['Global', 'Local', 'Premium', 'Economy', 'Express'][i % 5]}`,
          taxId: `SUP-TAX-${i.toString().padStart(8, '0')}`,
          contactPerson: `Contact Person ${i}`,
          email: `supplier${i}@${org.slug}.com`,
          phone: `+34 91${i.toString().padStart(7, '0')}`,
          website: `https://supplier${i}.com`,
          address: `Industrial Zone ${i}`,
          city: ['Barcelona', 'Madrid', 'Valencia', 'Zaragoza', 'Málaga'][i % 5],
          postalCode: `${(28000 + i * 100).toString()}`,
          country: 'Spain',
          status: 'ACTIVE',
          paymentTerms: `Net ${[15, 30, 45, 60][i % 4]}`,
          deliveryLeadTime: [3, 5, 7, 10, 14][i % 5],
          rating: 3 + (Math.random() * 2),
          tags: [`supplier_type_${i % 3}`],
        },
      });
      suppliers.push(supplier);
    }

    // Seed Warehouses (2 warehouses per org)
    const warehouses = [];
    for (let i = 1; i <= 2; i++) {
      const warehouse = await prisma.warehouse.create({
        data: {
          orgId: org.id,
          code: `WH-${org.slug.toUpperCase()}-${i}`,
          name: `${i === 1 ? 'Main' : 'Secondary'} Warehouse ${org.name}`,
          type: i === 1 ? 'MAIN' : 'SECONDARY',
          address: `Logistics Park ${i}, Zone ${i}`,
          city: i === 1 ? 'Barcelona' : 'Madrid',
          postalCode: i === 1 ? '08040' : '28042',
          country: 'Spain',
          manager: `Manager ${i}`,
          phone: `+34 93${i}123456`,
          email: `warehouse${i}@${org.slug}.com`,
          capacity: i === 1 ? 10000 : 5000,
          status: 'ACTIVE',
        },
      });
      warehouses.push(warehouse);
    }

    // Seed Inventory for products in warehouses
    for (const product of products.slice(0, 30)) { // First 30 products have inventory
      for (const warehouse of warehouses) {
        const quantity = Math.floor(Math.random() * 200) + 50;
        const reserved = Math.floor(quantity * 0.2);
        await prisma.inventory.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity,
            reservedQuantity: reserved,
            availableQuantity: quantity - reserved,
            location: `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 5) + 1}`,
            lastCountDate: new Date(),
            lastCountQuantity: quantity,
          },
        });
      }
    }

    // Seed Invoices (30 invoices in various states)
    for (let i = 1; i <= 30; i++) {
      const company = companies[i % companies.length];
      const dueDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      const invoice = await prisma.invoice.create({
        data: {
          orgId: org.id,
          invoiceNumber: `INV-${org.slug.toUpperCase()}-${new Date().getFullYear()}-${i.toString().padStart(5, '0')}`,
          type: 'SALES',
          entityType: 'COMPANY',
          entityId: company.id,
          status: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'][i % 5] as any,
          issueDate: new Date(),
          dueDate,
          paymentTerms: 'Net 30',
          currency: 'EUR',
          subtotal: Math.floor(Math.random() * 10000) + 1000,
          taxAmount: 0,
          totalAmount: 0,
          paidAmount: 0,
          balanceDue: 0,
          billingAddress: {
            line1: company.address || '123 Main St',
            city: company.city || 'Barcelona',
            postalCode: '08001',
            country: company.country || 'Spain',
          },
          tags: [`invoice_${i % 3}`],
        },
      });

      // Update calculated fields
      const taxAmount = invoice.subtotal * 0.21;
      const totalAmount = invoice.subtotal + taxAmount;
      const paidAmount = invoice.status === 'PAID' ? totalAmount : 0;

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          taxAmount,
          totalAmount,
          paidAmount,
          balanceDue: totalAmount - paidAmount,
        },
      });

      // Add invoice items
      for (let j = 1; j <= 3; j++) {
        const product = products[(i * 3 + j) % products.length];
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,
            description: product.name,
            quantity: Math.floor(Math.random() * 10) + 1,
            unitPrice: product.sellingPrice,
            unit: product.unit,
            taxRate: 21,
            subtotal: 0,
            taxAmount: 0,
            total: 0,
          },
        }).then(async (item) => {
          const subtotal = item.quantity * item.unitPrice;
          const taxAmount = subtotal * (item.taxRate / 100);
          const total = subtotal + taxAmount;

          await prisma.invoiceItem.update({
            where: { id: item.id },
            data: { subtotal, taxAmount, total },
          });
        });
      }
    }

    console.log(`✅ Created business data for ${org.name}`);
  }
}

async function main() {
  console.log('🌱 Starting seed process...');

  try {
    // Clear existing data in correct order
    console.log('🧹 Cleaning existing data...');
    await prisma.invoiceItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.inventoryAdjustment.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.product.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.company.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.deviceSession.deleteMany();
    await prisma.userOrganization.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // Seed in correct order
    const permissions = await seedPermissions();
    const roles = await seedSystemRoles(permissions);
    const organizations = await seedOrganizations(roles);
    const users = await seedUsers(organizations, roles);
    await seedBusinessData(organizations);

    console.log('✅ Seed completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Admin: admin@ecoretail.med / Password123!');
    console.log('  Sales: sales@ecoretail.med / Password123!');
    console.log('  Ops: ops@ecoretail.med / Password123!');
    console.log('  CFO: cfo@ecoretail.med / Password123!');
    console.log('  Viewer: viewer@ecoretail.med / Password123!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });