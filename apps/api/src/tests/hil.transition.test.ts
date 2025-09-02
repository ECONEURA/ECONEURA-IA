import { describe, it, expect } from 'vitest';
import { canTransition } from '../hil/service.js';

describe('HIL state transitions', () => {
  it('allows valid transitions', () => {
    expect(canTransition('draft', 'pending_approval')).toBe(true);
    expect(canTransition('pending_approval', 'approved')).toBe(true);
    expect(canTransition('approved', 'dispatched')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('draft', 'approved')).toBe(false);
    expect(canTransition('completed', 'draft')).toBe(false);
  });
});
