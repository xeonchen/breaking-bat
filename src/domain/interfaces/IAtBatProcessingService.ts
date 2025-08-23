import { BattingResult, BaserunnerState } from '@/domain/values';

export interface AtBatData {
  batterId: string;
  result: BattingResult;
  finalCount: { balls: number; strikes: number };
  pitchSequence?: string[];
  baserunnerAdvancement?: Record<string, string>;
}

export interface ProcessedAtBatResult {
  finalBaserunnerState: BaserunnerState;
  runsScored: string[];
  outsProduced: number;
  nextBatterId: string | null;
  shouldAdvanceInning: boolean;
  scoreUpdate?: {
    homeScore: number;
    awayScore: number;
  };
}

/**
 * Domain service interface for at-bat processing orchestration
 * Coordinates between scoring service, game session service, and score calculation
 */
export interface IAtBatProcessingService {
  /**
   * Process an at-bat and return all consequences
   */
  processAtBat(
    atBatData: AtBatData,
    currentBaserunnerState: BaserunnerState,
    currentOuts: number,
    lineup: Array<{ playerId: string; playerName: string }>
  ): ProcessedAtBatResult;

  /**
   * Process at-bat for auto-completion scenarios (walk, strikeout)
   */
  processAutoCompletedAtBat(
    result: BattingResult,
    batterId: string,
    currentBaserunnerState: BaserunnerState,
    currentOuts: number,
    lineup: Array<{ playerId: string; playerName: string }>
  ): ProcessedAtBatResult;

  /**
   * Validate at-bat data before processing
   */
  validateAtBatData(atBatData: AtBatData): {
    isValid: boolean;
    errors: string[];
  };
}
