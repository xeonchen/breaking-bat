import { Game } from '../entities';
import { GameStatus, GameScore } from '../entities/Game';

/**
 * Repository interface for Game entity operations
 */
export interface GameRepository {
  /**
   * Save (create or update) a game
   */
  save(game: Game): Promise<Game>;

  /**
   * Find game by ID
   */
  findById(id: string): Promise<Game | null>;

  /**
   * Find all games
   */
  findAll(): Promise<Game[]>;

  /**
   * Find current active game
   */
  findCurrent(): Promise<Game | null>;

  /**
   * Get lineup for a game
   */
  getLineup(gameId: string): Promise<string[]>;

  /**
   * Find games by team ID
   */
  findByTeamId(teamId: string): Promise<Game[]>;

  /**
   * Find games by season ID
   */
  findBySeasonId(seasonId: string): Promise<Game[]>;

  /**
   * Find games by status
   */
  findByStatus(status: GameStatus): Promise<Game[]>;

  /**
   * Get games within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Game[]>;

  /**
   * Find active games (in_progress status)
   */
  findActiveGames(): Promise<Game[]>;

  /**
   * Delete a game
   */
  delete(id: string): Promise<void>;

  /**
   * Add an inning to a game
   */
  addInning(gameId: string, inningId: string): Promise<Game>;

  /**
   * Update game score
   */
  updateScore(gameId: string, score: GameScore): Promise<Game>;

  /**
   * Search games by name or opponent
   */
  search(query: string): Promise<Game[]>;

  /**
   * Get game statistics summary
   */
  getGameStatistics(gameId: string): Promise<{
    totalRuns: number;
    ourScore: number;
    opponentScore: number;
    result: 'W' | 'L' | 'T';
    inningsPlayed: number;
  }>;
}
