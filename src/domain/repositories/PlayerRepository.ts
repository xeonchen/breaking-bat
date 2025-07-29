import { Player } from '../entities';

/**
 * Repository interface for Player entity operations
 */
export interface PlayerRepository {
  /**
   * Find player by ID
   */
  findById(id: string): Promise<Player | null>;

  /**
   * Find all players
   */
  findAll(): Promise<Player[]>;

  /**
   * Find players by team ID
   */
  findByTeamId(teamId: string): Promise<Player[]>;

  /**
   * Find active players by team ID
   */
  findActiveByTeamId(teamId: string): Promise<Player[]>;

  /**
   * Find player by jersey number within a team
   */
  findByJerseyNumber(teamId: string, jerseyNumber: number): Promise<Player | null>;

  /**
   * Create a new player
   */
  create(player: Player): Promise<Player>;

  /**
   * Update an existing player
   */
  update(player: Player): Promise<Player>;

  /**
   * Delete a player
   */
  delete(id: string): Promise<void>;

  /**
   * Check if player exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if jersey number is unique within a team
   */
  isJerseyNumberUnique(teamId: string, jerseyNumber: number, excludePlayerId?: string): Promise<boolean>;

  /**
   * Search players by name (partial match)
   */
  searchByName(query: string, teamId?: string): Promise<Player[]>;

  /**
   * Get players with statistics for a season
   */
  getPlayersWithStatistics(teamId: string, seasonId?: string): Promise<Player[]>;
}