#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.."; pwd)"
TRACE="$1"
MANIFEST="$BASE/audit/complete_${TRACE}.json"
SIG="$MANIFEST.sig"

# Ensure GPG directory exists if GPG is available
if command -v gpg >/dev/null 2>&1; then
  export GNUPGHOME="${GNUPGHOME:-$HOME/.gnupg}"
  mkdir -p "$GNUPGHOME" 2>/dev/null || true
  chmod 700 "$GNUPGHOME" 2>/dev/null || true
fi

# Try to sign the manifest with GPG if available and keys exist
if command -v gpg >/dev/null 2>&1 && gpg --list-keys >/dev/null 2>&1; then
  gpg --yes --batch --output "$SIG" --detach-sign "$MANIFEST" 2>/dev/null || {
    echo "GPG signing failed, continuing without signature"
    echo "false" > "$BASE/audit/signed_${TRACE}.status"
    exit 0
  }
  echo "true" > "$BASE/audit/signed_${TRACE}.status"
  echo "Manifest signed: $SIG"
else
  echo "GPG not available or no keys configured, skipping signature"
  echo "false" > "$BASE/audit/signed_${TRACE}.status"
fi
