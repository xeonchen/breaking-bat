import { BattingResult, BaserunnerState, Player, AtBat } from '@/domain';

export interface BaserunnerAdvancementCalculation {
  newState: BaserunnerState;
  runsScored: string[]; // player IDs
  battingAdvancement: number; // bases advanced by batter
  automaticAdvancement: boolean; // true if calculated automatically
}

/**
 * Domain service interface for core softball scoring logic
 * Defines the contract for scoring-related operations
 */
export interface IScoringService {
  /**
   * Calculate automatic baserunner advancement based on batting result
   */
  calculateBaserunnerAdvancement(
    result: BattingResult,
    currentState: BaserunnerState,
    batterId: string
  ): BaserunnerAdvancementCalculation;

  /**
   * Calculate RBIs based on batting result and baserunner advancement
   */
  calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    baserunnersAfter: BaserunnerState,
    runsScored: string[]
  ): number;

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
   * Validate that a batting result is legal
   */
  isValidBattingResult(result: BattingResult): boolean;

  /**
   * Calculate the number of outs produced by a batting result
   */
  calculateOuts(result: BattingResult): number;

  /**
   * Determine if an inning should end based on outs
   */
  shouldEndInning(totalOuts: number): boolean;

  /**
   * Calculate team batting average for multiple players
   */
  calculateTeamBattingAverage(players: Player[]): number;
}
