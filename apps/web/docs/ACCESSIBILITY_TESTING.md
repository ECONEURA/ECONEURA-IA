# Accessibility Testing Guide

## Overview

This guide covers the comprehensive accessibility testing setup for the ECONEURA UI components. The testing framework includes React Testing Library (RTL), Jest, and axe-core for automated accessibility testing.

## Features

- **Automated Accessibility Testing**: Using axe-core and jest-axe
- **React Testing Library Integration**: Component testing with accessibility focus
- **Comprehensive Test Coverage**: Button, Card, Form, Navigation, and Table components
- **WCAG 2.1 AA Compliance**: Tests meet Web Content Accessibility Guidelines
- **Keyboard Navigation Testing**: Tab order and focus management
- **Screen Reader Support**: ARIA labels and semantic HTML testing
- **Color Contrast Validation**: Basic color contrast checking
- **Form Accessibility**: Label associations and error handling

## Test Structure

### Test Files

- `src/test-utils/setup.ts` - Jest setup with accessibility matchers
- `src/test-utils/accessibility-helpers.tsx` - Custom render function and accessibility utilities
- `src/test-utils/accessibility-test-runner.ts` - Automated accessibility test runner
- `src/components/ui/button.test.tsx` - Button component accessibility tests
- `src/components/ui/card.test.tsx` - Card component accessibility tests
- `src/components/ui/form.test.tsx` - Form component accessibility tests
- `src/components/navigation.test.tsx` - Navigation component accessibility tests
- `src/components/ui/table.test.tsx` - Table component accessibility tests

### Configuration Files

- `jest.config.js` - Jest configuration with accessibility setup
- `scripts/test-accessibility.js` - Comprehensive accessibility test runner

## Running Tests

### All Accessibility Tests

```bash
# Run all accessibility tests
pnpm test:accessibility

# Run only accessibility-focused tests
pnpm test:a11y

# Run axe-core specific tests
pnpm test:axe
```

### Individual Component Tests

```bash
# Test specific component
pnpm test src/components/ui/button.test.tsx

# Test with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Manual Testing

```bash
# Run Jest tests manually
npx jest --config=jest.config.js

# Run with specific pattern
npx jest --testNamePattern="accessibility" --config=jest.config.js
```

## Test Categories

### 1. Basic Accessibility

- **axe-core Integration**: Automated accessibility violation detection
- **WCAG 2.1 AA Compliance**: Tests meet accessibility standards
- **ARIA Support**: Proper ARIA attributes and relationships

### 2. Keyboard Navigation

- **Tab Order**: Proper focus sequence
- **Focus Management**: Visible focus indicators
- **Keyboard Shortcuts**: Enter, Space, Arrow keys
- **Focus Traps**: Modal and dropdown focus management

### 3. Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Accessible names and descriptions
- **Form Labels**: Proper label associations
- **Button Accessibility**: Accessible button names

### 4. Form Accessibility

- **Label Associations**: `for` attributes and `aria-labelledby`
- **Error Messages**: `aria-describedby` and `role="alert"`
- **Required Fields**: `aria-required` and visual indicators
- **Help Text**: Proper help text associations

### 5. Interactive Elements

- **Button States**: Disabled, loading, and active states
- **Link Accessibility**: Descriptive link text
- **Form Controls**: Input, select, and textarea accessibility
- **Custom Components**: ARIA roles and properties

## Test Utilities

### Custom Render Function

```typescript
import { render } from '../test-utils/accessibility-helpers';

// Renders component with providers and accessibility setup
const { container } = render(<MyComponent />);
```

### Accessibility Test Helpers

```typescript
import { testAccessibility, runAllAccessibilityTests } from '../test-utils/accessibility-helpers';

// Test with axe-core
await testAccessibility(container);

// Run comprehensive accessibility tests
await runAllAccessibilityTests(container);
```

### Accessibility Test Runner

```typescript
import { accessibilityTestRunner } from '../test-utils/accessibility-test-runner';

// Test single component
const result = await accessibilityTestRunner.testComponent(<MyComponent />, 'MyComponent');

// Test multiple components
const results = await accessibilityTestRunner.testComponents([
  { component: <Button />, name: 'Button' },
  { component: <Card />, name: 'Card' },
]);

// Generate report
const report = accessibilityTestRunner.generateReport(results);
```

## Writing Accessibility Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils/accessibility-helpers';
import { testAccessibility } from '../test-utils/accessibility-helpers';
import { MyComponent } from './MyComponent';

describe('MyComponent Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    await testAccessibility(container);
  });

  it('should be keyboard accessible', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

### Testing Form Accessibility

```typescript
it('should have proper form labels', () => {
  render(
    <form>
      <label htmlFor="email">Email Address</label>
      <input id="email" type="email" required />
    </form>
  );

  const input = screen.getByLabelText(/email address/i);
  expect(input).toBeInTheDocument();
  expect(input).toHaveAttribute('required');
});
```

### Testing ARIA Attributes

```typescript
it('should have proper ARIA attributes', () => {
  render(
    <button aria-expanded="false" aria-controls="menu">
      Toggle Menu
    </button>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button).toHaveAttribute('aria-controls', 'menu');
});
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

All tests are designed to meet WCAG 2.1 AA standards:

- **Perceivable**: Information and UI components must be presentable in ways users can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough to be interpreted by assistive technologies

### ARIA Best Practices

- **ARIA Labels**: Use `aria-label` for accessible names
- **ARIA Descriptions**: Use `aria-describedby` for additional information
- **ARIA States**: Use `aria-expanded`, `aria-selected`, etc. for component states
- **ARIA Relationships**: Use `aria-controls`, `aria-owns` for relationships

### Keyboard Navigation

- **Tab Order**: Logical focus sequence
- **Focus Indicators**: Visible focus states
- **Keyboard Shortcuts**: Standard keyboard interactions
- **Focus Management**: Proper focus handling in modals and dropdowns

## Troubleshooting

### Common Issues

1. **Missing Labels**: Ensure all form inputs have proper labels
2. **Focus Indicators**: Check for visible focus states
3. **Color Contrast**: Verify sufficient color contrast ratios
4. **Heading Hierarchy**: Maintain proper heading structure
5. **ARIA Attributes**: Use appropriate ARIA roles and properties

### Debug Tips

```typescript
// Debug accessibility issues
import { axe } from 'jest-axe';

const { container } = render(<MyComponent />);
const results = await axe(container);
console.log(results.violations);
```

### Test Failures

When tests fail:

1. **Check axe-core violations**: Review specific accessibility issues
2. **Verify ARIA attributes**: Ensure proper ARIA implementation
3. **Test with screen readers**: Manual testing with NVDA, JAWS, or VoiceOver
4. **Check keyboard navigation**: Test tab order and focus management

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [Testing Library Accessibility](https://testing-library.com/docs/guide-accessibility/)

## Contributing

When adding new components:

1. **Create accessibility tests**: Include comprehensive accessibility test coverage
2. **Follow WCAG guidelines**: Ensure components meet accessibility standards
3. **Test with assistive technologies**: Manual testing with screen readers
4. **Document accessibility features**: Include accessibility documentation
5. **Update test utilities**: Extend test helpers as needed

## CI/CD Integration

The accessibility tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Accessibility Tests
  run: |
    cd apps/web
    pnpm test:accessibility
```

This ensures accessibility compliance is maintained throughout the development process.
