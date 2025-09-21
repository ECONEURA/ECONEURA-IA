#!/usr/bin/env python3
"""Auto-fix workflow YAML files by inserting step-level DEPLOY_ENABLED guards

This script uses ruamel.yaml to preserve formatting. It looks for steps that
contain a `run` command including deploy-related keywords and prepends a
shell guard that skips the command unless DEPLOY_ENABLED is set to 'true'.

Usage: python3 scripts/auto_fix_workflows.py <workflow-file>
"""
import sys
import re
from pathlib import Path

try:
    from ruamel.yaml import YAML
except Exception:
    print("ERROR: ruamel.yaml not installed. Run `pip install ruamel.yaml`.")
    sys.exit(2)

DEPLOY_KEYWORDS = re.compile(r"\b(kubectl|helm|gcloud|aws\s+(s3|ecr)|docker\s+push|buildx|terraform|apply|deploy)\b", re.I)

def guard_text(original: str) -> str:
    guard = (
        'if [ "${DEPLOY_ENABLED:-false}" != "true" ]; then\n'
        '  echo "Skipping deploy step: DEPLOY_ENABLED != true"\n'
        '  exit 0\n'
        'fi\n'
    )
    # Ensure original is properly indented in block style; ruamel will handle block style
    return guard + original

def process_file(path: Path) -> int:
    yaml = YAML()
    yaml.preserve_quotes = True
    data = None
    with path.open('r', encoding='utf-8') as f:
        data = yaml.load(f)

    if not data or 'jobs' not in data:
        return 0

    changed = 0
    for job_name, job in (data.get('jobs') or {}).items():
        steps = job.get('steps') or []
        for step in steps:
            if not isinstance(step, dict):
                continue
            run_val = step.get('run')
            if not run_val:
                continue
            # check for deploy keywords
            if DEPLOY_KEYWORDS.search(str(run_val)):
                # avoid double-guarding
                if isinstance(run_val, str) and 'Skipping deploy step: DEPLOY_ENABLED' in run_val:
                    continue
                new_run = guard_text(str(run_val))
                step['run'] = new_run
                changed += 1

    if changed > 0:
        # write back
        with path.open('w', encoding='utf-8') as f:
            yaml.dump(data, f)
        print(f"Patched {path}: inserted guards in {changed} step(s)")
    else:
        print(f"No deploy-related steps found in {path}")

    return changed

def main(argv):
    if len(argv) < 2:
        print("Usage: ./scripts/auto_fix_workflows.py <workflow-file> [<workflow-file> ...]")
        return 1
    total = 0
    for p in argv[1:]:
        pth = Path(p)
        if not pth.exists():
            print(f"File not found: {p}")
            continue
        total += process_file(pth)
    print(f"Total steps patched: {total}")
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv))
