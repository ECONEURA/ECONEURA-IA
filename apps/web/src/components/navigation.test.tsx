/**
 * Navigation Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test-utils/accessibility-helpers';
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
      render(<Navigation />);

      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const list = screen.getByRole('list');
      const links = screen.getAllByRole('link');

      expect(nav).toBeInTheDocument();
      expect(list).toBeInTheDocument();
      expect(links).toHaveLength(4);
    });

    it('should have proper link labels', () => {
      render(<Navigation />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });
      const servicesLink = screen.getByRole('link', { name: /services/i });
      const contactLink = screen.getByRole('link', { name: /contact/i });

      expect(homeLink).toBeInTheDocument();
      expect(aboutLink).toBeInTheDocument();
      expect(servicesLink).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
    });
  });

  describe('Current Page Indication', () => {
    it('should indicate current page properly', () => {
      render(<Navigation />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('should not indicate non-current pages', () => {
      render(<Navigation />);

      const aboutLink = screen.getByRole('link', { name: /about/i });
      const servicesLink = screen.getByRole('link', { name: /services/i });
      const contactLink = screen.getByRole('link', { name: /contact/i });

      expect(aboutLink).not.toHaveAttribute('aria-current');
      expect(servicesLink).not.toHaveAttribute('aria-current');
      expect(contactLink).not.toHaveAttribute('aria-current');
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

      render(<Navigation items={customItems} />);

      const projectsLink = screen.getByRole('link', { name: /projects/i });
      expect(projectsLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Mobile Navigation Accessibility', () => {
    it('should have no accessibility violations when closed', async () => {
      const { container } = render(<MobileNavigation />);
      await testAccessibility(container);
    });

    it('should have no accessibility violations when open', async () => {
      const { container } = render(<MobileNavigation />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);
      
      await testAccessibility(container);
    });

    it('should have proper mobile navigation structure', () => {
      render(<MobileNavigation />);

      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });

      expect(nav).toBeInTheDocument();
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should toggle mobile menu properly', () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      
      // Initially closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Close menu
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should have proper menu items when open', () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);

      const menu = screen.getByRole('menu');
      const menuItems = screen.getAllByRole('menuitem');

      expect(menu).toBeInTheDocument();
      expect(menuItems).toHaveLength(4);
      expect(menuItems[0]).toHaveTextContent('Home');
      expect(menuItems[1]).toHaveTextContent('About');
      expect(menuItems[2]).toHaveTextContent('Services');
      expect(menuItems[3]).toHaveTextContent('Contact');
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
      render(<BreadcrumbNavigation />);

      const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
      const list = screen.getByRole('list');
      const links = screen.getAllByRole('link');

      expect(nav).toBeInTheDocument();
      expect(list).toBeInTheDocument();
      expect(links).toHaveLength(2); // Only Home and Products have href
    });

    it('should indicate current page in breadcrumb', () => {
      render(<BreadcrumbNavigation />);

      const currentPage = screen.getByText('Current Page');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('should have proper separators', () => {
      render(<BreadcrumbNavigation />);

      const separators = screen.getAllByText('/', { exact: false });
      expect(separators).toHaveLength(2); // Two separators for three items
    });
  });

  describe('Navigation Focus Management', () => {
    it('should handle keyboard navigation', () => {
      render(<Navigation />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });
      const servicesLink = screen.getByRole('link', { name: /services/i });

      homeLink.focus();
      expect(homeLink).toHaveFocus();

      fireEvent.keyDown(homeLink, { key: 'Tab' });
      expect(aboutLink).toHaveFocus();

      fireEvent.keyDown(aboutLink, { key: 'Tab' });
      expect(servicesLink).toHaveFocus();
    });

    it('should handle mobile menu keyboard navigation', () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      fireEvent.click(toggleButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstMenuItem = menuItems[0];

      firstMenuItem.focus();
      expect(firstMenuItem).toHaveFocus();
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
      render(
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li>
              <a href="/" aria-describedby="home-desc">Home</a>
              <span id="home-desc" className="sr-only">Main page</span>
            </li>
          </ul>
        </nav>
      );

      const homeLink = screen.getByRole('link', { name: /home/i });
      const description = screen.getByText('Main page');

      expect(homeLink).toHaveAttribute('aria-describedby', 'home-desc');
      expect(description).toHaveAttribute('id', 'home-desc');
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
      render(
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

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      const mainContent = screen.getByRole('main');

      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(mainContent).toHaveAttribute('id', 'main-content');
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
      render(<DropdownNavigation />);

      const dropdownButton = screen.getByRole('button', { name: /services/i });
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
      expect(dropdownButton).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should toggle dropdown properly', () => {
      render(<DropdownNavigation />);

      const dropdownButton = screen.getByRole('button', { name: /services/i });
      
      // Initially closed
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Open dropdown
      fireEvent.click(dropdownButton);
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Close dropdown
      fireEvent.click(dropdownButton);
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
