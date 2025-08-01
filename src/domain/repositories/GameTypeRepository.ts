import { GameType } from '../entities';

/**
 * Repository interface for GameType entity operations
 */
export interface GameTypeRepository {
  /**
   * Save (create or update) a game type
   */
  save(gameType: GameType): Promise<GameType>;

  /**
   * Find game type by ID
   */
  findById(id: string): Promise<GameType | null>;

  /**
   * Find all game types
   */
  findAll(): Promise<GameType[]>;

  /**
   * Find game type by name
   */
  findByName(name: string): Promise<GameType | null>;

  /**
   * Delete a game type
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a game type name already exists
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Search game types by name or description
   */
  search(query: string): Promise<GameType[]>;

  /**
   * Get game types ordered by name
   */
  findAllOrderedByName(): Promise<GameType[]>;
}
