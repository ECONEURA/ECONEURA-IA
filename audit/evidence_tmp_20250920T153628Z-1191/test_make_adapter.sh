#!/usr/bin/env bash
set -euo pipefail
python3 - <<PY
import requests, json
print("Make adapter test placeholder - ensure services/make_adapter running")
PY
