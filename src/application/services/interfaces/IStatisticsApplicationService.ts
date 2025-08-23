/**
 * Statistics Application Service Interface
 *
 * Defines the contract for statistics and analytics operations following CQRS pattern.
 * This interface represents the "Primary Port" for statistics-related functionality
 * in our hexagonal architecture.
 */

import { Result } from '@/application/common/Result';

// Query DTOs - Read Operations (Statistics are primarily read-heavy)
export interface GetPlayerStatisticsQuery {
  playerId: string;
  seasonId?: string;
  gameTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  teamId?: string;
  splitBy?: 'season' | 'month' | 'opponent' | 'position';
}

export interface GetTeamStatisticsQuery {
  teamId: string;
  seasonId?: string;
  gameTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includePlayerBreakdown?: boolean;
  splitBy?: 'season' | 'month' | 'opponent' | 'home_away';
}

export interface GetSeasonStatisticsQuery {
  seasonId: string;
  teamId?: string;
  statCategory?: 'batting' | 'pitching' | 'fielding' | 'all';
  sortBy?: StatisticsSortField;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

export interface GetLeaderboardQuery {
  seasonId?: string;
  teamId?: string;
  statistic: LeaderboardStatistic;
  category: 'batting' | 'pitching' | 'fielding';
  minimumQualification?: number;
  limit?: number;
}

export interface GetPlayerComparisonQuery {
  playerIds: string[];
  seasonId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  metrics: ComparisonMetric[];
}

export interface GetTeamRankingsQuery {
  seasonId: string;
  category: 'offensive' | 'defensive' | 'overall';
  includeAdvancedMetrics?: boolean;
}

export interface GetTrendsAnalysisQuery {
  playerId?: string;
  teamId?: string;
  seasonId?: string;
  metric: TrendMetric;
  timeframe: 'game' | 'week' | 'month';
  periods: number;
}

export interface GetAdvancedAnalyticsQuery {
  entityId: string;
  entityType: 'player' | 'team';
  seasonId?: string;
  analysisType: 'situational' | 'clutch' | 'progression' | 'splits';
  context?: AnalysisContext;
}

// Command DTOs - Write Operations (for statistics management)
export interface RecalculateStatisticsCommand {
  entityId: string;
  entityType: 'player' | 'team' | 'season';
  fromDate?: Date;
  force?: boolean;
}

export interface CreateStatisticsSnapshotCommand {
  seasonId: string;
  snapshotDate: Date;
  description?: string;
}

// Result DTOs - Response Objects
export interface PlayerStatisticsDto {
  playerId: string;
  playerName: string;
  seasonId?: string;
  teamId: string;

  // Batting Statistics
  games: number;
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  hitByPitch: number;
  sacrificeFlies: number;
  sacrificeBunts: number;

  // Calculated Batting Metrics
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  onBasePlusSlugging: number;
  totalBases: number;
  extraBaseHits: number;

  // Advanced Metrics
  babip: number; // Batting Average on Balls in Play
  isolatedPower: number;
  walkRate: number;
  strikeoutRate: number;

  // Situational Statistics
  runnersInScoringPosition: SituationalStatsDto;
  clutchSituations: SituationalStatsDto;
  byInning: InningStatsDto[];
  vsOpponentType: Record<string, BasicStatsDto>;

  // Trends
  last10Games: BasicStatsDto;
  homeVsAway: SplitStatsDto;
  byPosition: Record<string, BasicStatsDto>;

  // Fielding Statistics (when available)
  fielding?: FieldingStatisticsDto;

  // Meta Information
  calculatedAt: Date;
  gamesPlayed: number;
  seasonStartDate?: Date;
  seasonEndDate?: Date;
}

export interface TeamStatisticsDto {
  teamId: string;
  teamName: string;
  seasonId?: string;

  // Team Batting
  teamBatting: TeamBattingStatsDto;

  // Team Records
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  runsFor: number;
  runsAgainst: number;
  runDifferential: number;

  // Advanced Team Metrics
  pythagoreanWinPercentage: number;
  averageRunsPerGame: number;
  averageRunsAllowedPerGame: number;

  // Situational Team Stats
  homeRecord: RecordDto;
  awayRecord: RecordDto;
  vsLeftyRecord: RecordDto;
  vsRightyRecord: RecordDto;

  // Player Breakdown
  playerStatistics?: PlayerStatisticsDto[];

  // Monthly Breakdown
  monthlyStats?: MonthlyTeamStatsDto[];

  calculatedAt: Date;
}

export interface LeaderboardDto {
  seasonId?: string;
  category: string;
  statistic: string;
  minimumQualification: number;
  leaders: LeaderboardEntryDto[];
  updatedAt: Date;
}

export interface LeaderboardEntryDto {
  rank: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
  qualifies: boolean;
}

export interface PlayerComparisonDto {
  players: PlayerComparisonEntryDto[];
  metrics: ComparisonMetricResultDto[];
  seasonId?: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  generatedAt: Date;
}

export interface PlayerComparisonEntryDto {
  playerId: string;
  playerName: string;
  teamName: string;
  statistics: Record<string, number>;
}

export interface ComparisonMetricResultDto {
  metric: ComparisonMetric;
  displayName: string;
  description: string;
  values: Record<string, number>; // playerId -> value
  leader: {
    playerId: string;
    playerName: string;
    value: number;
  };
}

export interface TrendsAnalysisDto {
  entityId: string;
  entityType: 'player' | 'team';
  metric: TrendMetric;
  timeframe: string;
  dataPoints: TrendDataPointDto[];
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    slope: number;
    correlation: number;
    confidence: number;
  };
  insights: string[];
  generatedAt: Date;
}

export interface TrendDataPointDto {
  period: string;
  date: Date;
  value: number;
  games: number;
  context?: Record<string, unknown>;
}

export interface AdvancedAnalyticsDto {
  entityId: string;
  entityType: 'player' | 'team';
  analysisType: string;
  results: AnalyticsResultDto[];
  insights: AnalyticsInsightDto[];
  recommendations: string[];
  confidence: number;
  generatedAt: Date;
}

export interface AnalyticsResultDto {
  metric: string;
  value: number;
  percentile?: number;
  leagueAverage?: number;
  interpretation: string;
}

export interface AnalyticsInsightDto {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
}

// Supporting Types
export interface SituationalStatsDto {
  atBats: number;
  hits: number;
  average: number;
  onBase: number;
  obp: number;
  rbis: number;
}

export interface InningStatsDto {
  inning: number;
  atBats: number;
  hits: number;
  runs: number;
  average: number;
}

export interface BasicStatsDto {
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  average: number;
}

export interface SplitStatsDto {
  home: BasicStatsDto;
  away: BasicStatsDto;
}

export interface FieldingStatisticsDto {
  position: string;
  games: number;
  chances: number;
  putouts: number;
  assists: number;
  errors: number;
  fieldingPercentage: number;
  doublePlays: number;
}

export interface TeamBattingStatsDto {
  games: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  onBasePlusSlugging: number;
}

export interface RecordDto {
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
}

export interface MonthlyTeamStatsDto {
  month: number;
  year: number;
  games: number;
  record: RecordDto;
  runsFor: number;
  runsAgainst: number;
  teamBatting: TeamBattingStatsDto;
}

// Enums and Types
export type StatisticsSortField =
  | 'battingAverage'
  | 'onBasePercentage'
  | 'sluggingPercentage'
  | 'onBasePlusSlugging'
  | 'hits'
  | 'runs'
  | 'rbis'
  | 'homeRuns'
  | 'walks'
  | 'strikeouts';

export type LeaderboardStatistic =
  | 'battingAverage'
  | 'hits'
  | 'runs'
  | 'rbis'
  | 'homeRuns'
  | 'walks'
  | 'onBasePercentage'
  | 'sluggingPercentage'
  | 'onBasePlusSlugging';

export type ComparisonMetric =
  | 'battingAverage'
  | 'onBasePercentage'
  | 'sluggingPercentage'
  | 'onBasePlusSlugging'
  | 'hits'
  | 'runs'
  | 'rbis'
  | 'homeRuns'
  | 'walks'
  | 'strikeouts'
  | 'games';

export type TrendMetric =
  | 'battingAverage'
  | 'onBasePercentage'
  | 'runsPerGame'
  | 'hitsPerGame'
  | 'strikeoutRate';

export interface AnalysisContext {
  situation?: 'clutch' | 'runners_on' | 'two_outs' | 'close_game';
  opponent?: string;
  venue?: 'home' | 'away';
  inning?: number[];
  gameType?: string;
}

/**
 * Statistics Application Service Interface
 *
 * Provides comprehensive statistics and analytics capabilities.
 * Primarily focused on queries (read operations) with some management commands.
 */
export interface IStatisticsApplicationService {
  // Query Operations (Read Side)

  /**
   * Gets comprehensive player statistics
   */
  getPlayerStatistics(
    query: GetPlayerStatisticsQuery
  ): Promise<Result<PlayerStatisticsDto>>;

  /**
   * Gets comprehensive team statistics
   */
  getTeamStatistics(
    query: GetTeamStatisticsQuery
  ): Promise<Result<TeamStatisticsDto>>;

  /**
   * Gets season-wide statistics
   */
  getSeasonStatistics(query: GetSeasonStatisticsQuery): Promise<
    Result<{
      players: PlayerStatisticsDto[];
      teams: TeamStatisticsDto[];
      seasonSummary: unknown;
    }>
  >;

  /**
   * Gets leaderboard for specific statistics
   */
  getLeaderboard(query: GetLeaderboardQuery): Promise<Result<LeaderboardDto>>;

  /**
   * Compares multiple players across metrics
   */
  getPlayerComparison(
    query: GetPlayerComparisonQuery
  ): Promise<Result<PlayerComparisonDto>>;

  /**
   * Gets team rankings for a season
   */
  getTeamRankings(query: GetTeamRankingsQuery): Promise<
    Result<{
      rankings: unknown[];
      criteria: string[];
    }>
  >;

  /**
   * Analyzes trends over time
   */
  getTrendsAnalysis(
    query: GetTrendsAnalysisQuery
  ): Promise<Result<TrendsAnalysisDto>>;

  /**
   * Gets advanced analytics insights
   */
  getAdvancedAnalytics(
    query: GetAdvancedAnalyticsQuery
  ): Promise<Result<AdvancedAnalyticsDto>>;

  // Command Operations (Write Side)

  /**
   * Forces recalculation of statistics
   */
  recalculateStatistics(
    command: RecalculateStatisticsCommand
  ): Promise<Result<void>>;

  /**
   * Creates a statistics snapshot for historical tracking
   */
  createStatisticsSnapshot(
    command: CreateStatisticsSnapshotCommand
  ): Promise<Result<string>>;
}
