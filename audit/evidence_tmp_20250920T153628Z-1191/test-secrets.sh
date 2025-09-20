#!/bin/bash

# Secret scanning script
set -e

echo "🔐 Running secret scanning..."

# Use detect-secrets if available
if command -v detect-secrets &> /dev/null; then
  echo "Running detect-secrets..."
  detect-secrets scan --all-files
else
  echo "detect-secrets not found, running basic secret checks..."
  
  # Basic secret patterns
  SECRETS_FOUND=0
  
  # Check for common secret patterns
  if grep -r "password.*=" --include="*.ts" --include="*.js" --include="*.json" . | grep -v ".env.example" | grep -v "test" | grep -v "spec"; then
    echo "❌ Found potential password in code"
    ((SECRETS_FOUND++))
  fi
  
  if grep -r "api_key.*=" --include="*.ts" --include="*.js" --include="*.json" . | grep -v ".env.example" | grep -v "test" | grep -v "spec"; then
    echo "❌ Found potential API key in code"
    ((SECRETS_FOUND++))
  fi
  
  if grep -r "secret.*=" --include="*.ts" --include="*.js" --include="*.json" . | grep -v ".env.example" | grep -v "test" | grep -v "spec"; then
    echo "❌ Found potential secret in code"
    ((SECRETS_FOUND++))
  fi
  
  if [ "$SECRETS_FOUND" -eq "0" ]; then
    echo "✅ No secrets found in code"
  else
    echo "❌ Found $SECRETS_FOUND potential secrets"
    exit 1
  fi
fi

