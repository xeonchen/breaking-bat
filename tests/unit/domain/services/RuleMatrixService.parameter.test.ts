import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { BattingResult } from '@/domain/values/BattingResult';
import { OutcomeParametersFactory } from '@/domain/values/OutcomeParameters';
import { RuleMatrixService } from '@/domain/services/RuleMatrixService';
import { ValidationResult } from '@/domain/values/RuleViolation';

describe('RuleMatrixService (Parameter-based)', () => {
  let service: RuleMatrixService;

  beforeEach(() => {
    service = new RuleMatrixService();
  });

  describe('getValidOutcomes', () => {
    it('should return all valid outcomes for empty bases single', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomes(beforeState, battingResult, batterId);

      expect(outcomes.length).toBeGreaterThan(0);
      
      // Should include standard outcome
      const standardOutcome = outcomes.find(o => 
        o.description.includes('Standard')
      );
      expect(standardOutcome).toBeDefined();
      expect(standardOutcome!.afterState.firstBase).toBe('batter1');
      expect(standardOutcome!.rbis).toBe(0);
    });

    it('should return multiple outcomes for scenarios with variations', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomes(beforeState, battingResult, batterId);

      // Should have multiple outcomes (standard + aggressive + error variations)
      expect(outcomes.length).toBeGreaterThan(1);
      
      // Should include both conservative and aggressive options
      const standardOutcome = outcomes.find(o => 
        o.description.includes('Standard')
      );
      const aggressiveOutcome = outcomes.find(o => 
        o.description.includes('Aggressive')
      );
      
      expect(standardOutcome).toBeDefined();
      expect(aggressiveOutcome).toBeDefined();
    });
  });

  describe('getValidOutcomesWithParameters', () => {
    it('should return only standard outcome with standard parameters', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.single();
      const parameters = OutcomeParametersFactory.standard();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomesWithParameters(
        beforeState, 
        battingResult, 
        parameters, 
        batterId
      );

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].description).toContain('Standard');
    });

    it('should return additional outcomes with aggressive parameters', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.single();
      const parameters = OutcomeParametersFactory.aggressive();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomesWithParameters(
        beforeState, 
        battingResult, 
        parameters, 
        batterId
      );

      expect(outcomes.length).toBeGreaterThan(1);
      
      // Should include aggressive variations
      const aggressiveOutcome = outcomes.find(o => 
        o.description.includes('Aggressive')
      );
      expect(aggressiveOutcome).toBeDefined();
    });

    it('should return error outcomes with error parameters', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const parameters = OutcomeParametersFactory.fieldingError();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomesWithParameters(
        beforeState, 
        battingResult, 
        parameters, 
        batterId
      );

      expect(outcomes.length).toBeGreaterThan(1);
      
      // Should include error variations
      const errorOutcome = outcomes.find(o => 
        o.description.includes('Error')
      );
      expect(errorOutcome).toBeDefined();
    });
  });

  describe('validateAtBat', () => {
    it('should validate correct standard single from empty bases', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState('batter1', null, null);
      const battingResult = BattingResult.single();
      const rbis = 0;
      const runsScored: string[] = [];
      const outs = 0;
      const batterId = 'batter1';

      const result = service.validateAtBat(
        before, 
        after, 
        battingResult, 
        rbis, 
        runsScored, 
        outs, 
        batterId
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate correct standard double from first_third', () => {
      const before = new BaserunnerState('runner1', null, 'runner3');
      const after = new BaserunnerState(null, 'batter1', 'runner1');
      const battingResult = BattingResult.double();
      const rbis = 1;
      const runsScored = ['runner3'];
      const outs = 0;
      const batterId = 'batter1';

      const result = service.validateAtBat(
        before, 
        after, 
        battingResult, 
        rbis, 
        runsScored, 
        outs, 
        batterId
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid RBI count', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState('batter1', null, null);
      const battingResult = BattingResult.single();
      const rbis = 5; // Invalid - no runs scored
      const runsScored: string[] = [];
      const outs = 0;
      const batterId = 'batter1';

      const result = service.validateAtBat(
        before, 
        after, 
        battingResult, 
        rbis, 
        runsScored, 
        outs, 
        batterId
      );

      expect(result.isValid).toBe(false);
      expect(result.violation).toBeDefined();
      expect(result.suggestedOutcomes).toBeDefined();
      expect(result.suggestedOutcomes!.length).toBeGreaterThan(0);
    });

    it('should reject impossible base advancement', () => {
      const before = BaserunnerState.empty();
      const after = new BaserunnerState(null, null, 'batter1'); // Batter on third from single
      const battingResult = BattingResult.single();
      const rbis = 0;
      const runsScored: string[] = [];
      const outs = 0;
      const batterId = 'batter1';

      const result = service.validateAtBat(
        before, 
        after, 
        battingResult, 
        rbis, 
        runsScored, 
        outs, 
        batterId
      );

      expect(result.isValid).toBe(false);
      expect(result.violation).toBeDefined();
    });

    it('should validate home run correctly', () => {
      const before = new BaserunnerState('runner1', 'runner2', 'runner3');
      const after = BaserunnerState.empty();
      const battingResult = BattingResult.homeRun();
      const rbis = 4;
      const runsScored = ['runner1', 'runner2', 'runner3', 'batter1'];
      const outs = 0;
      const batterId = 'batter1';

      const result = service.validateAtBat(
        before, 
        after, 
        battingResult, 
        rbis, 
        runsScored, 
        outs, 
        batterId
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('getAvailableParameters', () => {
    it('should return all 8 parameter combinations', () => {
      const parameters = service.getAvailableParameters();
      
      expect(parameters).toHaveLength(8); // 2^3 = 8 combinations
      
      // Should include standard parameters
      const standardParams = parameters.find(p => 
        !p.runner_is_aggressive && !p.has_fielding_error && !p.has_running_error
      );
      expect(standardParams).toBeDefined();
      
      // Should include all-true parameters
      const allTrueParams = parameters.find(p => 
        p.runner_is_aggressive && p.has_fielding_error && p.has_running_error
      );
      expect(allTrueParams).toBeDefined();
    });
  });

  describe('describeParameters', () => {
    it('should describe standard parameters correctly', () => {
      const parameters = OutcomeParametersFactory.standard();
      const description = service.describeParameters(parameters);
      
      expect(description).toBe('Standard');
    });

    it('should describe aggressive parameters correctly', () => {
      const parameters = OutcomeParametersFactory.aggressive();
      const description = service.describeParameters(parameters);
      
      expect(description).toBe('Aggressive Running');
    });

    it('should describe combined parameters correctly', () => {
      const parameters = OutcomeParametersFactory.custom(true, true, false);
      const description = service.describeParameters(parameters);
      
      expect(description).toBe('Aggressive Running + Fielding Error');
    });
  });

  describe('getBaseConfigurationKey', () => {
    it('should identify empty bases correctly', () => {
      const baseState = BaserunnerState.empty();
      const key = service.getBaseConfigurationKey(baseState);
      
      expect(key).toBe('empty');
    });

    it('should identify first_third correctly', () => {
      const baseState = new BaserunnerState('runner1', null, 'runner3');
      const key = service.getBaseConfigurationKey(baseState);
      
      expect(key).toBe('first_third');
    });

    it('should identify loaded bases correctly', () => {
      const baseState = new BaserunnerState('runner1', 'runner2', 'runner3');
      const key = service.getBaseConfigurationKey(baseState);
      
      expect(key).toBe('loaded');
    });
  });

  describe('integration with softball rules', () => {
    it('should respect force advancement rules', () => {
      const before = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.walk();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomes(before, battingResult, batterId);
      
      // Walk should force runner to second, batter to first
      const validOutcome = outcomes.find(o => 
        o.afterState.firstBase === 'batter1' && 
        o.afterState.secondBase === 'runner1' &&
        o.rbis === 0
      );
      
      expect(validOutcome).toBeDefined();
    });

    it('should handle RBI calculation correctly', () => {
      const before = new BaserunnerState(null, null, 'runner3');
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const outcomes = service.getValidOutcomes(before, battingResult, batterId);
      
      // Single with runner on third should typically score the runner
      const scoringOutcome = outcomes.find(o => 
        o.runsScored.includes('runner3') && o.rbis === 1
      );
      
      expect(scoringOutcome).toBeDefined();
    });
  });
});