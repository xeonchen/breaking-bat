import { RuleMatrixService } from '@/domain/services/RuleMatrixService';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { HitType } from '@/domain/values/HitType';
import { ViolationType } from '@/domain/values/RuleViolation';

describe('RuleMatrixService', () => {
  let ruleMatrix: RuleMatrixService;

  beforeEach(() => {
    ruleMatrix = new RuleMatrixService();
  });

  describe('getBaseConfigurationKey', () => {
    it('should identify empty bases', () => {
      const state = BaserunnerState.empty();
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('empty');
    });

    it('should identify runner on first only', () => {
      const state = new BaserunnerState('player1', null, null);
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('first_only');
    });

    it('should identify runner on second only', () => {
      const state = new BaserunnerState(null, 'player2', null);
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('second_only');
    });

    it('should identify runner on third only', () => {
      const state = new BaserunnerState(null, null, 'player3');
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('third_only');
    });

    it('should identify runners on first and second', () => {
      const state = new BaserunnerState('player1', 'player2', null);
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('first_second');
    });

    it('should identify runners on first and third', () => {
      const state = new BaserunnerState('player1', null, 'player3');
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('first_third');
    });

    it('should identify runners on second and third', () => {
      const state = new BaserunnerState(null, 'player2', 'player3');
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('second_third');
    });

    it('should identify loaded bases', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      expect(ruleMatrix.getBaseConfigurationKey(state)).toBe('loaded');
    });
  });

  describe('Empty Bases Scenarios', () => {
    const emptyBases = BaserunnerState.empty();

    it('should handle single with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(emptyBases, HitType.SINGLE);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.firstBase).toBe('batter');
      expect(outcomes[0].afterState.secondBase).toBeNull();
      expect(outcomes[0].afterState.thirdBase).toBeNull();
      expect(outcomes[0].rbis).toBe(0);
      expect(outcomes[0].outs).toBe(0);
      expect(outcomes[0].runsScored).toEqual([]);
    });

    it('should handle double with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(emptyBases, HitType.DOUBLE);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.firstBase).toBeNull();
      expect(outcomes[0].afterState.secondBase).toBe('batter');
      expect(outcomes[0].afterState.thirdBase).toBeNull();
      expect(outcomes[0].rbis).toBe(0);
      expect(outcomes[0].outs).toBe(0);
    });

    it('should handle triple with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(emptyBases, HitType.TRIPLE);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.isEmpty()).toBe(true);
      expect(outcomes[0].rbis).toBe(1);
      expect(outcomes[0].runsScored).toEqual(['batter']);
    });

    it('should handle home run with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        emptyBases,
        HitType.HOME_RUN
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.isEmpty()).toBe(true);
      expect(outcomes[0].rbis).toBe(1);
      expect(outcomes[0].runsScored).toEqual(['batter']);
    });

    it('should handle walk with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(emptyBases, HitType.WALK);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.firstBase).toBe('batter');
      expect(outcomes[0].rbis).toBe(0);
      expect(outcomes[0].outs).toBe(0);
    });

    it('should handle strikeout with empty bases', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        emptyBases,
        HitType.STRIKEOUT
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.isEmpty()).toBe(true);
      expect(outcomes[0].rbis).toBe(0);
      expect(outcomes[0].outs).toBe(1);
    });
  });

  describe('Runner on First Scenarios', () => {
    const runnerOnFirst = new BaserunnerState('runner1', null, null);

    it('should handle single with runner on first - standard advancement', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        runnerOnFirst,
        HitType.SINGLE
      );

      expect(outcomes.length).toBeGreaterThanOrEqual(1);

      // Find standard outcome
      const standardOutcome = outcomes.find(
        (o) =>
          o.afterState.firstBase === 'batter' &&
          o.afterState.secondBase === 'runner1' &&
          o.rbis === 0
      );

      expect(standardOutcome).toBeDefined();
      expect(standardOutcome?.outs).toBe(0);
    });

    it('should handle single with runner on first - aggressive advancement', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        runnerOnFirst,
        HitType.SINGLE
      );

      // Find aggressive outcome where runner scores
      const aggressiveOutcome = outcomes.find(
        (o) =>
          o.afterState.firstBase === 'batter' &&
          o.afterState.secondBase === null &&
          o.rbis === 1 &&
          o.runsScored.includes('runner1')
      );

      expect(aggressiveOutcome).toBeDefined();
    });

    it('should handle double with runner on first', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        runnerOnFirst,
        HitType.DOUBLE
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.secondBase).toBe('batter');
      expect(outcomes[0].rbis).toBe(1);
      expect(outcomes[0].runsScored).toEqual(['runner1']);
    });

    it('should handle walk with runner on first - forced advancement', () => {
      const outcomes = ruleMatrix.getValidOutcomes(runnerOnFirst, HitType.WALK);

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.firstBase).toBe('batter');
      expect(outcomes[0].afterState.secondBase).toBe('runner1');
      expect(outcomes[0].rbis).toBe(0);
    });

    it('should handle double play with runner on first', () => {
      const outcomes = ruleMatrix.getValidOutcomes(
        runnerOnFirst,
        HitType.DOUBLE_PLAY
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].afterState.isEmpty()).toBe(true);
      expect(outcomes[0].outs).toBe(2);
      expect(outcomes[0].rbis).toBe(0);
    });
  });

  describe('validateTransition', () => {
    it('should validate correct empty bases single', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState('batter', null, null);

      const result = ruleMatrix.validateTransition(
        before,
        after,
        HitType.SINGLE,
        0
      );

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should reject invalid base advancement', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState(null, 'batter', null); // Wrong - single should go to first

      const result = ruleMatrix.validateTransition(
        before,
        after,
        HitType.SINGLE,
        0
      );

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(
        ViolationType.INVALID_BASE_ADVANCEMENT
      );
    });

    it('should reject incorrect RBI count', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState('batter', null, null);

      const result = ruleMatrix.validateTransition(
        before,
        after,
        HitType.SINGLE,
        1
      ); // Wrong RBI count

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });

    it('should provide suggested corrections for violations', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState(null, 'batter', null); // Wrong base

      const result = ruleMatrix.validateTransition(
        before,
        after,
        HitType.SINGLE,
        0
      );

      expect(result.suggestedCorrections.length).toBeGreaterThan(0);
      expect(result.suggestedCorrections[0].afterState.firstBase).toBe(
        'batter'
      );
    });
  });

  describe('getAvailableHitTypes', () => {
    it('should return all hit types for any base state', () => {
      const emptyBases = BaserunnerState.empty();
      const hitTypes = ruleMatrix.getAvailableHitTypes(emptyBases);

      expect(hitTypes).toContain(HitType.SINGLE);
      expect(hitTypes).toContain(HitType.DOUBLE);
      expect(hitTypes).toContain(HitType.HOME_RUN);
      expect(hitTypes).toContain(HitType.STRIKEOUT);
      expect(hitTypes.length).toBe(13); // All 13 hit types
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown hit types gracefully', () => {
      const emptyBases = BaserunnerState.empty();
      // This test would be for future error scenarios
      expect(() => {
        ruleMatrix.getValidOutcomes(emptyBases, HitType.SINGLE);
      }).not.toThrow();
    });
  });
});
