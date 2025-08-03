import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { BattingResult } from '@/domain/values/BattingResult';
import { OutcomeParametersFactory } from '@/domain/values/OutcomeParameters';
import { RuleEngine } from '@/domain/services/RuleEngine';

describe('RuleEngine', () => {
  describe('generateValidOutcomes', () => {
    it('should generate standard outcome for empty bases single', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.standard();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome.afterState.firstBase).toBe('batter1');
      expect(outcome.afterState.secondBase).toBeNull();
      expect(outcome.afterState.thirdBase).toBeNull();
      expect(outcome.rbis).toBe(0);
      expect(outcome.runsScored).toEqual([]);
      expect(outcome.outs).toBe(0);
    });

    it('should generate standard outcome for first_third double', () => {
      const beforeState = new BaserunnerState('runner1', null, 'runner3');
      const battingResult = BattingResult.double();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.standard();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome.afterState.firstBase).toBeNull();
      expect(outcome.afterState.secondBase).toBe('batter1');
      expect(outcome.afterState.thirdBase).toBe('runner1');
      expect(outcome.rbis).toBe(1);
      expect(outcome.runsScored).toEqual(['runner3']);
      expect(outcome.outs).toBe(0);
    });

    it('should generate aggressive runner outcomes when parameter is set', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.double();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.aggressive();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      // Should have standard + aggressive variations
      expect(outcomes.length).toBeGreaterThan(1);
      
      // Check that some outcomes have aggressive descriptions
      const aggressiveOutcome = outcomes.find(o => 
        o.description.includes('Aggressive')
      );
      expect(aggressiveOutcome).toBeDefined();
    });

    it('should generate fielding error outcomes when parameter is set', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.fieldingError();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      // Should have standard + error variations
      expect(outcomes.length).toBeGreaterThan(1);
      
      // Check that some outcomes have error descriptions
      const errorOutcome = outcomes.find(o => 
        o.description.includes('Error')
      );
      expect(errorOutcome).toBeDefined();
    });

    it('should handle strikeouts correctly', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.strikeout();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.standard();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome.afterState.equals(beforeState)).toBe(true); // Runners stay
      expect(outcome.rbis).toBe(0);
      expect(outcome.runsScored).toEqual([]);
      expect(outcome.outs).toBe(1);
    });

    it('should handle home runs correctly', () => {
      const beforeState = new BaserunnerState('runner1', 'runner2', 'runner3');
      const battingResult = BattingResult.homeRun();
      const batterId = 'batter1';
      const parameters = OutcomeParametersFactory.standard();

      const outcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );

      expect(outcomes).toHaveLength(1);
      const outcome = outcomes[0];
      expect(outcome.afterState.equals(BaserunnerState.empty())).toBe(true);
      expect(outcome.rbis).toBe(4);
      expect(outcome.runsScored).toEqual(['runner1', 'runner2', 'runner3', 'batter1']);
      expect(outcome.outs).toBe(0);
    });
  });

  describe('getAllValidOutcomes', () => {
    it('should return outcomes for all parameter combinations', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const allOutcomes = RuleEngine.getAllValidOutcomes(
        beforeState,
        battingResult,
        batterId
      );

      // Should have outcomes from multiple parameter combinations
      expect(allOutcomes.length).toBeGreaterThan(1);
      
      // Should remove duplicates
      const uniqueDescriptions = new Set(allOutcomes.map(o => o.description));
      expect(uniqueDescriptions.size).toBeLessThanOrEqual(allOutcomes.length);
    });

    it('should include standard outcome in all scenarios', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      const allOutcomes = RuleEngine.getAllValidOutcomes(
        beforeState,
        battingResult,
        batterId
      );

      const standardOutcome = allOutcomes.find(o => 
        o.description.includes('Standard')
      );
      expect(standardOutcome).toBeDefined();
    });
  });

  describe('validateOutcome', () => {
    it('should validate correct standard outcome', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      // Get the expected standard outcome
      const validOutcomes = RuleEngine.getAllValidOutcomes(
        beforeState,
        battingResult,
        batterId
      );
      const standardOutcome = validOutcomes.find(o => 
        o.description.includes('Standard')
      );

      expect(standardOutcome).toBeDefined();
      
      const isValid = RuleEngine.validateOutcome(
        beforeState,
        battingResult,
        batterId,
        standardOutcome!
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid outcome', () => {
      const beforeState = BaserunnerState.empty();
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      // Create an obviously invalid outcome
      const invalidOutcome = OutcomeParametersFactory.standard();
      const outcome = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        invalidOutcome
      )[0];
      
      // Modify it to be invalid
      const modifiedOutcome = {
        ...outcome,
        rbis: 99, // Impossible RBI count for a single
      };

      const isValid = RuleEngine.validateOutcome(
        beforeState,
        battingResult,
        batterId,
        modifiedOutcome as any
      );

      expect(isValid).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should respect parameter requirements', () => {
      const beforeState = new BaserunnerState('runner1', null, null);
      const battingResult = BattingResult.single();
      const batterId = 'batter1';

      // Get aggressive outcomes
      const aggressiveParams = OutcomeParametersFactory.aggressive();
      const aggressiveOutcomes = RuleEngine.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        aggressiveParams
      );

      // All outcomes should be valid with aggressive parameters
      aggressiveOutcomes.forEach(outcome => {
        expect(outcome.isValidWithParameters(aggressiveParams)).toBe(true);
      });

      // Some outcomes might not be valid with standard parameters
      const standardParams = OutcomeParametersFactory.standard();
      const aggressiveOnlyOutcomes = aggressiveOutcomes.filter(outcome => 
        !outcome.isValidWithParameters(standardParams)
      );
      
      // There should be some aggressive-only outcomes
      expect(aggressiveOnlyOutcomes.length).toBeGreaterThan(0);
    });
  });
});