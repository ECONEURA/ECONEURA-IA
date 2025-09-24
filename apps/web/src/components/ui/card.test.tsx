/**
 * Card Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Card
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils/accessibility-helpers';
import { testAccessibility, runAllAccessibilityTests } from '../../test-utils/accessibility-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

describe('Card Component Accessibility', () => {
  describe('Basic Card Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>
      );
      await runAllAccessibilityTests(container);
    });

    it('should have proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>
      );

      const title = screen.getByRole('heading', { name: /card title/i });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3'); // CardTitle should render as h3
    });
  });

  describe('Card with Different Content Types', () => {
    it('should be accessible with text content', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Text Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a simple text card with some content.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should be accessible with form content', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" />
              <button type="submit">Submit</button>
            </form>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should be accessible with list content', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>List Card</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should be accessible with table content', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Table Card</CardTitle>
          </CardHeader>
          <CardContent>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Item 1</td>
                  <td>100</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });
  });

  describe('Card with Footer', () => {
    it('should be accessible with footer', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content.</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should have proper footer structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content.</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      const button = screen.getByRole('button', { name: /action button/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Card with Images', () => {
    it('should be accessible with images', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img src="/test-image.jpg" alt="Test image description" />
            <p>Card content with image.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should have proper image alt text', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img src="/test-image.jpg" alt="Test image description" />
            <p>Card content with image.</p>
          </CardContent>
        </Card>
      );

      const image = screen.getByAltText(/test image description/i);
      expect(image).toBeInTheDocument();
    });
  });

  describe('Card with Links', () => {
    it('should be accessible with links', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This card contains a <a href="/test">test link</a> and another{' '}
              <a href="/example">example link</a>.
            </p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should have proper link text', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This card contains a <a href="/test">test link</a> and another{' '}
              <a href="/example">example link</a>.
            </p>
          </CardContent>
        </Card>
      );

      const testLink = screen.getByRole('link', { name: /test link/i });
      const exampleLink = screen.getByRole('link', { name: /example link/i });
      
      expect(testLink).toBeInTheDocument();
      expect(exampleLink).toBeInTheDocument();
    });
  });

  describe('Card with Interactive Elements', () => {
    it('should be accessible with buttons', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has interactive elements.</p>
            <button>Primary Action</button>
            <button>Secondary Action</button>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should be accessible with form inputs', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <div>
                <label htmlFor="name">Name</label>
                <input id="name" type="text" />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" />
              </div>
              <button type="submit">Submit</button>
            </form>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });
  });

  describe('Card with ARIA Attributes', () => {
    it('should be accessible with custom ARIA attributes', async () => {
      const { container } = render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">ARIA Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has custom ARIA attributes.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should have proper ARIA relationships', () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">ARIA Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has custom ARIA attributes.</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByRole('article');
      const title = screen.getByRole('heading', { name: /aria card/i });
      
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      expect(title).toHaveAttribute('id', 'card-title');
    });
  });

  describe('Card with Custom Styling', () => {
    it('should be accessible with custom className', async () => {
      const { container } = render(
        <Card className="custom-card">
          <CardHeader>
            <CardTitle>Custom Styled Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has custom styling.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should be accessible with custom data attributes', async () => {
      const { container } = render(
        <Card data-testid="custom-card" data-analytics="card-view">
          <CardHeader>
            <CardTitle>Analytics Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has analytics tracking.</p>
          </CardContent>
        </Card>
      );
      await testAccessibility(container);
    });
  });

  describe('Card in Different Contexts', () => {
    it('should be accessible in a list of cards', async () => {
      const { container } = render(
        <div role="list">
          <Card role="listitem">
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p>First card content.</p>
            </CardContent>
          </Card>
          <Card role="listitem">
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Second card content.</p>
            </CardContent>
          </Card>
        </div>
      );
      await testAccessibility(container);
    });

    it('should be accessible in a grid layout', async () => {
      const { container } = render(
        <div role="grid">
          <Card role="gridcell">
            <CardHeader>
              <CardTitle>Grid Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card in grid layout.</p>
            </CardContent>
          </Card>
        </div>
      );
      await testAccessibility(container);
    });
  });

  describe('Card with Complex Content', () => {
    it('should be accessible with nested components', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Complex Card</CardTitle>
            <CardDescription>This card has complex nested content</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h4>Section 1</h4>
              <p>Content for section 1.</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
            <div>
              <h4>Section 2</h4>
              <p>Content for section 2.</p>
              <button>Action</button>
            </div>
          </CardContent>
          <CardFooter>
            <button>Footer Action</button>
          </CardFooter>
        </Card>
      );
      await testAccessibility(container);
    });

    it('should maintain proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complex Card</CardTitle>
            <CardDescription>This card has complex nested content</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h4>Section 1</h4>
              <p>Content for section 1.</p>
            </div>
            <div>
              <h4>Section 2</h4>
              <p>Content for section 2.</p>
            </div>
          </CardContent>
        </Card>
      );

      const mainTitle = screen.getByRole('heading', { name: /complex card/i, level: 3 });
      const section1 = screen.getByRole('heading', { name: /section 1/i, level: 4 });
      const section2 = screen.getByRole('heading', { name: /section 2/i, level: 4 });
      
      expect(mainTitle).toBeInTheDocument();
      expect(section1).toBeInTheDocument();
      expect(section2).toBeInTheDocument();
    });
  });

  describe('Card Focus Management', () => {
    it('should be focusable when interactive', () => {
      render(
        <Card tabIndex={0} role="button">
          <CardHeader>
            <CardTitle>Focusable Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card can be focused.</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByRole('button');
      card.focus();
      expect(card).toHaveFocus();
    });

    it('should not be focusable by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Non-focusable Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card is not focusable.</p>
          </CardContent>
        </Card>
      );

      const card = screen.getByRole('generic');
      expect(card).not.toHaveAttribute('tabindex');
    });
  });
});
