/**
 * Button Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Button
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test-utils/accessibility-helpers';
import { testAccessibility, runAllAccessibilityTests } from '../../test-utils/accessibility-helpers';
import { Button } from './button';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

describe('Button Component Accessibility', () => {
  describe('Basic Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Test Button</Button>);
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(<Button>Test Button</Button>);
      await runAllAccessibilityTests(container);
    });

    it('should have proper button role', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Button Variants', () => {
    it('should be accessible in default variant', async () => {
      const { container } = render(<Button variant="default">Default Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in destructive variant', async () => {
      const { container } = render(<Button variant="destructive">Delete Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in outline variant', async () => {
      const { container } = render(<Button variant="outline">Outline Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in secondary variant', async () => {
      const { container } = render(<Button variant="secondary">Secondary Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in ghost variant', async () => {
      const { container } = render(<Button variant="ghost">Ghost Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in link variant', async () => {
      const { container } = render(<Button variant="link">Link Button</Button>);
      await testAccessibility(container);
    });
  });

  describe('Button Sizes', () => {
    it('should be accessible in default size', async () => {
      const { container } = render(<Button size="default">Default Size</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in small size', async () => {
      const { container } = render(<Button size="sm">Small Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in large size', async () => {
      const { container } = render(<Button size="lg">Large Button</Button>);
      await testAccessibility(container);
    });

    it('should be accessible in icon size', async () => {
      const { container } = render(<Button size="icon">Icon Button</Button>);
      await testAccessibility(container);
    });
  });

  describe('Button States', () => {
    it('should be accessible when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      await testAccessibility(container);
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should be accessible when loading', async () => {
      const { container } = render(<Button disabled>Loading Button</Button>);
      await testAccessibility(container);
    });

    it('should have proper loading state', () => {
      render(<Button disabled>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Button with Icons', () => {
    it('should be accessible with icon and text', async () => {
      const { container } = render(
        <Button>
          <span aria-hidden="true">🚀</span>
          Launch App
        </Button>
      );
      await testAccessibility(container);
    });

    it('should be accessible with icon only', async () => {
      const { container } = render(
        <Button aria-label="Close dialog">
          <span aria-hidden="true">×</span>
        </Button>
      );
      await testAccessibility(container);
    });

    it('should have proper aria-label for icon-only button', () => {
      render(
        <Button aria-label="Close dialog">
          <span aria-hidden="true">×</span>
        </Button>
      );
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should handle click events accessibly', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events accessibly', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Button with Custom Props', () => {
    it('should be accessible with custom className', async () => {
      const { container } = render(
        <Button className="custom-class">Custom Button</Button>
      );
      await testAccessibility(container);
    });

    it('should be accessible with custom data attributes', async () => {
      const { container } = render(
        <Button data-testid="custom-button" data-analytics="button-click">
          Custom Button
        </Button>
      );
      await testAccessibility(container);
    });

    it('should be accessible with custom aria attributes', async () => {
      const { container } = render(
        <Button aria-describedby="button-description">
          Button with Description
        </Button>
      );
      await testAccessibility(container);
    });
  });

  describe('Button in Different Contexts', () => {
    it('should be accessible in form context', async () => {
      const { container } = render(
        <form>
          <Button type="submit">Submit Form</Button>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible in navigation context', async () => {
      const { container } = render(
        <nav>
          <Button>Navigation Button</Button>
        </nav>
      );
      await testAccessibility(container);
    });

    it('should be accessible in dialog context', async () => {
      const { container } = render(
        <div role="dialog" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Dialog Title</h2>
          <Button>Dialog Button</Button>
        </div>
      );
      await testAccessibility(container);
    });
  });

  describe('Button with Complex Content', () => {
    it('should be accessible with nested elements', async () => {
      const { container } = render(
        <Button>
          <div>
            <strong>Bold Text</strong>
            <span>Regular Text</span>
          </div>
        </Button>
      );
      await testAccessibility(container);
    });

    it('should be accessible with multiple icons', async () => {
      const { container } = render(
        <Button>
          <span aria-hidden="true">📧</span>
          Send Email
          <span aria-hidden="true">→</span>
        </Button>
      );
      await testAccessibility(container);
    });
  });

  describe('Button Focus Management', () => {
    it('should maintain focus after click', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.click(button);
      // Focus should remain on button unless explicitly moved
      expect(button).toHaveFocus();
    });

    it('should be focusable with Tab key', () => {
      render(
        <div>
          <input data-testid="input1" />
          <Button>Button</Button>
          <input data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const button = screen.getByRole('button');
      const input2 = screen.getByTestId('input2');
      
      input1.focus();
      expect(input1).toHaveFocus();
      
      fireEvent.keyDown(input1, { key: 'Tab' });
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Tab' });
      expect(input2).toHaveFocus();
    });
  });
});
