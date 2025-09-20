#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${1:-audit}"
# compress json older than 30 days and logs older than 7 days
find "$AUDIT_DIR" -type f -name "*.json" -mtime +30 -print0 | xargs -0 -r gzip -9
find "$AUDIT_DIR" -type f -name "*.log" -mtime +7 -print0 | xargs -0 -r xz -9
echo "Compression done in $AUDIT_DIR"
