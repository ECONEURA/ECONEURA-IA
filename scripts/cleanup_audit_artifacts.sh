#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${1:-audit}"
# keep last 10 approval files
ls -1t "$AUDIT_DIR"/approval_*.json 2>/dev/null | tail -n +11 | xargs -r rm -f
# remove tmp prefixed files older than 1 day
find /tmp -type f -name "econeura_*" -mtime +1 -delete || true
echo "Cleanup done"
