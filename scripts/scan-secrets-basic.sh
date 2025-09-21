#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="$(pwd)/audit"
mkdir -p "$OUT_DIR"
TRACE="$1"
OUT_TXT="$OUT_DIR/scan_results_${TRACE}.txt"
LOG="$OUT_DIR/scan_log_${TRACE}.txt"

echo "=== ECONEURA Security Scan Report ===" > "$OUT_TXT"
echo "Timestamp: $(date --iso-8601=seconds)" >> "$OUT_TXT"
echo "Trace ID: $TRACE" >> "$OUT_TXT"
echo "" >> "$OUT_TXT"

echo "Starting basic security scan..." > "$LOG"
echo "Timestamp: $(date --iso-8601=seconds)" >> "$LOG"
echo "Trace ID: $TRACE" >> "$LOG"
echo "" >> "$LOG"

# Check for common patterns
echo "🔍 Scanning for common security patterns..." >> "$LOG"

# Search for passwords
echo "Searching for password patterns..." >> "$LOG"
PASSWORD_MATCHES=$(git grep -n -i "password\|passwd\|pwd" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | wc -l)
echo "Found $PASSWORD_MATCHES potential password references" >> "$OUT_TXT"
echo "Found $PASSWORD_MATCHES potential password references" >> "$LOG"

# Search for API keys
echo "Searching for API key patterns..." >> "$LOG"
API_MATCHES=$(git grep -n -i "api[_-]?key\|apikey" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | wc -l)
echo "Found $API_MATCHES potential API key references" >> "$OUT_TXT"
echo "Found $API_MATCHES potential API key references" >> "$LOG"

# Search for tokens
echo "Searching for token patterns..." >> "$LOG"
TOKEN_MATCHES=$(git grep -n -i "token\|bearer\|jwt" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | wc -l)
echo "Found $TOKEN_MATCHES potential token references" >> "$OUT_TXT"
echo "Found $TOKEN_MATCHES potential token references" >> "$LOG"

# Search for secrets
echo "Searching for secret patterns..." >> "$LOG"
SECRET_MATCHES=$(git grep -n -i "secret\|private[_-]?key" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | wc -l)
echo "Found $SECRET_MATCHES potential secret references" >> "$OUT_TXT"
echo "Found $SECRET_MATCHES potential secret references" >> "$LOG"

# Search for keys
echo "Searching for key patterns..." >> "$LOG"
KEY_MATCHES=$(git grep -n -i "key\|-----BEGIN" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | wc -l)
echo "Found $KEY_MATCHES potential key references" >> "$OUT_TXT"
echo "Found $KEY_MATCHES potential key references" >> "$LOG"

TOTAL_MATCHES=$((PASSWORD_MATCHES + API_MATCHES + TOKEN_MATCHES + SECRET_MATCHES + KEY_MATCHES))

echo "" >> "$OUT_TXT"
echo "=== SUMMARY ===" >> "$OUT_TXT"
echo "Total potential security-sensitive references found: $TOTAL_MATCHES" >> "$OUT_TXT"
echo "" >> "$OUT_TXT"
echo "Note: This is a basic scan. For comprehensive analysis," >> "$OUT_TXT"
echo "consider installing trufflehog and gitleaks tools." >> "$OUT_TXT"
echo "" >> "$OUT_TXT"
echo "Scan completed successfully at $(date --iso-8601=seconds)" >> "$OUT_TXT"

echo "Scan completed. Total matches: $TOTAL_MATCHES" >> "$LOG"
echo "Results saved to: $OUT_TXT" >> "$LOG"

echo "✅ Basic security scan completed!"
echo "📊 Found $TOTAL_MATCHES potential security-sensitive references"
echo "📄 Results saved to: $OUT_TXT"
echo "📋 Log saved to: $LOG"
