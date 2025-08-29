import { db, setOrg } from './connection.ts'
import { organizations, users, companies, contacts, deals, invoices, tasks } from './schema.ts'
import { env } from '@econeura/shared'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create test organizations
    const [org1, org2] = await db.insert(organizations).values([
      {
        name: 'Mediterranean Tech Solutions',
        slug: 'mediterranean-tech',
        settings: {
          timezone: 'Europe/Madrid',
          currency: 'EUR',
          language: 'es'
        }
      },
      {
        name: 'Costa Brava Consulting',
        slug: 'costa-brava-consulting',
        settings: {
          timezone: 'Europe/Madrid',
          currency: 'EUR',
          language: 'es'
        }
      }
    ]).returning()

    console.log('✅ Organizations created')

    // Seed data for organization 1
    await setOrg(org1.id)
    
    const [user1, user2] = await db.insert(users).values([
      {
        orgId: org1.id,
        email: 'admin@mediterranean-tech.com',
        name: 'Ana García',
        role: 'admin'
      },
      {
        orgId: org1.id,
        email: 'sales@mediterranean-tech.com',
        name: 'Carlos Rodríguez',
        role: 'user'
      }
    ]).returning()

    const [company1, company2] = await db.insert(companies).values([
      {
        orgId: org1.id,
        name: 'Barcelona Digital Agency',
        industry: 'Technology',
        website: 'https://barcelona-digital.com',
        phone: '+34 93 123 4567',
        email: 'info@barcelona-digital.com',
        address: {
          street: 'Carrer de la Pau, 123',
          city: 'Barcelona',
          postalCode: '08001',
          country: 'Spain'
        }
      },
      {
        orgId: org1.id,
        name: 'Valencia Software Solutions',
        industry: 'Software Development',
        website: 'https://valencia-software.com',
        phone: '+34 96 987 6543',
        email: 'contact@valencia-software.com',
        address: {
          street: 'Carrer del Mar, 456',
          city: 'Valencia',
          postalCode: '46001',
          country: 'Spain'
        }
      }
    ]).returning()

    const [contact1, contact2] = await db.insert(contacts).values([
      {
        orgId: org1.id,
        companyId: company1.id,
        firstName: 'María',
        lastName: 'López',
        email: 'maria.lopez@barcelona-digital.com',
        phone: '+34 93 123 4568',
        position: 'CEO'
      },
      {
        orgId: org1.id,
        companyId: company2.id,
        firstName: 'Javier',
        lastName: 'Martínez',
        email: 'javier.martinez@valencia-software.com',
        phone: '+34 96 987 6544',
        position: 'CTO'
      }
    ]).returning()

    const [deal1, deal2] = await db.insert(deals).values([
      {
        orgId: org1.id,
        companyId: company1.id,
        contactId: contact1.id,
        title: 'Website Redesign Project',
        description: 'Complete redesign of corporate website with modern UI/UX',
        amount: 25000.00,
        stage: 'negotiation',
        probability: 75,
        expectedCloseDate: new Date('2024-03-15')
      },
      {
        orgId: org1.id,
        companyId: company2.id,
        contactId: contact2.id,
        title: 'CRM Implementation',
        description: 'Custom CRM solution for sales team',
        amount: 15000.00,
        stage: 'prospecting',
        probability: 50,
        expectedCloseDate: new Date('2024-04-30')
      }
    ]).returning()

    const [invoice1, invoice2] = await db.insert(invoices).values([
      {
        orgId: org1.id,
        companyId: company1.id,
        invoiceNumber: 'INV-2024-001',
        amount: 5000.00,
        status: 'sent',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        items: [
          {
            description: 'Initial consultation and planning',
            quantity: 1,
            unitPrice: 5000.00,
            total: 5000.00
          }
        ]
      },
      {
        orgId: org1.id,
        companyId: company2.id,
        invoiceNumber: 'INV-2024-002',
        amount: 3000.00,
        status: 'paid',
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        paidDate: new Date('2024-02-10'),
        items: [
          {
            description: 'Software license and setup',
            quantity: 1,
            unitPrice: 3000.00,
            total: 3000.00
          }
        ]
      }
    ]).returning()

    const [task1, task2] = await db.insert(tasks).values([
      {
        orgId: org1.id,
        title: 'Follow up with Barcelona Digital',
        description: 'Call María to discuss project timeline',
        assigneeId: user2.id,
        priority: 'high',
        status: 'todo',
        dueDate: new Date('2024-02-10'),
        tags: ['sales', 'follow-up']
      },
      {
        orgId: org1.id,
        title: 'Prepare proposal for Valencia Software',
        description: 'Create detailed proposal for CRM implementation',
        assigneeId: user2.id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date('2024-02-15'),
        tags: ['proposal', 'crm']
      }
    ]).returning()

    console.log('✅ Organization 1 data seeded')

    // Seed data for organization 2
    await setOrg(org2.id)
    
    const [user3] = await db.insert(users).values([
      {
        orgId: org2.id,
        email: 'admin@costa-brava.com',
        name: 'Elena Costa',
        role: 'admin'
      }
    ]).returning()

    const [company3] = await db.insert(companies).values([
      {
        orgId: org2.id,
        name: 'Girona Tourism Services',
        industry: 'Tourism',
        website: 'https://girona-tourism.com',
        phone: '+34 97 234 5678',
        email: 'info@girona-tourism.com',
        address: {
          street: 'Carrer de la Costa, 789',
          city: 'Girona',
          postalCode: '17001',
          country: 'Spain'
        }
      }
    ]).returning()

    const [contact3] = await db.insert(contacts).values([
      {
        orgId: org2.id,
        companyId: company3.id,
        firstName: 'Pere',
        lastName: 'Català',
        email: 'pere.catala@girona-tourism.com',
        phone: '+34 97 234 5679',
        position: 'Director'
      }
    ]).returning()

    const [deal3] = await db.insert(deals).values([
      {
        orgId: org2.id,
        companyId: company3.id,
        contactId: contact3.id,
        title: 'Tourism Platform Development',
        description: 'Custom platform for managing tourism services',
        amount: 35000.00,
        stage: 'qualification',
        probability: 60,
        expectedCloseDate: new Date('2024-05-15')
      }
    ]).returning()

    console.log('✅ Organization 2 data seeded')

    console.log('🎉 Database seeding completed successfully!')
    console.log(`📊 Created ${org1.id} and ${org2.id} organizations`)
    console.log(`👥 Created ${user1.id}, ${user2.id}, ${user3.id} users`)
    console.log(`🏢 Created ${company1.id}, ${company2.id}, ${company3.id} companies`)
    console.log(`📞 Created ${contact1.id}, ${contact2.id}, ${contact3.id} contacts`)
    console.log(`💼 Created ${deal1.id}, ${deal2.id}, ${deal3.id} deals`)
    console.log(`🧾 Created ${invoice1.id}, ${invoice2.id} invoices`)
    console.log(`✅ Created ${task1.id}, ${task2.id} tasks`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seed }



