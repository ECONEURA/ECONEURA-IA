#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.."; pwd)"
TRACE="$1"
BRANCH="econeura/audit/${TRACE}"
MANIFEST="${BASE}/audit/complete_${TRACE}.json"
# ensure git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "{\"error\":\"not_git_repo\",\"trace\":\"$TRACE\"}" > "${BASE}/audit/errors_${TRACE}.json"
  echo "Not in git repo. Artifacts left local in audit/." && exit 0
fi
# create branch and commit artifacts
git checkout -B "$BRANCH"
git add audit/*.json || true
git commit -m "econeura: audit artifacts ${TRACE}" || true
git tag -f "econeura-audit-${TRACE}" || true
# only push if allowed
if [ "${GIT_PUSH_ALLOWED:-false}" = "true" ]; then
  git push --set-upstream origin "$BRANCH" || true
  git push --force origin "econeura-audit-${TRACE}" || true
  echo "{\"status\":\"pushed\",\"branch\":\"$BRANCH\",\"tag\":\"econeura-audit-${TRACE}\"}" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
else
  echo "{\"status\":\"local_only\",\"branch\":\"$BRANCH\",\"tag\":\"econeura-audit-${TRACE}\"}" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"
fi
echo "$MANIFEST"
