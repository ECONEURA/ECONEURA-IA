#!/usr/bin/env tsx

/**
 * Database setup script for ECONEURA CRM
 * This script initializes the database with Prisma migrations
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const PRISMA_SCHEMA = join(ROOT_DIR, 'prisma', 'schema.prisma');

console.log('🚀 ECONEURA CRM Database Setup');
console.log('================================');

// Check if schema exists
if (!existsSync(PRISMA_SCHEMA)) {
  console.error('❌ Prisma schema not found at:', PRISMA_SCHEMA);
  process.exit(1);
}

console.log('✅ Found Prisma schema');

try {
  // Generate Prisma client
  console.log('\n📦 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: ROOT_DIR
  });
  
  // Push schema to database (creates tables if they don't exist)
  console.log('\n🔧 Pushing schema to database...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: ROOT_DIR
  });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n🎯 Next steps:');
  console.log('   1. Start the API server: npm run dev');
  console.log('   2. Test authentication endpoints');
  console.log('   3. Create CRM records via API');
  
} catch (error) {
  console.error('\n❌ Database setup failed:');
  console.error(error);
  process.exit(1);
}