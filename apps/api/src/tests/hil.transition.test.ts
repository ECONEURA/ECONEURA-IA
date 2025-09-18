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

  it('returns false for undefined or null states', () => {
    expect(canTransition(undefined, 'pending_approval')).toBe(false);
    expect(canTransition('draft', null)).toBe(false);
  });

  it('rejects non-string inputs', () => {
    expect(canTransition(123, 'pending_approval')).toBe(false);
    expect(canTransition('draft', {})).toBe(false);
  });

  describe('Additional Improvements', () => {
    it('rejects empty string states', () => {
      expect(canTransition('' as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
      expect(canTransition('draft' as HilState, '' as unknown as HilState)).toBe(false);
    });

    it('is case sensitive', () => {
      expect(canTransition('Draft' as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
      expect(canTransition('draft' as HilState, 'Pending_approval' as unknown as HilState)).toBe(false);
    });

    it('returns false for states not defined in transitions', () => {
      expect(canTransition('nonexistent' as unknown as HilState, 'approved' as HilState)).toBe(false);
    });

    it('is consistent across multiple invocations', () => {
      const result1 = canTransition('pending_approval', 'approved');
      const result2 = canTransition('pending_approval', 'approved');
      expect(result1).toBe(result2);
    });
  });

  describe('Edge Case Improvements', () => {
    it('rejects whitespace-only states', () => {
      expect(canTransition('   ' as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
      expect(canTransition('draft' as HilState, '   ' as unknown as HilState)).toBe(false);
    });

    it('rejects states with leading or trailing whitespace', () => {
      expect(canTransition(' draft' as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
      expect(canTransition('draft' as HilState, 'pending_approval ' as unknown as HilState)).toBe(false);
    });

    it('handles chained valid transitions', () => {
      let currentState: HilState = 'draft';
      const transitions = ['pending_approval', 'approved', 'dispatched'];
      transitions.forEach(targetState => {
        expect(canTransition(currentState, targetState as HilState)).toBe(true);
        currentState = targetState as HilState;
      });
      // After chaining, no further valid transition should exist
      expect(canTransition(currentState, 'draft' as HilState)).toBe(false);
    });

    it('rejects null states', () => {
      // force through unknown cast to simulate runtime nulls while satisfying TS
      expect(canTransition(null as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
      expect(canTransition('draft' as HilState, null as unknown as HilState)).toBe(false);
    });

    it('rejects states with extra inner spaces', () => {
      // Even if trimmed, internal extra spaces make it invalid
  expect(canTransition('d r a f t' as unknown as HilState, 'pending_approval' as HilState)).toBe(false);
  expect(canTransition('draft' as HilState, 'pending  approval' as unknown as HilState)).toBe(false);
    });
  });

  describe('Table driven state tests', () => {
    const cases = [
      { from: 'draft', to: 'pending_approval', expected: true },
      { from: 'pending_approval', to: 'approved', expected: true },
      { from: 'approved', to: 'dispatched', expected: true },
      { from: 'approved', to: 'draft', expected: false },
      { from: 'foo', to: 'bar', expected: false }
    ];

    cases.forEach(({ from, to, expected }) => {
      it(`from '${from}' to '${to}' should be ${expected}`, () => {
  expect(canTransition(from as HilState, to as HilState)).toBe(expected);
      });
    });
  });
});
