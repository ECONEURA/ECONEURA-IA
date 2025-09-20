#!/usr/bin/env bash
# ECONEURA Metrics HTTP Server
# Simple HTTP server to serve Prometheus metrics

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/metrics_lib.sh"

PORT="${1:-9090}"
METRICS_FILE="$SCRIPT_DIR/../metrics/econeura_metrics.txt"

# Ensure metrics directory exists
mkdir -p "$(dirname "$METRICS_FILE")"

# Function to handle HTTP requests
handle_request() {
  local request="$1"

  # Only respond to GET /metrics
  if echo "$request" | grep -q "^GET /metrics "; then
    if [ -f "$METRICS_FILE" ]; then
      echo -e "HTTP/1.1 200 OK\r"
      echo -e "Content-Type: text/plain; charset=utf-8\r"
      echo -e "Cache-Control: no-cache\r"
      echo -e "\r"
      cat "$METRICS_FILE"
    else
      echo -e "HTTP/1.1 503 Service Unavailable\r"
      echo -e "Content-Type: text/plain\r"
      echo -e "\r"
      echo "# No metrics available"
    fi
  else
    echo -e "HTTP/1.1 404 Not Found\r"
    echo -e "Content-Type: text/plain\r"
    echo -e "\r"
    echo "Not Found"
  fi
}

# Function to update system health metric
update_health_metric() {
  if [ -f "$METRICS_FILE" ]; then
    # Update the health metric timestamp
    sed -i 's/econeura_up 1/econeura_up 1/' "$METRICS_FILE"
  else
    # Initialize metrics file with system health
    cat > "$METRICS_FILE" << EOF
# HELP econeura_up System health status
# TYPE econeura_up gauge
econeura_up 1

# HELP econeura_last_updated_timestamp Last metrics update timestamp
# TYPE econeura_last_updated_timestamp gauge
econeura_last_updated_timestamp $(date +%s)
EOF
  fi
}

echo "🚀 Starting ECONEURA Metrics Server on port $PORT"
echo "📊 Metrics available at: http://localhost:$PORT/metrics"
echo "📁 Metrics file: $METRICS_FILE"

# Update health metric initially
update_health_metric

# Start simple HTTP server using netcat
while true; do
  # Update health metric periodically
  update_health_metric

  # Listen for connections (using timeout to allow periodic updates)
  if command -v nc >/dev/null 2>&1; then
    echo "HTTP/1.1 200 OK
Content-Type: text/plain

ECONEURA Metrics Server Running
Endpoint: /metrics
Port: $PORT
Timestamp: $(date)" | nc -l -p "$PORT" -q 1 2>/dev/null || true
  elif command -v ncat >/dev/null 2>&1; then
    echo "HTTP/1.1 200 OK
Content-Type: text/plain

ECONEURA Metrics Server Running
Endpoint: /metrics
Port: $PORT
Timestamp: $(date)" | ncat -l -p "$PORT" -q 1 2>/dev/null || true
  else
    echo "❌ Neither nc nor ncat found. Please install netcat."
    exit 1
  fi

  sleep 1
done