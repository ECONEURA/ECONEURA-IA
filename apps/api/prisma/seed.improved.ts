// import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@econeura/db/client.lazy'

const prisma = getPrisma()

// Utility to create or update records
async function upsertRecord<T>(
  model: any,
  where: any,
  create: any,
  update?: any
): Promise<T> {
  const existing = await model.findFirst({ where })
  if (existing) {
    console.log(`✓ Found existing ${model.name}: ${JSON.stringify(where)}`)
    if (update) {
      return await model.update({
        where: { id: existing.id },
        data: update
      })
    }
    return existing
  } else {
    console.log(`+ Creating new ${model.name}: ${JSON.stringify(where)}`)
    return await model.create({ data: create })
  }
}

async function seed() {
  console.log('🌱 Starting idempotent seed...')

  try {
    // 1. Create Organizations
    console.log('\n📦 Seeding Organizations...')
    const org1 = await upsertRecord(
      prisma.organization,
      { slug: 'ecoretail' },
      {
        name: 'EcoRetail',
        slug: 'ecoretail',
        domain: 'ecoretail.com',
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        status: 'ACTIVE',
        settings: {
          features: ['crm', 'erp', 'finance'],
          theme: 'light'
        }
      }
    )

    const org2 = await upsertRecord(
      prisma.organization,
      { slug: 'mediterraneo' },
      {
        name: 'Mediterráneo Imports',
        slug: 'mediterraneo',
        domain: 'mediterraneo.com',
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        status: 'ACTIVE',
        settings: {
          features: ['crm', 'finance'],
          theme: 'dark'
        }
      }
    )

    // 2. Create Roles for each organization
    console.log('\n👮 Seeding Roles...')
    const roles = ['admin', 'sales', 'ops', 'cfo', 'viewer']
    const rolePermissions = {
      admin: ['*:*'],
      sales: [
        'crm:companies:*',
        'crm:contacts:*',
        'crm:deals:*',
        'crm:activities:*',
        'finance:invoices:read',
        'finance:payments:read'
      ],
      ops: [
        'erp:products:*',
        'erp:inventory:*',
        'erp:warehouses:*',
        'erp:suppliers:*',
        'erp:purchase_orders:*'
      ],
      cfo: [
        'finance:*:*',
        'crm:companies:read',
        'crm:deals:read',
        'erp:products:read',
        'erp:inventory:read'
      ],
      viewer: [
        'crm:companies:read',
        'crm:contacts:read',
        'crm:deals:read',
        'erp:products:read',
        'finance:invoices:read'
      ]
    }

    const orgRoles = {}
    for (const org of [org1, org2]) {
      orgRoles[org.id] = {}
      for (const roleName of roles) {
        const role = await upsertRecord(
          prisma.role,
          {
            organizationId: org.id,
            name: roleName
          },
          {
            organizationId: org.id,
            name: roleName,
            description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
            permissions: rolePermissions[roleName] || [],
            isSystem: true
          },
          {
            permissions: rolePermissions[roleName] || []
          }
        )
        orgRoles[org.id][roleName] = role
      }
    }

    // 3. Create Users
    console.log('\n👤 Seeding Users...')
    const hashedPassword = await bcrypt.hash('Demo1234!', 10)

    const users = [
      // EcoRetail users
      { email: 'admin@ecoretail.com', name: 'Admin User', org: org1, role: 'admin' },
      { email: 'sales@ecoretail.com', name: 'Sales Manager', org: org1, role: 'sales' },
      { email: 'ops@ecoretail.com', name: 'Operations Manager', org: org1, role: 'ops' },
      { email: 'cfo@ecoretail.com', name: 'CFO', org: org1, role: 'cfo' },
      { email: 'viewer@ecoretail.com', name: 'Viewer', org: org1, role: 'viewer' },
      // Mediterráneo users
      { email: 'admin@mediterraneo.com', name: 'Admin Med', org: org2, role: 'admin' },
      { email: 'sales@mediterraneo.com', name: 'Sales Med', org: org2, role: 'sales' },
      { email: 'cfo@mediterraneo.com', name: 'CFO Med', org: org2, role: 'cfo' }
    ]

    const createdUsers = {}
    for (const userData of users) {
      const user = await upsertRecord(
        prisma.user,
        { email: userData.email },
        {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          isActive: true,
          emailVerified: true,
          organizationId: userData.org.id,
          roleId: orgRoles[userData.org.id][userData.role].id
        },
        {
          name: userData.name,
          isActive: true
        }
      )
      createdUsers[userData.email] = user
    }

    // 4. Create CRM data for EcoRetail
    console.log('\n🏢 Seeding Companies...')
    const companies = []
    for (let i = 1; i <= 20; i++) {
      const company = await upsertRecord(
        prisma.company,
        {
          orgId: org1.id,
          name: `Company ${i}`
        },
        {
          orgId: org1.id,
          name: `Company ${i}`,
          industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][i % 5],
          website: `https://company${i}.com`,
          employees: Math.floor(Math.random() * 1000) + 10,
          status: ['PROSPECT', 'LEAD', 'CUSTOMER', 'PARTNER'][i % 4],
          address: `${i} Business Street`,
          city: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'][i % 4],
          country: 'Spain',
          phone: `+34 900 ${String(100000 + i).padStart(6, '0')}`,
          email: `contact@company${i}.com`,
          tags: ['important', 'new', 'premium'].slice(0, i % 3 + 1)
        }
      )
      companies.push(company)
    }

    // 5. Create Contacts
    console.log('\n👥 Seeding Contacts...')
    const contacts = []
    for (let i = 1; i <= 60; i++) {
      const companyIndex = Math.floor(Math.random() * companies.length)
      const contact = await upsertRecord(
        prisma.contact,
        {
          orgId: org1.id,
          email: `contact${i}@example.com`
        },
        {
          orgId: org1.id,
          companyId: companies[companyIndex].id,
          firstName: ['John', 'Jane', 'Robert', 'Maria', 'Carlos'][i % 5],
          lastName: `Doe${i}`,
          email: `contact${i}@example.com`,
          phone: `+34 600 ${String(100000 + i).padStart(6, '0')}`,
          position: ['CEO', 'CTO', 'Sales Manager', 'Developer', 'Designer'][i % 5],
          status: 'ACTIVE',
          tags: ['decision-maker', 'technical', 'budget-holder'].slice(0, i % 3 + 1)
        }
      )
      contacts.push(contact)
    }

    // 6. Create Deals
    console.log('\n💼 Seeding Deals...')
    for (let i = 1; i <= 25; i++) {
      const companyIndex = Math.floor(Math.random() * companies.length)
      const contactIndex = Math.floor(Math.random() * contacts.length)
      await upsertRecord(
        prisma.deal,
        {
          orgId: org1.id,
          title: `Deal ${i}`
        },
        {
          orgId: org1.id,
          title: `Deal ${i}`,
          companyId: companies[companyIndex].id,
          primaryContactId: contacts[contactIndex].id,
          value: Math.floor(Math.random() * 100000) + 5000,
          currency: 'EUR',
          stage: ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'][i % 6],
          status: i % 6 === 5 ? 'CLOSED' : 'OPEN',
          probability: [10, 25, 50, 75, 100, 0][i % 6],
          expectedCloseDate: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)),
          assignedUserId: createdUsers['sales@ecoretail.com'].id,
          tags: ['hot', 'urgent', 'q1-target'].slice(0, i % 3 + 1)
        }
      )
    }

    // 7. Create Products
    console.log('\n📦 Seeding Products...')
    const products = []
    for (let i = 1; i <= 50; i++) {
      const product = await upsertRecord(
        prisma.product,
        {
          orgId: org1.id,
          sku: `SKU-${String(i).padStart(4, '0')}`
        },
        {
          orgId: org1.id,
          sku: `SKU-${String(i).padStart(4, '0')}`,
          name: `Product ${i}`,
          description: `High quality product ${i} with excellent features`,
          category: ['Electronics', 'Clothing', 'Food', 'Tools', 'Office'][i % 5],
          unit: ['unit', 'kg', 'liter', 'box', 'pack'][i % 5],
          status: 'ACTIVE',
          barcode: `8${String(400000 + i).padStart(12, '0')}`,
          costPrice: Math.floor(Math.random() * 50) + 10,
          sellingPrice: Math.floor(Math.random() * 100) + 50,
          currency: 'EUR',
          taxRate: 21,
          minStockLevel: 10,
          reorderPoint: 20,
          reorderQuantity: 50,
          tags: ['bestseller', 'new', 'promotion'].slice(0, i % 3 + 1)
        }
      )
      products.push(product)
    }

    // 8. Create Suppliers
    console.log('\n🚚 Seeding Suppliers...')
    const suppliers = []
    for (let i = 1; i <= 10; i++) {
      const supplier = await upsertRecord(
        prisma.supplier,
        {
          orgId: org1.id,
          code: `SUP-${String(i).padStart(3, '0')}`
        },
        {
          orgId: org1.id,
          code: `SUP-${String(i).padStart(3, '0')}`,
          name: `Supplier ${i}`,
          contactName: `Contact ${i}`,
          email: `supplier${i}@example.com`,
          phone: `+34 900 ${String(200000 + i).padStart(6, '0')}`,
          address: `${i} Supply Street`,
          city: ['Barcelona', 'Madrid', 'Valencia'][i % 3],
          country: 'Spain',
          taxId: `B${String(80000000 + i).padStart(8, '0')}`,
          status: 'ACTIVE',
          rating: Math.floor(Math.random() * 3) + 3,
          paymentTerms: [15, 30, 45, 60][i % 4],
          currency: 'EUR',
          tags: ['preferred', 'reliable', 'fast-delivery'].slice(0, i % 3 + 1)
        }
      )
      suppliers.push(supplier)
    }

    // 9. Create Warehouses
    console.log('\n🏭 Seeding Warehouses...')
    const warehouses = []
    for (let i = 1; i <= 3; i++) {
      const warehouse = await upsertRecord(
        prisma.warehouse,
        {
          orgId: org1.id,
          code: `WH-${String(i).padStart(2, '0')}`
        },
        {
          orgId: org1.id,
          code: `WH-${String(i).padStart(2, '0')}`,
          name: `Warehouse ${['North', 'Central', 'South'][i - 1]}`,
          type: ['MAIN', 'DISTRIBUTION', 'RETAIL'][i - 1],
          address: `${i} Warehouse Avenue`,
          city: ['Barcelona', 'Madrid', 'Valencia'][i - 1],
          country: 'Spain',
          phone: `+34 900 ${String(300000 + i).padStart(6, '0')}`,
          email: `warehouse${i}@ecoretail.com`,
          capacity: 10000 * i,
          occupancy: Math.floor(Math.random() * 70) + 20,
          status: 'ACTIVE',
          operatingHours: { open: '08:00', close: '20:00', days: ['Mon-Fri'] },
          metadata: {
            climate_controlled: i === 1,
            security_level: 'high',
            loading_docks: i * 2
          }
        }
      )
      warehouses.push(warehouse)
    }

    // 10. Create Inventory
    console.log('\n📊 Seeding Inventory...')
    for (const warehouse of warehouses) {
      for (let i = 0; i < 20; i++) {
        const product = products[i]
        await upsertRecord(
          prisma.inventory,
          {
            orgId: org1.id,
            productId: product.id,
            warehouseId: warehouse.id
          },
          {
            orgId: org1.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: Math.floor(Math.random() * 100) + 10,
            reservedQuantity: Math.floor(Math.random() * 10),
            location: `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 10) + 1}`,
            batch: `BATCH-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
            expiryDate: i % 3 === 0 ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) : null,
            lastStockCheck: new Date()
          }
        )
      }
    }

    // 11. Create Purchase Orders
    console.log('\n📋 Seeding Purchase Orders...')
    for (let i = 1; i <= 15; i++) {
      const supplier = suppliers[i % suppliers.length]
      const po = await upsertRecord(
        prisma.purchaseOrder,
        {
          orgId: org1.id,
          orderNumber: `PO-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`
        },
        {
          orgId: org1.id,
          orderNumber: `PO-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`,
          supplierId: supplier.id,
          status: ['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'COMPLETED'][i % 5],
          orderDate: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
          expectedDelivery: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          totalAmount: 0,
          currency: 'EUR',
          paymentTerms: 30,
          shippingAddress: warehouses[0].address,
          notes: `Purchase order ${i} for regular supply`
        }
      )

      // Add items to purchase order
      let totalAmount = 0
      for (let j = 0; j < 3; j++) {
        const product = products[(i * 3 + j) % products.length]
        const quantity = Math.floor(Math.random() * 50) + 10
        const unitPrice = product.costPrice
        const lineTotal = quantity * unitPrice
        totalAmount += lineTotal

        await upsertRecord(
          prisma.purchaseOrderItem,
          {
            purchaseOrderId: po.id,
            productId: product.id
          },
          {
            purchaseOrderId: po.id,
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice: lineTotal,
            currency: 'EUR',
            status: 'PENDING'
          }
        )
      }

      // Update purchase order total
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { totalAmount }
      })
    }

    // 12. Create Invoices
    console.log('\n💰 Seeding Invoices...')
    for (let i = 1; i <= 30; i++) {
      const company = companies[i % companies.length]
      const invoice = await upsertRecord(
        prisma.invoice,
        {
          orgId: org1.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`
        },
        {
          orgId: org1.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`,
          entityType: 'COMPANY',
          entityId: company.id,
          status: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'][i % 5],
          issueDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + (i % 30) * 24 * 60 * 60 * 1000),
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          currency: 'EUR',
          taxRate: 21,
          paymentTerms: 30,
          notes: `Invoice for services/products delivered to ${company.name}`
        }
      )

      // Add invoice items
      let subtotal = 0
      for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
        const product = products[(i + j) % products.length]
        const quantity = Math.floor(Math.random() * 10) + 1
        const unitPrice = product.sellingPrice
        const lineTotal = quantity * unitPrice
        subtotal += lineTotal

        await upsertRecord(
          prisma.invoiceItem,
          {
            invoiceId: invoice.id,
            description: product.name
          },
          {
            invoiceId: invoice.id,
            productId: product.id,
            description: product.name,
            quantity,
            unitPrice,
            totalPrice: lineTotal,
            currency: 'EUR'
          }
        )
      }

      // Update invoice totals
      const taxAmount = subtotal * 0.21
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount
        }
      })
    }

    // 13. Create sample Activities
    console.log('\n📅 Seeding Activities...')
    const activityTypes = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']
    for (let i = 1; i <= 50; i++) {
      const entityType = ['COMPANY', 'CONTACT', 'DEAL'][i % 3]
      let entityId
      switch (entityType) {
        case 'COMPANY':
          entityId = companies[i % companies.length].id
          break
        case 'CONTACT':
          entityId = contacts[i % contacts.length].id
          break
        case 'DEAL':
          entityId = (await prisma.deal.findFirst({ where: { orgId: org1.id }, skip: i % 25 }))?.id
          break
      }

      await upsertRecord(
        prisma.activity,
        {
          orgId: org1.id,
          subject: `Activity ${i}`
        },
        {
          orgId: org1.id,
          type: activityTypes[i % 5],
          subject: `Activity ${i}`,
          description: `Description for activity ${i}`,
          entityType,
          entityId,
          status: ['PENDING', 'COMPLETED', 'CANCELLED'][i % 3],
          priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
          dueDate: new Date(Date.now() + (i - 25) * 24 * 60 * 60 * 1000),
          assignedUserId: createdUsers['sales@ecoretail.com'].id
        }
      )
    }

    console.log('\n✅ Seed completed successfully!')

    // Print summary
    console.log('\n📊 Summary:')
    console.log('- Organizations: 2')
    console.log('- Users: 8')
    console.log('- Companies: 20')
    console.log('- Contacts: 60')
    console.log('- Deals: 25')
    console.log('- Products: 50')
    console.log('- Suppliers: 10')
    console.log('- Warehouses: 3')
    console.log('- Purchase Orders: 15')
    console.log('- Invoices: 30')
    console.log('- Activities: 50')

    console.log('\n🔑 Login credentials:')
    console.log('Email: admin@ecoretail.com')
    console.log('Password: Demo1234!')

  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

// Execute seed
seed()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
