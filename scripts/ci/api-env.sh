#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=test
export PORT=3001
export HEALTH_PATH=/health
export MOCK_EXTERNAL=1
export LOG_LEVEL=warn

set -euo pipefail
export NODE_ENV=test
export PORT=3001
export HEALTH_PATH=/health
export MOCK_EXTERNAL=1
export LOG_LEVEL=warn
#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=test
export PORT="${PORT:-3001}"
export HEALTH_PATH="${HEALTH_PATH:-/health}"
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@127.0.0.1:5432/econeura_ci}"
# Evitar llamadas externas reales en CI
export MOCK_EXTERNAL=1
export OPENAI_API_KEY="test"
export AZURE_OPENAI_API_BASE="http://127.0.0.1:9999"
export LOG_LEVEL="warn"
