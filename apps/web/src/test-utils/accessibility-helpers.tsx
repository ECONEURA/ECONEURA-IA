/**
 * Accessibility Testing Helpers
 * PR-99: Cobertura UI & Axe - Helper functions for accessibility testing
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'next-themes';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
}

const AllTheProviders = ({ 
  children, 
  theme = 'light',
  locale = 'en'
}: { 
  children: React.ReactNode;
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
}) => {
  return (
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
      <div lang={locale}>
        {children}
      </div>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { theme, locale, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders theme={theme} locale={locale}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Accessibility testing utilities
export const testAccessibility = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  return results;
};

export const testAccessibilityWithOptions = async (
  container: HTMLElement,
  options: any = {}
) => {
  const results = await axe(container, options);
  expect(results).toHaveNoViolations();
  return results;
};

// Common accessibility test patterns
export const accessibilityTestSuite = {
  // Test for proper heading hierarchy
  testHeadingHierarchy: (container: HTMLElement) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    // Check for proper hierarchy (no skipping levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      if (currentLevel > previousLevel + 1) {
        throw new Error(
          `Heading hierarchy violation: h${currentLevel} follows h${previousLevel}. ` +
          `Headings should not skip levels.`
        );
      }
    }
  },

  // Test for proper form labels
  testFormLabels: (container: HTMLElement) => {
    const inputs = container.querySelectorAll('input, select, textarea');
    const violations: string[] = [];

    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = id ? container.querySelector(`label[for="${id}"]`) : null;

      if (!label && !ariaLabel && !ariaLabelledBy) {
        violations.push(`Input at index ${index} lacks proper labeling`);
      }
    });

    if (violations.length > 0) {
      throw new Error(`Form labeling violations:\n${violations.join('\n')}`);
    }
  },

  // Test for proper button accessibility
  testButtonAccessibility: (container: HTMLElement) => {
    const buttons = container.querySelectorAll('button');
    const violations: string[] = [];

    buttons.forEach((button, index) => {
      const text = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      const title = button.getAttribute('title');

      if (!text && !ariaLabel && !ariaLabelledBy && !title) {
        violations.push(`Button at index ${index} lacks accessible name`);
      }
    });

    if (violations.length > 0) {
      throw new Error(`Button accessibility violations:\n${violations.join('\n')}`);
    }
  },

  // Test for proper link accessibility
  testLinkAccessibility: (container: HTMLElement) => {
    const links = container.querySelectorAll('a[href]');
    const violations: string[] = [];

    links.forEach((link, index) => {
      const text = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const ariaLabelledBy = link.getAttribute('aria-labelledby');
      const title = link.getAttribute('title');

      if (!text && !ariaLabel && !ariaLabelledBy && !title) {
        violations.push(`Link at index ${index} lacks accessible name`);
      }

      // Check for generic link text
      if (text && ['click here', 'read more', 'here', 'link'].includes(text.toLowerCase())) {
        violations.push(`Link at index ${index} has generic text: "${text}"`);
      }
    });

    if (violations.length > 0) {
      throw new Error(`Link accessibility violations:\n${violations.join('\n')}`);
    }
  },

  // Test for proper color contrast (basic check)
  testColorContrast: (container: HTMLElement) => {
    const elements = container.querySelectorAll('*');
    const violations: string[] = [];

    elements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Basic check for transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        const parent = element.parentElement;
        if (parent) {
          const parentStyles = window.getComputedStyle(parent);
          const parentBg = parentStyles.backgroundColor;
          if (parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent') {
            violations.push(`Element at index ${index} may have insufficient color contrast`);
          }
        }
      }
    });

    if (violations.length > 0) {
      console.warn(`Potential color contrast issues:\n${violations.join('\n')}`);
    }
  },

  // Test for proper focus management
  testFocusManagement: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const tabIndexValues = Array.from(focusableElements).map(el => 
      parseInt(el.getAttribute('tabindex') || '0')
    );

    // Check for mixed positive and zero tabindex values
    const hasPositiveTabIndex = tabIndexValues.some(index => index > 0);
    const hasZeroTabIndex = tabIndexValues.some(index => index === 0);

    if (hasPositiveTabIndex && hasZeroTabIndex) {
      throw new Error(
        'Mixed positive and zero tabindex values found. ' +
        'This can create confusing focus order.'
      );
    }
  },

  // Test for proper ARIA attributes
  testAriaAttributes: (container: HTMLElement) => {
    const elements = container.querySelectorAll('[aria-*]');
    const violations: string[] = [];

    elements.forEach((element, index) => {
      const ariaExpanded = element.getAttribute('aria-expanded');
      const ariaControls = element.getAttribute('aria-controls');
      const ariaOwns = element.getAttribute('aria-owns');

      // Check for aria-expanded without proper controls
      if (ariaExpanded && !ariaControls && !ariaOwns) {
        violations.push(`Element at index ${index} has aria-expanded but no aria-controls or aria-owns`);
      }

      // Check for aria-controls/aria-owns without valid targets
      if (ariaControls) {
        const target = container.querySelector(`#${ariaControls}`);
        if (!target) {
          violations.push(`Element at index ${index} has aria-controls pointing to non-existent element: ${ariaControls}`);
        }
      }

      if (ariaOwns) {
        const target = container.querySelector(`#${ariaOwns}`);
        if (!target) {
          violations.push(`Element at index ${index} has aria-owns pointing to non-existent element: ${ariaOwns}`);
        }
      }
    });

    if (violations.length > 0) {
      throw new Error(`ARIA attribute violations:\n${violations.join('\n')}`);
    }
  }
};

// Helper to run all accessibility tests
export const runAllAccessibilityTests = async (container: HTMLElement) => {
  // Run axe-core tests
  await testAccessibility(container);

  // Run custom accessibility tests
  accessibilityTestSuite.testHeadingHierarchy(container);
  accessibilityTestSuite.testFormLabels(container);
  accessibilityTestSuite.testButtonAccessibility(container);
  accessibilityTestSuite.testLinkAccessibility(container);
  accessibilityTestSuite.testColorContrast(container);
  accessibilityTestSuite.testFocusManagement(container);
  accessibilityTestSuite.testAriaAttributes(container);
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
