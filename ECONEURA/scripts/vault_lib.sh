#!/usr/bin/env bash
# ECONEURA Vault Integration Library
# Reusable functions for Vault operations

set -euo pipefail

# vault_lookup: Retrieve a value from Vault
# Usage: vault_lookup <key> [default_value]
vault_lookup() {
  local key="$1"
  local default_value="${2:-}"

  if [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    local value
    value=$(vault kv get -field=value "secret/econeura/$key" 2>/dev/null || echo "")
    if [ -n "$value" ]; then
      echo "$value"
      return 0
    fi
  fi

  # Fallback to default or empty
  echo "$default_value"
  return 1
}

# vault_store: Store a value in Vault
# Usage: vault_store <key> <value>
vault_store() {
  local key="$1"
  local value="$2"

  if [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    echo "$value" | vault kv put "secret/econeura/$key" value=-
    return $?
  else
    echo "ERROR: Vault not configured (VAULT_ADDR or VAULT_TOKEN missing)" >&2
    return 1
  fi
}

# vault_check_connection: Verify Vault connectivity
# Usage: vault_check_connection
vault_check_connection() {
  if [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    vault status >/dev/null 2>&1
    return $?
  else
    return 1
  fi
}

# vault_get_token_with_expiry: Get approval token with expiry validation
# Usage: vault_get_token_with_expiry
vault_get_token_with_expiry() {
  local token_data
  token_data=$(vault_lookup "approval_token_data" "{}")

  if [ "$token_data" = "{}" ] || [ -z "$token_data" ]; then
    return 1
  fi

  # Parse JSON for token and expiry
  local token expiry
  token=$(echo "$token_data" | jq -r '.token // empty')
  expiry=$(echo "$token_data" | jq -r '.expiry // empty')

  if [ -z "$token" ] || [ -z "$expiry" ]; then
    return 1
  fi

  # Check if token is expired
  local current_time
  current_time=$(date +%s)
  if [ "$current_time" -gt "$expiry" ]; then
    echo "ERROR: Approval token expired" >&2
    return 1
  fi

  echo "$token"
  return 0
}

# vault_store_token_with_expiry: Store approval token with expiry
# Usage: vault_store_token_with_expiry <token> <hours_valid>
vault_store_token_with_expiry() {
  local token="$1"
  local hours_valid="${2:-24}"
  local expiry
  expiry=$(date -d "+${hours_valid} hours" +%s)

  local token_data
  token_data=$(jq -n \
    --arg token "$token" \
    --arg expiry "$expiry" \
    --arg created "$(date --iso-8601=seconds)" \
    '{token: $token, expiry: $expiry, created: $created}')

  vault_store "approval_token_data" "$token_data"
}