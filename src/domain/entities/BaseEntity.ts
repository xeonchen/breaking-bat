/**
 * Base entity class for all domain entities.
 * Provides common properties and methods for domain objects.
 */
export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Check if this entity is equal to another entity
   */
  public equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }

  /**
   * Update the entity's timestamp
   */
  protected touch(): void {
    (this as any).updatedAt = new Date();
  }
}
