import { ConfigurableRuleEngine } from '@/domain/services/ConfigurableRuleEngine';
import {
  ValidationRuleFactory,
  AtBatValidationScenario,
} from '@/domain/values/ValidationRule';
import {
  ValidationResult,
  RuleViolation,
  ViolationType,
} from '@/domain/values/RuleViolation';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { BattingResult } from '@/domain/values/BattingResult';

describe('ConfigurableRuleEngine', () => {
  let ruleEngine: ConfigurableRuleEngine;

  beforeEach(() => {
    ruleEngine = new ConfigurableRuleEngine();
  });

  describe('rule registration', () => {
    it('should register a new rule', () => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(rule);

      const allRules = ruleEngine.getAllRules();
      expect(allRules).toHaveLength(1);
      expect(allRules[0].id).toBe('test-rule');
    });

    it('should set rule as enabled by default', () => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(rule);

      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(true);
    });

    it('should respect default enabled configuration', () => {
      const ruleEngineDisabled = new ConfigurableRuleEngine({
        defaultEnabled: false,
      });

      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngineDisabled.registerRule(rule);

      expect(ruleEngineDisabled.isRuleEnabled('test-rule')).toBe(false);
    });
  });

  describe('rule enable/disable', () => {
    beforeEach(() => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );
      ruleEngine.registerRule(rule);
    });

    it('should enable a rule', () => {
      ruleEngine.disableRule('test-rule');
      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(false);

      ruleEngine.enableRule('test-rule');
      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(true);
    });

    it('should disable a rule', () => {
      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(true);

      ruleEngine.disableRule('test-rule');
      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(false);
    });

    it('should throw error for non-existent rule', () => {
      expect(() => ruleEngine.enableRule('non-existent')).toThrow();
      expect(() => ruleEngine.disableRule('non-existent')).toThrow();
    });
  });

  describe('rule filtering', () => {
    beforeEach(() => {
      const criticalRule = ValidationRuleFactory.create(
        'critical-rule',
        'Critical Rule',
        'A critical rule',
        'critical',
        () => ValidationResult.valid()
      );

      const configurableRule = ValidationRuleFactory.create(
        'configurable-rule',
        'Configurable Rule',
        'A configurable rule',
        'configurable',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(criticalRule);
      ruleEngine.registerRule(configurableRule);
      ruleEngine.disableRule('configurable-rule');
    });

    it('should get enabled rules only', () => {
      const enabledRules = ruleEngine.getEnabledRules();
      expect(enabledRules).toHaveLength(1);
      expect(enabledRules[0].id).toBe('critical-rule');
    });

    it('should get rules by category', () => {
      const criticalRules = ruleEngine.getRulesByCategory('critical');
      const configurableRules = ruleEngine.getRulesByCategory('configurable');

      expect(criticalRules).toHaveLength(1);
      expect(criticalRules[0].id).toBe('critical-rule');

      expect(configurableRules).toHaveLength(1);
      expect(configurableRules[0].id).toBe('configurable-rule');
    });
  });

  describe('validation', () => {
    const createTestScenario = (): AtBatValidationScenario => ({
      beforeState: BaserunnerState.empty(),
      afterState: new BaserunnerState('batter', null, null),
      battingResult: BattingResult.single(),
      rbis: 0,
      outs: 0,
      runsScored: [],
      batterId: 'batter',
    });

    it('should validate successfully when all rules pass', () => {
      const passingRule = ValidationRuleFactory.create(
        'passing-rule',
        'Passing Rule',
        'Always passes',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(passingRule);

      const result = ruleEngine.validateAtBat(createTestScenario());

      expect(result.isValid).toBe(true);
      expect(result.ruleResults.size).toBe(1);
      expect(result.allViolations).toHaveLength(0);
    });

    it('should fail validation when any rule fails', () => {
      const failingRule = ValidationRuleFactory.create(
        'failing-rule',
        'Failing Rule',
        'Always fails',
        'critical',
        () =>
          ValidationResult.invalid(
            new RuleViolation(
              ViolationType.INVALID_BASE_ADVANCEMENT,
              'Test violation',
              createTestScenario()
            )
          )
      );

      ruleEngine.registerRule(failingRule);

      const result = ruleEngine.validateAtBat(createTestScenario());

      expect(result.isValid).toBe(false);
      expect(result.allViolations).toHaveLength(1);
      expect(result.allViolations[0].message).toBe('Test violation');
    });

    it('should only run enabled rules', () => {
      let passRuleCalled = false;
      let failRuleCalled = false;

      const passingRule = ValidationRuleFactory.create(
        'passing-rule',
        'Passing Rule',
        'Always passes',
        'critical',
        () => {
          passRuleCalled = true;
          return ValidationResult.valid();
        }
      );

      const failingRule = ValidationRuleFactory.create(
        'failing-rule',
        'Failing Rule',
        'Always fails',
        'critical',
        () => {
          failRuleCalled = true;
          return ValidationResult.invalid(
            new RuleViolation(
              ViolationType.INVALID_BASE_ADVANCEMENT,
              'Test violation',
              createTestScenario()
            )
          );
        }
      );

      ruleEngine.registerRule(passingRule);
      ruleEngine.registerRule(failingRule);
      ruleEngine.disableRule('failing-rule');

      const result = ruleEngine.validateAtBat(createTestScenario());

      expect(result.isValid).toBe(true);
      expect(passRuleCalled).toBe(true);
      expect(failRuleCalled).toBe(false);
    });

    it('should handle rule execution errors', () => {
      const errorRule = ValidationRuleFactory.create(
        'error-rule',
        'Error Rule',
        'Throws error',
        'critical',
        () => {
          throw new Error('Rule execution failed');
        }
      );

      ruleEngine.registerRule(errorRule);

      const result = ruleEngine.validateAtBat(createTestScenario());

      expect(result.isValid).toBe(false);
      expect(result.allViolations).toHaveLength(1);
      expect(result.allViolations[0].message).toContain(
        'Rule execution failed'
      );
    });
  });

  describe('configuration management', () => {
    it('should get current configuration', () => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(rule);

      const config = ruleEngine.getConfig();
      expect(config.defaultEnabled).toBe(true);
      expect(config.ruleStates.get('test-rule')).toBe(true);
    });

    it('should update configuration', () => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(rule);

      const newStates = new Map([['test-rule', false]]);
      ruleEngine.updateConfig({
        ruleStates: newStates,
        defaultEnabled: false,
      });

      expect(ruleEngine.isRuleEnabled('test-rule')).toBe(false);
      expect(ruleEngine.getConfig().defaultEnabled).toBe(false);
    });

    it('should clear all rules', () => {
      const rule = ValidationRuleFactory.create(
        'test-rule',
        'Test Rule',
        'A test rule',
        'critical',
        () => ValidationResult.valid()
      );

      ruleEngine.registerRule(rule);
      expect(ruleEngine.getAllRules()).toHaveLength(1);

      ruleEngine.clearRules();
      expect(ruleEngine.getAllRules()).toHaveLength(0);
    });
  });
});
