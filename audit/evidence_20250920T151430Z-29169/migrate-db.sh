#!/bin/bash

# Database migration script
set -e

echo "🗃️  Running database migrations..."

# Check if MEM_PG_URL is set
if [ -z "$MEM_PG_URL" ]; then
  echo "⚠️  MEM_PG_URL not set, using default"
  MEM_PG_URL="postgres://postgres:postgres@localhost:5432/econeura"
fi

echo "📊 Database URL: $MEM_PG_URL"

# Run migration
echo "🔄 Applying migration..."
psql "$MEM_PG_URL" -f packages/db/migrations/20250101000000_mem.sql

echo "✅ Database migration completed!"

