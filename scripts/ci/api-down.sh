#!/usr/bin/env bash
set -euo pipefail
pkill -f "apps/api" || true
