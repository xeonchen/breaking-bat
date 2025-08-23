import { Player, AtBat, BattingResult, BaserunnerState } from '@/domain';

export interface RBICalculationResult {
  rbis: number;
  explanation: string;
}

export interface StatisticsUpdate {
  atBats?: number;
  hits?: number;
  singles?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbis?: number;
  walks?: number;
  strikeouts?: number;
  runs?: number;
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
}

/**
 * Domain service interface for calculating player and team statistics
 * Defines the contract for statistics-related operations
 */
export interface IStatisticsCalculationService {
  /**
   * Calculate RBIs based on batting result and baserunner advancement
   */
  calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    runsScored: string[],
    batterId: string
  ): RBICalculationResult;

  /**
   * Update player statistics based on an at-bat
   */
  updatePlayerStatistics(player: Player, atBat: AtBat): Player['statistics'];

  /**
   * Calculate batting average
   */
  calculateBattingAverage(hits: number, atBats: number): number;

  /**
   * Calculate on-base percentage
   */
  calculateOnBasePercentage(
    hits: number,
    walks: number,
    hitByPitch: number,
    atBats: number,
    sacrificeFlies: number
  ): number;

  /**
   * Calculate slugging percentage
   */
  calculateSluggingPercentage(
    singles: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    atBats: number
  ): number;

  /**
   * Calculate OPS (On-base Plus Slugging)
   */
  calculateOPS(onBasePercentage: number, sluggingPercentage: number): number;

  /**
   * Calculate team batting average for multiple players
   */
  calculateTeamBattingAverage(players: Player[]): number;

  /**
   * Calculate team statistics summary
   */
  calculateTeamStatistics(players: Player[]): {
    totalAtBats: number;
    totalHits: number;
    totalRuns: number;
    totalRBIs: number;
    totalWalks: number;
    totalStrikeouts: number;
    teamBattingAverage: number;
    teamOnBasePercentage: number;
    teamSluggingPercentage: number;
    teamOPS: number;
  };

  /**
   * Validate statistics for reasonableness
   */
  validateStatistics(stats: Player['statistics']): {
    isValid: boolean;
    errors: string[];
  };
}
