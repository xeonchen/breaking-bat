/**
 * Data Application Service Interface
 *
 * Defines the contract for data management operations including seasons,
 * game types, and data initialization following CQRS pattern.
 */

import { Result } from '@/application/common/Result';
// Domain entities not needed for interface definitions

// Command DTOs - Write Operations
export interface CreateSeasonCommand {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSeasonCommand {
  seasonId: string;
  name?: string;
  year?: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  isActive?: boolean;
}

export interface CreateGameTypeCommand {
  name: string;
  description?: string;
  defaultInnings?: number;
  allowTies?: boolean;
  mercyRule?: MercyRuleConfig;
  isActive?: boolean;
}

export interface UpdateGameTypeCommand {
  gameTypeId: string;
  name?: string;
  description?: string;
  defaultInnings?: number;
  allowTies?: boolean;
  mercyRule?: MercyRuleConfig;
  isActive?: boolean;
}

export interface LoadDefaultDataCommand {
  includeTeams?: boolean;
  includePlayers?: boolean;
  includeSeasons?: boolean;
  includeGameTypes?: boolean;
  overwriteExisting?: boolean;
  sampleDataSize?: 'minimal' | 'standard' | 'comprehensive';
}

export interface ImportDataCommand {
  dataType: 'teams' | 'players' | 'games' | 'seasons' | 'gameTypes';
  source: 'csv' | 'json' | 'xml';
  data: string | object[];
  options: ImportOptions;
}

export interface ExportDataCommand {
  dataType:
    | 'teams'
    | 'players'
    | 'games'
    | 'seasons'
    | 'gameTypes'
    | 'statistics'
    | 'all';
  format: 'csv' | 'json' | 'xml';
  filters?: ExportFilters;
  includeMetadata?: boolean;
}

export interface ArchiveSeasonCommand {
  seasonId: string;
  archiveReason?: string;
  preserveStatistics?: boolean;
}

export interface InitializeOrganizationCommand {
  organizationName: string;
  organizationType: 'league' | 'club' | 'school' | 'recreation';
  adminName: string;
  adminEmail: string;
  defaultSeasonStructure: SeasonStructure;
}

// Query DTOs - Read Operations
export interface GetSeasonsQuery {
  includeArchived?: boolean;
  year?: number;
  isActive?: boolean;
  sortBy?: 'name' | 'year' | 'startDate' | 'endDate';
  sortDirection?: 'asc' | 'desc';
}

export interface GetSeasonByIdQuery {
  seasonId: string;
  includeTeams?: boolean;
  includeGames?: boolean;
  includeStatistics?: boolean;
}

export interface GetGameTypesQuery {
  includeInactive?: boolean;
  sortBy?: 'name' | 'createdDate';
  sortDirection?: 'asc' | 'desc';
}

export interface GetGameTypeByIdQuery {
  gameTypeId: string;
  includeGames?: boolean;
}

export interface GetDataSummaryQuery {
  seasonId?: string;
  includeStatistics?: boolean;
}

export interface GetSystemHealthQuery {
  includePerformanceMetrics?: boolean;
  includeDatabaseStats?: boolean;
}

// Result DTOs - Response Objects
export interface SeasonDto {
  id: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  description?: string;
  isActive: boolean;
  isArchived: boolean;
  teamCount: number;
  gameCount: number;
  playerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeasonWithDetailsDto extends SeasonDto {
  teams: SeasonTeamSummaryDto[];
  games: SeasonGameSummaryDto[];
  statistics: SeasonStatisticsSummaryDto;
}

export interface GameTypeDto {
  id: string;
  name: string;
  description?: string;
  defaultInnings: number;
  allowTies: boolean;
  mercyRule?: MercyRuleConfig;
  isActive: boolean;
  gameCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameTypeWithDetailsDto extends GameTypeDto {
  games: GameTypeSummaryDto[];
  averageGameDuration?: number;
  completionRate: number;
}

export interface LoadDefaultDataResultDto {
  success: boolean;
  summary: {
    teamsCreated: number;
    playersCreated: number;
    seasonsCreated: number;
    gameTypesCreated: number;
  };
  details: DefaultDataDetailsDto;
  warnings: string[];
  errors: string[];
  executionTime: number;
}

export interface ImportDataResultDto {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: ImportErrorDto[];
  warnings: string[];
  summary: Record<string, unknown>;
}

export interface ExportDataResultDto {
  success: boolean;
  format: string;
  recordCount: number;
  data: string | object[];
  metadata: ExportMetadataDto;
  generatedAt: Date;
  fileSize?: number;
}

export interface DataSummaryDto {
  seasonId?: string;
  seasonName?: string;
  totals: {
    teams: number;
    players: number;
    games: number;
    atBats: number;
    seasons: number;
    gameTypes: number;
  };
  statistics: {
    gamesCompleted: number;
    gamesInProgress: number;
    totalRuns: number;
    totalHits: number;
    averageBattingAverage: number;
  };
  recentActivity: RecentActivityDto[];
  topPerformers: TopPerformersDto;
  lastUpdated: Date;
}

export interface SystemHealthDto {
  status: 'healthy' | 'warning' | 'error';
  components: ComponentHealthDto[];
  performanceMetrics?: PerformanceMetricsDto;
  databaseStats?: DatabaseStatsDto;
  lastCheck: Date;
  uptime: number;
}

// Supporting Types
export interface MercyRuleConfig {
  enabled: boolean;
  runDifferential: number;
  minimumInning: number;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  validateData?: boolean;
  batchSize?: number;
  mapping?: Record<string, string>; // field mapping
}

export interface ExportFilters {
  seasonId?: string;
  teamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
}

export interface SeasonStructure {
  defaultGameType: string;
  regularSeasonLength: number;
  playoffFormat?: 'single_elimination' | 'double_elimination' | 'round_robin';
  maxTeamsPerDivision?: number;
}

export interface SeasonTeamSummaryDto {
  teamId: string;
  teamName: string;
  playerCount: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface SeasonGameSummaryDto {
  gameId: string;
  gameName: string;
  date: Date;
  status: string;
  homeTeam: string;
  awayTeam: string;
}

export interface SeasonStatisticsSummaryDto {
  totalGames: number;
  totalAtBats: number;
  totalRuns: number;
  totalHits: number;
  averageBattingAverage: number;
  topBatter: {
    playerId: string;
    playerName: string;
    battingAverage: number;
  };
}

export interface GameTypeSummaryDto {
  gameId: string;
  gameName: string;
  date: Date;
  duration?: number;
  finalScore?: string;
}

export interface DefaultDataDetailsDto {
  teams: DefaultDataTeamDto[];
  players: DefaultDataPlayerDto[];
  seasons: DefaultDataSeasonDto[];
  gameTypes: DefaultDataGameTypeDto[];
}

export interface DefaultDataTeamDto {
  id: string;
  name: string;
  playerCount: number;
}

export interface DefaultDataPlayerDto {
  id: string;
  name: string;
  teamId: string;
  jerseyNumber: number;
}

export interface DefaultDataSeasonDto {
  id: string;
  name: string;
  year: number;
}

export interface DefaultDataGameTypeDto {
  id: string;
  name: string;
  description: string;
}

export interface ImportErrorDto {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

export interface ExportMetadataDto {
  exportedBy: string;
  exportedAt: Date;
  filters: Record<string, unknown>;
  recordCount: number;
  schemaVersion: string;
}

export interface RecentActivityDto {
  id: string;
  type: 'game_created' | 'game_completed' | 'player_added' | 'team_created';
  description: string;
  entityId: string;
  timestamp: Date;
}

export interface TopPerformersDto {
  batting: {
    playerId: string;
    playerName: string;
    statistic: string;
    value: number;
  };
  runs: {
    playerId: string;
    playerName: string;
    value: number;
  };
  rbis: {
    playerId: string;
    playerName: string;
    value: number;
  };
}

export interface ComponentHealthDto {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
}

export interface PerformanceMetricsDto {
  averageResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: number;
  errorRate: number;
}

export interface DatabaseStatsDto {
  totalRecords: number;
  databaseSize: number;
  indexEfficiency: number;
  slowQueries: number;
  connectionCount: number;
}

/**
 * Data Application Service Interface
 *
 * Provides data management capabilities including seasons, game types,
 * data import/export, and system administration functions.
 */
export interface IDataApplicationService {
  // Command Operations (Write Side)

  /**
   * Creates a new season
   */
  createSeason(command: CreateSeasonCommand): Promise<Result<SeasonDto>>;

  /**
   * Updates an existing season
   */
  updateSeason(command: UpdateSeasonCommand): Promise<Result<SeasonDto>>;

  /**
   * Creates a new game type
   */
  createGameType(command: CreateGameTypeCommand): Promise<Result<GameTypeDto>>;

  /**
   * Updates an existing game type
   */
  updateGameType(command: UpdateGameTypeCommand): Promise<Result<GameTypeDto>>;

  /**
   * Loads default sample data
   */
  loadDefaultData(
    command: LoadDefaultDataCommand
  ): Promise<Result<LoadDefaultDataResultDto>>;

  /**
   * Imports data from external sources
   */
  importData(command: ImportDataCommand): Promise<Result<ImportDataResultDto>>;

  /**
   * Exports data in various formats
   */
  exportData(command: ExportDataCommand): Promise<Result<ExportDataResultDto>>;

  /**
   * Archives a season and its data
   */
  archiveSeason(command: ArchiveSeasonCommand): Promise<Result<void>>;

  /**
   * Initializes a new organization with default structure
   */
  initializeOrganization(
    command: InitializeOrganizationCommand
  ): Promise<Result<void>>;

  // Query Operations (Read Side)

  /**
   * Gets all seasons with filtering options
   */
  getSeasons(query: GetSeasonsQuery): Promise<Result<SeasonDto[]>>;

  /**
   * Gets a specific season with details
   */
  getSeasonById(
    query: GetSeasonByIdQuery
  ): Promise<Result<SeasonWithDetailsDto | null>>;

  /**
   * Gets all game types
   */
  getGameTypes(query: GetGameTypesQuery): Promise<Result<GameTypeDto[]>>;

  /**
   * Gets a specific game type with details
   */
  getGameTypeById(
    query: GetGameTypeByIdQuery
  ): Promise<Result<GameTypeWithDetailsDto | null>>;

  /**
   * Gets comprehensive data summary
   */
  getDataSummary(query: GetDataSummaryQuery): Promise<Result<DataSummaryDto>>;

  /**
   * Gets system health and performance metrics
   */
  getSystemHealth(
    query: GetSystemHealthQuery
  ): Promise<Result<SystemHealthDto>>;
}
