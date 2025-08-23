import { Game } from '@/domain/entities/Game';

export interface LineupData {
  lineupId: string;
  playerIds: string[];
  defensivePositions: string[];
}

/**
 * Repository interface for Game entities
 * Defines the contract for game data persistence
 */
export interface IGameRepository {
  /**
   * Find a game by its ID
   */
  findById(id: string): Promise<Game | null>;

  /**
   * Find the current active game
   */
  findCurrent(): Promise<Game | null>;

  /**
   * Save a game (create or update)
   */
  save(game: Game): Promise<Game>;

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
  findByStatus(status: string): Promise<Game[]>;

  /**
   * Delete a game
   */
  delete(id: string): Promise<void>;

  /**
   * Get lineup for a game
   */
  getLineup(lineupId: string): Promise<string[]>;

  /**
   * Save lineup for a game
   */
  saveLineup(gameId: string, lineupData: LineupData): Promise<void>;
}
