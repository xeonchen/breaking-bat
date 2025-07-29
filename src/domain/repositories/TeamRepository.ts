import { Team, Player } from '../entities';

/**
 * Repository interface for Team entity operations
 */
export interface TeamRepository {
  /**
   * Find team by ID
   */
  findById(id: string): Promise<Team | null>;

  /**
   * Find all teams
   */
  findAll(): Promise<Team[]>;

  /**
   * Find teams by season ID
   */
  findBySeasonId(seasonId: string): Promise<Team[]>;

  /**
   * Find team by name (case-insensitive)
   */
  findByName(name: string): Promise<Team | null>;

  /**
   * Create a new team
   */
  create(team: Team): Promise<Team>;

  /**
   * Update an existing team
   */
  update(team: Team): Promise<Team>;

  /**
   * Delete a team
   */
  delete(id: string): Promise<void>;

  /**
   * Check if team exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get team roster (all players)
   */
  getTeamRoster(teamId: string): Promise<Player[]>;

  /**
   * Get active players for a team
   */
  getActivePlayers(teamId: string): Promise<Player[]>;

  /**
   * Check if team name is unique
   */
  isNameUnique(name: string, excludeId?: string): Promise<boolean>;
}