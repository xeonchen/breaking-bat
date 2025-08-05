import {
  ValidationRule,
  ValidationRuleFactory,
  AtBatValidationScenario,
} from '../values/ValidationRule';
import {
  ValidationResult,
  RuleViolation,
  ViolationType,
} from '../values/RuleViolation';

/**
 * Critical validation rules that prevent fundamental game rule violations
 * These rules represent basic game mechanics and data consistency requirements
 */
export class CriticalValidationRules {
  /**
   * Create the "no-runner-passing" validation rule
   * Prevents scenarios where a trailing runner passes a lead runner
   */
  public static createNoRunnerPassingRule(): ValidationRule {
    return ValidationRuleFactory.create(
      'no-runner-passing',
      'No Runner Passing',
      'Trailing runner cannot pass a lead runner',
      'critical',
      (scenario: AtBatValidationScenario) => {
        // Check for runner passing violations
        const before = scenario.beforeState;
        const after = scenario.afterState;

        // Get runner positions before and after
        const beforeRunners = new Map<string, number>();
        const afterRunners = new Map<string, number>();

        // Map before positions (1=first, 2=second, 3=third)
        if (before.firstBase) beforeRunners.set(before.firstBase, 1);
        if (before.secondBase) beforeRunners.set(before.secondBase, 2);
        if (before.thirdBase) beforeRunners.set(before.thirdBase, 3);

        // Map after positions
        if (after.firstBase) afterRunners.set(after.firstBase, 1);
        if (after.secondBase) afterRunners.set(after.secondBase, 2);
        if (after.thirdBase) afterRunners.set(after.thirdBase, 3);

        // Check if any runner moved backwards past another runner
        for (const [runnerId, beforePos] of beforeRunners) {
          const afterPos = afterRunners.get(runnerId);
          if (afterPos !== undefined) {
            // Check if this runner passed another runner
            for (const [otherRunnerId, otherBeforePos] of beforeRunners) {
              if (runnerId !== otherRunnerId) {
                const otherAfterPos = afterRunners.get(otherRunnerId);

                // If trailing runner (lower position) ends up ahead of lead runner
                if (
                  beforePos < otherBeforePos &&
                  afterPos !== undefined &&
                  otherAfterPos !== undefined &&
                  afterPos > otherAfterPos
                ) {
                  const violation = new RuleViolation(
                    ViolationType.RUNNER_ORDER_VIOLATION,
                    `Runner ${runnerId} cannot pass runner ${otherRunnerId}`,
                    {
                      before: scenario.beforeState,
                      after: scenario.afterState,
                      hitType: scenario.battingResult.toHitType(),
                      rbis: scenario.rbis,
                      outs: scenario.outs,
                    }
                  );

                  return ValidationResult.invalid(violation);
                }
              }
            }
          }
        }

        return ValidationResult.valid();
      }
    );
  }

  /**
   * Create the "rbi-validation" rule
   * Ensures RBI count does not exceed runs scored
   */
  public static createRbiValidationRule(): ValidationRule {
    return ValidationRuleFactory.create(
      'rbi-validation',
      'RBI Validation',
      'RBI count cannot exceed runs scored',
      'critical',
      (scenario: AtBatValidationScenario) => {
        if (scenario.rbis > scenario.runsScored.length) {
          const violation = new RuleViolation(
            ViolationType.INCORRECT_RBI_COUNT,
            `RBI count (${scenario.rbis}) cannot exceed runs scored (${scenario.runsScored.length})`,
            {
              before: scenario.beforeState,
              after: scenario.afterState,
              hitType: scenario.battingResult.toHitType(),
              rbis: scenario.rbis,
              outs: scenario.outs,
            }
          );

          return ValidationResult.invalid(violation);
        }

        return ValidationResult.valid();
      }
    );
  }

  /**
   * Create the "max-outs-validation" rule
   * Ensures no more than 3 outs are recorded on a single at-bat
   */
  public static createMaxOutsValidationRule(): ValidationRule {
    return ValidationRuleFactory.create(
      'max-outs-validation',
      'Maximum Outs Validation',
      'Cannot record more than 3 outs on a single at-bat',
      'critical',
      (scenario: AtBatValidationScenario) => {
        if (scenario.outs < 0 || scenario.outs > 3) {
          const violation = new RuleViolation(
            ViolationType.EXCESSIVE_OUTS,
            `Cannot record ${scenario.outs} outs on a single at-bat (must be 0-3)`,
            {
              before: scenario.beforeState,
              after: scenario.afterState,
              hitType: scenario.battingResult.toHitType(),
              rbis: scenario.rbis,
              outs: scenario.outs,
            }
          );

          return ValidationResult.invalid(violation);
        }

        return ValidationResult.valid();
      }
    );
  }

  /**
   * Create all critical validation rules
   */
  public static createAllCriticalRules(): ValidationRule[] {
    return [
      this.createNoRunnerPassingRule(),
      this.createRbiValidationRule(),
      this.createMaxOutsValidationRule(),
    ];
  }

  /**
   * Register all critical rules with a rule engine
   */
  public static registerWithEngine(
    engine: import('./ConfigurableRuleEngine').ConfigurableRuleEngine
  ): void {
    const rules = this.createAllCriticalRules();
    for (const rule of rules) {
      engine.registerRule(rule);
    }
  }
}
