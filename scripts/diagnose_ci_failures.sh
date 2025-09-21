#!/usr/bin/env bash
set -euo pipefail

# diagnose_ci_failures.sh
# Diagnoses recent CI failures using GitHub API

echo "=== DIAGNOSTICANDO FALLOS RECIENTES EN CI ==="

# Check if GITHUB_TOKEN is available
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ GITHUB_TOKEN not set. Cannot access GitHub API."
  exit 1
fi

# Get repo info from git
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL =~ github\.com[\/:]([^\/]+)\/([^\/\.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "❌ Could not parse repo from git remote"
  exit 1
fi

echo "📊 Analyzing repo: $OWNER/$REPO"

# Get recent workflow runs (last 100)
echo "🔍 Fetching recent workflow runs..."
RUNS_JSON=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=100")

# Extract failed runs
FAILED_RUNS=$(echo "$RUNS_JSON" | jq -r '.workflow_runs[] | select(.conclusion == "failure") | {name: .name, id: .id, created_at: .created_at, html_url: .html_url, head_branch: .head_branch}')

echo ""
echo "=== RECENT FAILED RUNS (last 20) ==="
echo "$FAILED_RUNS" | jq -r 'select(.name) | "🔴 \(.name) (\(.id)) - \(.created_at)"' | head -20

echo ""
echo "=== FAILURE COUNT BY WORKFLOW ==="
echo "$FAILED_RUNS" | jq -r '.name' | sort | uniq -c | sort -nr | while read count name; do
  echo "$name: $count failures"
done

echo ""
echo "=== TOTAL FAILED RUNS ==="
TOTAL_FAILED=$(echo "$FAILED_RUNS" | jq -s 'length')
echo "$TOTAL_FAILED failed runs in last 100 runs"

echo ""
echo "=== MOST RECENT FAILURE DETAILS ==="
echo "$FAILED_RUNS" | jq -r 'select(.name) | "Workflow: \(.name)\nID: \(.id)\nBranch: \(.head_branch)\nURL: \(.html_url)\nCreated: \(.created_at)\n---"' | head -20

echo ""
echo "=== DIAGNOSTIC COMPLETE ==="