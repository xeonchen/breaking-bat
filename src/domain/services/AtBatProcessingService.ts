import {
  BattingResult,
  BaserunnerState as BaserunnerStateClass,
} from '@/domain';
import type { BaserunnerUI } from '@/presentation/types/BaserunnerUI';
import { ScoringService } from './ScoringService';
import { GameSessionService } from './GameSessionService';

export interface AtBatData {
  batterId: string;
  result: BattingResult;
  finalCount: { balls: number; strikes: number };
  pitchSequence?: string[];
  baserunnerAdvancement?: Record<string, string>;
}

export interface ProcessedAtBatResult {
  finalBaserunnerState: BaserunnerUI;
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
 * Domain service that orchestrates at-bat processing
 * Coordinates between scoring service, game session service, and score calculation
 */
export class AtBatProcessingService {
  constructor(
    private scoringService: ScoringService,
    private gameSessionService: GameSessionService
    // scoreCalculationService will be used in future iterations for score updates
  ) {}

  /**
   * Process an at-bat and return all consequences
   */
  public processAtBat(
    atBatData: AtBatData,
    currentBaserunners: BaserunnerUI,
    currentOuts: number,
    lineup: Array<{ playerId: string; playerName: string }>
  ): ProcessedAtBatResult {
    // Convert UI baserunner state to domain BaserunnerState
    const currentBaserunnerState =
      this.gameSessionService.convertBaserunnerStateToClass(currentBaserunners);

    // Calculate automatic baserunner advancement
    const advancement = this.scoringService.calculateBaserunnerAdvancement(
      atBatData.result,
      currentBaserunnerState,
      atBatData.batterId
    );

    // Apply manual advancement if provided, otherwise use automatic
    let finalBaserunnerState = advancement.newState;
    let finalRunsScored = advancement.runsScored;

    // Check for manual advancement overrides
    if (this.hasManualAdvancement(atBatData.baserunnerAdvancement)) {
      const manualResult = this.applyManualAdvancement(
        currentBaserunnerState,
        atBatData.result,
        atBatData.batterId,
        atBatData.baserunnerAdvancement!
      );
      finalBaserunnerState = manualResult.newState;
      finalRunsScored = manualResult.runsScored;
    }

    // Calculate outs produced
    const outsProduced = this.scoringService.calculateOuts(atBatData.result);
    const totalOuts = currentOuts + outsProduced;
    const shouldAdvanceInning = totalOuts >= 3;

    // Convert back to UI format
    const finalBaserunners =
      this.gameSessionService.convertBaserunnerStateToInterface(
        finalBaserunnerState,
        lineup
      );

    // Determine next batter
    const nextBatterId = this.gameSessionService.advanceToNextBatter(
      atBatData.batterId,
      lineup
    );

    return {
      finalBaserunnerState: finalBaserunners,
      runsScored: finalRunsScored,
      outsProduced,
      nextBatterId,
      shouldAdvanceInning,
    };
  }

  /**
   * Check if meaningful manual advancement was provided
   */
  private hasManualAdvancement(
    baserunnerAdvancement?: Record<string, string>
  ): boolean {
    return !!(
      baserunnerAdvancement &&
      Object.keys(baserunnerAdvancement).length > 0 &&
      Object.values(baserunnerAdvancement).some(
        (value) => value && value.trim() !== ''
      )
    );
  }

  /**
   * Apply manual baserunner advancement
   */
  private applyManualAdvancement(
    currentBaserunnerState: BaserunnerStateClass,
    result: BattingResult,
    batterId: string,
    manualAdvancement: Record<string, string>
  ): { newState: BaserunnerStateClass; runsScored: string[] } {
    const finalRunsScored: string[] = [];

    // Start with empty bases and apply manual advancement
    let firstBase: string | null = null;
    let secondBase: string | null = null;
    let thirdBase: string | null = null;

    // Handle existing runners based on manual advancement
    if (currentBaserunnerState.firstBase && manualAdvancement.first) {
      switch (manualAdvancement.first) {
        case 'second':
          secondBase = currentBaserunnerState.firstBase;
          break;
        case 'third':
          thirdBase = currentBaserunnerState.firstBase;
          break;
        case 'home':
          finalRunsScored.push(currentBaserunnerState.firstBase);
          break;
        case 'stay':
          firstBase = currentBaserunnerState.firstBase;
          break;
        // 'out' case - runner is removed (no assignment)
      }
    }

    if (currentBaserunnerState.secondBase && manualAdvancement.second) {
      switch (manualAdvancement.second) {
        case 'third':
          thirdBase = currentBaserunnerState.secondBase;
          break;
        case 'home':
          finalRunsScored.push(currentBaserunnerState.secondBase);
          break;
        case 'stay':
          secondBase = currentBaserunnerState.secondBase;
          break;
        // 'out' case - runner is removed (no assignment)
      }
    }

    if (currentBaserunnerState.thirdBase && manualAdvancement.third) {
      switch (manualAdvancement.third) {
        case 'home':
          finalRunsScored.push(currentBaserunnerState.thirdBase);
          break;
        case 'stay':
          thirdBase = currentBaserunnerState.thirdBase;
          break;
        // 'out' case - runner is removed (no assignment)
      }
    }

    // Add batter to first base if they reached base safely
    if (result.reachesBase()) {
      firstBase = batterId;
    }

    const newState = new BaserunnerStateClass(firstBase, secondBase, thirdBase);

    return { newState, runsScored: finalRunsScored };
  }

  /**
   * Process at-bat for auto-completion scenarios (walk, strikeout)
   */
  public processAutoCompletedAtBat(
    result: BattingResult,
    batterId: string,
    currentBaserunners: BaserunnerUI,
    currentOuts: number,
    lineup: Array<{ playerId: string; playerName: string }>
  ): ProcessedAtBatResult {
    const atBatData: AtBatData = {
      batterId,
      result,
      finalCount:
        result.value === 'BB' || result.value === 'IBB'
          ? { balls: 4, strikes: 0 }
          : { balls: 0, strikes: 3 },
      pitchSequence: [],
    };

    return this.processAtBat(
      atBatData,
      currentBaserunners,
      currentOuts,
      lineup
    );
  }

  /**
   * Validate at-bat data before processing
   */
  public validateAtBatData(atBatData: AtBatData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate batter ID
    if (!atBatData.batterId || atBatData.batterId.trim().length === 0) {
      errors.push('Batter ID is required');
    }

    // Validate result
    if (!atBatData.result) {
      errors.push('Batting result is required');
    }

    // Validate count
    if (!atBatData.finalCount) {
      errors.push('Final count is required');
    } else {
      if (atBatData.finalCount.balls < 0 || atBatData.finalCount.balls > 4) {
        errors.push('Ball count must be between 0 and 4');
      }
      if (
        atBatData.finalCount.strikes < 0 ||
        atBatData.finalCount.strikes > 3
      ) {
        errors.push('Strike count must be between 0 and 3');
      }
    }

    // Validate manual advancement options
    if (atBatData.baserunnerAdvancement) {
      const validOptions = ['stay', 'second', 'third', 'home', 'out'];
      for (const [position, action] of Object.entries(
        atBatData.baserunnerAdvancement
      )) {
        if (!['first', 'second', 'third'].includes(position)) {
          errors.push(`Invalid baserunner position: ${position}`);
        }
        if (action && !validOptions.includes(action)) {
          errors.push(`Invalid advancement option: ${action}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
