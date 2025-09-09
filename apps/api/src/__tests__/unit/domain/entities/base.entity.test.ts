// ============================================================================
// BASE ENTITY TESTS - Tests unitarios para la entidad base
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseEntity, BaseEntityId, BaseEntityProps } from '../../../domain/entities/base.entity.js';

// ========================================================================
// ENTIDAD DE PRUEBA
// ========================================================================

class TestEntity extends BaseEntity {
  constructor(props: BaseEntityProps) {
    super(props);
  }

  // Método público para testing
  public validate(): boolean {
    return this.validateBase();
  }

  // Método público para testing
  public updateTimestamp(): void {
    super.updateTimestamp();
  }
}

// ========================================================================
// TESTS
// ========================================================================

describe('BaseEntity', () => {
  let testEntity: TestEntity;
  let validProps: BaseEntityProps;

  beforeEach(() => {
    validProps = {
      id: { value: crypto.randomUUID() },
      organizationId: { value: crypto.randomUUID() },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    testEntity = new TestEntity(validProps);
  });

  describe('Constructor', () => {
    it('should create entity with valid props', () => {
      expect(testEntity).toBeDefined();
      expect(testEntity.id).toEqual(validProps.id);
      expect(testEntity.organizationId).toEqual(validProps.organizationId);
      expect(testEntity.isActive).toBe(true);
      expect(testEntity.createdAt).toEqual(validProps.createdAt);
      expect(testEntity.updatedAt).toEqual(validProps.updatedAt);
    });
  });

  describe('Getters', () => {
    it('should return correct id', () => {
      expect(testEntity.id).toEqual(validProps.id);
    });

    it('should return correct organizationId', () => {
      expect(testEntity.organizationId).toEqual(validProps.organizationId);
    });

    it('should return correct isActive status', () => {
      expect(testEntity.isActive).toBe(true);
    });

    it('should return correct createdAt', () => {
      expect(testEntity.createdAt).toEqual(validProps.createdAt);
    });

    it('should return correct updatedAt', () => {
      expect(testEntity.updatedAt).toEqual(validProps.updatedAt);
    });
  });

  describe('activate()', () => {
    it('should activate entity and update timestamp', () => {
      const originalUpdatedAt = testEntity.updatedAt;

      testEntity.activate();

      expect(testEntity.isActive).toBe(true);
      expect(testEntity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('deactivate()', () => {
    it('should deactivate entity and update timestamp', () => {
      const originalUpdatedAt = testEntity.updatedAt;

      testEntity.deactivate();

      expect(testEntity.isActive).toBe(false);
      expect(testEntity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('validateBase()', () => {
    it('should return true for valid entity', () => {
      expect(testEntity.validate()).toBe(true);
    });

    it('should return false for entity without id', () => {
      const invalidProps = { ...validProps, id: { value: '' } };
      const invalidEntity = new TestEntity(invalidProps);

      expect(invalidEntity.validate()).toBe(false);
    });

    it('should return false for entity without organizationId', () => {
      const invalidProps = { ...validProps, organizationId: { value: '' } };
      const invalidEntity = new TestEntity(invalidProps);

      expect(invalidEntity.validate()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('should return correct JSON representation', () => {
      const json = testEntity.toJSON();

      expect(json).toEqual(validProps);
      expect(json.id).toEqual(validProps.id);
      expect(json.organizationId).toEqual(validProps.organizationId);
      expect(json.isActive).toBe(true);
    });
  });

  describe('Static methods', () => {
    describe('generateId()', () => {
      it('should generate valid UUID', () => {
        const id = BaseEntity.generateId();

        expect(id).toHaveProperty('value');
        expect(typeof id.value).toBe('string');
        expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate unique IDs', () => {
        const id1 = BaseEntity.generateId();
        const id2 = BaseEntity.generateId();

        expect(id1.value).not.toBe(id2.value);
      });
    });

    describe('getCurrentTimestamp()', () => {
      it('should return current date', () => {
        const timestamp = BaseEntity.getCurrentTimestamp();

        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null id value', () => {
      const invalidProps = { ...validProps, id: { value: null as any } };
      const invalidEntity = new TestEntity(invalidProps);

      expect(invalidEntity.validate()).toBe(false);
    });

    it('should handle null organizationId value', () => {
      const invalidProps = { ...validProps, organizationId: { value: null as any } };
      const invalidEntity = new TestEntity(invalidProps);

      expect(invalidEntity.validate()).toBe(false);
    });

    it('should handle undefined id', () => {
      const invalidProps = { ...validProps, id: undefined as any };
      const invalidEntity = new TestEntity(invalidProps);

      expect(invalidEntity.validate()).toBe(false);
    });
  });
});

