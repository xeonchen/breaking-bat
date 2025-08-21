import { Team } from '@/domain/entities/Team';

/**
 * Application layer repository interface for Team entities
 * Defines the contract for team data persistence
 */
export interface ITeamRepository {
  /**
   * Find a team by ID
   */
  findById(id: string): Promise<Team | null>;

  /**
   * Save a team (create or update)
   */
  save(team: Team): Promise<Team>;

  /**
   * Find all teams
   */
  findAll(): Promise<Team[]>;

  /**
   * Find teams by season ID
   */
  findBySeasonId(seasonId: string): Promise<Team[]>;

  /**
   * Find teams by organization
   */
  findByOrganization(organizationId: string): Promise<Team[]>;

  /**
   * Search teams by name
   */
  searchByName(query: string): Promise<Team[]>;

  /**
   * Find team by exact name
   */
  findByName(name: string): Promise<Team | null>;

  /**
   * Delete a team
   */
  delete(id: string): Promise<void>;

  /**
   * Check if team name is available within an organization
   */
  isNameAvailable(
    organizationId: string,
    name: string,
    excludeTeamId?: string
  ): Promise<boolean>;
}
