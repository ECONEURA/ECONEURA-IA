/**
 * Form Component Accessibility Tests
 * PR-99: Cobertura UI & Axe - Tests RTL y accesibilidad para Form
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../test-utils/accessibility-helpers';
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

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => (e: Event) => {
      e.preventDefault();
      fn({});
    }),
    formState: { errors: {} },
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
  }),
  Controller: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } }),
}));

describe('Form Component Accessibility', () => {
  describe('Basic Form Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" name="email" required />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" required />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );
      await testAccessibility(container);
    });

    it('should pass all accessibility tests', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" name="email" required />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" required />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );
      await runAllAccessibilityTests(container);
    });

    it('should have proper form structure', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" name="email" required />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );

      const form = container.querySelector('form');
      const emailInput = container.querySelector('input#email[type="email"]');
      const submitButton = within(container).getByRole('button', { name: /submit/i });

      expect(form).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Form Input Types', () => {
    it('should be accessible with text input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" name="name" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with email input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with password input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with number input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="age">Age</label>
            <input id="age" type="number" name="age" min="0" max="120" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with tel input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" name="phone" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with url input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="website">Website</label>
            <input id="website" type="url" name="website" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should be accessible with date input', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="birthdate">Birth Date</label>
            <input id="birthdate" type="date" name="birthdate" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });
  });

  describe('Form with Select Elements', () => {
    it('should be accessible with select dropdown', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="country">Country</label>
            <select id="country" name="country">
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="mx">Mexico</option>
            </select>
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper select structure', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="country">Country</label>
            <select id="country" name="country">
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
            </select>
          </div>
        </form>
      );

      const select = container.querySelector('select#country');
      expect(select).toBeTruthy();
    });
  });

  describe('Form with Textarea', () => {
    it('should be accessible with textarea', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={4} cols={50}></textarea>
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper textarea structure', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={4} cols={50}></textarea>
          </div>
        </form>
      );

      const textarea = container.querySelector('textarea#message');
      expect(textarea).toBeTruthy();
    });
  });

  describe('Form with Checkboxes', () => {
    it('should be accessible with checkboxes', async () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Preferences</legend>
            <div>
              <input id="newsletter" type="checkbox" name="newsletter" />
              <label htmlFor="newsletter">Subscribe to newsletter</label>
            </div>
            <div>
              <input id="updates" type="checkbox" name="updates" />
              <label htmlFor="updates">Receive updates</label>
            </div>
          </fieldset>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper checkbox structure', () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Preferences</legend>
            <div>
              <input id="newsletter" type="checkbox" name="newsletter" />
              <label htmlFor="newsletter">Subscribe to newsletter</label>
            </div>
          </fieldset>
        </form>
      );

      const checkbox = container.querySelector('input#newsletter[type="checkbox"]');
      expect(checkbox).toBeTruthy();
    });
  });

  describe('Form with Radio Buttons', () => {
    it('should be accessible with radio buttons', async () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Gender</legend>
            <div>
              <input id="male" type="radio" name="gender" value="male" />
              <label htmlFor="male">Male</label>
            </div>
            <div>
              <input id="female" type="radio" name="gender" value="female" />
              <label htmlFor="female">Female</label>
            </div>
            <div>
              <input id="other" type="radio" name="gender" value="other" />
              <label htmlFor="other">Other</label>
            </div>
          </fieldset>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper radio button structure', () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Gender</legend>
            <div>
              <label htmlFor="male">Male</label>
              <input id="male" type="radio" name="gender" value="male" />
            </div>
            <div>
              <label htmlFor="female">Female</label>
              <input id="female" type="radio" name="gender" value="female" />
            </div>
          </fieldset>
        </form>
      );

      const maleRadio = container.querySelector('input#male[type="radio"]');
      const femaleRadio = container.querySelector('input#female[type="radio"]');
      
      expect(maleRadio).toBeTruthy();
      expect(femaleRadio).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should be accessible with required fields', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address *</label>
            <input id="email" type="email" name="email" required aria-required="true" />
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper required field indicators', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address *</label>
            <input id="email" type="email" name="email" required aria-required="true" />
          </div>
        </form>
      );

      const input = container.querySelector('input#email[type="email"]');
      expect(input?.getAttribute('required')).toBe('');
      expect(input?.getAttribute('aria-required')).toBe('true');
    });

    it('should be accessible with field validation messages', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              name="email" 
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" role="alert">
              Please enter a valid email address
            </div>
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper error message associations', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              name="email" 
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" role="alert">
              Please enter a valid email address
            </div>
          </div>
        </form>
      );

      const input = container.querySelector('input#email[type="email"]');
      const errorMessage = container.querySelector('div#email-error[role="alert"]');
      
      expect(input?.getAttribute('aria-invalid')).toBe('true');
      expect(input?.getAttribute('aria-describedby')).toBe('email-error');
      expect(errorMessage?.getAttribute('id')).toBe('email-error');
    });
  });

  describe('Form with Help Text', () => {
    it('should be accessible with help text', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              name="password"
              aria-describedby="password-help"
            />
            <div id="password-help">
              Password must be at least 8 characters long
            </div>
          </div>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper help text associations', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              name="password"
              aria-describedby="password-help"
            />
            <div id="password-help">
              Password must be at least 8 characters long
            </div>
          </div>
        </form>
      );

      const input = container.querySelector('input#password[type="password"]');
      const helpText = within(container).getByText(/password must be at least 8 characters long/i);
      
      expect(input?.getAttribute('aria-describedby')).toBe('password-help');
      expect(helpText?.getAttribute('id')).toBe('password-help');
    });
  });

  describe('Form Submission', () => {
    it('should be accessible with submit button', async () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
          </div>
          <Button type="submit">Submit Form</Button>
        </form>
      );
      await testAccessibility(container);
    });

    it('should handle form submission accessibly', async () => {
      const handleSubmit = vi.fn();

      const { container } = render(
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
          </div>
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Form with Complex Layout', () => {
    it('should be accessible with multiple sections', async () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Personal Information</legend>
            <div>
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" type="text" name="firstName" />
            </div>
            <div>
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" type="text" name="lastName" />
            </div>
          </fieldset>
          
          <fieldset>
            <legend>Contact Information</legend>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" />
            </div>
            <div>
              <label htmlFor="phone">Phone</label>
              <input id="phone" type="tel" name="phone" />
            </div>
          </fieldset>
          
          <Button type="submit">Submit</Button>
        </form>
      );
      await testAccessibility(container);
    });

    it('should have proper fieldset structure', () => {
      const { container } = render(
        <form>
          <fieldset>
            <legend>Personal Information</legend>
            <div>
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" type="text" name="firstName" />
            </div>
          </fieldset>
        </form>
      );

      const fieldset = within(container).getByRole('group', { name: /personal information/i });
      expect(fieldset).toBeTruthy();
    });
  });

  describe('Form Focus Management', () => {
    it('should handle tab order correctly', () => {
      const { container } = render(
        <form>
          <div>
            <label htmlFor="field1">Field 1</label>
            <input id="field1" type="text" name="field1" />
          </div>
          <div>
            <label htmlFor="field2">Field 2</label>
            <input id="field2" type="text" name="field2" />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      );

      const field1 = container.querySelector('input#field1') as HTMLInputElement;
      const field2 = container.querySelector('input#field2') as HTMLInputElement;
      const submitButton = within(container).getByRole('button', { name: /submit/i });

      // Verify elements are focusable and in correct tab order
      expect(field1).toBeTruthy();
      expect(field2).toBeTruthy();
      expect(submitButton).toBeTruthy();

      // Verify elements don't have tabindex that would interfere with natural order
      expect(field1.getAttribute('tabindex')).toBeNull();
      expect(field2.getAttribute('tabindex')).toBeNull();
      expect(submitButton.getAttribute('tabindex')).toBeNull();
    });
  });
});
