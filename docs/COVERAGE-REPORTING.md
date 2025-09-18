# 📊 Consolidated Test Coverage Reporting

This document describes the consolidated test coverage reporting system implemented in the CI/CD pipeline.

## Overview

The system aggregates coverage from multiple sources (unit tests, workers tests) and provides a unified coverage report in the GitHub Actions workflow run summary.

## Architecture

### Coverage Sources

1. **Unit Tests** (`ci.yml` → `unit-tests` job)
   - Runs unit tests across all packages
   - Generates `coverage/lcov.info` using Vitest
   - Uploads as `unit-coverage` artifact

2. **Workers Tests** (`workers-ci.yml` → `test` job)  
   - Runs workers-specific tests
   - Generates `apps/workers/coverage/lcov.info` using Vitest
   - Uploads as `workers-coverage` artifact
   - Also uploads to Codecov for external reporting

### Coverage Aggregation

The `coverage-summary` job in `ci.yml`:
- Downloads all artifacts with names ending in `coverage`
- Merges LCOV files by concatenating and deduplicating
- Calculates total lines, covered lines, and percentage
- Generates markdown summary in GitHub Actions run summary
- Uploads merged coverage as `merged-coverage` artifact

## Configuration Changes

### Vitest Configuration Updates

Added `lcov` reporter to all `vitest.config.ts` files:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'], // Added 'lcov'
  // ... rest of config
}
```

### CI Workflow Updates

#### ci.yml Changes

1. **Unit Tests Job** - Updated artifact upload:
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: unit-coverage
    path: coverage/lcov.info  # Explicit path to lcov file
```

2. **Added Coverage Summary Job**:
```yaml
coverage-summary:
  name: Coverage Summary
  runs-on: ubuntu-latest
  needs: [unit-tests]
  if: always()
  # Downloads artifacts, merges coverage, generates summary
```

3. **Updated Pipeline Summary Dependencies**:
```yaml
needs: [build-lint, unit-tests, api-tests, k6-tests, security-scan, metrics-progress, coverage-summary]
```

#### workers-ci.yml Changes

1. **Added Coverage Artifact Upload**:
```yaml
- name: Upload coverage artifact
  uses: actions/upload-artifact@v4
  with:
    name: workers-coverage
    path: apps/workers/coverage/lcov.info
```

2. **Upgraded Codecov Action**:
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4  # Upgraded from v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}  # Added token support
    # ... rest of config
```

## Coverage Merging Logic

The system uses a simple but effective approach:

1. **Discovery**: Find all `lcov.info` files in downloaded artifacts
2. **Deduplication**: Remove `TN:` lines and `end_of_record` from individual files
3. **Concatenation**: Combine all coverage data with single header and footer
4. **Calculation**: Parse `DA:` (line coverage) entries to compute statistics

### Example Merged LCOV Format

```
TN:
SF:/path/to/file1.ts
DA:1,1
DA:2,0
SF:/path/to/file2.ts  
DA:1,2
DA:2,0
end_of_record
```

### Coverage Calculation

- **Total Lines**: Count of all `DA:` entries
- **Covered Lines**: Count of `DA:` entries with hit count > 0
- **Percentage**: `(covered / total) * 100`

## Output

### Workflow Run Summary

The coverage summary appears in the GitHub Actions run summary:

```markdown
## 📊 Combined Coverage

| Metric | Value |
|--------|-------|
| Total Lines | 150 |
| Covered Lines | 120 |
| Coverage Percentage | 80.00% |
```

### Artifacts Generated

1. **unit-coverage**: Contains `lcov.info` from unit tests
2. **workers-coverage**: Contains `lcov.info` from workers tests  
3. **merged-coverage**: Contains `merged.lcov` with consolidated coverage

## Error Handling

### Graceful Degradation

- **No Coverage Artifacts**: Shows warning message instead of failing
- **Processing Errors**: Uses `continue-on-error: true` for non-critical steps
- **Missing Files**: Exits gracefully with informative message

### Example No-Coverage Output

```markdown
## 📊 Combined Coverage

| Status | Message |
|--------|---------|
| ⚠️ No Coverage | No coverage artifacts found |
```

## Requirements Met

✅ **Consolidated Reporting**: Merges coverage from unit and workers tests  
✅ **Human-Readable Summary**: Displays lines/total/percentage in workflow summary  
✅ **Artifact Persistence**: Workers coverage now uploaded as artifact  
✅ **Minimal Permissions**: Uses only `contents: read`  
✅ **Actions v4**: Uses `actions/download-artifact@v4`  
✅ **Bash Implementation**: No external dependencies, bash-only merging  
✅ **Graceful Handling**: Doesn't fail pipeline when coverage missing  
✅ **Codecov Integration**: Maintains existing Codecov uploads with v4 upgrade

## Future Enhancements

### Per-File Breakdown

To add detailed per-file coverage, modify the calculation logic:

```bash
# Parse SF: lines for filenames
# Parse DA: lines for per-file statistics  
# Generate detailed table in summary
```

### Threshold Enforcement

Add coverage thresholds with job failure:

```yaml
- name: Enforce coverage thresholds
  run: |
    if [ "$PCT" -lt "80" ]; then
      echo "❌ Coverage below threshold: ${PCT}% < 80%"
      exit 1
    fi
```

### Integration with External Tools

- **SonarQube**: Upload merged coverage for analysis
- **Code Climate**: Send consolidated coverage data
- **Custom Dashboards**: Use artifacts for internal reporting tools

## Troubleshooting

### Common Issues

1. **Missing lcov.info**: Ensure vitest configs include 'lcov' reporter
2. **Artifact Not Found**: Check job dependencies and artifact names
3. **Parsing Errors**: Verify LCOV format compatibility
4. **Permissions**: Ensure `CODECOV_TOKEN` secret is configured

### Debug Commands

```bash
# Check artifact contents
find artifacts -name "*.info" -exec head -20 {} \;

# Validate LCOV format  
grep -c "^DA:" merged_coverage/merged.lcov

# Test merge locally
bash -x coverage-merge-script.sh
```