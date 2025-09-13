/**
 * Accessibility Test Runner
 * PR-99: Cobertura UI & Axe - Automated accessibility testing runner
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import React from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

export interface AccessibilityTestConfig {
  includeColorContrast?: boolean;
  includeKeyboardNavigation?: boolean;
  includeScreenReader?: boolean;
  includeFocusManagement?: boolean;
  customRules?: string[];
  skipRules?: string[];
  tags?: string[];
}

export interface AccessibilityTestResult {
  component: string;
  passed: boolean;
  violations: any[];
  warnings: string[];
  recommendations: string[];
  score: number;
}

export class AccessibilityTestRunner {
  private config: AccessibilityTestConfig;

  constructor(config: AccessibilityTestConfig = {}) {
    this.config = {
      includeColorContrast: true,
      includeKeyboardNavigation: true,
      includeScreenReader: true,
      includeFocusManagement: true,
      customRules: [],
      skipRules: [],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      ...config,
    };
  }

  /**
   * Run accessibility tests on a React component
   */
  async testComponent(
    component: React.ReactElement,
    componentName: string
  ): Promise<AccessibilityTestResult> {
    const { container } = render(component);
    
    const result: AccessibilityTestResult = {
      component: componentName,
      passed: true,
      violations: [],
      warnings: [],
      recommendations: [],
      score: 100,
    };

    try {
      // Run axe-core tests
      const axeResults = await axe(container, {
        tags: this.config.tags,
        rules: this.getAxeRules(),
      });

      if (axeResults.violations.length > 0) {
        result.passed = false;
        result.violations = axeResults.violations;
        result.score = Math.max(0, 100 - (axeResults.violations.length * 10));
      }

      // Run custom accessibility tests
      if (this.config.includeKeyboardNavigation) {
        await this.testKeyboardNavigation(container, result);
      }

      if (this.config.includeFocusManagement) {
        await this.testFocusManagement(container, result);
      }

      if (this.config.includeScreenReader) {
        await this.testScreenReaderSupport(container, result);
      }

      if (this.config.includeColorContrast) {
        await this.testColorContrast(container, result);
      }

    } catch (error) {
      result.passed = false;
      result.warnings.push(`Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Run accessibility tests on multiple components
   */
  async testComponents(
    components: Array<{ component: React.ReactElement; name: string }>
  ): Promise<AccessibilityTestResult[]> {
    const results: AccessibilityTestResult[] = [];

    for (const { component, name } of components) {
      const result = await this.testComponent(component, name);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate accessibility test report
   */
  generateReport(results: AccessibilityTestResult[]): string {
    const totalComponents = results.length;
    const passedComponents = results.filter(r => r.passed).length;
    const failedComponents = totalComponents - passedComponents;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalComponents;

    let report = `
# Accessibility Test Report

## Summary
- **Total Components Tested**: ${totalComponents}
- **Passed**: ${passedComponents}
- **Failed**: ${failedComponents}
- **Success Rate**: ${((passedComponents / totalComponents) * 100).toFixed(1)}%
- **Average Score**: ${averageScore.toFixed(1)}/100

## Component Results
`;

    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `
### ${result.component} - ${status} (${result.score}/100)

`;

      if (result.violations.length > 0) {
        report += `**Violations (${result.violations.length}):**\n`;
        result.violations.forEach((violation, index) => {
          report += `${index + 1}. **${violation.id}**: ${violation.description}\n`;
          if (violation.nodes.length > 0) {
            report += `   - Impact: ${violation.impact}\n`;
            report += `   - Help: ${violation.help}\n`;
            report += `   - Help URL: ${violation.helpUrl}\n`;
          }
        });
        report += '\n';
      }

      if (result.warnings.length > 0) {
        report += `**Warnings (${result.warnings.length}):**\n`;
        result.warnings.forEach((warning, index) => {
          report += `${index + 1}. ${warning}\n`;
        });
        report += '\n';
      }

      if (result.recommendations.length > 0) {
        report += `**Recommendations (${result.recommendations.length}):**\n`;
        result.recommendations.forEach((recommendation, index) => {
          report += `${index + 1}. ${recommendation}\n`;
        });
        report += '\n';
      }
    });

    return report;
  }

  /**
   * Get axe rules configuration
   */
  private getAxeRules(): Record<string, any> {
    const rules: Record<string, any> = {};

    // Skip specified rules
    this.config.skipRules?.forEach(rule => {
      rules[rule] = { enabled: false };
    });

    // Enable custom rules
    this.config.customRules?.forEach(rule => {
      rules[rule] = { enabled: true };
    });

    return rules;
  }

  /**
   * Test keyboard navigation
   */
  private async testKeyboardNavigation(container: HTMLElement, result: AccessibilityTestResult): Promise<void> {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      result.warnings.push('No focusable elements found for keyboard navigation testing');
      return;
    }

    // Test tab order
    const tabIndexValues = Array.from(focusableElements).map(el => 
      parseInt(el.getAttribute('tabindex') || '0')
    );

    const hasPositiveTabIndex = tabIndexValues.some(index => index > 0);
    const hasZeroTabIndex = tabIndexValues.some(index => index === 0);

    if (hasPositiveTabIndex && hasZeroTabIndex) {
      result.warnings.push('Mixed positive and zero tabindex values found. This can create confusing focus order.');
    }

    // Test for keyboard traps
    const hasModal = container.querySelector('[role="dialog"], [role="modal"]');
    if (hasModal) {
      const modalFocusableElements = hasModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (modalFocusableElements.length === 0) {
        result.warnings.push('Modal dialog found but no focusable elements inside. This creates a keyboard trap.');
      }
    }
  }

  /**
   * Test focus management
   */
  private async testFocusManagement(container: HTMLElement, result: AccessibilityTestResult): Promise<void> {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        result.warnings.push(`Element ${index} has positive tabindex (${tabIndex}). This can disrupt natural tab order.`);
      }
    });

    // Test for focus indicators
    const elementsWithoutFocusIndicator = Array.from(focusableElements).filter(el => {
      const styles = window.getComputedStyle(el, ':focus');
      return styles.outline === 'none' && styles.boxShadow === 'none';
    });

    if (elementsWithoutFocusIndicator.length > 0) {
      result.warnings.push(`${elementsWithoutFocusIndicator.length} focusable elements may lack visible focus indicators.`);
    }
  }

  /**
   * Test screen reader support
   */
  private async testScreenReaderSupport(container: HTMLElement, result: AccessibilityTestResult): Promise<void> {
    // Test for proper heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      if (currentLevel > previousLevel + 1) {
        result.warnings.push(`Heading hierarchy violation: h${currentLevel} follows h${previousLevel}. Headings should not skip levels.`);
      }
    }

    // Test for proper form labels
    const inputs = container.querySelectorAll('input, select, textarea');
    const unlabeledInputs: HTMLElement[] = [];

    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = id ? container.querySelector(`label[for="${id}"]`) : null;

      if (!label && !ariaLabel && !ariaLabelledBy) {
        unlabeledInputs.push(input as HTMLElement);
      }
    });

    if (unlabeledInputs.length > 0) {
      result.warnings.push(`${unlabeledInputs.length} form inputs lack proper labeling for screen readers.`);
    }

    // Test for proper button accessibility
    const buttons = container.querySelectorAll('button');
    const unlabeledButtons: HTMLElement[] = [];

    buttons.forEach(button => {
      const text = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      const title = button.getAttribute('title');

      if (!text && !ariaLabel && !ariaLabelledBy && !title) {
        unlabeledButtons.push(button as HTMLElement);
      }
    });

    if (unlabeledButtons.length > 0) {
      result.warnings.push(`${unlabeledButtons.length} buttons lack accessible names for screen readers.`);
    }
  }

  /**
   * Test color contrast (basic check)
   */
  private async testColorContrast(container: HTMLElement, result: AccessibilityTestResult): Promise<void> {
    const elements = container.querySelectorAll('*');
    const potentialContrastIssues: HTMLElement[] = [];

    elements.forEach(element => {
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
            potentialContrastIssues.push(element as HTMLElement);
          }
        }
      }
    });

    if (potentialContrastIssues.length > 0) {
      result.warnings.push(`${potentialContrastIssues.length} elements may have insufficient color contrast. Consider using a color contrast analyzer for detailed testing.`);
    }
  }
}

// Export default instance
export const accessibilityTestRunner = new AccessibilityTestRunner();

// Export utility functions
export const runAccessibilityTest = (component: React.ReactElement, name: string) => 
  accessibilityTestRunner.testComponent(component, name);

export const runAccessibilityTests = (components: Array<{ component: React.ReactElement; name: string }>) => 
  accessibilityTestRunner.testComponents(components);

export const generateAccessibilityReport = (results: AccessibilityTestResult[]) => 
  accessibilityTestRunner.generateReport(results);
