import { Game, Inning } from '../entities';
import { GameStatus } from '../entities/Game';

/**
 * Repository interface for Game entity operations
 */
export interface GameRepository {
  /**
   * Find game by ID
   */
  findById(id: string): Promise<Game | null>;

  /**
   * Find all games
   */
  findAll(): Promise<Game[]>;

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
   * Find incomplete games (setup, in_progress, suspended)
   */
  findIncompleteGames(): Promise<Game[]>;

  /**
   * Find recent games (limited number, most recent first)
   */
  findRecentGames(limit: number, teamId?: string): Promise<Game[]>;

  /**
   * Create a new game
   */
  create(game: Game): Promise<Game>;

  /**
   * Update an existing game
   */
  update(game: Game): Promise<Game>;

  /**
   * Delete a game
   */
  delete(id: string): Promise<void>;

  /**
   * Check if game exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get games within a date range
   */
  findByDateRange(startDate: Date, endDate: Date, teamId?: string): Promise<Game[]>;

  /**
   * Find games by opponent
   */
  findByOpponent(opponent: string, teamId?: string): Promise<Game[]>;

  /**
   * Get game with innings
   */
  findWithInnings(gameId: string): Promise<{ game: Game; innings: Inning[] } | null>;

  /**
   * Get game statistics summary
   */
  getGameStatistics(gameId: string): Promise<{
    totalAtBats: number;
    totalHits: number;
    totalRuns: number;
    totalInnings: number;
  } | null>;
}