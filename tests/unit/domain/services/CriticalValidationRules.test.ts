import { CriticalValidationRules } from '@/domain/services/CriticalValidationRules';
import { AtBatValidationScenario } from '@/domain/values/ValidationRule';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { BattingResult } from '@/domain/values/BattingResult';
import { ViolationType } from '@/domain/values/RuleViolation';

describe('CriticalValidationRules', () => {
  const createBaseScenario = (
    overrides: Partial<AtBatValidationScenario> = {}
  ): AtBatValidationScenario => ({
    beforeState: BaserunnerState.empty(),
    afterState: new BaserunnerState('batter', null, null),
    battingResult: BattingResult.single(),
    rbis: 0,
    outs: 0,
    runsScored: [],
    batterId: 'batter',
    ...overrides,
  });

  describe('No Runner Passing Rule', () => {
    let rule: ReturnType<
      typeof CriticalValidationRules.createNoRunnerPassingRule
    >;

    beforeEach(() => {
      rule = CriticalValidationRules.createNoRunnerPassingRule();
    });

    it('should have correct metadata', () => {
      expect(rule.id).toBe('no-runner-passing');
      expect(rule.name).toBe('No Runner Passing');
      expect(rule.category).toBe('critical');
      expect(rule.enabled).toBe(true);
    });

    it('should pass when no runners pass each other', () => {
      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', 'runner2', null),
        afterState: new BaserunnerState(null, 'runner1', 'runner2'),
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should pass when runners advance normally', () => {
      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', null, 'runner3'),
        afterState: new BaserunnerState('batter', 'runner1', null),
        runsScored: ['runner3'],
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should fail when trailing runner passes lead runner', () => {
      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', 'runner2', null),
        afterState: new BaserunnerState('runner2', 'runner1', null), // runner1 passed runner2
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(
        ViolationType.RUNNER_ORDER_VIOLATION
      );
      expect(result.violations[0].message).toContain('cannot pass');
    });

    it('should handle empty bases correctly', () => {
      const scenario = createBaseScenario({
        beforeState: BaserunnerState.empty(),
        afterState: new BaserunnerState('batter', null, null),
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should handle runners scoring correctly', () => {
      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', 'runner2', 'runner3'),
        afterState: new BaserunnerState('batter', 'runner1', 'runner2'),
        runsScored: ['runner3'],
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });
  });

  describe('RBI Validation Rule', () => {
    let rule: ReturnType<
      typeof CriticalValidationRules.createRbiValidationRule
    >;

    beforeEach(() => {
      rule = CriticalValidationRules.createRbiValidationRule();
    });

    it('should have correct metadata', () => {
      expect(rule.id).toBe('rbi-validation');
      expect(rule.name).toBe('RBI Validation');
      expect(rule.category).toBe('critical');
      expect(rule.enabled).toBe(true);
    });

    it('should pass when RBIs equal runs scored', () => {
      const scenario = createBaseScenario({
        rbis: 2,
        runsScored: ['runner1', 'runner2'],
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should pass when RBIs are less than runs scored', () => {
      const scenario = createBaseScenario({
        rbis: 1,
        runsScored: ['runner1', 'runner2'], // 2 runs but only 1 RBI (e.g., error)
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should fail when RBIs exceed runs scored', () => {
      const scenario = createBaseScenario({
        rbis: 3,
        runsScored: ['runner1', 'runner2'], // Only 2 runs but 3 RBIs
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.INCORRECT_RBI_COUNT);
      expect(result.violations[0].message).toContain(
        'cannot exceed runs scored'
      );
    });

    it('should handle zero RBIs correctly', () => {
      const scenario = createBaseScenario({
        rbis: 0,
        runsScored: [],
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should handle strikeout with no RBIs', () => {
      const scenario = createBaseScenario({
        battingResult: BattingResult.strikeout(),
        rbis: 0,
        runsScored: [],
        outs: 1,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Max Outs Validation Rule', () => {
    let rule: ReturnType<
      typeof CriticalValidationRules.createMaxOutsValidationRule
    >;

    beforeEach(() => {
      rule = CriticalValidationRules.createMaxOutsValidationRule();
    });

    it('should have correct metadata', () => {
      expect(rule.id).toBe('max-outs-validation');
      expect(rule.name).toBe('Maximum Outs Validation');
      expect(rule.category).toBe('critical');
      expect(rule.enabled).toBe(true);
    });

    it('should pass with 0 outs', () => {
      const scenario = createBaseScenario({
        outs: 0,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should pass with 1 out', () => {
      const scenario = createBaseScenario({
        battingResult: BattingResult.strikeout(),
        outs: 1,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should pass with 2 outs (double play)', () => {
      const scenario = createBaseScenario({
        battingResult: BattingResult.doublePlay(),
        outs: 2,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should pass with 3 outs (triple play)', () => {
      const scenario = createBaseScenario({
        outs: 3,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(true);
    });

    it('should fail with more than 3 outs', () => {
      const scenario = createBaseScenario({
        outs: 4,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.EXCESSIVE_OUTS);
      expect(result.violations[0].message).toContain('Cannot record 4 outs');
    });

    it('should fail with negative outs', () => {
      const scenario = createBaseScenario({
        outs: -1,
      });

      const result = rule.validate(scenario);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Rule Factory Methods', () => {
    it('should create all critical rules', () => {
      const rules = CriticalValidationRules.createAllCriticalRules();

      expect(rules).toHaveLength(3);
      expect(rules.map((r) => r.id)).toEqual([
        'no-runner-passing',
        'rbi-validation',
        'max-outs-validation',
      ]);

      rules.forEach((rule) => {
        expect(rule.category).toBe('critical');
        expect(rule.enabled).toBe(true);
      });
    });

    it('should register rules with engine', () => {
      const mockEngine = {
        registerRule: jest.fn(),
      } as any;

      CriticalValidationRules.registerWithEngine(mockEngine);

      expect(mockEngine.registerRule).toHaveBeenCalledTimes(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle home run scenario correctly', () => {
      const noRunnerPassingRule =
        CriticalValidationRules.createNoRunnerPassingRule();
      const rbiRule = CriticalValidationRules.createRbiValidationRule();
      const maxOutsRule = CriticalValidationRules.createMaxOutsValidationRule();

      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', 'runner2', 'runner3'),
        afterState: BaserunnerState.empty(),
        battingResult: BattingResult.homeRun(),
        rbis: 4,
        outs: 0,
        runsScored: ['runner1', 'runner2', 'runner3', 'batter'],
      });

      expect(noRunnerPassingRule.validate(scenario).isValid).toBe(true);
      expect(rbiRule.validate(scenario).isValid).toBe(true);
      expect(maxOutsRule.validate(scenario).isValid).toBe(true);
    });

    it('should handle double play scenario correctly', () => {
      const noRunnerPassingRule =
        CriticalValidationRules.createNoRunnerPassingRule();
      const rbiRule = CriticalValidationRules.createRbiValidationRule();
      const maxOutsRule = CriticalValidationRules.createMaxOutsValidationRule();

      const scenario = createBaseScenario({
        beforeState: new BaserunnerState('runner1', null, null),
        afterState: BaserunnerState.empty(),
        battingResult: BattingResult.doublePlay(),
        rbis: 0,
        outs: 2,
        runsScored: [],
      });

      expect(noRunnerPassingRule.validate(scenario).isValid).toBe(true);
      expect(rbiRule.validate(scenario).isValid).toBe(true);
      expect(maxOutsRule.validate(scenario).isValid).toBe(true);
    });
  });
});
