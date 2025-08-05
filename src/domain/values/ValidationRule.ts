import { ValidationResult } from './RuleViolation';

/**
 * Represents a single validation rule that can be enabled/disabled
 */
export interface ValidationRule {
  /** Unique identifier for the rule */
  readonly id: string;

  /** Human-readable name for the rule */
  readonly name: string;

  /** Description of what the rule validates */
  readonly description: string;

  /** Whether the rule is currently enabled */
  enabled: boolean;

  /** Rule category for organization */
  readonly category: 'critical' | 'configurable' | 'optional';

  /**
   * Validate an at-bat scenario against this rule
   * @param scenario The at-bat scenario to validate
   * @returns ValidationResult indicating if the scenario is valid
   */
  validate(scenario: AtBatValidationScenario): ValidationResult;
}

/**
 * Scenario data needed for rule validation
 */
export interface AtBatValidationScenario {
  /** Baserunner state before the at-bat */
  beforeState: import('../values/BaserunnerState').BaserunnerState;

  /** Baserunner state after the at-bat */
  afterState: import('../values/BaserunnerState').BaserunnerState;

  /** The batting result */
  battingResult: import('../values/BattingResult').BattingResult;

  /** Number of RBIs recorded */
  rbis: number;

  /** Number of outs recorded */
  outs: number;

  /** List of runs scored */
  runsScored: readonly string[];

  /** ID of the batter */
  batterId: string;
}

/**
 * Factory for creating validation rules
 */
export class ValidationRuleFactory {
  /**
   * Create a validation rule with the given properties
   */
  public static create(
    id: string,
    name: string,
    description: string,
    category: 'critical' | 'configurable' | 'optional',
    validateFn: (scenario: AtBatValidationScenario) => ValidationResult,
    enabled: boolean = true
  ): ValidationRule {
    return {
      id,
      name,
      description,
      category,
      enabled,
      validate: validateFn,
    };
  }
}

/**
 * Configuration for the rule engine
 */
export interface RuleEngineConfig {
  /** Map of rule ID to enabled status */
  ruleStates: Map<string, boolean>;

  /** Default enabled state for new rules */
  defaultEnabled: boolean;
}

/**
 * Result of rule engine validation
 */
export interface RuleEngineValidationResult {
  /** Whether all enabled rules passed */
  isValid: boolean;

  /** Results from individual rules */
  ruleResults: Map<string, ValidationResult>;

  /** Combined violations from all failed rules */
  allViolations: readonly import('./RuleViolation').RuleViolation[];

  /** All suggested corrections from failed rules */
  allSuggestions: readonly import('./ValidOutcome').ValidOutcome[];
}
