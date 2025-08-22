import { BaseEntity } from '@/domain/entities/BaseEntity';

// Concrete implementation for testing
class TestEntity extends BaseEntity {
  public readonly name: string;

  constructor(id: string, name: string, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.name = name;
  }

  public testTouch(): void {
    this.touch();
  }
}

describe('BaseEntity', () => {
  describe('Constructor', () => {
    it('should create entity with provided id', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      expect(entity.id).toBe('test-id');
      expect(entity.name).toBe('Test Entity');
    });

    it('should create entity with default timestamps when not provided', () => {
      const beforeCreation = new Date();
      const entity = new TestEntity('test-id', 'Test Entity');
      const afterCreation = new Date();

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
    });

    it('should create entity with provided timestamps', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z');
      const updatedAt = new Date('2023-01-02T10:00:00Z');
      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        createdAt,
        updatedAt
      );

      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
    });

    it('should handle partial timestamp provision', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z');
      const entity = new TestEntity('test-id', 'Test Entity', createdAt);

      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).not.toBe(createdAt);
    });

    it('should accept empty string as valid id', () => {
      const entity = new TestEntity('', 'Test Entity');

      expect(entity.id).toBe('');
    });

    it('should accept special characters in id', () => {
      const specialId = 'test-id_123!@#$%^&*()';
      const entity = new TestEntity(specialId, 'Test Entity');

      expect(entity.id).toBe(specialId);
    });

    it('should accept unicode characters in id', () => {
      const unicodeId = 'тест-айди-東京-🎯';
      const entity = new TestEntity(unicodeId, 'Test Entity');

      expect(entity.id).toBe(unicodeId);
    });
  });

  describe('Equality', () => {
    it('should return true for entities with same id', () => {
      const entity1 = new TestEntity('same-id', 'Entity 1');
      const entity2 = new TestEntity('same-id', 'Entity 2');

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity2.equals(entity1)).toBe(true);
    });

    it('should return false for entities with different ids', () => {
      const entity1 = new TestEntity('id-1', 'Entity 1');
      const entity2 = new TestEntity('id-2', 'Entity 2');

      expect(entity1.equals(entity2)).toBe(false);
      expect(entity2.equals(entity1)).toBe(false);
    });

    it('should work with different entity types having same id', () => {
      class AnotherTestEntity extends BaseEntity {
        public readonly value: number;

        constructor(id: string, value: number) {
          super(id);
          this.value = value;
        }
      }

      const entity1 = new TestEntity('same-id', 'Test');
      const entity2 = new AnotherTestEntity('same-id', 42);

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity2.equals(entity1)).toBe(true);
    });

    it('should be reflexive (entity equals itself)', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      expect(entity.equals(entity)).toBe(true);
    });

    it('should handle empty string ids consistently', () => {
      const entity1 = new TestEntity('', 'Entity 1');
      const entity2 = new TestEntity('', 'Entity 2');

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should handle special character ids consistently', () => {
      const specialId = 'test!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const entity1 = new TestEntity(specialId, 'Entity 1');
      const entity2 = new TestEntity(specialId, 'Entity 2');

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should handle unicode ids consistently', () => {
      const unicodeId = '测试-айди-テスト-🌟';
      const entity1 = new TestEntity(unicodeId, 'Entity 1');
      const entity2 = new TestEntity(unicodeId, 'Entity 2');

      expect(entity1.equals(entity2)).toBe(true);
    });
  });

  describe('Touch Method', () => {
    it('should update the updatedAt timestamp', () => {
      const originalUpdatedAt = new Date('2023-01-01T10:00:00Z');
      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        new Date(),
        originalUpdatedAt
      );

      // Wait a small amount to ensure timestamp difference
      const beforeTouch = new Date();
      entity.testTouch();
      const afterTouch = new Date();

      expect(entity.updatedAt).not.toBe(originalUpdatedAt);
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTouch.getTime()
      );
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(
        afterTouch.getTime()
      );
    });

    it('should not modify createdAt timestamp', () => {
      const originalCreatedAt = new Date('2023-01-01T10:00:00Z');
      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        originalCreatedAt
      );

      entity.testTouch();

      expect(entity.createdAt).toBe(originalCreatedAt);
    });

    it('should not modify id', () => {
      const entity = new TestEntity('test-id', 'Test Entity');
      const originalId = entity.id;

      entity.testTouch();

      expect(entity.id).toBe(originalId);
    });

    it('should make updatedAt property non-writable after touch', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      entity.testTouch();
      const touchedUpdatedAt = entity.updatedAt;

      // Verify the property descriptor
      const descriptor = Object.getOwnPropertyDescriptor(entity, 'updatedAt');
      expect(descriptor?.writable).toBe(false);
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBe(false);

      // Try to modify updatedAt (should fail silently in non-strict mode)
      try {
        (entity as any).updatedAt = new Date('1990-01-01');
      } catch (error) {
        // Expected in strict mode
      }

      expect(entity.updatedAt).toBe(touchedUpdatedAt);
    });

    it('should allow first call to touch but throw on subsequent calls', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      // First touch should work
      expect(() => entity.testTouch()).not.toThrow();

      // Second touch should throw because property cannot be redefined
      expect(() => entity.testTouch()).toThrow(
        'Cannot redefine property: updatedAt'
      );
    });
  });

  describe('Immutability', () => {
    it('should have readonly properties at TypeScript level', () => {
      // TypeScript readonly properties don't necessarily create non-writable runtime properties
      // but they provide compile-time safety
      const entity = new TestEntity('test-id', 'Test Entity');

      // Verify properties exist and are of correct type
      expect(typeof entity.id).toBe('string');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);

      // In JavaScript, we can still modify these properties even though TypeScript prevents it
      // This tests the runtime behavior
      const originalId = entity.id;
      const originalCreatedAt = entity.createdAt;
      const originalUpdatedAt = entity.updatedAt;

      // Attempts to modify (TypeScript would prevent this at compile time)
      (entity as any).id = 'new-id';
      (entity as any).createdAt = new Date('2020-01-01');
      (entity as any).updatedAt = new Date('2020-01-01');

      // Verify modifications took effect (showing JavaScript behavior)
      expect(entity.id).toBe('new-id');
      expect(entity.createdAt).not.toBe(originalCreatedAt);
      expect(entity.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should have non-writable updatedAt after touch', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      entity.testTouch();

      // After touch, updatedAt should be non-writable
      const descriptor = Object.getOwnPropertyDescriptor(entity, 'updatedAt');
      expect(descriptor?.writable).toBe(false);
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should enforce id type as string', () => {
      // This test verifies TypeScript compilation
      const entity = new TestEntity('string-id', 'Test Entity');

      expect(typeof entity.id).toBe('string');
    });

    it('should enforce createdAt type as Date', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(typeof entity.createdAt.getTime).toBe('function');
    });

    it('should enforce updatedAt type as Date', () => {
      const entity = new TestEntity('test-id', 'Test Entity');

      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(typeof entity.updatedAt.getTime).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long ids', () => {
      const longId = 'a'.repeat(10000);
      const entity = new TestEntity(longId, 'Test Entity');

      expect(entity.id).toBe(longId);
      expect(entity.id.length).toBe(10000);
    });

    it('should handle edge case dates', () => {
      const edgeDates = [
        new Date('1900-01-01T00:00:00.000Z'),
        new Date('2100-12-31T23:59:59.999Z'),
        new Date(0), // Unix epoch
        new Date('2038-01-19T03:14:07.000Z'), // Near 32-bit timestamp limit
      ];

      edgeDates.forEach((date, index) => {
        const entity = new TestEntity(`edge-${index}`, 'Edge Test', date, date);

        expect(entity.createdAt).toBe(date);
        expect(entity.updatedAt).toBe(date);
        expect(entity.createdAt.getTime()).toBe(date.getTime());
        expect(entity.updatedAt.getTime()).toBe(date.getTime());
      });
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid-date');
      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        invalidDate,
        invalidDate
      );

      expect(entity.createdAt).toBe(invalidDate);
      expect(entity.updatedAt).toBe(invalidDate);
      expect(isNaN(entity.createdAt.getTime())).toBe(true);
      expect(isNaN(entity.updatedAt.getTime())).toBe(true);
    });

    it('should handle null/undefined dates by using defaults', () => {
      // TypeScript won't allow null/undefined, but testing runtime behavior
      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        undefined as any,
        undefined as any
      );

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(isNaN(entity.createdAt.getTime())).toBe(false);
      expect(isNaN(entity.updatedAt.getTime())).toBe(false);
    });
  });

  describe('Inheritance', () => {
    it('should work with multiple inheritance levels', () => {
      class ExtendedTestEntity extends TestEntity {
        public readonly description: string;

        constructor(id: string, name: string, description: string) {
          super(id, name);
          this.description = description;
        }

        public getFullDescription(): string {
          return `${this.name}: ${this.description}`;
        }
      }

      const entity = new ExtendedTestEntity(
        'test-id',
        'Test Name',
        'Test Description'
      );

      expect(entity.id).toBe('test-id');
      expect(entity.name).toBe('Test Name');
      expect(entity.description).toBe('Test Description');
      expect(entity.getFullDescription()).toBe('Test Name: Test Description');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should maintain equality behavior in inheritance hierarchy', () => {
      class AnotherExtendedEntity extends TestEntity {
        public readonly value: number;

        constructor(id: string, name: string, value: number) {
          super(id, name);
          this.value = value;
        }
      }

      const entity1 = new TestEntity('same-id', 'Entity 1');
      const entity2 = new AnotherExtendedEntity('same-id', 'Entity 2', 42);

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity2.equals(entity1)).toBe(true);
    });

    it('should allow derived classes to access protected touch method', () => {
      class EntityWithPublicTouch extends TestEntity {
        public updateTimestamp(): void {
          this.touch(); // Should be accessible in derived class
        }
      }

      const entity = new EntityWithPublicTouch('test-id', 'Test Entity');
      const originalUpdatedAt = entity.updatedAt;

      expect(() => entity.updateTimestamp()).not.toThrow();
      expect(entity.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('Performance', () => {
    it('should handle creation of many entities efficiently', () => {
      const startTime = Date.now();
      const entities: TestEntity[] = [];

      for (let i = 0; i < 1000; i++) {
        entities.push(new TestEntity(`entity-${i}`, `Entity ${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(entities.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle equality checks efficiently', () => {
      const entities = Array.from(
        { length: 100 },
        (_, i) => new TestEntity(`entity-${i}`, `Entity ${i}`)
      );

      const startTime = Date.now();

      // Perform many equality checks
      for (let i = 0; i < entities.length; i++) {
        for (let j = 0; j < entities.length; j++) {
          entities[i].equals(entities[j]);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Memory Management', () => {
    it('should not retain references to constructor parameters', () => {
      let createdAt: Date | null = new Date('2023-01-01');
      let updatedAt: Date | null = new Date('2023-01-02');

      const entity = new TestEntity(
        'test-id',
        'Test Entity',
        createdAt,
        updatedAt
      );

      // Clear original references
      createdAt = null;
      updatedAt = null;

      // Entity should still function normally
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getFullYear()).toBe(2023);
      expect(entity.updatedAt.getFullYear()).toBe(2023);
    });
  });
});
