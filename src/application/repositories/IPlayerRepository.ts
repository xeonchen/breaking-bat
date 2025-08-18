import { Player } from '@/domain/entities/Player';

/**
 * Application layer repository interface for Player entities
 * Defines the contract for player data persistence
 */
export interface IPlayerRepository {
  /**
   * Find a player by ID
   */
  findById(id: string): Promise<Player | null>;

  /**
   * Save a player (create or update)
   */
  save(player: Player): Promise<Player>;

  /**
   * Find all players
   */
  findAll(): Promise<Player[]>;

  /**
   * Find players by team ID
   */
  findByTeamId(teamId: string): Promise<Player[]>;

  /**
   * Find players by position
   */
  findByPosition(position: string): Promise<Player[]>;

  /**
   * Find players by jersey number within a team
   */
  findByJerseyNumber(
    teamId: string,
    jerseyNumber: number
  ): Promise<Player | null>;

  /**
   * Search players by name
   */
  searchByName(query: string): Promise<Player[]>;

  /**
   * Delete a player
   */
  delete(id: string): Promise<void>;

  /**
   * Check if jersey number is available for a team
   */
  isJerseyNumberAvailable(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean>;
}
