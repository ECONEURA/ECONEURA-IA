#!/usr/bin/env bash
# ECONEURA Metrics Collection Library
# Prometheus-compatible metrics emission

set -euo pipefail

METRICS_FILE="/tmp/econeura_metrics.prom"

# Function to initialize metrics file
init_metrics() {
  cat > "$METRICS_FILE" << 'EOF'
# HELP econeura_findings_total Total number of security findings
# TYPE econeura_findings_total counter
econeura_findings_total{tool="trufflehog"} 0
econeura_findings_total{tool="gitleaks"} 0
econeura_findings_total{tool="semgrep"} 0

# HELP econeura_findings_high High-risk security findings
# TYPE econeura_findings_high gauge
econeura_findings_high 0

# HELP econeura_findings_medium Medium-risk security findings
# TYPE econeura_findings_medium gauge
econeura_findings_medium 0

# HELP econeura_findings_low Low-risk security findings
# TYPE econeura_findings_low gauge
econeura_findings_low 0

# HELP econeura_mitigations_executed Total number of mitigations executed
# TYPE econeura_mitigations_executed counter
econeura_mitigations_executed 0

# HELP econeura_mitigations_blocked Total number of mitigations blocked
# TYPE econeura_mitigations_blocked counter
econeura_mitigations_blocked 0

# HELP econeura_approvals_validated Total number of approvals validated
# TYPE econeura_approvals_validated counter
econeura_approvals_validated 0

# HELP econeura_approvals_rejected Total number of approvals rejected
# TYPE econeura_approvals_rejected counter
econeura_approvals_rejected 0

# HELP econeura_scan_duration_seconds Scan duration in seconds
# TYPE econeura_scan_duration_seconds histogram
econeura_scan_duration_seconds_bucket{le="10"} 0
econeura_scan_duration_seconds_bucket{le="30"} 0
econeura_scan_duration_seconds_bucket{le="60"} 0
econeura_scan_duration_seconds_bucket{le="300"} 0
econeura_scan_duration_seconds_bucket{le="+Inf"} 0
econeura_scan_duration_seconds_count 0
econeura_scan_duration_seconds_sum 0

# HELP econeura_mttr_seconds Mean Time To Resolution in seconds
# TYPE econeura_mttr_seconds histogram
econeura_mttr_seconds_bucket{le="3600"} 0
econeura_mttr_seconds_bucket{le="86400"} 0
econeura_mttr_seconds_bucket{le="604800"} 0
econeura_mttr_seconds_bucket{le="+Inf"} 0
econeura_mttr_seconds_count 0
econeura_mttr_seconds_sum 0

# HELP econeura_up Service health status
# TYPE econeura_up gauge
econeura_up 1
EOF
}

# Function to increment a counter metric
increment_counter() {
  local metric_name="$1"
  local labels="${2:-}"

  if [ ! -f "$METRICS_FILE" ]; then
    init_metrics
  fi

  # Find and increment the metric
  local temp_file
  temp_file=$(mktemp)

  awk -v metric="$metric_name" -v labels="$labels" '
  $0 ~ metric && (!labels || $0 ~ labels) && $0 !~ /_count|_sum|_bucket/ {
    # Extract current value
    match($0, /([0-9]+)$/, arr)
    if (arr[1]) {
      new_value = arr[1] + 1
      sub(/[0-9]+$/, new_value)
    }
  }
  { print }
  ' "$METRICS_FILE" > "$temp_file"

  mv "$temp_file" "$METRICS_FILE"
}

# Function to set a gauge metric
set_gauge() {
  local metric_name="$1"
  local value="$2"
  local labels="${3:-}"

  if [ ! -f "$METRICS_FILE" ]; then
    init_metrics
  fi

  # Find and update the metric
  local temp_file
  temp_file=$(mktemp)

  awk -v metric="$metric_name" -v new_value="$value" -v labels="$labels" '
  $0 ~ metric && (!labels || $0 ~ labels) && $0 !~ /_count|_sum|_bucket/ {
    # Replace the value
    sub(/[0-9]+$/, new_value)
  }
  { print }
  ' "$METRICS_FILE" > "$temp_file"

  mv "$temp_file" "$METRICS_FILE"
}

# Function to observe histogram
observe_histogram() {
  local metric_name="$1"
  local value="$2"

  if [ ! -f "$METRICS_FILE" ]; then
    init_metrics
  fi

  local temp_file
  temp_file=$(mktemp)

  awk -v metric="$metric_name" -v obs_value="$value" '
  BEGIN { sum_updated = 0; count_updated = 0 }
  $0 ~ metric"_sum" {
    match($0, /([0-9]+)$/, arr)
    if (arr[1]) {
      new_sum = arr[1] + obs_value
      sub(/[0-9]+$/, new_sum)
      sum_updated = 1
    }
  }
  $0 ~ metric"_count" {
    match($0, /([0-9]+)$/, arr)
    if (arr[1]) {
      new_count = arr[1] + 1
      sub(/[0-9]+$/, new_count)
      count_updated = 1
    }
  }
  $0 ~ metric"_bucket" {
    match($0, /le="([^"]+)"/, le_arr)
    if (le_arr[1]) {
      le_value = le_arr[1]
      if (le_value == "+Inf" || obs_value <= le_value) {
        match($0, /([0-9]+)$/, arr)
        if (arr[1]) {
          new_bucket = arr[1] + 1
          sub(/[0-9]+$/, new_bucket)
        }
      }
    }
  }
  { print }
  END {
    if (!sum_updated) print metric"_sum " obs_value
    if (!count_updated) print metric"_count 1"
  }
  ' "$METRICS_FILE" > "$temp_file"

  mv "$temp_file" "$METRICS_FILE"
}

# Function to record scan metrics
record_scan_metrics() {
  local tool="$1"
  local findings_count="$2"
  local duration_seconds="$3"

  increment_counter "econeura_findings_total" "tool=\"$tool\""
  observe_histogram "econeura_scan_duration_seconds" "$duration_seconds"

  echo "📊 Recorded scan metrics: $tool=$findings_count findings, ${duration_seconds}s duration"
}

# Function to record classification metrics
record_classification_metrics() {
  local high_risk="$1"
  local medium_risk="$2"
  local low_risk="$3"

  set_gauge "econeura_findings_high" "$high_risk"
  set_gauge "econeura_findings_medium" "$medium_risk"
  set_gauge "econeura_findings_low" "$low_risk"

  echo "📊 Recorded classification metrics: H=$high_risk, M=$medium_risk, L=$low_risk"
}

# Function to record mitigation metrics
record_mitigation_metrics() {
  local status="$1"  # executed or blocked
  local mttr_seconds="${2:-0}"

  case "$status" in
    "executed")
      increment_counter "econeura_mitigations_executed"
      ;;
    "blocked")
      increment_counter "econeura_mitigations_blocked"
      ;;
  esac

  if [ "$mttr_seconds" -gt 0 ]; then
    observe_histogram "econeura_mttr_seconds" "$mttr_seconds"
  fi

  echo "📊 Recorded mitigation metrics: status=$status, MTTR=${mttr_seconds}s"
}

# Function to record approval metrics
record_approval_metrics() {
  local status="$1"  # validated or rejected

  case "$status" in
    "validated")
      increment_counter "econeura_approvals_validated"
      ;;
    "rejected")
      increment_counter "econeura_approvals_rejected"
      ;;
  esac

  echo "📊 Recorded approval metrics: status=$status"
}

# Function to get current metrics summary
get_metrics_summary() {
  if [ ! -f "$METRICS_FILE" ]; then
    init_metrics
  fi

  echo "=== ECONEURA Metrics Summary ==="
  grep -E "^econeura_(findings_total|findings_high|mitigations_executed|approvals_validated)" "$METRICS_FILE" || echo "No metrics available"
}

# Initialize metrics if this script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  init_metrics
  echo "Metrics initialized at: $METRICS_FILE"
fi