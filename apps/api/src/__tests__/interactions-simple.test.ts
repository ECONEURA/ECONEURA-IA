import { describe, it, expect } from 'vitest';
import { CreateInteractionSchema, UpdateInteractionSchema } from '@econeura/shared/schemas/crm';

describe('Interactions Schemas', () => {
  describe('CreateInteractionSchema', () => {
    it('should validate a valid interaction', () => {
      const validInteraction = {
        type: 'email' as const,
        subject: 'Test Email',
        content: 'This is a test email',
        status: 'pending' as const,
        priority: 'medium' as const,
        company_id: 'test-company-123',
        contact_id: 'test-contact-123',
        deal_id: 'test-deal-123',
        due_date: new Date().toISOString(),
        assigned_to: 'test-user-123'
      };

      const result = CreateInteractionSchema.safeParse(validInteraction);
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should require type field', () => {
      const invalidInteraction = {
        subject: 'Test Email',
        content: 'This is a test email'
      };

      const result = CreateInteractionSchema.safeParse(invalidInteraction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('type'))).toBe(true);
      }
    });

    it('should validate enum values', () => {
      const invalidInteraction = {
        type: 'invalid_type',
        subject: 'Test Email'
      };

      const result = CreateInteractionSchema.safeParse(invalidInteraction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('type'))).toBe(true);
      }
    });
  });

  describe('UpdateInteractionSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        subject: 'Updated Subject',
        status: 'completed' as const
      };

      const result = UpdateInteractionSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate enum values in updates', () => {
      const invalidUpdate = {
        type: 'invalid_type'
      };

      const result = UpdateInteractionSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('type'))).toBe(true);
      }
    });

    it('should allow empty object', () => {
      const emptyUpdate = {};

      const result = UpdateInteractionSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });
});
