import { BaserunnerState } from '../values/BaserunnerState';
import { BattingResult } from '../values/BattingResult';
import { ValidOutcome } from '../values/ValidOutcome';
import { ValidationRule } from '../values/ValidationRule';
import {
  ValidationResult,
  RuleViolation,
  ViolationType,
} from '../values/RuleViolation';
import { HitType } from '../values/HitType';

export interface GameRuleConfig {
  enableValidation: boolean;
  enableOutcomeGeneration: boolean;
  strictValidation: boolean;
  customRules: ValidationRule[];
}

export interface OutcomeGenerationParameters {
  aggressiveRunning: boolean;
  fieldingErrors: boolean;
  unconventionalAdvancement: boolean;
}

export interface AtBatValidationData {
  beforeState: BaserunnerState;
  afterState: BaserunnerState;
  battingResult: BattingResult;
  batterId: string;
  runsScored: readonly string[];
  rbis: number;
  outs: number;
}

/**
 * Unified game rule engine that consolidates all rule-related functionality
 * Combines validation, outcome generation, and rule management
 */
export class GameRuleEngine {
  private config: GameRuleConfig;
  private validationRules: Map<string, ValidationRule> = new Map();

  constructor(config?: Partial<GameRuleConfig>) {
    this.config = {
      enableValidation: true,
      enableOutcomeGeneration: true,
      strictValidation: false,
      customRules: [],
      ...config,
    };

    this.initializeDefaultRules();
    this.registerCustomRules(this.config.customRules);
  }

  // ========== Validation Methods ==========

  /**
   * Validate an at-bat scenario against all active rules
   */
  public validateAtBat(data: AtBatValidationData): ValidationResult {
    if (!this.config.enableValidation) {
      return ValidationResult.valid();
    }

    const violations: RuleViolation[] = [];

    for (const rule of this.validationRules.values()) {
      if (!rule.enabled) {
        continue; // Skip disabled rules
      }

      try {
        const result = rule.validate({
          beforeState: data.beforeState,
          afterState: data.afterState,
          battingResult: data.battingResult,
          batterId: data.batterId,
          runsScored: data.runsScored,
          rbis: data.rbis,
          outs: data.outs,
        });

        if (!result.isValid) {
          violations.push(...result.violations);
        }
      } catch (error) {
        if (this.config.strictValidation) {
          violations.push(
            new RuleViolation(
              ViolationType.INVALID_BASE_ADVANCEMENT,
              `Rule validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                before: data.beforeState,
                after: data.afterState,
                hitType: data.battingResult.value as HitType,
                rbis: data.rbis,
                outs: data.outs,
              }
            )
          );
        }
      }
    }

    return violations.length === 0
      ? ValidationResult.valid()
      : ValidationResult.invalid(violations);
  }

  /**
   * Register a custom validation rule
   */
  public registerRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * Remove a validation rule
   */
  public unregisterRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
  }

  /**
   * Enable or disable a specific rule
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.validationRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // ========== Outcome Generation Methods ==========

  /**
   * Generate valid outcomes for a batting scenario
   */
  public generateValidOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    parameters?: OutcomeGenerationParameters
  ): ValidOutcome[] {
    if (!this.config.enableOutcomeGeneration) {
      return [
        this.generateStandardOutcome(beforeState, battingResult, batterId),
      ];
    }

    const outcomes: ValidOutcome[] = [];

    // Always include standard outcome
    const standardOutcome = this.generateStandardOutcome(
      beforeState,
      battingResult,
      batterId
    );
    outcomes.push(standardOutcome);

    // Generate parameter-based variations if requested
    if (parameters) {
      const variations = this.generateOutcomeVariations(
        beforeState,
        battingResult,
        batterId,
        parameters
      );
      outcomes.push(...variations);
    }

    return outcomes;
  }

  /**
   * Generate the standard (most common) outcome for a batting result
   */
  private generateStandardOutcome(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): ValidOutcome {
    const afterState = this.calculateStandardAdvancement(
      beforeState,
      battingResult,
      batterId
    );
    const runsScored = this.calculateRunsScored(
      beforeState,
      afterState,
      battingResult,
      batterId
    );
    const rbis = this.calculateRBIs(battingResult, runsScored);

    return ValidOutcome.standard(
      afterState,
      rbis,
      runsScored,
      'Standard softball advancement rules'
    );
  }

  /**
   * Generate outcome variations based on parameters
   */
  private generateOutcomeVariations(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    parameters: OutcomeGenerationParameters
  ): ValidOutcome[] {
    const variations: ValidOutcome[] = [];

    // Aggressive running variations
    if (
      parameters.aggressiveRunning &&
      this.allowsAggressiveRunning(battingResult)
    ) {
      const aggressiveOutcome = this.generateAggressiveOutcome(
        beforeState,
        battingResult,
        batterId
      );
      if (aggressiveOutcome) {
        variations.push(aggressiveOutcome);
      }
    }

    // Fielding error variations
    if (parameters.fieldingErrors && this.allowsFieldingErrors(battingResult)) {
      const errorOutcome = this.generateErrorOutcome(
        beforeState,
        battingResult,
        batterId
      );
      if (errorOutcome) {
        variations.push(errorOutcome);
      }
    }

    // Unconventional advancement variations
    if (parameters.unconventionalAdvancement) {
      const unconventionalOutcome = this.generateUnconventionalOutcome(
        beforeState,
        battingResult,
        batterId
      );
      if (unconventionalOutcome) {
        variations.push(unconventionalOutcome);
      }
    }

    return variations;
  }

  // ========== Private Helper Methods ==========

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Critical validation rules
    this.registerRule({
      id: 'no-runner-passing',
      name: 'No Runner Passing Rule',
      description: 'Runners cannot pass each other',
      category: 'critical',
      enabled: true,
      validate: (data) => this.validateNoRunnerPassing(data),
    });

    this.registerRule({
      id: 'rbi-validation',
      name: 'RBI Validation Rule',
      description: 'RBIs must not exceed runs scored',
      category: 'critical',
      enabled: true,
      validate: (data) => this.validateRBIs(data),
    });

    this.registerRule({
      id: 'max-outs',
      name: 'Maximum Outs Rule',
      description: 'Cannot exceed 3 outs per at-bat',
      category: 'critical',
      enabled: true,
      validate: (data) => this.validateMaxOuts(data),
    });

    this.registerRule({
      id: 'base-occupancy',
      name: 'Base Occupancy Rule',
      description: 'Only one runner per base',
      category: 'critical',
      enabled: true,
      validate: (data) => this.validateBaseOccupancy(data),
    });
  }

  /**
   * Register custom rules from configuration
   */
  private registerCustomRules(customRules: ValidationRule[]): void {
    for (const rule of customRules) {
      this.registerRule(rule);
    }
  }

  /**
   * Calculate standard baserunner advancement
   */
  private calculateStandardAdvancement(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): BaserunnerState {
    // Use existing ScoringService logic for standard advancement
    // This is a simplified implementation - would delegate to ScoringService in practice

    switch (battingResult.value) {
      case 'HR': // Home run - all bases clear
        return new BaserunnerState(null, null, null);
      case '3B': // Triple - batter to third
        return new BaserunnerState(null, null, batterId);
      case '2B': // Double - batter to second, advance others
        return new BaserunnerState(
          null,
          batterId,
          beforeState.firstBase || null
        );
      case '1B': // Single - batter to first, advance others
        return new BaserunnerState(
          batterId,
          beforeState.firstBase || null,
          beforeState.secondBase || null
        );
      default: // Other results - maintain current state
        return new BaserunnerState(
          beforeState.firstBase,
          beforeState.secondBase,
          beforeState.thirdBase
        );
    }
  }

  /**
   * Calculate runs scored based on before/after states
   */
  private calculateRunsScored(
    beforeState: BaserunnerState,
    afterState: BaserunnerState,
    battingResult: BattingResult,
    _batterId: string
  ): string[] {
    const runsScored: string[] = [];

    // Handle home runs - all runners score including batter
    if (battingResult.value === 'HR') {
      if (beforeState.firstBase) runsScored.push(beforeState.firstBase);
      if (beforeState.secondBase) runsScored.push(beforeState.secondBase);
      if (beforeState.thirdBase) runsScored.push(beforeState.thirdBase);
      // Note: batter scoring is handled separately in the calling code
      return runsScored;
    }

    // Check each runner from before state who is no longer on base
    if (
      beforeState.firstBase &&
      !this.isRunnerOnBase(beforeState.firstBase, afterState)
    ) {
      runsScored.push(beforeState.firstBase);
    }
    if (
      beforeState.secondBase &&
      !this.isRunnerOnBase(beforeState.secondBase, afterState)
    ) {
      runsScored.push(beforeState.secondBase);
    }
    if (
      beforeState.thirdBase &&
      !this.isRunnerOnBase(beforeState.thirdBase, afterState)
    ) {
      runsScored.push(beforeState.thirdBase);
    }

    return runsScored;
  }

  /**
   * Check if a runner is still on base
   */
  private isRunnerOnBase(playerId: string, state: BaserunnerState): boolean {
    return (
      state.firstBase === playerId ||
      state.secondBase === playerId ||
      state.thirdBase === playerId
    );
  }

  /**
   * Calculate RBIs based on batting result and runs scored
   */
  private calculateRBIs(
    battingResult: BattingResult,
    runsScored: string[]
  ): number {
    // Simplified RBI calculation
    if (['BB', 'IBB', 'E'].includes(battingResult.value)) {
      return 0; // No RBIs for walks or errors (simplified)
    }
    return runsScored.length;
  }

  // ========== Validation Helper Methods ==========

  private validateNoRunnerPassing(
    _data: AtBatValidationData
  ): ValidationResult {
    // TODO: Implementation for runner passing validation
    return ValidationResult.valid();
  }

  private validateRBIs(data: AtBatValidationData): ValidationResult {
    if (data.rbis > data.runsScored.length) {
      return ValidationResult.invalid(
        new RuleViolation(
          ViolationType.INCORRECT_RBI_COUNT,
          'RBIs cannot exceed runs scored',
          {
            before: data.beforeState,
            after: data.afterState,
            hitType: data.battingResult.value as HitType,
            rbis: data.rbis,
          }
        )
      );
    }
    return ValidationResult.valid();
  }

  private validateMaxOuts(data: AtBatValidationData): ValidationResult {
    if (data.outs > 3) {
      return ValidationResult.invalid(
        new RuleViolation(
          ViolationType.EXCESSIVE_OUTS,
          'Cannot exceed 3 outs per at-bat',
          {
            before: data.beforeState,
            after: data.afterState,
            hitType: data.battingResult.value as HitType,
            rbis: data.rbis,
            outs: data.outs,
          }
        )
      );
    }
    return ValidationResult.valid();
  }

  private validateBaseOccupancy(data: AtBatValidationData): ValidationResult {
    // Check for duplicate runners on different bases
    const runners = [
      data.afterState.firstBase,
      data.afterState.secondBase,
      data.afterState.thirdBase,
    ].filter(Boolean);

    const uniqueRunners = new Set(runners);
    if (runners.length !== uniqueRunners.size) {
      return ValidationResult.invalid(
        new RuleViolation(
          ViolationType.IMPOSSIBLE_BASERUNNER_STATE,
          'Multiple runners cannot occupy the same base',
          {
            before: data.beforeState,
            after: data.afterState,
            hitType: data.battingResult.value as HitType,
            rbis: data.rbis,
          }
        )
      );
    }
    return ValidationResult.valid();
  }

  // ========== Outcome Generation Helper Methods ==========

  private allowsAggressiveRunning(battingResult: BattingResult): boolean {
    return ['1B', '2B', 'GO', 'AO'].includes(battingResult.value);
  }

  private allowsFieldingErrors(battingResult: BattingResult): boolean {
    return !['HR', 'SO', 'BB', 'IBB'].includes(battingResult.value);
  }

  private generateAggressiveOutcome(
    _beforeState: BaserunnerState,
    _battingResult: BattingResult,
    _batterId: string
  ): ValidOutcome | null {
    // Implementation for aggressive running scenarios
    return null; // Simplified - would implement actual logic
  }

  private generateErrorOutcome(
    _beforeState: BaserunnerState,
    _battingResult: BattingResult,
    _batterId: string
  ): ValidOutcome | null {
    // Implementation for fielding error scenarios
    return null; // Simplified - would implement actual logic
  }

  private generateUnconventionalOutcome(
    _beforeState: BaserunnerState,
    _battingResult: BattingResult,
    _batterId: string
  ): ValidOutcome | null {
    // Implementation for unconventional advancement scenarios
    return null; // Simplified - would implement actual logic
  }
}
