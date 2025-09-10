#!/usr/bin/env bash
# Performance metrics collection for DEV verification

# Global metrics storage
declare -A METRICS
declare -A TIMINGS

# Start timing a metric
start_timing() {
    local metric_name="$1"
    TIMINGS["${metric_name}_start"]=$(date +%s.%N)
}

# End timing a metric
end_timing() {
    local metric_name="$1"
    local start_time="${TIMINGS[${metric_name}_start]}"
    if [ -n "$start_time" ]; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        METRICS["${metric_name}_duration"]="$duration"
        echo "$duration"
    fi
}

# Record a metric value
record_metric() {
    local metric_name="$1"
    local value="$2"
    local unit="${3:-count}"
    METRICS["${metric_name}_${unit}"]="$value"
}

# Get system metrics
get_system_metrics() {
    # CPU usage (simplified)
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    record_metric "system_cpu_usage" "$cpu_usage" "percent"
    
    # Memory usage
    local memory_info=$(vm_stat | grep -E "(Pages free|Pages active|Pages inactive|Pages speculative|Pages wired down)")
    local pages_free=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local pages_active=$(echo "$memory_info" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    local page_size=4096
    local total_memory=$(( (pages_free + pages_active) * page_size / 1024 / 1024 ))
    record_metric "system_memory_mb" "$total_memory" "mb"
    
    # Disk space
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    record_metric "system_disk_usage" "$disk_usage" "percent"
}

# Get network metrics
get_network_metrics() {
    local url="$1"
    local metric_prefix="$2"
    
    # DNS resolution time
    start_timing "${metric_prefix}_dns"
    nslookup "$(echo "$url" | sed 's|https\?://||' | cut -d'/' -f1)" >/dev/null 2>&1
    local dns_time=$(end_timing "${metric_prefix}_dns")
    record_metric "${metric_prefix}_dns_time" "$dns_time" "seconds"
    
    # Connection time
    start_timing "${metric_prefix}_connect"
    curl -s -o /dev/null -w "%{time_connect}" --max-time 10 "$url" >/dev/null 2>&1 || echo "0"
    local connect_time=$(end_timing "${metric_prefix}_connect")
    record_metric "${metric_prefix}_connect_time" "$connect_time" "seconds"
    
    # Total request time
    start_timing "${metric_prefix}_total"
    curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url" >/dev/null 2>&1 || echo "0"
    local total_time=$(end_timing "${metric_prefix}_total")
    record_metric "${metric_prefix}_total_time" "$total_time" "seconds"
}

# Generate performance report
generate_performance_report() {
    local output_file="$1"
    
    cat > "$output_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "system_metrics": {
    "cpu_usage_percent": ${METRICS[system_cpu_usage_percent]:-0},
    "memory_mb": ${METRICS[system_memory_mb_mb]:-0},
    "disk_usage_percent": ${METRICS[system_disk_usage_percent]:-0}
  },
  "network_metrics": {
    "api_dns_time_seconds": ${METRICS[api_dns_time_seconds]:-0},
    "api_connect_time_seconds": ${METRICS[api_connect_time_seconds]:-0},
    "api_total_time_seconds": ${METRICS[api_total_time_seconds]:-0},
    "web_dns_time_seconds": ${METRICS[web_dns_time_seconds]:-0},
    "web_connect_time_seconds": ${METRICS[web_connect_time_seconds]:-0},
    "web_total_time_seconds": ${METRICS[web_total_time_seconds]:-0}
  },
  "verification_metrics": {
    "health_check_duration_seconds": ${METRICS[health_check_duration_seconds]:-0},
    "openapi_check_duration_seconds": ${METRICS[openapi_check_duration_seconds]:-0},
    "cors_check_duration_seconds": ${METRICS[cors_check_duration_seconds]:-0},
    "security_headers_duration_seconds": ${METRICS[security_headers_duration_seconds]:-0},
    "finops_check_duration_seconds": ${METRICS[finops_check_duration_seconds]:-0},
    "websocket_check_duration_seconds": ${METRICS[websocket_check_duration_seconds]:-0},
    "total_verification_duration_seconds": ${METRICS[total_verification_duration_seconds]:-0}
  },
  "performance_analysis": {
    "slowest_check": "$(get_slowest_check)",
    "fastest_check": "$(get_fastest_check)",
    "average_check_time": "$(get_average_check_time)",
    "performance_grade": "$(get_performance_grade)"
  }
}
EOF
}

# Helper functions for performance analysis
get_slowest_check() {
    local slowest=""
    local max_time=0
    
    for key in "${!METRICS[@]}"; do
        if [[ "$key" =~ _duration_seconds$ ]]; then
            local time="${METRICS[$key]}"
            if (( $(echo "$time > $max_time" | bc -l) )); then
                max_time="$time"
                slowest="${key%_duration_seconds}"
            fi
        fi
    done
    
    echo "${slowest:-unknown}"
}

get_fastest_check() {
    local fastest=""
    local min_time=999999
    
    for key in "${!METRICS[@]}"; do
        if [[ "$key" =~ _duration_seconds$ ]]; then
            local time="${METRICS[$key]}"
            if (( $(echo "$time < $min_time" | bc -l) )); then
                min_time="$time"
                fastest="${key%_duration_seconds}"
            fi
        fi
    done
    
    echo "${fastest:-unknown}"
}

get_average_check_time() {
    local total=0
    local count=0
    
    for key in "${!METRICS[@]}"; do
        if [[ "$key" =~ _duration_seconds$ ]]; then
            total=$(echo "$total + ${METRICS[$key]}" | bc -l)
            count=$((count + 1))
        fi
    done
    
    if [ $count -gt 0 ]; then
        echo "scale=3; $total / $count" | bc -l
    else
        echo "0"
    fi
}

get_performance_grade() {
    local total_time="${METRICS[total_verification_duration_seconds]:-0}"
    
    if (( $(echo "$total_time < 10" | bc -l) )); then
        echo "A"
    elif (( $(echo "$total_time < 20" | bc -l) )); then
        echo "B"
    elif (( $(echo "$total_time < 30" | bc -l) )); then
        echo "C"
    else
        echo "D"
    fi
}

# Export functions
export -f start_timing
export -f end_timing
export -f record_metric
export -f get_system_metrics
export -f get_network_metrics
export -f generate_performance_report
