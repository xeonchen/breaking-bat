import { BaserunnerState } from '../values/BaserunnerState';
import { BattingResult } from '../values/BattingResult';
import { ValidOutcome } from '../values/ValidOutcome';
import {
  OutcomeParameters,
  OutcomeParametersFactory,
} from '../values/OutcomeParameters';
import {
  RuleViolation,
  ValidationResult,
  ViolationType,
} from '../values/RuleViolation';
import { RuleEngine } from './RuleEngine';
import { ConfigurableRuleEngine } from './ConfigurableRuleEngine';
import { CriticalValidationRules } from './CriticalValidationRules';
import { AtBatValidationScenario } from '../values/ValidationRule';

/**
 * Parameter-based rule matrix implementation for slow-pitch softball
 * Uses the RuleEngine to generate valid outcomes based on 3-parameter system
 * Integrates with configurable rule validation framework
 */
export class RuleMatrixService {
  private configurableRuleEngine: ConfigurableRuleEngine;

  constructor(ruleEngine?: ConfigurableRuleEngine) {
    // Initialize configurable rule engine
    this.configurableRuleEngine = ruleEngine || new ConfigurableRuleEngine();

    // Register critical validation rules by default
    if (!ruleEngine) {
      CriticalValidationRules.registerWithEngine(this.configurableRuleEngine);
    }
  }

  /**
   * Get all valid outcomes for a given base state and hit type
   * Uses parameter-based generation instead of pre-built lookup
   */
  public getValidOutcomes(
    baseState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string = 'batter'
  ): readonly ValidOutcome[] {
    return RuleEngine.getAllValidOutcomes(baseState, battingResult, batterId);
  }

  /**
   * Get valid outcomes for specific parameter combination
   */
  public getValidOutcomesWithParameters(
    baseState: BaserunnerState,
    battingResult: BattingResult,
    parameters: OutcomeParameters,
    batterId: string = 'batter'
  ): readonly ValidOutcome[] {
    return RuleEngine.generateValidOutcomes(
      baseState,
      battingResult,
      batterId,
      parameters
    );
  }

  /**
   * Validate if a proposed at-bat outcome is valid
   * Combines parameter-based validation with configurable rule validation
   */
  public validateAtBat(
    before: BaserunnerState,
    after: BaserunnerState,
    battingResult: BattingResult,
    rbis: number,
    runsScored: string[],
    outs: number = 0,
    batterId: string = 'batter'
  ): ValidationResult {
    try {
      // Step 1: Run configurable rule validation first
      const scenario: AtBatValidationScenario = {
        beforeState: before,
        afterState: after,
        battingResult,
        rbis,
        outs,
        runsScored,
        batterId,
      };

      const ruleValidationResult =
        this.configurableRuleEngine.validateAtBat(scenario);

      // If rule validation fails, still provide parameter-based valid outcomes as suggestions
      if (!ruleValidationResult.isValid) {
        const validOutcomes = this.getValidOutcomes(
          before,
          battingResult,
          batterId
        );
        return ValidationResult.invalid(
          ruleValidationResult.allViolations,
          validOutcomes
        );
      }

      // Step 2: Run parameter-based outcome validation
      const validOutcomes = this.getValidOutcomes(
        before,
        battingResult,
        batterId
      );

      // Check if the proposed outcome matches any valid outcome
      const matchingOutcome = validOutcomes.find(
        (outcome) =>
          outcome.afterState.equals(after) &&
          outcome.rbis === rbis &&
          outcome.outs === outs &&
          outcome.runsScored.length === runsScored.length &&
          outcome.runsScored.every(
            (runner, index) => runner === runsScored[index]
          )
      );

      if (matchingOutcome) {
        return ValidationResult.valid();
      }

      // Invalid outcome - create violation with suggestions
      const violation = new RuleViolation(
        ViolationType.INVALID_BASE_ADVANCEMENT,
        `Invalid transition from ${before.toString()} to ${after.toString()} with ${battingResult.value}`,
        { before, after, hitType: battingResult.toHitType(), rbis, outs },
        validOutcomes
      );

      return ValidationResult.invalid(violation, validOutcomes);
    } catch (error) {
      const violation = new RuleViolation(
        ViolationType.INVALID_HIT_TYPE,
        `Error validating scenario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { before, after, hitType: battingResult.toHitType(), rbis, outs }
      );

      return ValidationResult.invalid(violation);
    }
  }

  /**
   * Get all available parameter combinations
   */
  public getAvailableParameters(): readonly OutcomeParameters[] {
    return OutcomeParametersFactory.getAllCombinations();
  }

  /**
   * Get description for parameter combination
   */
  public describeParameters(parameters: OutcomeParameters): string {
    return OutcomeParametersFactory.describe(parameters);
  }

  /**
   * Get the configurable rule engine for direct rule management
   */
  public getRuleEngine(): ConfigurableRuleEngine {
    return this.configurableRuleEngine;
  }

  /**
   * Enable a specific validation rule
   */
  public enableRule(ruleId: string): void {
    this.configurableRuleEngine.enableRule(ruleId);
  }

  /**
   * Disable a specific validation rule
   */
  public disableRule(ruleId: string): void {
    this.configurableRuleEngine.disableRule(ruleId);
  }

  /**
   * Check if a specific rule is enabled
   */
  public isRuleEnabled(ruleId: string): boolean {
    return this.configurableRuleEngine.isRuleEnabled(ruleId);
  }

  /**
   * Get all available validation rules
   */
  public getAvailableRules(): readonly import('../values/ValidationRule').ValidationRule[] {
    return this.configurableRuleEngine.getAllRules();
  }

  /**
   * Get base configuration key for debugging/logging
   */
  public getBaseConfigurationKey(baseState: BaserunnerState): string {
    const hasFirst = baseState.firstBase !== null;
    const hasSecond = baseState.secondBase !== null;
    const hasThird = baseState.thirdBase !== null;

    if (!hasFirst && !hasSecond && !hasThird) return 'empty';
    if (hasFirst && !hasSecond && !hasThird) return 'first_only';
    if (!hasFirst && hasSecond && !hasThird) return 'second_only';
    if (!hasFirst && !hasSecond && hasThird) return 'third_only';
    if (hasFirst && hasSecond && !hasThird) return 'first_second';
    if (hasFirst && !hasSecond && hasThird) return 'first_third';
    if (!hasFirst && hasSecond && hasThird) return 'second_third';
    if (hasFirst && hasSecond && hasThird) return 'loaded';

    throw new Error(`Invalid baserunner state: ${baseState.toString()}`);
  }

  // Legacy methods removed - rule matrix now uses parameter-based generation
}
