import { Season } from '../entities';

/**
 * Repository interface for Season entity operations
 */
export interface SeasonRepository {
  /**
   * Save (create or update) a season
   */
  save(season: Season): Promise<Season>;

  /**
   * Find season by ID
   */
  findById(id: string): Promise<Season | null>;

  /**
   * Find all seasons
   */
  findAll(): Promise<Season[]>;

  /**
   * Find seasons by year
   */
  findByYear(year: number): Promise<Season[]>;

  /**
   * Find active seasons (current date within season range)
   */
  findActiveSeason(): Promise<Season | null>;

  /**
   * Find seasons for a specific team
   */
  findByTeamId(teamId: string): Promise<Season[]>;

  /**
   * Delete a season
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a season name already exists for a given year
   */
  existsByNameAndYear(name: string, year: number): Promise<boolean>;

  /**
   * Find seasons within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Season[]>;

  /**
   * Add a team to a season
   */
  addTeamToSeason(seasonId: string, teamId: string): Promise<Season>;

  /**
   * Remove a team from a season
   */
  removeTeamFromSeason(seasonId: string, teamId: string): Promise<Season>;
}
