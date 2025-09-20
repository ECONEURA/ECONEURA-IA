#!/usr/bin/env bash
# ECONEURA Git Utilities Module
# Functions for git-based analysis

set -euo pipefail

# Function to get commit age in hours for a file
get_commit_age_hours() {
  local file_path="$1"

  # Check if file exists in git
  if ! git ls-files "$file_path" >/dev/null 2>&1; then
    echo "0"
    return 0
  fi

  # Get the last commit date for the file
  local last_commit_date
  last_commit_date=$(git log -1 --format=%ct -- "$file_path" 2>/dev/null || echo "")

  if [ -z "$last_commit_date" ]; then
    echo "0"
    return 0
  fi

  # Calculate age in hours
  local current_time
  current_time=$(date +%s)
  local age_seconds=$((current_time - last_commit_date))
  local age_hours=$((age_seconds / 3600))

  echo "$age_hours"
}

# Function to get age modifier based on hours
get_age_modifier() {
  local age_hours="$1"
  local age_days=$((age_hours / 24))

  if [ "$age_hours" -lt 24 ]; then
    echo "hours_0_24"
  elif [ "$age_hours" -lt 168 ]; then  # 7 days
    echo "hours_24_168"
  elif [ "$age_days" -lt 30 ]; then
    echo "days_7_30"
  elif [ "$age_days" -lt 90 ]; then
    echo "days_30_90"
  else
    echo "days_90_plus"
  fi
}

# Function to check if file has been modified recently
is_recently_modified() {
  local file_path="$1"
  local threshold_hours="${2:-24}"

  local age_hours
  age_hours=$(get_commit_age_hours "$file_path")

  if [ "$age_hours" -le "$threshold_hours" ]; then
    return 0  # true
  else
    return 1  # false
  fi
}

# Function to get file modification frequency
get_modification_frequency() {
  local file_path="$1"
  local days="${2:-30}"

  # Count commits in the last N days
  local commit_count
  commit_count=$(git log --since="$days days ago" --oneline -- "$file_path" 2>/dev/null | wc -l)

  echo "$commit_count"
}

# Function to check if file is in a sensitive branch
is_sensitive_branch() {
  local current_branch
  current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")

  case "$current_branch" in
    "main"|"master"|"production"|"prod")
      return 0 ;;  # true
    *)
      return 1 ;;  # false
  esac
}

# Function to get branch sensitivity modifier
get_branch_modifier() {
  if is_sensitive_branch; then
    echo "15"  # Increase risk for sensitive branches
  else
    echo "0"
  fi
}