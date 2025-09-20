#!/bin/bash

# Development startup script
set -e

echo "🚀 Starting ECONEURA development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm -w i

# Build packages
echo "🔨 Building packages..."
pnpm -w build

# Start services in background
echo "🌐 Starting API services..."

# Start NEURA↔Comet API (port 3101)
echo "Starting api-neura-comet on port 3101..."
pnpm --filter api-neura-comet dev &
NEURA_PID=$!

# Start Agents↔Make API (port 3102)
echo "Starting api-agents-make on port 3102..."
pnpm --filter api-agents-make dev &
MAKE_PID=$!

# Start Cockpit (port 3000)
echo "Starting econeura-cockpit on port 3000..."
pnpm --filter econeura-cockpit dev &
COCKPIT_PID=$!

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Running health checks..."
curl -f http://localhost:3000 || echo "⚠️  Cockpit not ready"
curl -f http://localhost:3101/health || echo "⚠️  NEURA API not ready"
curl -f http://localhost:3102/health || echo "⚠️  Agents API not ready"

echo "✅ Development environment started!"
echo ""
echo "Services:"
echo "  🌐 Cockpit: http://localhost:3000"
echo "  🧠 NEURA API: http://localhost:3101"
echo "  🤖 Agents API: http://localhost:3102"
echo ""
echo "To stop all services, run: kill $COCKPIT_PID $NEURA_PID $MAKE_PID"

# Keep script running
wait

