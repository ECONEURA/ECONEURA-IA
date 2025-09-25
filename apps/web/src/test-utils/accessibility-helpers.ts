import { render, screen, fireEvent, within, act } from '@testing-library/react';
import axe from 'axe-core';
import { toHaveNoViolations } from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// Add axe-core matchers to Jest
expect.extend({ toHaveNoViolations });

// Custom render function with accessibility helpers
export { render, screen, fireEvent, within, act };

// Accessibility testing functions
export async function testAccessibility(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // Disable rules that are not relevant for component testing or cause issues with jsdom
      'color-contrast': { enabled: false },
      'html-has-lang': { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
      'region': { enabled: false },
      // Disable rules that require canvas/context which jsdom doesn't support
      'hidden-content': { enabled: false },
      'css-orientation-lock': { enabled: false },
      'meta-viewport': { enabled: false },
      'aria-hidden-focus': { enabled: false }, // Can cause issues with canvas detection
    },
  });

  // Custom assertion instead of toHaveNoViolations
  if (results.violations.length > 0) {
    const violations = results.violations.map(v => `${v.id}: ${v.description}`).join('\n');
    throw new Error(`Accessibility violations found:\n${violations}`);
  }
}

export async function runAllAccessibilityTests(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // Comprehensive accessibility checks for components, excluding jsdom-incompatible rules
      'aria-allowed-attr': { enabled: true },
      'aria-allowed-role': { enabled: true },
      'aria-hidden-body': { enabled: true },
      'aria-hidden-focus': { enabled: true },
      'aria-input-field-name': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-required-children': { enabled: true },
      'aria-required-parent': { enabled: true },
      'aria-roledescription': { enabled: true },
      'aria-roles': { enabled: true },
      'aria-toggle-field-name': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'button-name': { enabled: true },
      'duplicate-id-active': { enabled: true },
      'duplicate-id-aria': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'heading-order': { enabled: true },
      'image-alt': { enabled: true },
      'image-redundant-alt': { enabled: true },
      'input-button-name': { enabled: true },
      'input-image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'nested-interactive': { enabled: true },
      'role-img-alt': { enabled: true },
      'select-name': { enabled: true },
      'table-duplicate-name': { enabled: true },
      'table-fake-caption': { enabled: true },
      'td-has-header': { enabled: true },
      'td-headers-attr': { enabled: true },
      'th-has-data-cells': { enabled: true },
      // Disable rules that cause issues with jsdom
      'color-contrast': { enabled: false },
      'hidden-content': { enabled: false },
      'css-orientation-lock': { enabled: false },
      'meta-viewport': { enabled: false },
      'html-has-lang': { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
      'region': { enabled: false },
      'valid-lang': { enabled: false },
    },
  });

  // Custom assertion instead of toHaveNoViolations
  if (results.violations.length > 0) {
    const violations = results.violations.map(v => `${v.id}: ${v.description}`).join('\n');
    throw new Error(`Accessibility violations found:\n${violations}`);
  }
}

// Helper to test keyboard navigation
export function testKeyboardNavigation(element: HTMLElement) {
  return {
    pressTab: () => fireEvent.keyDown(element, { key: 'Tab', code: 'Tab' }),
    pressEnter: () => fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' }),
    pressSpace: () => fireEvent.keyDown(element, { key: ' ', code: 'Space' }),
    pressEscape: () => fireEvent.keyDown(element, { key: 'Escape', code: 'Escape' }),
    pressArrowUp: () => fireEvent.keyDown(element, { key: 'ArrowUp', code: 'ArrowUp' }),
    pressArrowDown: () => fireEvent.keyDown(element, { key: 'ArrowDown', code: 'ArrowDown' }),
    pressArrowLeft: () => fireEvent.keyDown(element, { key: 'ArrowLeft', code: 'ArrowLeft' }),
    pressArrowRight: () => fireEvent.keyDown(element, { key: 'ArrowRight', code: 'ArrowRight' }),
  };
}

// Helper to test focus management
export function testFocusManagement() {
  return {
    isFocused: (element: HTMLElement) => element === document.activeElement,
    focus: (element: HTMLElement) => element.focus(),
    blur: (element: HTMLElement) => element.blur(),
    getActiveElement: () => document.activeElement,
  };
}