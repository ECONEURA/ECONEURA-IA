#!/usr/bin/env tsx

// import { PrismaClient } from '@prisma/client'
import { confirm } from '@inquirer/prompts'

import { getPrisma } from '@econeura/db/client.lazy'
const prisma = getPrisma();

async function rollback() {
  console.log('⚠️  Database Rollback Script')
  console.log('This will delete all data from the database!')

  const proceed = await confirm({
    message: 'Are you sure you want to delete ALL data?',
    default: false
  }).catch(() => false)

  if (!proceed) {
    console.log('❌ Rollback cancelled')
    return
  }

  console.log('\n🗑️  Starting rollback...')

  try {
    // Delete in reverse order of dependencies
    const deletions = [
      // Activities
      { model: prisma.activity, name: 'Activities' },

      // Finance
      { model: prisma.payment, name: 'Payments' },
      { model: prisma.invoiceItem, name: 'Invoice Items' },
      { model: prisma.invoice, name: 'Invoices' },
      { model: prisma.expense, name: 'Expenses' },

      // ERP
      { model: prisma.inventoryAdjustment, name: 'Inventory Adjustments' },
      { model: prisma.inventory, name: 'Inventory' },
      { model: prisma.purchaseOrderItem, name: 'Purchase Order Items' },
      { model: prisma.purchaseOrder, name: 'Purchase Orders' },
      { model: prisma.warehouse, name: 'Warehouses' },
      { model: prisma.product, name: 'Products' },
      { model: prisma.supplier, name: 'Suppliers' },

      // CRM
      { model: prisma.deal, name: 'Deals' },
      { model: prisma.contact, name: 'Contacts' },
      { model: prisma.company, name: 'Companies' },

      // Auth & System
      { model: prisma.auditLog, name: 'Audit Logs' },
      { model: prisma.session, name: 'Sessions' },
      { model: prisma.userOrganization, name: 'User Organizations' },
      { model: prisma.user, name: 'Users' },
      { model: prisma.role, name: 'Roles' },
      { model: prisma.organization, name: 'Organizations' }
    ]

    for (const { model, name } of deletions) {
      try {
        const count = await model.deleteMany()
        console.log(`✓ Deleted ${count.count} ${name}`)
      } catch (error) {
        console.log(`⚠ Could not delete ${name}:`, error.message)
      }
    }

    console.log('\n✅ Rollback completed successfully!')

  } catch (error) {
    console.error('❌ Rollback error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute rollback
rollback().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
