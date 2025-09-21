#!/usr/bin/env bash
set -euo pipefail

# Lightweight heuristic fixer for workflow YAML files.
# It looks for lines starting with '  run:' and if the following command matches
# deploy keywords, it replaces the block with a guarded block that checks DEPLOY_ENABLED.

WF="$1"
TMP="${WF}.tmp"
KEYWORDS="kubectl|helm|gcloud|aws s3|aws ecr|docker push|buildx|terraform apply|deploy"

awk -v kw="$KEYWORDS" '
BEGIN{ins=0}
{
  if($0 ~ /^[[:space:]]*run:[[:space:]]*\|?-?/){
    # print the run: line
    print $0
    getline cmd
    # trim leading spaces
    gsub(/^\s+/, "", cmd)
    if(tolower(cmd) ~ kw){
      print "      |"
      print "        if [ \"${DEPLOY_ENABLED:-false}\" != \"true\" ]; then"
      print "          echo \"Skipping deploy step: DEPLOY_ENABLED != true\""
      print "          exit 0"
      print "        fi"
      print ""
    }
    print cmd
  } else {
    print $0
  }
}
' "$WF" > "$TMP" && mv "$TMP" "$WF"

echo "Shim applied to $WF"
