/**
 * Navigation Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Navigation
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '../test-utils/accessibility-helpers';
import { testAccessibility, runAllAccessibilityTests } from '../test-utils/accessibility-helpers';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Simple Navigation Component for testing
const Navigation = ({ items = [] }: { items?: Array<{ label: string; href: string; current?: boolean }> }) => {
  const defaultItems = [
    { label: 'Home', href: '/', current: true },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        {navItems.map((item, index) => (
          <li key={index}>
            <a
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={item.current ? 'current' : ''}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Mobile Navigation Component
const MobileNavigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav role="navigation" aria-label="Mobile navigation">
      <button
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle mobile menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰ Menu
      </button>
      {isOpen && (
        <ul id="mobile-menu" role="menu">
          <li role="none">
            <a href="/" role="menuitem">Home</a>
          </li>
          <li role="none">
            <a href="/about" role="menuitem">About</a>
          </li>
          <li role="none">
            <a href="/services" role="menuitem">Services</a>
          </li>
          <li role="none">
            <a href="/contact" role="menuitem">Contact</a>
          </li>
        </ul>
      )}
    </nav>
  );
};

// Breadcrumb Navigation Component
const BreadcrumbNavigation = ({ items = [] }: { items?: Array<{ label: string; href?: string }> }) => {
  const defaultItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Current Page' },
  ];

  const breadcrumbItems = items.length > 0 ? items : defaultItems;

  return (
    <nav role="navigation" aria-label="Breadcrumb">
      <ol>
        {breadcrumbItems.map((item, index) => (
          <li key={index}>
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span aria-hidden="true"> / </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

describe('Navigation Component Accessibility', () => {
  describe('Basic Navigation Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Navigation />);
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(<Navigation />);
      await runAllAccessibilityTests(container);
    });

    it('should have proper navigation structure', () => {
      const { container } = render(<Navigation />);

      const nav = within(container).getByRole('navigation', { name: /main navigation/i });
      const list = within(container).getByRole('list');
      const links = within(container).getAllByRole('link');

      expect(nav).toBeTruthy();
      expect(list).toBeTruthy();
      expect(links).toHaveLength(4);
    });

    it('should have proper link labels', () => {
      const { container } = render(<Navigation />);

      const homeLink = within(container).getByRole('link', { name: /home/i });
      const aboutLink = within(container).getByRole('link', { name: /about/i });
      const servicesLink = within(container).getByRole('link', { name: /services/i });
      const contactLink = within(container).getByRole('link', { name: /contact/i });

      expect(homeLink).toBeTruthy();
      expect(aboutLink).toBeTruthy();
      expect(servicesLink).toBeTruthy();
      expect(contactLink).toBeTruthy();
    });
  });

  describe('Current Page Indication', () => {
    it('should indicate current page properly', () => {
      const { container } = render(<Navigation />);

      const homeLink = within(container).getByRole('link', { name: /home/i });
      expect(homeLink.getAttribute('aria-current')).toBe('page');
    });

    it('should not indicate non-current pages', () => {
      const { container } = render(<Navigation />);

      const aboutLink = within(container).getByRole('link', { name: /about/i });
      const servicesLink = within(container).getByRole('link', { name: /services/i });
      const contactLink = within(container).getByRole('link', { name: /contact/i });

      expect(aboutLink.getAttribute('aria-current')).toBe(null);
      expect(servicesLink.getAttribute('aria-current')).toBe(null);
      expect(contactLink.getAttribute('aria-current')).toBe(null);
    });
  });

  describe('Navigation with Custom Items', () => {
    it('should be accessible with custom navigation items', async () => {
      const customItems = [
        { label: 'Dashboard', href: '/dashboard', current: true },
        { label: 'Projects', href: '/projects' },
        { label: 'Team', href: '/team' },
        { label: 'Settings', href: '/settings' },
      ];

      const { container } = render(<Navigation items={customItems} />);
      await testAccessibility(container);
    });

    it('should handle custom current page', () => {
      const customItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Projects', href: '/projects', current: true },
        { label: 'Team', href: '/team' },
      ];

      const { container } = render(<Navigation items={customItems} />);

      const projectsLink = within(container).getByRole('link', { name: /projects/i });
      expect(projectsLink.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('Mobile Navigation Accessibility', () => {
    it('should have no accessibility violations when closed', async () => {
      const { container } = render(<MobileNavigation />);
      await testAccessibility(container);
    });

    it('should have no accessibility violations when open', async () => {
      const { container } = render(<MobileNavigation />);
      
      const toggleButton = within(container).getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);
      
      await testAccessibility(container);
    });

    it('should have proper mobile navigation structure', () => {
      const { container } = render(<MobileNavigation />);

      const nav = within(container).getByRole('navigation', { name: /mobile navigation/i });
      const toggleButton = within(container).getByRole('button', { name: /toggle mobile menu/i });

      expect(nav).toBeTruthy();
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should toggle mobile menu properly', () => {
      const { container } = render(<MobileNavigation />);

      const toggleButton = within(container).getByRole('button', { name: /toggle mobile menu/i });
      
      // Initially closed
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
      expect(within(container).queryByRole('menu')).not.toBeTruthy();

      // Open menu
      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
      expect(within(container).getByRole('menu')).toBeTruthy();

      // Close menu
      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
      expect(within(container).queryByRole('menu')).not.toBeTruthy();
    });

    it('should have proper menu items when open', () => {
      const { container } = render(<MobileNavigation />);

      const toggleButton = within(container).getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);

      const menu = within(container).getByRole('menu');
      const menuItems = within(container).getAllByRole('menuitem');

      expect(menu).toBeTruthy();
      expect(menuItems).toHaveLength(4);
      expect(menuItems[0].textContent).toBe('Home');
      expect(menuItems[1].textContent).toBe('About');
      expect(menuItems[2].textContent).toBe('Services');
      expect(menuItems[3].textContent).toBe('Contact');
    });
  });

  describe('Breadcrumb Navigation Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<BreadcrumbNavigation />);
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(<BreadcrumbNavigation />);
      await runAllAccessibilityTests(container);
    });

    it('should have proper breadcrumb structure', () => {
      const { container } = render(<BreadcrumbNavigation />);

      const nav = within(container).getByRole('navigation', { name: /breadcrumb/i });
      const list = within(container).getByRole('list');
      const links = within(container).getAllByRole('link');

      expect(nav).toBeTruthy();
      expect(list).toBeTruthy();
      expect(links).toHaveLength(2); // Only Home and Products have href
    });

    it('should indicate current page in breadcrumb', () => {
      const { container } = render(<BreadcrumbNavigation />);

      const currentPage = within(container).getByText('Current Page');
      expect(currentPage.getAttribute('aria-current')).toBe('page');
    });

    it('should have proper separators', () => {
      const { container } = render(<BreadcrumbNavigation />);

      const separators = within(container).getAllByText('/', { exact: false });
      expect(separators).toHaveLength(2); // Two separators for three items
    });
  });

  describe('Navigation Focus Management', () => {
    it('should handle keyboard navigation', () => {
      const { container } = render(<Navigation />);

      const homeLink = within(container).getByRole('link', { name: /home/i });
      const aboutLink = within(container).getByRole('link', { name: /about/i });
      const servicesLink = within(container).getByRole('link', { name: /services/i });

      // Check that links are present and focusable
      expect(homeLink).toBeTruthy();
      expect(aboutLink).toBeTruthy();
      expect(servicesLink).toBeTruthy();

      expect(homeLink.getAttribute('href')).toBe('/');
      expect(aboutLink.getAttribute('href')).toBe('/about');
      expect(servicesLink.getAttribute('href')).toBe('/services');
    });

    it('should handle mobile menu keyboard navigation', () => {
      const { container } = render(<MobileNavigation />);

      const toggleButton = within(container).getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);

      const menuItems = within(container).getAllByRole('menuitem');
      const firstMenuItem = menuItems[0];

      firstMenuItem.focus();
      expect(document.activeElement).toBe(firstMenuItem);
    });
  });

  describe('Navigation with ARIA Attributes', () => {
    it('should be accessible with custom ARIA labels', async () => {
      const { container } = render(
        <nav role="navigation" aria-label="Custom navigation">
          <ul>
            <li>
              <a href="/" aria-label="Go to home page">Home</a>
            </li>
            <li>
              <a href="/about" aria-label="Learn more about us">About</a>
            </li>
          </ul>
        </nav>
      );
      await testAccessibility(container);
    });

    it('should have proper ARIA relationships', () => {
      const { container } = render(
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li>
              <a href="/" aria-describedby="home-desc">Home</a>
              <span id="home-desc" className="sr-only">Main page</span>
            </li>
          </ul>
        </nav>
      );

      const homeLink = within(container).getByRole('link', { name: /home/i });
      const description = within(container).getByText('Main page');

      expect(homeLink.getAttribute('aria-describedby')).toBe('home-desc');
      expect(description.getAttribute('id')).toBe('home-desc');
    });
  });

  describe('Navigation with Skip Links', () => {
    it('should be accessible with skip links', async () => {
      const { container } = render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navigation />
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );
      await testAccessibility(container);
    });

    it('should have proper skip link structure', () => {
      const { container } = render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navigation />
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const skipLink = within(container).getByRole('link', { name: /skip to main content/i });
      const mainContent = within(container).getByRole('main');

      expect(skipLink.getAttribute('href')).toBe('#main-content');
      expect(mainContent.getAttribute('id')).toBe('main-content');
    });
  });

  describe('Navigation with Dropdown Menus', () => {
    const DropdownNavigation = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <nav role="navigation" aria-label="Navigation with dropdown">
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <button
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setIsOpen(!isOpen)}
              >
                Services
              </button>
              {isOpen && (
                <ul role="menu">
                  <li role="none">
                    <a href="/web-design" role="menuitem">Web Design</a>
                  </li>
                  <li role="none">
                    <a href="/development" role="menuitem">Development</a>
                  </li>
                  <li role="none">
                    <a href="/consulting" role="menuitem">Consulting</a>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </nav>
      );
    };

    it('should be accessible with dropdown menus', async () => {
      const { container } = render(<DropdownNavigation />);
      await testAccessibility(container);
    });

    it('should have proper dropdown structure', () => {
      const { container } = render(<DropdownNavigation />);

      const dropdownButton = within(container).getByRole('button', { name: /services/i });
      expect(dropdownButton.getAttribute('aria-expanded')).toBe('false');
      expect(dropdownButton.getAttribute('aria-haspopup')).toBe('true');
    });

    it('should toggle dropdown properly', () => {
      const { container } = render(<DropdownNavigation />);

      const dropdownButton = within(container).getByRole('button', { name: /services/i });
      
      // Initially closed
      expect(dropdownButton.getAttribute('aria-expanded')).toBe('false');
      expect(within(container).queryByRole('menu')).toBe(null);

      // Open dropdown
      fireEvent.click(dropdownButton);
      expect(dropdownButton.getAttribute('aria-expanded')).toBe('true');
      expect(within(container).getByRole('menu')).toBeTruthy();

      // Close dropdown
      fireEvent.click(dropdownButton);
      expect(dropdownButton.getAttribute('aria-expanded')).toBe('false');
      expect(within(container).queryByRole('menu')).toBe(null);
    });
  });
});
