import { BaseEntity } from './BaseEntity';

/**
 * GameType domain entity representing different types of games
 * (Regular Season, Playoffs, Tournament, etc.)
 */
export class GameType extends BaseEntity {
  public readonly name: string;
  public readonly description: string;

  constructor(
    id: string,
    name: string,
    description: string = '',
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!name.trim()) {
      throw new Error('Game type name cannot be empty');
    }

    if (name.length > 100) {
      throw new Error('Game type name cannot exceed 100 characters');
    }

    if (description.length > 500) {
      throw new Error('Game type description cannot exceed 500 characters');
    }

    this.name = name.trim();
    this.description = description.trim();
  }

  /**
   * Update the game type name and description
   */
  public update(name: string, description: string = ''): GameType {
    return new GameType(this.id, name, description, this.createdAt, new Date());
  }

  /**
   * Check if the game type has a description
   */
  public hasDescription(): boolean {
    return this.description.length > 0;
  }

  /**
   * Get a display name for the game type
   */
  public getDisplayName(): string {
    return this.name;
  }

  /**
   * Get a summary including description if available
   */
  public getSummary(): string {
    if (this.hasDescription()) {
      return `${this.name}: ${this.description}`;
    }
    return this.name;
  }
}
