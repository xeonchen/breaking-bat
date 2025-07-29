import { Team } from '../entities';

/**
 * Repository interface for Team entity operations
 */
export interface TeamRepository {
  /**
   * Save (create or update) a team
   */
  save(team: Team): Promise<Team>;

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
   * Delete a team
   */
  delete(id: string): Promise<void>;

  /**
   * Add a player to a team
   */
  addPlayer(teamId: string, playerId: string): Promise<Team>;

  /**
   * Remove a player from a team
   */
  removePlayer(teamId: string, playerId: string): Promise<Team>;

  /**
   * Add a season to a team
   */
  addSeason(teamId: string, seasonId: string): Promise<Team>;

  /**
   * Remove a season from a team
   */
  removeSeason(teamId: string, seasonId: string): Promise<Team>;

  /**
   * Search teams by name
   */
  search(query: string): Promise<Team[]>;
}
