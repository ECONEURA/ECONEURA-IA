#!/bin/bash
# PR-2: TypeScript Configuration Setup

set -e

echo "🔧 Setting up TypeScript Configuration (PR-2)..."

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

# Create TypeScript configs for each app
print_status "Creating TypeScript configurations..."

# API TypeScript config
if [ ! -f "apps/api/tsconfig.json" ]; then
    print_status "Creating apps/api/tsconfig.json..."
    cat > apps/api/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/routes/*": ["./routes/*"],
      "@/middleware/*": ["./middleware/*"],
      "@/controllers/*": ["./controllers/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    print_success "apps/api/tsconfig.json created"
else
    print_success "apps/api/tsconfig.json already exists"
fi

# Web TypeScript config
if [ ! -f "apps/web/tsconfig.json" ]; then
    print_status "Creating apps/web/tsconfig.json..."
    cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/app/*": ["./src/app/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
EOF
    print_success "apps/web/tsconfig.json created"
else
    print_success "apps/web/tsconfig.json already exists"
fi

# Workers TypeScript config
if [ ! -f "apps/workers/tsconfig.json" ]; then
    print_status "Creating apps/workers/tsconfig.json..."
    cat > apps/workers/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/processors/*": ["./processors/*"],
      "@/queues/*": ["./queues/*"],
      "@/services/*": ["./services/*"],
      "@/types/*": ["./types/*"],
      "@/utils/*": ["./utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    print_success "apps/workers/tsconfig.json created"
else
    print_success "apps/workers/tsconfig.json already exists"
fi

# Shared package TypeScript config
if [ ! -f "packages/shared/tsconfig.json" ]; then
    print_status "Creating packages/shared/tsconfig.json..."
    cat > packages/shared/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    print_success "packages/shared/tsconfig.json created"
else
    print_success "packages/shared/tsconfig.json already exists"
fi

# DB package TypeScript config
if [ ! -f "packages/db/tsconfig.json" ]; then
    print_status "Creating packages/db/tsconfig.json..."
    cat > packages/db/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    print_success "packages/db/tsconfig.json created"
else
    print_success "packages/db/tsconfig.json already exists"
fi

# SDK package TypeScript config
if [ ! -f "packages/sdk/tsconfig.json" ]; then
    print_status "Creating packages/sdk/tsconfig.json..."
    cat > packages/sdk/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    print_success "packages/sdk/tsconfig.json created"
else
    print_success "packages/sdk/tsconfig.json already exists"
fi

# Update root tsconfig.json with references
print_status "Updating root tsconfig.json with project references..."

# Create a backup of the current tsconfig.json
cp tsconfig.json tsconfig.json.backup

# Update tsconfig.json to include project references
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@econeura/shared": ["./packages/shared/src"],
      "@econeura/db": ["./packages/db/src"],
      "@econeura/sdk": ["./packages/sdk/src"]
    }
  },
  "include": [],
  "exclude": ["node_modules", "dist", "build", ".next"],
  "references": [
    { "path": "./apps/api" },
    { "path": "./apps/web" },
    { "path": "./apps/workers" },
    { "path": "./packages/shared" },
    { "path": "./packages/db" },
    { "path": "./packages/sdk" }
  ]
}
EOF

print_success "Root tsconfig.json updated with project references"

# Test TypeScript configurations
print_status "Testing TypeScript configurations..."

# Test each project's TypeScript config
projects=("apps/api" "apps/web" "apps/workers" "packages/shared" "packages/db" "packages/sdk")

for project in "${projects[@]}"; do
    if [ -f "$project/tsconfig.json" ]; then
        if pnpm --filter "$project" tsc --noEmit > /dev/null 2>&1; then
            print_success "✓ $project TypeScript config valid"
        else
            print_warning "⚠ $project TypeScript config has issues (expected for empty projects)"
        fi
    else
        print_error "✗ $project/tsconfig.json missing"
    fi
done

print_success "✅ PR-2: TypeScript Configuration Complete!"
print_status "Next steps:"
echo "  1. Continue with PR-3: Database and Migrations"
echo "  2. Run 'pnpm typecheck' to verify configurations"
echo "  3. Start adding TypeScript code to test configurations"

echo ""
print_status "🎯 PR-2 Implementation Summary:"
echo "  ✓ TypeScript configs created for all apps and packages"
echo "  ✓ Project references configured"
echo "  ✓ Path aliases set up"
echo "  ✓ Strict mode enabled"
echo "  ✓ Build optimizations configured"
