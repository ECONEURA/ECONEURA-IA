# E2E Tests

This directory contains end-to-end tests for the ECONEURA project.

## Test Structure

- `neura-agents.spec.ts` - Tests for NEURA↔Comet and agent execution
- `voice-demo.spec.ts` - Tests for voice recognition demo
- `security.spec.ts` - Tests for security features (CORS, CSP, HMAC, idempotency)
- `telemetry.spec.ts` - Tests for telemetry and FinOps features

## Running Tests

```bash
# Run all E2E tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in headed mode
pnpm test:headed

# Debug tests
pnpm test:debug

# View test report
pnpm test:report
```

## Test Requirements

- Cockpit must be running on port 3000
- API services must be running on ports 3101 and 3102
- Database must be accessible
- Redis must be accessible

## Test Data

Tests use mock data and do not require real external services. However, they do test the integration between components and verify that the correct API calls are made.