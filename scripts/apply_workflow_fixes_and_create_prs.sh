#!/usr/bin/env bash
set -euo pipefail

REPO_OWNER="ECONEURA"
REPO_NAME="ECONEURA-IA"
BASE_REF="main"
TMP_BRANCH_PREFIX="fix/no-deploy-auto"

WORKFLOWS_DIR=".github/workflows"

if [ ! -d "$WORKFLOWS_DIR" ]; then
  echo "No workflows directory found: $WORKFLOWS_DIR"
  exit 1
fi

for wf in $WORKFLOWS_DIR/*.yml $WORKFLOWS_DIR/*.yaml; do
  [ -f "$wf" ] || continue
  echo "Processing $wf"
  # Copy to temp file to detect changes
  cp "$wf" "$wf.bak"
  # Try the robust Python fixer first; if ruamel isn't available, fall back to the shim
  if python3 scripts/auto_fix_workflows.py "$wf" >/dev/null 2>&1; then
    echo "Applied Python auto-fixer to $wf"
  else
    echo "Python auto-fixer unavailable or failed; using shim for $wf"
    ./scripts/auto_fix_workflows_shim.sh "$wf" || true
  fi
  if ! cmp -s "$wf" "$wf.bak"; then
  branch_name="$TMP_BRANCH_PREFIX-$(basename "$wf" | sed 's/[^a-zA-Z0-9]/-/g')-$(date +%s)"
  # Ensure git user config in CI
  git config user.email "actions@econeura.local" || true
  git config user.name "Econeura CI AutoFix" || true
  git checkout -b "$branch_name" "$BASE_REF"
    git add "$wf"
    git commit -m "chore(ci): add DEPLOY_ENABLED guards to $(basename "$wf") [auto-fix]" || true
    git push --set-upstream origin "$branch_name"

    # create PR: prefer gh CLI if available
    if command -v gh >/dev/null 2>&1; then
      gh pr create --title "chore(ci): add NO_DEPLOY guards to $(basename "$wf")" \
        --body "Automatic insertion of DEPLOY_ENABLED guards on deploy-like steps." \
        --base "$BASE_REF" --head "$branch_name"
    else
      # fallback to GitHub REST API using GITHUB_TOKEN
      if [ -z "${GITHUB_TOKEN:-}" ]; then
        echo "GITHUB_TOKEN not set; PR created branch pushed but cannot create PR programmatically. Open a PR manually:"
        echo "https://github.com/$REPO_OWNER/$REPO_NAME/compare/$BASE_REF...$branch_name?expand=1"
      else
        api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls"
        payload=$(jq -n --arg t "chore(ci): add NO_DEPLOY guards to $(basename "$wf")" \
          --arg b "$BASE_REF" --arg h "$branch_name" --arg bd "Automatic insertion of DEPLOY_ENABLED guards on deploy-like steps." \
          '{title: $t, head: $h, base: $b, body: $bd}')
        curl -sS -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
          -d "$payload" "$api_url" || true
      fi
    fi
  else
    echo "No changes for $wf"
  fi
  rm -f "$wf.bak"
done

echo "Done."
