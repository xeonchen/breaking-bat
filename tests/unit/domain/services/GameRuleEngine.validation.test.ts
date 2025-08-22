import {
  GameRuleEngine,
  AtBatValidationData,
} from '@/domain/services/GameRuleEngine';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { BattingResult } from '@/domain/values/BattingResult';
import { ViolationType } from '@/domain/values/RuleViolation';

describe('GameRuleEngine Validation Functions', () => {
  let ruleEngine: GameRuleEngine;

  const createValidationData = (
    beforeState: BaserunnerState,
    afterState: BaserunnerState,
    additionalData: Partial<AtBatValidationData> = {}
  ): AtBatValidationData => ({
    beforeState,
    afterState,
    battingResult: BattingResult.single(),
    batterId: 'batter1',
    runsScored: [],
    rbis: 0,
    outs: 0,
    ...additionalData,
  });

  beforeEach(() => {
    ruleEngine = new GameRuleEngine();
  });

  describe('validateNoRunnerPassing', () => {
    it('should validate normal advancement without passing', () => {
      // Runner on first advances to second on single
      const beforeState = new BaserunnerState('runner1', null, null);
      const afterState = new BaserunnerState('batter1', 'runner1', null);

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect runner passing violation - runner from first passes runner on second', () => {
      // Invalid scenario: Runner on first somehow ends up on third while runner on second stays on second
      const beforeState = new BaserunnerState('runner1', 'runner2', null); // runner1 on first, runner2 on second
      const afterState = new BaserunnerState('batter1', 'runner2', 'runner1'); // runner1 passed runner2!

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(
        result.violations.some(
          (v) => v.type === ViolationType.RUNNER_PASSING_VIOLATION
        )
      ).toBe(true);
      expect(
        result.violations.some((v) => v.message.includes('cannot pass runner'))
      ).toBe(true);
    });

    it('should allow runners to score without triggering passing violation', () => {
      // Runner on second scores, runner on first advances to third
      const beforeState = new BaserunnerState('runner1', 'runner2', null);
      const afterState = new BaserunnerState('batter1', null, 'runner1'); // runner2 scored, runner1 to third

      const validationData = createValidationData(beforeState, afterState, {
        runsScored: ['runner2'],
        rbis: 1,
      });
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle multiple runners advancing correctly', () => {
      // Bases loaded, all advance one base
      const beforeState = new BaserunnerState('runner1', 'runner2', 'runner3');
      const afterState = new BaserunnerState('batter1', 'runner1', 'runner2'); // runner3 scored

      const validationData = createValidationData(beforeState, afterState, {
        runsScored: ['runner3'],
        rbis: 1,
      });
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect complex passing scenario', () => {
      // Valid scenario: Runner on first advances to second, runner on third stays
      const beforeState = new BaserunnerState('runner1', null, 'runner3');
      const afterState = new BaserunnerState('batter1', 'runner1', 'runner3'); // Valid advancement

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true); // This is actually a valid scenario
    });

    it('should handle empty bases correctly', () => {
      const beforeState = BaserunnerState.empty();
      const afterState = new BaserunnerState('batter1', null, null);

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle legacy string-based baserunner state', () => {
      // Test with legacy string format that might still exist in the system
      const beforeState = new BaserunnerState('runner1', 'runner2', null);
      const afterState = new BaserunnerState('batter1', 'runner1', 'runner2');

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Implementation Detection Tests', () => {
    it('should actually implement validateNoRunnerPassing and not return default valid', () => {
      // Create a scenario that SHOULD fail validation
      const beforeState = new BaserunnerState('runner1', 'runner2', null);
      const afterState = new BaserunnerState('batter1', 'runner2', 'runner1'); // Runner 1 passes Runner 2

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      // If the function is properly implemented, this should fail
      // If it just returns ValidationResult.valid(), this test will fail
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should have functional getRunnerPositions helper method', () => {
      const state = new BaserunnerState('runner1', 'runner2', 'runner3');

      // This tests the helper method indirectly through validation
      const validationData = createValidationData(
        state,
        BaserunnerState.empty()
      );
      const result = ruleEngine.validateAtBat(validationData);

      // The validation should run without throwing errors, proving the helper works
      expect(result).toBeDefined();
    });
  });

  describe('validateBaseAdvancement', () => {
    it('should detect home run with runners left on base', () => {
      const beforeState = new BaserunnerState('runner1', 'runner2', null);
      const afterState = new BaserunnerState('batter1', 'runner1', null); // runner1 didn't score on HR!

      const validationData = createValidationData(beforeState, afterState, {
        battingResult: BattingResult.homeRun(),
      });
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(
        result.violations.some(
          (v) => v.type === ViolationType.INVALID_BASE_ADVANCEMENT
        )
      ).toBe(true);
    });

    it('should detect runners moving backwards inappropriately', () => {
      const beforeState = new BaserunnerState(null, 'runner2', null);
      const afterState = new BaserunnerState('runner2', null, null); // runner moved backwards!

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(
        result.violations.some(
          (v) => v.type === ViolationType.INVALID_BASE_ADVANCEMENT
        )
      ).toBe(true);
    });

    it('should allow valid advancement on home run', () => {
      const beforeState = new BaserunnerState('runner1', 'runner2', 'runner3');
      const afterState = BaserunnerState.empty(); // All runners scored

      const validationData = createValidationData(beforeState, afterState, {
        battingResult: BattingResult.homeRun(),
        runsScored: ['runner1', 'runner2', 'runner3', 'batter1'],
        rbis: 4,
      });
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateHitType', () => {
    it('should detect invalid hit type', () => {
      const validationData = createValidationData(
        BaserunnerState.empty(),
        BaserunnerState.empty(),
        { battingResult: { value: 'INVALID' } as any }
      );

      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(
        result.violations.some((v) => v.type === ViolationType.INVALID_HIT_TYPE)
      ).toBe(true);
    });

    it('should detect strikeout without outs', () => {
      const validationData = createValidationData(
        BaserunnerState.empty(),
        BaserunnerState.empty(),
        {
          battingResult: { value: 'SO' } as any,
          outs: 0, // Strikeout should result in at least 1 out
        }
      );

      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(
        result.violations.some((v) => v.type === ViolationType.INVALID_HIT_TYPE)
      ).toBe(true);
    });

    it('should accept valid hit types', () => {
      const validHitTypes = [
        '1B',
        '2B',
        '3B',
        'HR',
        'BB',
        'IBB',
        'SO',
        'GO',
        'AO',
      ];

      validHitTypes.forEach((hitType) => {
        const validationData = createValidationData(
          BaserunnerState.empty(),
          new BaserunnerState('batter1', null, null),
          {
            battingResult: { value: hitType } as any,
            outs: hitType === 'SO' ? 1 : 0, // Strikeouts need outs
          }
        );

        const result = ruleEngine.validateAtBat(validationData);

        if (
          result.violations.some(
            (v) => v.type === ViolationType.INVALID_HIT_TYPE
          )
        ) {
          throw new Error(`Valid hit type ${hitType} was rejected`);
        }
      });
    });
  });

  describe('validateRunnerOrder', () => {
    it('should detect runner order violations', () => {
      // Complex scenario: runner who was ahead ends up behind
      const beforeState = new BaserunnerState('runner1', null, 'runner3');
      const afterState = new BaserunnerState('batter1', 'runner3', 'runner1'); // runner3 passed runner1

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(false);
      expect(
        result.violations.some(
          (v) => v.type === ViolationType.RUNNER_ORDER_VIOLATION
        )
      ).toBe(true);
    });

    it('should allow proper runner order maintenance', () => {
      const beforeState = new BaserunnerState('runner1', 'runner2', null);
      const afterState = new BaserunnerState('batter1', 'runner1', 'runner2'); // Proper order maintained

      const validationData = createValidationData(beforeState, afterState);
      const result = ruleEngine.validateAtBat(validationData);

      expect(result.isValid).toBe(true);
    });
  });

  describe('All Validation Functions Implementation Check', () => {
    it('should not return default valid for validation functions', () => {
      // Test data that should trigger various validation rules
      const problematicData: AtBatValidationData = {
        beforeState: BaserunnerState.empty(),
        afterState: BaserunnerState.empty(),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 5, // Invalid - too many RBIs
        outs: 0,
      };

      const result = ruleEngine.validateAtBat(problematicData);

      // If RBI validation is properly implemented, this should fail
      // If it returns default valid, this test will catch it
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should have all critical validation rules implemented', () => {
      const testScenarios = [
        {
          name: 'Home run with runners left on base',
          data: createValidationData(
            new BaserunnerState('runner1', null, null),
            new BaserunnerState('batter1', 'runner1', null), // runner1 didn't score on HR
            { battingResult: BattingResult.homeRun() }
          ),
          expectedViolation: ViolationType.INVALID_BASE_ADVANCEMENT,
        },
        {
          name: 'Invalid hit type',
          data: createValidationData(
            BaserunnerState.empty(),
            BaserunnerState.empty(),
            { battingResult: { value: 'INVALID' } as any }
          ),
          expectedViolation: ViolationType.INVALID_HIT_TYPE,
        },
        {
          name: 'Runner order violation',
          data: createValidationData(
            new BaserunnerState('runner1', null, 'runner3'),
            new BaserunnerState('batter1', 'runner3', 'runner1') // runner3 passed runner1
          ),
          expectedViolation: ViolationType.RUNNER_ORDER_VIOLATION,
        },
      ];

      testScenarios.forEach((scenario) => {
        const result = ruleEngine.validateAtBat(scenario.data);

        const hasExpectedViolation = result.violations.some(
          (v) => v.type === scenario.expectedViolation
        );
        if (!hasExpectedViolation) {
          throw new Error(
            `Expected ${scenario.expectedViolation} violation for scenario: ${scenario.name}`
          );
        }
      });
    });
  });
});
