import { BaserunnerState } from '../values/BaserunnerState';
import { HitType } from '../values/HitType';
import { ValidOutcome } from '../values/ValidOutcome';
import { ValidationResult } from '../values/RuleViolation';

/**
 * Interface for rule matrix validation service
 */
export interface IRuleMatrixService {
  /**
   * Get all valid outcomes for a base situation and hit type
   */
  getValidOutcomes(
    baseState: BaserunnerState,
    hitType: HitType
  ): readonly ValidOutcome[];

  /**
   * Validate if a transition follows softball rules
   */
  validateTransition(
    before: BaserunnerState,
    after: BaserunnerState,
    hitType: HitType,
    rbis: number,
    outs?: number
  ): ValidationResult;

  /**
   * Get hit types available for current game situation
   * (Future: may filter based on inning state, outs, etc.)
   */
  getAvailableHitTypes(baseState: BaserunnerState): readonly HitType[];

  /**
   * Get the base configuration key for a runner state
   */
  getBaseConfigurationKey(baseState: BaserunnerState): string;
}

/**
 * Scenario for testing and validation
 */
export interface AtBatScenario {
  before: BaserunnerState;
  after: BaserunnerState;
  hitType: HitType;
  rbis: number;
  outs?: number;
  runsScored?: readonly string[];
}
