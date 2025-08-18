import { AtBat } from '@/domain/entities/AtBat';

/**
 * Application layer repository interface for AtBat entities
 * Defines the contract for at-bat data persistence
 */
export interface IAtBatRepository {
  /**
   * Save an at-bat record (create or update)
   */
  save(atBat: AtBat): Promise<AtBat>;

  /**
   * Find an at-bat by ID
   */
  findById(id: string): Promise<AtBat | null>;

  /**
   * Find at-bats by game ID
   */
  findByGameId(gameId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by batter ID
   */
  findByBatterId(batterId: string): Promise<AtBat[]>;

  /**
   * Find at-bats for a specific inning
   */
  findByInning(
    gameId: string,
    inning: number,
    isTopInning?: boolean
  ): Promise<AtBat[]>;

  /**
   * Find at-bats by result type
   */
  findByResult(gameId: string, resultType: string): Promise<AtBat[]>;

  /**
   * Delete an at-bat record
   */
  delete(id: string): Promise<void>;

  /**
   * Get at-bat statistics for a player in a game
   */
  getPlayerStats(
    gameId: string,
    playerId: string
  ): Promise<{
    atBats: number;
    hits: number;
    runs: number;
    rbis: number;
  }>;
}
