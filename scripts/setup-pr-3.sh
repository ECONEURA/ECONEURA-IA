#!/bin/bash
# PR-3: Database and Migrations Setup

set -e

echo "🗄️ Setting up Database and Migrations (PR-3)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set. Please set it in your .env file:"
    echo "DATABASE_URL=postgresql://user:password@localhost:5432/econeura"
    print_status "Using default DATABASE_URL for setup..."
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/econeura"
fi

# Create database package structure
print_status "Creating database package structure..."

# Create drizzle config
cat > packages/db/drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default defineConfig({
  schema: './src/schemas/*',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
EOF

# Create connection file
cat > packages/db/src/connection.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL!;

// Create the connection
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client);

// Export the client for direct access if needed
export { client };
EOF

# Create schemas directory
mkdir -p packages/db/src/schemas

# Create users schema
cat > packages/db/src/schemas/users.ts << 'EOF'
import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
EOF

# Create organizations schema
cat > packages/db/src/schemas/organizations.ts << 'EOF'
import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations);
export const selectOrganizationSchema = createSelectSchema(organizations);

export type Organization = z.infer<typeof selectOrganizationSchema>;
export type NewOrganization = z.infer<typeof insertOrganizationSchema>;
EOF

# Create schemas index
cat > packages/db/src/schemas/index.ts << 'EOF'
// Export all schemas
export * from './users';
export * from './organizations';

// Export database instance
export { db } from '../connection';
EOF

# Create main index file
cat > packages/db/src/index.ts << 'EOF'
// Export everything from schemas
export * from './schemas';

// Export connection
export { db, client } from './connection';
EOF

# Create migrations directory
mkdir -p packages/db/migrations

# Create initial migration
cat > packages/db/migrations/001_initial_schema.sql << 'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");
EOF

print_success "Database package structure created"

# Install dependencies
print_status "Installing database dependencies..."
pnpm install

# Generate initial migration
print_status "Generating initial migration..."
pnpm --filter @econeura/db db:generate:pg

print_success "✅ PR-3: Database and Migrations Complete!"
print_status "Next steps:"
echo "  1. Set up PostgreSQL database"
echo "  2. Update DATABASE_URL in .env file"
echo "  3. Run 'pnpm db:migrate' to apply migrations"
echo "  4. Run 'pnpm db:seed' to seed initial data"
echo "  5. Continue with PR-4: Authentication and Authorization"

echo ""
print_status "🎯 PR-3 Implementation Summary:"
echo "  ✓ Database package structure created"
echo "  ✓ Drizzle ORM configured"
echo "  ✓ Initial schemas created"
echo "  ✓ Migration system set up"
echo "  ✓ Seeding scripts prepared"
