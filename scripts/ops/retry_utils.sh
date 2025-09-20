#!/usr/bin/env bash
# Retry utilities for robust verification scripts

# Exponential backoff retry function
retry_with_backoff() {
    local max_attempts="$1"
    local base_delay="$2"
    local max_delay="$3"
    local command="$4"
    local description="$5"
    
    local attempt=1
    local delay="$base_delay"
    
    while [ $attempt -le $max_attempts ]; do
        log "Attempt $attempt/$max_attempts: $description"
        
        if eval "$command"; then
            log "✅ $description succeeded on attempt $attempt"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            log "⚠️ $description failed, retrying in ${delay}s..."
            sleep "$delay"
            
            # Exponential backoff with jitter
            delay=$((delay * 2))
            if [ $delay -gt $max_delay ]; then
                delay=$max_delay
            fi
            
            # Add jitter (±25%)
            local jitter=$((RANDOM % (delay / 2) - delay / 4))
            delay=$((delay + jitter))
            if [ $delay -lt 1 ]; then
                delay=1
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log "❌ $description failed after $max_attempts attempts"
    return 1
}

# Circuit breaker pattern
circuit_breaker() {
    local failure_threshold="$1"
    local recovery_timeout="$2"
    local command="$3"
    local description="$4"
    
    local state_file="/tmp/circuit_breaker_$(echo "$description" | tr ' ' '_')"
    local current_time=$(date +%s)
    
    # Check circuit state
    if [ -f "$state_file" ]; then
        local last_failure_time
        local failure_count
        read -r last_failure_time failure_count < "$state_file"
        
        if [ $((current_time - last_failure_time)) -lt $recovery_timeout ]; then
            if [ $failure_count -ge $failure_threshold ]; then
                log "🔴 Circuit breaker OPEN for $description (failures: $failure_count)"
                return 1
            fi
        else
            # Reset circuit after timeout
            rm -f "$state_file"
            log "🟢 Circuit breaker RESET for $description"
        fi
    fi
    
    # Execute command
    if eval "$command"; then
        # Success - reset circuit
        rm -f "$state_file"
        log "✅ $description succeeded"
        return 0
    else
        # Failure - update circuit state
        local new_count=1
        if [ -f "$state_file" ]; then
            read -r _ new_count < "$state_file"
            new_count=$((new_count + 1))
        fi
        echo "$current_time $new_count" > "$state_file"
        log "❌ $description failed (failures: $new_count/$failure_threshold)"
        return 1
    fi
}

# Health check with retry
health_check_with_retry() {
    local url="$1"
    local max_attempts="${2:-3}"
    local base_delay="${3:-2}"
    
    retry_with_backoff "$max_attempts" "$base_delay" 30 \
        "curl -s -o /dev/null -w '%{http_code}' --max-time 10 '$url' | grep -q '200'" \
        "Health check for $url"
}

# API call with retry and circuit breaker
api_call_with_resilience() {
    local url="$1"
    local output_file="$2"
    local description="$3"
    
    circuit_breaker 3 60 \
        "curl -sS --max-time 10 --retry 2 --retry-all-errors -D - '$url' -o '$output_file'" \
        "$description"
}

# WebSocket probe with retry
ws_probe_with_retry() {
    local api_url="$1"
    local web_url="$2"
    local max_attempts="${3:-2}"
    
    retry_with_backoff "$max_attempts" 3 15 \
        "node scripts/ops/ws_probe.mjs '$api_url' '$web_url'" \
        "WebSocket probe"
}

# Export functions for use in other scripts
export -f retry_with_backoff
export -f circuit_breaker
export -f health_check_with_retry
export -f api_call_with_resilience
export -f ws_probe_with_retry
