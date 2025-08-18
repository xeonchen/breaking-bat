import { Game } from '../entities/Game';

export interface ScoreUpdate {
  homeScore: number;
  awayScore: number;
  inningScores: Array<{
    inning: number;
    homeRuns: number;
    awayRuns: number;
  }>;
}

export interface ScoreCalculationResult {
  updatedGame: Game;
  newScore: ScoreUpdate;
}

/**
 * Domain service interface for score calculation and game score management
 * Defines the contract for score-related operations
 */
export interface IScoreCalculationService {
  /**
   * Update the game score with runs scored in the current inning
   */
  updateGameScore(
    game: Game,
    runsScored: number,
    currentInning: number,
    isTopInning: boolean
  ): ScoreCalculationResult;

  /**
   * Calculate the current run differential
   */
  calculateRunDifferential(game: Game): number;

  /**
   * Determine which team is winning
   */
  getWinningTeam(game: Game): 'home' | 'away' | 'tied';

  /**
   * Check if the mercy rule should be applied
   */
  shouldApplyMercyRule(
    game: Game,
    currentInning: number,
    mercyRunDifference?: number
  ): boolean;

  /**
   * Validate a score update is reasonable
   */
  validateScoreUpdate(
    currentScore: ScoreUpdate,
    runsScored: number,
    maxRunsPerInning?: number
  ): { isValid: boolean; error?: string };

  /**
   * Get score summary for display
   */
  getScoreSummary(game: Game): {
    homeScore: number;
    awayScore: number;
    currentLeader: 'home' | 'away' | 'tied';
    runDifferential: number;
    inningByInningScores: Array<{
      inning: number;
      homeRuns: number;
      awayRuns: number;
    }>;
  };
}
