// FSM Unit Tests - ECONEURA Cockpit
import { describe, it, expect } from 'vitest';
import { can, getStatusColor, getStatusLabel } from '@/lib/fsm';

describe('FSM', () => {
  describe('can', () => {
    it('should allow transitions from idle to running and paused', () => {
      expect(can('idle', 'running')).toBe(true);
      expect(can('idle', 'paused')).toBe(true);
      expect(can('idle', 'completed')).toBe(false);
    });

    it('should allow transitions from running to all valid states', () => {
      expect(can('running', 'hitl_wait')).toBe(true);
      expect(can('running', 'completed')).toBe(true);
      expect(can('running', 'warning')).toBe(true);
      expect(can('running', 'failed')).toBe(true);
      expect(can('running', 'paused')).toBe(true);
      expect(can('running', 'idle')).toBe(false);
    });

    it('should allow transitions from completed back to running or idle', () => {
      expect(can('completed', 'running')).toBe(true);
      expect(can('completed', 'idle')).toBe(true);
      expect(can('completed', 'failed')).toBe(false);
    });

    it('should allow transitions from failed back to running or idle', () => {
      expect(can('failed', 'running')).toBe(true);
      expect(can('failed', 'idle')).toBe(true);
      expect(can('failed', 'completed')).toBe(false);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor('idle')).toBe('#6B7280');
      expect(getStatusColor('running')).toBe('#3B82F6');
      expect(getStatusColor('hitl_wait')).toBe('#F59E0B');
      expect(getStatusColor('completed')).toBe('#10B981');
      expect(getStatusColor('warning')).toBe('#F59E0B');
      expect(getStatusColor('failed')).toBe('#EF4444');
      expect(getStatusColor('paused')).toBe('#8B5CF6');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect(getStatusLabel('idle')).toBe('Inactivo');
      expect(getStatusLabel('running')).toBe('Ejecutando');
      expect(getStatusLabel('hitl_wait')).toBe('Esperando intervención');
      expect(getStatusLabel('completed')).toBe('Completado');
      expect(getStatusLabel('warning')).toBe('Advertencia');
      expect(getStatusLabel('failed')).toBe('Fallido');
      expect(getStatusLabel('paused')).toBe('Pausado');
    });
  });
});
