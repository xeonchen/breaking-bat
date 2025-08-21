/**
 * Application Service Interface for Scoring Operations
 *
 * This interface provides presentation layer with scoring operations
 * without exposing domain-specific types.
 */

export interface PresentationBaserunnerState {
  first: { playerId: string; playerName: string } | null;
  second: { playerId: string; playerName: string } | null;
  third: { playerId: string; playerName: string } | null;
}

export interface ScoringAdvancement {
  newState: PresentationBaserunnerState;
  runsScored: Array<{ playerId: string; playerName: string }>;
}

export interface IScoringApplicationService {
  /**
   * Calculate baserunner advancement for a batting result
   */
  calculateBaserunnerAdvancement(
    battingResult: string,
    currentState: PresentationBaserunnerState,
    batterId: string
  ): ScoringAdvancement;

  /**
   * Calculate number of outs produced by a batting result
   */
  calculateOuts(battingResult: string): number;

  /**
   * Validate that a baserunner advancement is legal
   */
  validateAdvancement(
    battingResult: string,
    currentState: PresentationBaserunnerState,
    proposedState: PresentationBaserunnerState
  ): Promise<{ isValid: boolean; errors: string[] }>;
}
