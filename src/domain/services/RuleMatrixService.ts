import { BaserunnerState } from '../values/BaserunnerState';
import { HitType } from '../values/HitType';
import { ValidOutcome } from '../values/ValidOutcome';
import {
  RuleViolation,
  ValidationResult,
  ViolationType,
} from '../values/RuleViolation';
import { IRuleMatrixService } from './IRuleMatrixService';

/**
 * Hard-coded rule matrix implementation for slow-pitch softball
 * Provides O(1) lookup for all valid scenarios
 */
export class RuleMatrixService implements IRuleMatrixService {
  private readonly ruleMatrix: Map<
    string,
    Map<HitType, readonly ValidOutcome[]>
  >;

  constructor() {
    this.ruleMatrix = this.buildRuleMatrix();
  }

  public getValidOutcomes(
    baseState: BaserunnerState,
    hitType: HitType
  ): readonly ValidOutcome[] {
    const configKey = this.getBaseConfigurationKey(baseState);
    const hitTypeOutcomes = this.ruleMatrix.get(configKey);

    if (!hitTypeOutcomes) {
      throw new Error(
        `No rule matrix entry for base configuration: ${configKey}`
      );
    }

    const outcomes = hitTypeOutcomes.get(hitType);
    if (!outcomes) {
      throw new Error(`No outcomes defined for ${configKey} + ${hitType}`);
    }

    return outcomes;
  }

  public validateTransition(
    before: BaserunnerState,
    after: BaserunnerState,
    hitType: HitType,
    rbis: number,
    outs: number = 0
  ): ValidationResult {
    try {
      const validOutcomes = this.getValidOutcomes(before, hitType);

      // Check if the proposed transition matches any valid outcome
      const matchingOutcome = validOutcomes.find(
        (outcome) =>
          outcome.afterState.equals(after) &&
          outcome.rbis === rbis &&
          outcome.outs === outs
      );

      if (matchingOutcome) {
        return ValidationResult.valid();
      }

      // Create violation with suggested corrections
      const violation = new RuleViolation(
        ViolationType.INVALID_BASE_ADVANCEMENT,
        `Invalid transition from ${before.toString()} to ${after.toString()} with ${hitType}`,
        { before, after, hitType, rbis, outs },
        validOutcomes
      );

      return ValidationResult.invalid(violation, validOutcomes);
    } catch (error) {
      const violation = new RuleViolation(
        ViolationType.INVALID_HIT_TYPE,
        `Error validating scenario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { before, after, hitType, rbis, outs }
      );

      return ValidationResult.invalid(violation);
    }
  }

  public getAvailableHitTypes(_baseState: BaserunnerState): readonly HitType[] {
    // For now, return all hit types. Future enhancement could filter based on game state
    return Object.values(HitType);
  }

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

  /**
   * Build the complete rule matrix for all scenarios
   */
  private buildRuleMatrix(): Map<
    string,
    Map<HitType, readonly ValidOutcome[]>
  > {
    const matrix = new Map<string, Map<HitType, readonly ValidOutcome[]>>();

    // Build matrix for each base configuration
    matrix.set('empty', this.buildEmptyBasesRules());
    matrix.set('first_only', this.buildFirstOnlyRules());
    matrix.set('second_only', this.buildSecondOnlyRules());
    matrix.set('third_only', this.buildThirdOnlyRules());
    matrix.set('first_second', this.buildFirstSecondRules());
    matrix.set('first_third', this.buildFirstThirdRules());
    matrix.set('second_third', this.buildSecondThirdRules());
    matrix.set('loaded', this.buildLoadedBasesRules());

    return matrix;
  }

  private buildEmptyBasesRules(): Map<HitType, readonly ValidOutcome[]> {
    const rules = new Map<HitType, readonly ValidOutcome[]>();

    rules.set(HitType.SINGLE, [
      ValidOutcome.standard(
        new BaserunnerState('batter', null, null),
        0,
        [],
        'Batter reaches first base'
      ),
    ]);

    rules.set(HitType.DOUBLE, [
      ValidOutcome.standard(
        new BaserunnerState(null, 'batter', null),
        0,
        [],
        'Batter reaches second base'
      ),
    ]);

    rules.set(HitType.TRIPLE, [
      ValidOutcome.standard(
        BaserunnerState.empty(),
        1,
        ['batter'],
        'Batter scores on triple'
      ),
    ]);

    rules.set(HitType.HOME_RUN, [
      ValidOutcome.standard(
        BaserunnerState.empty(),
        1,
        ['batter'],
        'Solo home run'
      ),
    ]);

    rules.set(HitType.WALK, [
      ValidOutcome.standard(
        new BaserunnerState('batter', null, null),
        0,
        [],
        'Batter walks to first base'
      ),
    ]);

    rules.set(HitType.INTENTIONAL_WALK, [
      ValidOutcome.standard(
        new BaserunnerState('batter', null, null),
        0,
        [],
        'Batter intentionally walked'
      ),
    ]);

    rules.set(HitType.STRIKEOUT, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        1,
        [],
        'Batter strikes out'
      ),
    ]);

    rules.set(HitType.GROUND_OUT, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        1,
        [],
        'Batter grounds out'
      ),
    ]);

    rules.set(HitType.AIR_OUT, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        1,
        [],
        'Batter flies out'
      ),
    ]);

    // No runners to sacrifice or double play with empty bases
    rules.set(HitType.SACRIFICE_FLY, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        1,
        [],
        'Sacrifice fly with no runners (just an out)'
      ),
    ]);

    rules.set(HitType.FIELDERS_CHOICE, [
      ValidOutcome.standard(
        new BaserunnerState('batter', null, null),
        0,
        [],
        "Batter reaches on fielder's choice"
      ),
    ]);

    rules.set(HitType.DOUBLE_PLAY, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        1,
        [],
        'Batter out (no DP possible with empty bases)'
      ),
    ]);

    rules.set(HitType.ERROR, [
      ValidOutcome.standard(
        new BaserunnerState('batter', null, null),
        0,
        [],
        'Batter reaches first on error'
      ),
    ]);

    return rules;
  }

  private buildFirstOnlyRules(): Map<HitType, readonly ValidOutcome[]> {
    const rules = new Map<HitType, readonly ValidOutcome[]>();

    rules.set(HitType.SINGLE, [
      // Standard advancement
      ValidOutcome.standard(
        new BaserunnerState('batter', 'runner1', null),
        0,
        [],
        'Runner advances to second, batter to first'
      ),
      // Aggressive advancement - runner scores
      ValidOutcome.aggressive(
        new BaserunnerState('batter', null, null),
        1,
        0,
        ['runner1'],
        'Runner scores from first on single'
      ),
    ]);

    rules.set(HitType.DOUBLE, [
      ValidOutcome.standard(
        new BaserunnerState(null, 'batter', null),
        1,
        ['runner1'],
        'Runner scores from first on double'
      ),
    ]);

    rules.set(HitType.TRIPLE, [
      ValidOutcome.standard(
        BaserunnerState.empty(),
        2,
        ['runner1', 'batter'],
        'Both runner and batter score'
      ),
    ]);

    rules.set(HitType.HOME_RUN, [
      ValidOutcome.standard(
        BaserunnerState.empty(),
        2,
        ['runner1', 'batter'],
        '2-run home run'
      ),
    ]);

    rules.set(HitType.WALK, [
      ValidOutcome.standard(
        new BaserunnerState('batter', 'runner1', null),
        0,
        [],
        'Forced advancement - runner to second, batter to first'
      ),
    ]);

    rules.set(HitType.INTENTIONAL_WALK, [
      ValidOutcome.standard(
        new BaserunnerState('batter', 'runner1', null),
        0,
        [],
        'Forced advancement - runner to second, batter to first'
      ),
    ]);

    rules.set(HitType.STRIKEOUT, [
      ValidOutcome.withOuts(
        new BaserunnerState('runner1', null, null),
        0,
        1,
        [],
        'Batter strikes out, runner stays'
      ),
    ]);

    rules.set(HitType.GROUND_OUT, [
      ValidOutcome.withOuts(
        new BaserunnerState('runner1', null, null),
        0,
        1,
        [],
        'Batter grounds out, runner stays'
      ),
      // Force play at second
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        2,
        [],
        'Force play - both runner and batter out'
      ),
    ]);

    rules.set(HitType.AIR_OUT, [
      ValidOutcome.withOuts(
        new BaserunnerState('runner1', null, null),
        0,
        1,
        [],
        'Batter flies out, runner stays'
      ),
    ]);

    rules.set(HitType.SACRIFICE_FLY, [
      ValidOutcome.withOuts(
        new BaserunnerState('runner1', null, null),
        0,
        1,
        [],
        'Sacrifice fly with runner on first (no advancement)'
      ),
    ]);

    rules.set(HitType.FIELDERS_CHOICE, [
      ValidOutcome.withOuts(
        new BaserunnerState('batter', null, null),
        0,
        1,
        [],
        'Runner forced out at second, batter safe at first'
      ),
    ]);

    rules.set(HitType.DOUBLE_PLAY, [
      ValidOutcome.withOuts(
        BaserunnerState.empty(),
        0,
        2,
        [],
        'Classic 6-4-3 double play'
      ),
    ]);

    rules.set(HitType.ERROR, [
      ValidOutcome.standard(
        new BaserunnerState('batter', 'runner1', null),
        0,
        [],
        'Batter reaches on error, runner advances'
      ),
    ]);

    return rules;
  }

  // TODO: Implement remaining base configurations
  private buildSecondOnlyRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for runner on second only scenarios
    return new Map(); // Placeholder - will implement in next iteration
  }

  private buildThirdOnlyRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for runner on third only scenarios
    return new Map(); // Placeholder
  }

  private buildFirstSecondRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for runners on first and second
    return new Map(); // Placeholder
  }

  private buildFirstThirdRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for runners on first and third
    return new Map(); // Placeholder
  }

  private buildSecondThirdRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for runners on second and third
    return new Map(); // Placeholder
  }

  private buildLoadedBasesRules(): Map<HitType, readonly ValidOutcome[]> {
    // Implementation for bases loaded scenarios
    return new Map(); // Placeholder
  }
}
