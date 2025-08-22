import { BaserunnerState } from './BaserunnerState';
import { HitType } from './HitType';
import { ValidOutcome } from './ValidOutcome';

/**
 * Types of rule violations that can occur
 */
export enum ViolationType {
  INVALID_BASE_ADVANCEMENT = 'invalid_base_advancement',
  IMPOSSIBLE_BASERUNNER_STATE = 'impossible_baserunner_state',
  INCORRECT_RBI_COUNT = 'incorrect_rbi_count',
  INVALID_HIT_TYPE = 'invalid_hit_type',
  EXCESSIVE_OUTS = 'excessive_outs',
  RUNNER_ORDER_VIOLATION = 'runner_order_violation',
  RUNNER_PASSING_VIOLATION = 'runner_passing_violation',
}

/**
 * Represents a violation of softball rules
 */
export class RuleViolation {
  constructor(
    public readonly type: ViolationType,
    public readonly message: string,
    public readonly scenario: {
      before: BaserunnerState;
      after: BaserunnerState;
      hitType: HitType;
      rbis: number;
      outs?: number;
      [key: string]: any; // Allow additional validation-specific properties
    },
    public readonly suggestedCorrections?: readonly ValidOutcome[]
  ) {}

  public toString(): string {
    return `Rule Violation [${this.type}]: ${this.message}`;
  }
}

/**
 * Result of rule validation
 */
export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly violations: readonly RuleViolation[] = [],
    public readonly suggestedCorrections: readonly ValidOutcome[] = []
  ) {}

  public static valid(): ValidationResult {
    return new ValidationResult(true);
  }

  public static invalid(
    violations: RuleViolation | readonly RuleViolation[],
    suggestedCorrections: readonly ValidOutcome[] = []
  ): ValidationResult {
    const violationArray = Array.isArray(violations)
      ? violations
      : [violations];
    return new ValidationResult(false, violationArray, suggestedCorrections);
  }

  public addViolation(violation: RuleViolation): ValidationResult {
    return new ValidationResult(
      false,
      [...this.violations, violation],
      this.suggestedCorrections
    );
  }

  public hasViolationType(type: ViolationType): boolean {
    return this.violations.some((v) => v.type === type);
  }

  /**
   * Get the first violation (for convenience when expecting single violations)
   */
  public get violation(): RuleViolation | undefined {
    return this.violations[0];
  }

  /**
   * Get suggested outcomes (alias for suggestedCorrections)
   */
  public get suggestedOutcomes(): readonly ValidOutcome[] {
    return this.suggestedCorrections;
  }
}
