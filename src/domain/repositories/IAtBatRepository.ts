import { AtBat } from '../entities/AtBat';

/**
 * Repository interface for AtBat entities
 */
export interface IAtBatRepository {
  /**
   * Save an at-bat record
   */
  save(atBat: AtBat): Promise<void>;

  /**
   * Find at-bats by game ID
   */
  findByGameId(gameId: string): Promise<AtBat[]>;

  /**
   * Find an at-bat by ID
   */
  findById(id: string): Promise<AtBat | null>;

  /**
   * Delete an at-bat record
   */
  delete(id: string): Promise<void>;

  /**
   * Find at-bats by batter ID
   */
  findByBatterId(batterId: string): Promise<AtBat[]>;

  /**
   * Find at-bats for a specific inning
   */
  findByInning(gameId: string, inning: number): Promise<AtBat[]>;
}
