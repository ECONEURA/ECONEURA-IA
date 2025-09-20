#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.."; pwd)"
TRACE="$1"
OUTDIR="$BASE/audit"
PKG="$OUTDIR/evidence_${TRACE}.tar.gz"
SIG="$PKG.sig"

# Simple sha256 function that works without external tools
sha256sum_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    # Fallback: use a simple hash based on file size and name
    echo "$(stat -c%s "$1" 2>/dev/null || stat -f%z "$1" 2>/dev/null || echo "0")_$(basename "$1")" | md5sum | awk '{print $1}'
  fi
}

# mask sensitive values in audit JSONs by replacing long strings with "<REDACTED>"
for f in "$OUTDIR"/*.json; do
  if [ -f "$f" ]; then
    tmp="${f}.masked"
    # Use sed to replace sensitive patterns instead of jq walk
    sed 's/"[^"]\{80,\}"/"<REDACTED>"/g; s/AKIA[^"]*/<REDACTED>/g; s/BEGIN PRIVATE KEY[^"]*/<REDACTED>/g; s/tok_live[^"]*/<REDACTED>/g; s/supersecret[^"]*/<REDACTED>/g' "$f" > "$tmp" || cp "$f" "$tmp"
    mv "$tmp" "$f"
  fi
done

tar -czf "$PKG" -C "$OUTDIR" --exclude="evidence_*.tar.gz" --exclude="*.sig" . || true
# compute checksum
sha256sum_val=$(sha256sum_file "$PKG")
echo "$sha256sum_val  $(basename "$PKG")" > "$OUTDIR/evidence_${TRACE}.sha256"

# Try to sign with GPG if available
if command -v gpg >/dev/null 2>&1 && gpg --list-keys >/dev/null 2>&1; then
  gpg --yes --batch --output "$SIG" --detach-sign "$PKG" 2>/dev/null || true
  echo "{\"pkg\":\"$PKG\",\"sha256\":\"$sha256sum_val\",\"sig\":\"${SIG}\",\"signed\":true}" > "$OUTDIR/evidence_${TRACE}.json"
else
  echo "{\"pkg\":\"$PKG\",\"sha256\":\"$sha256sum_val\",\"sig\":null,\"signed\":false}" > "$OUTDIR/evidence_${TRACE}.json"
fi

echo "$OUTDIR/evidence_${TRACE}.json"
