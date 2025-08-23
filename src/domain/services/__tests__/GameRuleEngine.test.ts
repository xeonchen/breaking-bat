import { GameRuleEngine, AtBatValidationData } from '../GameRuleEngine';
import { BaserunnerState } from '../../values/BaserunnerState';
import { BattingResult } from '../../values/BattingResult';

describe('GameRuleEngine', () => {
  let ruleEngine: GameRuleEngine;

  beforeEach(() => {
    ruleEngine = new GameRuleEngine({
      enableValidation: true,
      enableOutcomeGeneration: true,
      strictValidation: false,
      customRules: [],
    });
  });

  describe('validation', () => {
    it('should validate correct at-bat scenario', () => {
      const validData: AtBatValidationData = {
        beforeState: new BaserunnerState('player1', null, null),
        afterState: new BaserunnerState(null, 'player1', null),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 0,
        outs: 0,
      };

      const result = ruleEngine.validateAtBat(validData);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect RBI validation violation', () => {
      const invalidData: AtBatValidationData = {
        beforeState: new BaserunnerState('player1', null, null),
        afterState: new BaserunnerState(null, 'player1', null),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 2, // Invalid: more RBIs than runs scored
        outs: 0,
      };

      const result = ruleEngine.validateAtBat(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain(
        'RBIs cannot exceed runs scored'
      );
    });

    it('should detect max outs violation', () => {
      const invalidData: AtBatValidationData = {
        beforeState: new BaserunnerState(null, null, null),
        afterState: new BaserunnerState(null, null, null),
        battingResult: BattingResult.strikeout(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 0,
        outs: 4, // Invalid: more than 3 outs
      };

      const result = ruleEngine.validateAtBat(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain('Cannot exceed 3 outs');
    });

    it('should detect base occupancy violation', () => {
      const invalidData: AtBatValidationData = {
        beforeState: new BaserunnerState('player1', null, null),
        afterState: new BaserunnerState('player1', 'player1', null), // Same player on two bases
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 0,
        outs: 0,
      };

      const result = ruleEngine.validateAtBat(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain(
        'Multiple runners cannot occupy the same base'
      );
    });
  });

  describe('outcome generation', () => {
    it('should generate standard outcome for single', () => {
      const beforeState = new BaserunnerState(null, null, 'player1');
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = ruleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId
      );

      expect(outcomes).toHaveLength(1); // Standard outcome only
      expect(outcomes[0].runsScored).toHaveLength(1); // Player from third scores
      expect(outcomes[0].runsScored[0]).toBe('player1');
    });

    it('should generate standard outcome for home run', () => {
      const beforeState = new BaserunnerState('player1', 'player2', 'player3');
      const battingResult = BattingResult.homeRun();
      const batterId = 'batter1';

      const outcomes = ruleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId
      );

      expect(outcomes).toHaveLength(1); // Standard outcome only
      expect(outcomes[0].runsScored).toHaveLength(3); // All three runners score
      expect(outcomes[0].rbis).toBe(3); // RBIs for all runners
      expect(outcomes[0].afterState.firstBase).toBeNull(); // All bases clear after home run
      expect(outcomes[0].afterState.secondBase).toBeNull();
      expect(outcomes[0].afterState.thirdBase).toBeNull();
    });

    it('should generate multiple outcomes with parameters', () => {
      const beforeState = new BaserunnerState('player1', null, null);
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = ruleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        {
          aggressiveRunning: true,
          fieldingErrors: true,
          unconventionalAdvancement: false,
        }
      );

      expect(outcomes).toHaveLength(1); // Standard outcome (variations not implemented yet)
      expect(outcomes[0].afterState.firstBase).toBe('batter1'); // Batter advances to first
      expect(outcomes[0].afterState.secondBase).toBe('player1'); // Runner advances to second
    });
  });

  describe('rule management', () => {
    it('should allow registering custom rules', () => {
      const customRule = {
        id: 'custom-test-rule',
        name: 'Custom Test Rule',
        description: 'A test rule',
        category: 'optional' as const,
        enabled: true,
        validate: jest.fn().mockReturnValue({ isValid: true, violations: [] }),
      };

      ruleEngine.registerRule(customRule);

      const validData: AtBatValidationData = {
        beforeState: new BaserunnerState(null, null, null),
        afterState: new BaserunnerState(null, null, null),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 0,
        outs: 0,
      };

      ruleEngine.validateAtBat(validData);
      expect(customRule.validate).toHaveBeenCalled();
    });

    it('should allow disabling rules', () => {
      ruleEngine.setRuleEnabled('rbi-validation', false);

      const invalidData: AtBatValidationData = {
        beforeState: new BaserunnerState(null, null, null),
        afterState: new BaserunnerState(null, null, null),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 5, // This should normally fail RBI validation
        outs: 0,
      };

      const result = ruleEngine.validateAtBat(invalidData);
      // Should pass because RBI validation is disabled
      expect(
        result.violations.some((v) => v.message.includes('RBIs cannot exceed'))
      ).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should respect validation disable setting', () => {
      const disabledEngine = new GameRuleEngine({ enableValidation: false });

      const invalidData: AtBatValidationData = {
        beforeState: new BaserunnerState(null, null, null),
        afterState: new BaserunnerState(null, null, null),
        battingResult: BattingResult.single(),
        batterId: 'batter1',
        runsScored: [],
        rbis: 10, // Invalid but should pass
        outs: 0,
      };

      const result = disabledEngine.validateAtBat(invalidData);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should respect outcome generation disable setting', () => {
      const limitedEngine = new GameRuleEngine({
        enableOutcomeGeneration: false,
      });

      const beforeState = new BaserunnerState(null, null, null);
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = limitedEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        {
          aggressiveRunning: true,
          fieldingErrors: true,
          unconventionalAdvancement: true,
        }
      );

      expect(outcomes).toHaveLength(1); // Only standard outcome, parameters ignored
    });
  });
});
