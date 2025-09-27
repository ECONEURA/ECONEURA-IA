import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Re-export testing library functions
export { render, screen, fireEvent, within, act };

// Accessibility testing helpers
export const testAccessibility = async (container: Element) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

export const runAllAccessibilityTests = async (container: Element) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};