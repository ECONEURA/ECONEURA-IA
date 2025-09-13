# GitHub Actions Auto-Heal System

This document describes the auto-healing mechanism implemented for GitHub Actions in the ECONEURA-IA repository.

## Overview

The auto-heal system consists of two components:

1. **Auto-Heal Workflow** (`.github/workflows/auto-heal.yml`) - Automatically retries failed workflows and creates issues for persistent failures
2. **Retry Composite Action** (`.github/actions/retry/action.yml`) - Reusable action for step-level retries

## Auto-Heal Workflow

### Triggers
- Runs on `workflow_run` completion events
- Only processes workflows that have failed (`conclusion == 'failure'`)
- Skips its own runs to prevent infinite recursion

### Behavior

#### First Failure (run_attempt == 1)
- Automatically re-runs the failed workflow once
- Uses GitHub API to trigger the re-run
- Requires `actions: write` permission

#### Second Failure (run_attempt >= 2)  
- Creates a GitHub issue with failure details
- Includes workflow name, run URL, branch, and commit information
- Tries to add `['ci', 'failed']` labels, falls back gracefully if labels don't exist
- Requires `issues: write` permission

### Example Issue Created
```
Title: CI failed twice: Build and Test #123

Workflow: Build and Test
Run URL: https://github.com/ECONEURA/ECONEURA-IA/actions/runs/123456789
Event: push
Branch: main
Commit: abc123def456

Este issue se abrió automáticamente tras dos fallos consecutivos.
```

## Retry Composite Action

### Usage

```yaml
- name: Install dependencies with retry
  uses: ./.github/actions/retry
  with:
    command: pnpm install --frozen-lockfile
    max_attempts: 3      # default: 3
    backoff_seconds: 15  # default: 10
```

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `command` | Yes | - | Shell command to execute |
| `max_attempts` | No | `3` | Maximum number of retry attempts |
| `backoff_seconds` | No | `10` | Seconds to wait between retries |

### Behavior

1. Executes the command using `bash -lc`
2. If successful, exits immediately
3. If failed, waits `backoff_seconds` and retries
4. After `max_attempts` failures, exits with code 1
5. Provides detailed logging for each attempt

## Common Use Cases

### Package Installation
```yaml
- name: Install Node.js dependencies
  uses: ./.github/actions/retry
  with:
    command: pnpm install --frozen-lockfile
    max_attempts: 5
    backoff_seconds: 30
```

### Database Operations
```yaml
- name: Run database migrations
  uses: ./.github/actions/retry
  with:
    command: pnpm db:migrate
    max_attempts: 3
    backoff_seconds: 20
```

### Test Execution
```yaml
- name: Run integration tests
  uses: ./.github/actions/retry
  with:
    command: pnpm test:integration
    max_attempts: 3
    backoff_seconds: 15
```

### API Calls
```yaml
- name: Health check API
  uses: ./.github/actions/retry
  with:
    command: curl -f https://api.example.com/health
    max_attempts: 5
    backoff_seconds: 10
```

## Security Considerations

- Uses `GITHUB_TOKEN` with minimal required permissions
- No secrets are logged in retry attempts
- Issue creation handles missing labels gracefully
- Commands are executed in isolated shell environments

## Monitoring

- Auto-heal events are visible in the Actions tab
- Created issues provide audit trail of persistent failures
- Retry attempts are logged with timestamps and attempt numbers

## Limitations

- Only retries entire workflows on failure, not individual jobs
- Cannot retry workflows that fail due to authentication or permission issues
- Issue creation requires the `ci` and `failed` labels to exist (falls back gracefully)
- Maximum of one automatic retry per workflow run