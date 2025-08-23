/**
 * Team Application Service Interface
 *
 * Defines the contract for team management operations following CQRS pattern.
 * This interface represents the "Primary Port" for team-related functionality
 * in our hexagonal architecture.
 */

import { Result } from '@/application/common/Result';

// Command DTOs - Write Operations
export interface CreateTeamCommand {
  name: string;
  seasonIds?: string[];
  organizationId?: string;
}

export interface UpdateTeamCommand {
  teamId: string;
  name?: string;
  seasonIds?: string[];
  isActive?: boolean;
}

export interface AddPlayerToTeamCommand {
  teamId: string;
  playerName: string;
  jerseyNumber: number;
  positions: string[];
  isActive?: boolean;
}

export interface UpdatePlayerInTeamCommand {
  teamId: string;
  playerId: string;
  playerName?: string;
  jerseyNumber?: number;
  positions?: string[];
  isActive?: boolean;
}

export interface RemovePlayerFromTeamCommand {
  teamId: string;
  playerId: string;
  reason?: string;
}

export interface ArchiveTeamCommand {
  teamId: string;
  reason?: string;
}

// Query DTOs - Read Operations
export interface GetTeamByIdQuery {
  teamId: string;
  includeInactivePlayers?: boolean;
  includeStatistics?: boolean;
}

export interface GetTeamsBySeasonQuery {
  seasonId: string;
  includeInactive?: boolean;
  sortBy?: 'name' | 'createdDate' | 'playerCount';
  sortDirection?: 'asc' | 'desc';
}

export interface SearchTeamsQuery {
  searchTerm: string;
  organizationId?: string;
  seasonId?: string;
  limit?: number;
  offset?: number;
}

export interface GetTeamRosterQuery {
  teamId: string;
  seasonId?: string;
  positionFilter?: string[];
  activeOnly?: boolean;
}

export interface GetTeamStatisticsQuery {
  teamId: string;
  seasonId?: string;
  gameTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Result DTOs - Response Objects
export interface TeamDto {
  id: string;
  name: string;
  organizationId?: string;
  seasonIds: string[];
  playerCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithPlayersDto extends TeamDto {
  players: TeamPlayerDto[];
}

export interface TeamPlayerDto {
  id: string;
  name: string;
  jerseyNumber: number;
  positions: string[];
  isActive: boolean;
  statistics?: PlayerStatisticsDto;
}

export interface PlayerStatisticsDto {
  gamesPlayed: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
}

export interface TeamStatisticsDto {
  teamId: string;
  teamName: string;
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  totalRuns: number;
  totalHits: number;
  totalAtBats: number;
  teamBattingAverage: number;
  runsPerGame: number;
  hitsPerGame: number;
}

export interface TeamRosterDto {
  teamId: string;
  teamName: string;
  seasonId?: string;
  players: TeamPlayerDto[];
  positionCoverage: Record<string, string[]>; // position -> playerIds
  totalPlayers: number;
  activePlayers: number;
}

/**
 * Team Application Service Interface
 *
 * Provides a high-level API for team management operations.
 * Implements CQRS by separating commands (write) from queries (read).
 */
export interface ITeamApplicationService {
  // Command Operations (Write Side)

  /**
   * Creates a new team
   */
  createTeam(command: CreateTeamCommand): Promise<Result<TeamDto>>;

  /**
   * Updates an existing team
   */
  updateTeam(command: UpdateTeamCommand): Promise<Result<TeamDto>>;

  /**
   * Adds a player to a team
   */
  addPlayer(command: AddPlayerToTeamCommand): Promise<Result<TeamPlayerDto>>;

  /**
   * Updates a player in a team
   */
  updatePlayer(
    command: UpdatePlayerInTeamCommand
  ): Promise<Result<TeamPlayerDto>>;

  /**
   * Removes a player from a team
   */
  removePlayer(command: RemovePlayerFromTeamCommand): Promise<Result<void>>;

  /**
   * Archives a team (soft delete)
   */
  archiveTeam(command: ArchiveTeamCommand): Promise<Result<void>>;

  // Query Operations (Read Side)

  /**
   * Gets a team by ID with optional includes
   */
  getTeamById(
    query: GetTeamByIdQuery
  ): Promise<Result<TeamWithPlayersDto | null>>;

  /**
   * Gets teams by season with filtering and sorting
   */
  getTeamsBySeason(query: GetTeamsBySeasonQuery): Promise<Result<TeamDto[]>>;

  /**
   * Searches teams by name or other criteria
   */
  searchTeams(query: SearchTeamsQuery): Promise<
    Result<{
      teams: TeamDto[];
      totalCount: number;
      hasMore: boolean;
    }>
  >;

  /**
   * Gets team roster with position information
   */
  getTeamRoster(query: GetTeamRosterQuery): Promise<Result<TeamRosterDto>>;

  /**
   * Gets team statistics for a given period
   */
  getTeamStatistics(
    query: GetTeamStatisticsQuery
  ): Promise<Result<TeamStatisticsDto>>;

  /**
   * Validates team name availability
   */
  isTeamNameAvailable(
    organizationId: string,
    name: string,
    excludeTeamId?: string
  ): Promise<Result<boolean>>;

  /**
   * Validates jersey number availability within a team
   */
  isJerseyNumberAvailable(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<Result<boolean>>;

  /**
   * Gets all teams with optional filtering
   */
  getTeams(query?: GetTeamsQuery): Promise<Result<TeamDto[]>>;
}

// Add the missing GetTeamsQuery interface
export interface GetTeamsQuery {
  organizationId?: string;
  seasonId?: string;
  isActive?: boolean;
  includeArchived?: boolean;
  sortBy?: 'name' | 'createdDate';
  sortDirection?: 'asc' | 'desc';
}
