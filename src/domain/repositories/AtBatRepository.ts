import { AtBat, PlayerStatistics } from '../entities';

/**
 * Repository interface for AtBat entity operations
 */
export interface AtBatRepository {
  /**
   * Save (create or update) an at-bat
   */
  save(atBat: AtBat): Promise<AtBat>;

  /**
   * Find at-bat by ID
   */
  findById(id: string): Promise<AtBat | null>;

  /**
   * Find at-bats by game ID
   */
  findByGameId(gameId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by inning ID
   */
  findByInningId(inningId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by batter ID
   */
  findByBatterId(batterId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by batting position in a game
   */
  findByBattingPosition(gameId: string, position: number): Promise<AtBat[]>;

  /**
   * Delete an at-bat
   */
  delete(id: string): Promise<void>;

  /**
   * Get player statistics from at-bats
   */
  getPlayerStatistics(batterId: string): Promise<PlayerStatistics>;

  /**
   * Get game-wide statistics
   */
  getGameStatistics(gameId: string): Promise<{
    totalAtBats: number;
    totalHits: number;
    totalRuns: number;
    totalRBIs: number;
    teamBattingAverage: number;
  }>;

  /**
   * Find only at-bats that resulted in hits
   */
  findHitsOnly(gameId: string): Promise<AtBat[]>;

  /**
   * Find at-bats that produced RBIs
   */
  findWithRBIs(gameId: string): Promise<AtBat[]>;

  /**
   * Find at-bats that involved running errors
   */
  findWithRunningErrors(gameId: string): Promise<AtBat[]>;

  /**
   * Get running error statistics for a player
   */
  getPlayerRunningErrorStats(batterId: string): Promise<{
    totalRunningErrors: number;
    gamesWithRunningErrors: number;
    atBatsWithRunningErrors: number;
  }>;
}
