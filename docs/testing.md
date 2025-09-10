# Testing Standards & Guidelines

This document outlines the testing standards, conventions, and guidelines for the ECONEURA project.

## Overview

The project maintains several types of tests to ensure quality and reliability:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test interactions between components 
- **E2E Tests**: Test complete user workflows end-to-end
- **Visual Tests**: Test UI components for visual regressions
- **Accessibility Tests**: Test components for accessibility compliance
- **Performance Tests**: Test application performance under load
- **Security Tests**: Test for vulnerabilities and secrets

## Test Configuration

### Coverage Requirements

- **Minimum Coverage**: 80% for statements, lines, branches, and functions
- **New/Modified Files**: Must maintain or increase coverage percentage
- **Coverage Exclusions**: Generated code should be marked with `/* c8 ignore */` comments

#### Coverage Comments

Use these patterns to exclude generated or non-testable code:

```typescript
/* c8 ignore start */
// Generated code or external dependencies
const generatedConfig = await loadExternalConfig();
/* c8 ignore stop */

// Single line exclusion
const debugLog = () => console.log('debug'); /* c8 ignore next */

// Ignore specific lines
function complexFunction() {
  const result = computation();
  /* c8 ignore next 3 */
  if (process.env.NODE_ENV === 'development') {
    console.log(result);
  }
  return result;
}
```

### Data-TestId Standards

Use `data-testid` attributes for stable test selectors. This prevents tests from breaking due to styling or content changes.

#### Naming Convention

- Use kebab-case: `data-testid="user-profile-button"`
- Be descriptive: `data-testid="email-input"` not `data-testid="input1"`
- Include component context: `data-testid="sidebar-navigation"`

#### Examples

```tsx
// ✅ Good - Stable and descriptive
<button data-testid="login-button" type="submit">
  Log In
</button>

<input 
  data-testid="email-input"
  type="email"
  name="email"
/>

<nav data-testid="main-navigation">
  <ul data-testid="nav-menu">
    <li data-testid="nav-item-dashboard">Dashboard</li>
  </ul>
</nav>

// ❌ Bad - Fragile selectors
<button className="bg-blue-500 hover:bg-blue-600">
  Log In  
</button>

// ❌ Bad - Text-based selection (fragile)
await page.click('button:has-text("Log In")')

// ✅ Good - Using data-testid
await page.click('[data-testid="login-button"]')
```

## Test Data Seeding

### E2E Test Data

For consistent E2E tests, use deterministic test data:

```typescript
// Use consistent test users
const testAdmin = {
  email: 'admin@ecoretail.com',
  password: 'Demo1234!',
  role: 'admin'
};

// Seed data before tests
test.beforeEach(async ({ page }) => {
  await seedTestData();
  // ... test setup
});

test.afterEach(async ({ page }) => {
  await cleanupTestData();
});
```

### Running Seeds Locally

```bash
# Seed test database
pnpm db:seed

# Reset and seed
pnpm db:reset
```

## Visual Testing

### Snapshot Updates

When UI changes are **intentional**, update snapshots:

```bash
# Update all visual snapshots
pnpm test:visual --update-snapshots

# Update specific test snapshots
pnpm test:visual dashboard.visual.spec.ts --update-snapshots
```

### Visual Testing Guidelines

- **Threshold**: Allow up to 2% visual difference
- **Viewports**: Test on multiple screen sizes
- **States**: Test different component states (loading, error, empty)

```typescript
test('component visual test', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for content to load
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="dashboard-main"]');
  
  // Take screenshot
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

## Accessibility Testing

### Axe Core Integration

Tests must meet WCAG 2.1 AA standards (≥95% score):

```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('accessibility test', async ({ page }) => {
  await injectAxe(page);
  
  // Check entire page
  await checkA11y(page, null, {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  });
});
```

### Accessibility Requirements

- **ARIA Labels**: All interactive elements must have labels
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Color Contrast**: Text must meet WCAG contrast ratios
- **Focus Management**: Focus indicators must be visible
- **Screen Reader**: Content must be screen reader friendly

```tsx
// ✅ Good accessibility
<button 
  data-testid="delete-button"
  aria-label="Delete user profile"
  className="focus:ring-2 focus:ring-blue-500"
>
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Good form accessibility
<label htmlFor="email">Email Address</label>
<input 
  id="email"
  data-testid="email-input"
  type="email"
  required
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  {emailError}
</div>
```

## Performance Testing

### k6 Performance Tests

```bash
# Run smoke tests (basic functionality)
pnpm k6:smoke

# Run load tests (normal load)
pnpm k6:load  

# Run chaos tests (stress testing)
pnpm k6:chaos
```

### Performance Metrics

Tests export metrics to `.artifacts/k6-summary.json`:

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01']     // <1% failure rate
  }
};

export function handleSummary(data) {
  return {
    ".artifacts/k6-summary.json": JSON.stringify(data, null, 2)
  };
}
```

## Security Testing

### Secret Scanning

Use detect-secrets to prevent secrets in code:

```bash
# Scan for secrets
pnpm test:secrets

# Update baseline (when adding legitimate test fixtures)
pnpm secrets:audit
```

### Security Dependencies

```bash
# Check for vulnerable dependencies
pnpm security:audit

# Advanced security scanning
pnpm security:scan
```

## Running Tests

### Local Development

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test types
pnpm test:e2e
pnpm test:visual  
pnpm test:axe
pnpm test:links

# Run performance tests
pnpm k6:smoke
```

### CI/CD Pipeline

The CI pipeline runs all test gates:

1. **Coverage Gate**: ≥80% coverage required
2. **Visual Gate**: ≤2% visual difference allowed  
3. **Accessibility Gate**: ≥95% axe score required
4. **Links Gate**: 0 broken internal links allowed
5. **E2E Gate**: All user workflows must pass
6. **Security Gate**: No secrets or high vulnerabilities
7. **Performance Gate**: Response times within thresholds

## Troubleshooting

### Common Issues

#### Coverage Too Low
```bash
# Check coverage report
pnpm test:coverage
open coverage/index.html

# Add tests for uncovered code
# Use /* c8 ignore */ for generated code
```

#### Visual Tests Failing
```bash
# Compare visual diffs
pnpm test:visual
open visual-test-results/index.html

# Update if changes are intentional
pnpm test:visual --update-snapshots
```

#### E2E Tests Flaky
```bash
# Use stable selectors
await page.click('[data-testid="button"]')

# Wait for elements properly  
await page.waitForSelector('[data-testid="content"]')

# Seed consistent test data
await seedTestData()
```

#### Accessibility Issues
```bash
# Run axe tests to see specific issues
pnpm test:axe

# Common fixes:
# - Add aria-label attributes
# - Improve color contrast  
# - Add focus indicators
# - Use semantic HTML
```

## Best Practices

1. **Write tests first** (TDD approach when possible)
2. **Use descriptive test names** that explain the expected behavior
3. **Keep tests independent** - each test should work in isolation
4. **Use stable selectors** - prefer data-testid over class names or text
5. **Test user behavior** not implementation details
6. **Mock external dependencies** in unit tests
7. **Use real data** in integration and E2E tests
8. **Keep tests fast** - optimize for quick feedback
9. **Document test patterns** and share knowledge with team
10. **Review test coverage** regularly and improve weak areas