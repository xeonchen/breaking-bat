import { AtBat } from '../entities';

/**
 * Repository interface for AtBat entity operations
 */
export interface AtBatRepository {
  /**
   * Find at-bat by ID
   */
  findById(id: string): Promise<AtBat | null>;

  /**
   * Find all at-bats
   */
  findAll(): Promise<AtBat[]>;

  /**
   * Find at-bats by game ID
   */
  findByGameId(gameId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by inning ID
   */
  findByInningId(inningId: string): Promise<AtBat[]>;

  /**
   * Find at-bats by player ID
   */
  findByPlayerId(playerId: string): Promise<AtBat[]>;

  /**
   * Get at-bats for a player in a specific game
   */
  findByPlayerAndGame(playerId: string, gameId: string): Promise<AtBat[]>;

  /**
   * Create a new at-bat
   */
  create(atBat: AtBat): Promise<AtBat>;

  /**
   * Update an existing at-bat
   */
  update(atBat: AtBat): Promise<AtBat>;

  /**
   * Delete an at-bat
   */
  delete(id: string): Promise<void>;

  /**
   * Check if at-bat exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get the last at-bat for a game
   */
  getLastAtBat(gameId: string): Promise<AtBat | null>;

  /**
   * Get at-bat sequence for a game (chronological order)
   */
  getAtBatSequence(gameId: string): Promise<AtBat[]>;

  /**
   * Get at-bats by batting result
   */
  findByResult(result: string, gameId?: string): Promise<AtBat[]>;

  /**
   * Count at-bats for statistics
   */
  countByPlayer(playerId: string, gameId?: string): Promise<number>;
}