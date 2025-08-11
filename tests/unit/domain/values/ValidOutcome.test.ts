import { ValidOutcome } from '@/domain/values/ValidOutcome';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { OutcomeParameters } from '@/domain/values/OutcomeParameters';

describe('ValidOutcome', () => {
  const baseState = new BaserunnerState(null, null, null);
  const defaultParameters: OutcomeParameters = {
    runner_is_aggressive: false,
    has_fielding_error: false,
    has_running_error: false,
  };

  describe('Constructor', () => {
    it('should create ValidOutcome with valid parameters', () => {
      const outcome = new ValidOutcome(
        baseState,
        1, // Fixed: RBIs cannot exceed runsEarnedByHit.length
        1,
        ['runner1', 'runner2'],
        ['runner1'],
        'Test outcome',
        defaultParameters
      );

      expect(outcome.afterState).toBe(baseState);
      expect(outcome.rbis).toBe(1); // Fixed expectation
      expect(outcome.outs).toBe(1);
      expect(outcome.runsScored).toEqual(['runner1', 'runner2']);
      expect(outcome.runsEarnedByHit).toEqual(['runner1']);
      expect(outcome.description).toBe('Test outcome');
      expect(outcome.requiredParameters).toBe(defaultParameters);
    });

    it('should throw error for negative RBIs', () => {
      expect(() => {
        new ValidOutcome(
          baseState,
          -1, // Invalid
          0,
          [],
          [],
          'Test',
          defaultParameters
        );
      }).toThrow('RBIs cannot be negative');
    });

    it('should throw error for negative outs', () => {
      expect(() => {
        new ValidOutcome(
          baseState,
          0,
          -1, // Invalid
          [],
          [],
          'Test',
          defaultParameters
        );
      }).toThrow('Outs must be between 0 and 3');
    });

    it('should throw error for outs greater than 3', () => {
      expect(() => {
        new ValidOutcome(
          baseState,
          0,
          4, // Invalid
          [],
          [],
          'Test',
          defaultParameters
        );
      }).toThrow('Outs must be between 0 and 3');
    });

    it('should throw error when RBIs exceed runs earned by hit', () => {
      expect(() => {
        new ValidOutcome(
          baseState,
          3, // More than runsEarnedByHit.length
          0,
          ['r1', 'r2', 'r3'],
          ['r1', 'r2'], // Only 2 runs earned by hit
          'Test',
          defaultParameters
        );
      }).toThrow('RBI count cannot exceed runs earned by hit');
    });

    it('should throw error when runs earned by hit exceed total runs scored', () => {
      expect(() => {
        new ValidOutcome(
          baseState,
          1,
          0,
          ['r1'], // Only 1 run scored
          ['r1', 'r2'], // But 2 earned by hit
          'Test',
          defaultParameters
        );
      }).toThrow('Runs earned by hit cannot exceed total runs scored');
    });

    it('should allow edge case of 0 RBIs, 3 outs', () => {
      const outcome = new ValidOutcome(
        baseState,
        0,
        3,
        [],
        [],
        'Triple play',
        defaultParameters
      );

      expect(outcome.rbis).toBe(0);
      expect(outcome.outs).toBe(3);
    });

    it('should allow RBIs equal to runs earned by hit', () => {
      const outcome = new ValidOutcome(
        baseState,
        2,
        0,
        ['r1', 'r2', 'r3'],
        ['r1', 'r2'],
        'Test',
        defaultParameters
      );

      expect(outcome.rbis).toBe(2);
      expect(outcome.runsEarnedByHit).toEqual(['r1', 'r2']);
    });
  });

  describe('Static factory methods', () => {
    describe('standard', () => {
      it('should create standard outcome with no outs', () => {
        const runs = ['runner1', 'runner2'];
        const outcome = ValidOutcome.standard(
          baseState,
          2,
          runs,
          'Double with 2 RBIs'
        );

        expect(outcome.afterState).toBe(baseState);
        expect(outcome.rbis).toBe(2);
        expect(outcome.outs).toBe(0);
        expect(outcome.runsScored).toEqual(runs);
        expect(outcome.runsEarnedByHit).toEqual(runs); // Same as runsScored
        expect(outcome.description).toBe('Double with 2 RBIs');
        expect(outcome.requiredParameters).toEqual(defaultParameters);
      });

      it('should create standard outcome with no runs', () => {
        const outcome = ValidOutcome.standard(
          baseState,
          0,
          [],
          'Single, no runners'
        );

        expect(outcome.rbis).toBe(0);
        expect(outcome.outs).toBe(0);
        expect(outcome.runsScored).toEqual([]);
        expect(outcome.runsEarnedByHit).toEqual([]);
      });
    });

    describe('withOuts', () => {
      it('should create outcome with outs', () => {
        const runs = ['runner1'];
        const outcome = ValidOutcome.withOuts(
          baseState,
          1,
          2,
          runs,
          'Sacrifice fly with double play'
        );

        expect(outcome.afterState).toBe(baseState);
        expect(outcome.rbis).toBe(1);
        expect(outcome.outs).toBe(2);
        expect(outcome.runsScored).toEqual(runs);
        expect(outcome.runsEarnedByHit).toEqual(runs);
        expect(outcome.description).toBe('Sacrifice fly with double play');
        expect(outcome.requiredParameters).toEqual(defaultParameters);
      });

      it('should create outcome with maximum outs', () => {
        const outcome = ValidOutcome.withOuts(
          baseState,
          0,
          3,
          [],
          'Triple play'
        );

        expect(outcome.outs).toBe(3);
        expect(outcome.rbis).toBe(0);
        expect(outcome.runsScored).toEqual([]);
      });
    });

    describe('withParameters', () => {
      it('should create outcome with custom parameters', () => {
        const customParams: OutcomeParameters = {
          runner_is_aggressive: true,
          has_fielding_error: false,
          has_running_error: false,
        };
        const runsScored = ['r1', 'r2', 'r3'];
        const runsEarnedByHit = ['r1', 'r2'];

        const outcome = ValidOutcome.withParameters(
          baseState,
          2,
          1,
          runsScored,
          runsEarnedByHit,
          'Aggressive running with out',
          customParams
        );

        expect(outcome.afterState).toBe(baseState);
        expect(outcome.rbis).toBe(2);
        expect(outcome.outs).toBe(1);
        expect(outcome.runsScored).toEqual(runsScored);
        expect(outcome.runsEarnedByHit).toEqual(runsEarnedByHit);
        expect(outcome.description).toBe('Aggressive running with out');
        expect(outcome.requiredParameters).toEqual(customParams);
      });

      it('should create outcome with all parameters enabled', () => {
        const allParams: OutcomeParameters = {
          runner_is_aggressive: true,
          has_fielding_error: true,
          has_running_error: true,
        };

        const outcome = ValidOutcome.withParameters(
          baseState,
          0,
          2,
          ['r1'],
          [],
          'Chaos play',
          allParams
        );

        expect(outcome.requiredParameters).toEqual(allParams);
        expect(outcome.rbis).toBe(0);
        expect(outcome.runsEarnedByHit).toEqual([]);
      });
    });
  });

  describe('equals method', () => {
    const baseOutcome = ValidOutcome.standard(
      baseState,
      1,
      ['runner1'],
      'Test outcome'
    );

    it('should return true for identical outcomes', () => {
      const identical = ValidOutcome.standard(
        baseState,
        1,
        ['runner1'],
        'Test outcome'
      );

      expect(baseOutcome.equals(identical)).toBe(true);
    });

    it('should return false for different afterState', () => {
      const differentState = new BaserunnerState('batter', null, null);
      const different = ValidOutcome.standard(
        differentState,
        1,
        ['runner1'],
        'Test outcome'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different rbis', () => {
      const different = ValidOutcome.standard(
        baseState,
        0, // Different (and valid - can't exceed runsEarnedByHit.length)
        ['runner1'],
        'Test outcome'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different outs', () => {
      const different = ValidOutcome.withOuts(
        baseState,
        1,
        1, // Different outs
        ['runner1'],
        'Test outcome'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different runsScored length', () => {
      const different = ValidOutcome.standard(
        baseState,
        1,
        ['runner1', 'runner2'], // Different length
        'Test outcome'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different runsScored content', () => {
      const different = ValidOutcome.standard(
        baseState,
        1,
        ['runner2'], // Different runner
        'Test outcome'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different runsEarnedByHit length', () => {
      const different = ValidOutcome.withParameters(
        baseState,
        0, // Fixed: can't have 1 RBI with empty runsEarnedByHit
        0,
        ['runner1'],
        [], // Different length
        'Test outcome',
        defaultParameters
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different runsEarnedByHit content', () => {
      const different = ValidOutcome.withParameters(
        baseState,
        1,
        0,
        ['runner1'],
        ['runner2'], // Different runner
        'Test outcome',
        defaultParameters
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different description', () => {
      const different = ValidOutcome.standard(
        baseState,
        1,
        ['runner1'],
        'Different description'
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different runner_is_aggressive', () => {
      const differentParams: OutcomeParameters = {
        runner_is_aggressive: true, // Different
        has_fielding_error: false,
        has_running_error: false,
      };
      const different = ValidOutcome.withParameters(
        baseState,
        1,
        0,
        ['runner1'],
        ['runner1'],
        'Test outcome',
        differentParams
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different has_fielding_error', () => {
      const differentParams: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: true, // Different
        has_running_error: false,
      };
      const different = ValidOutcome.withParameters(
        baseState,
        1,
        0,
        ['runner1'],
        ['runner1'],
        'Test outcome',
        differentParams
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });

    it('should return false for different has_running_error', () => {
      const differentParams: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: true, // Different
      };
      const different = ValidOutcome.withParameters(
        baseState,
        1,
        0,
        ['runner1'],
        ['runner1'],
        'Test outcome',
        differentParams
      );

      expect(baseOutcome.equals(different)).toBe(false);
    });
  });

  describe('toString method', () => {
    it('should format outcome with 0 RBIs and no outs', () => {
      const outcome = ValidOutcome.standard(
        baseState,
        0,
        [],
        'Single, no runners'
      );

      expect(outcome.toString()).toBe('Single, no runners (0 RBIs)');
    });

    it('should format outcome with 1 RBI and no outs', () => {
      const outcome = ValidOutcome.standard(
        baseState,
        1,
        ['runner1'],
        'Single with RBI'
      );

      expect(outcome.toString()).toBe('Single with RBI (1 RBI)');
    });

    it('should format outcome with multiple RBIs and no outs', () => {
      const outcome = ValidOutcome.standard(
        baseState,
        2,
        ['runner1', 'runner2'],
        'Double with RBIs'
      );

      expect(outcome.toString()).toBe('Double with RBIs (2 RBIs)');
    });

    it('should format outcome with 1 out', () => {
      const outcome = ValidOutcome.withOuts(
        baseState,
        1,
        1,
        ['runner1'],
        'Sacrifice fly'
      );

      expect(outcome.toString()).toBe('Sacrifice fly (1 RBI, 1 out)');
    });

    it('should format outcome with multiple outs', () => {
      const outcome = ValidOutcome.withOuts(baseState, 0, 2, [], 'Double play');

      expect(outcome.toString()).toBe('Double play (0 RBIs, 2 outs)');
    });

    it('should format outcome with aggressive running parameter', () => {
      const params: OutcomeParameters = {
        runner_is_aggressive: true,
        has_fielding_error: false,
        has_running_error: false,
      };
      const outcome = ValidOutcome.withParameters(
        baseState,
        2,
        0,
        ['r1', 'r2'],
        ['r1', 'r2'],
        'Aggressive advance',
        params
      );

      expect(outcome.toString()).toBe(
        'Aggressive advance (2 RBIs) [Aggressive]'
      );
    });

    it('should format outcome with fielding error parameter', () => {
      const params: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: true,
        has_running_error: false,
      };
      const outcome = ValidOutcome.withParameters(
        baseState,
        0,
        0,
        ['r1'],
        [],
        'Error advance',
        params
      );

      expect(outcome.toString()).toBe('Error advance (0 RBIs) [Error]');
    });

    it('should format outcome with running error parameter', () => {
      const params: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: true,
      };
      const outcome = ValidOutcome.withParameters(
        baseState,
        0,
        1,
        [],
        [],
        'Running mistake',
        params
      );

      expect(outcome.toString()).toBe(
        'Running mistake (0 RBIs, 1 out) [Running Error]'
      );
    });

    it('should format outcome with all parameters', () => {
      const params: OutcomeParameters = {
        runner_is_aggressive: true,
        has_fielding_error: true,
        has_running_error: true,
      };
      const outcome = ValidOutcome.withParameters(
        baseState,
        1,
        2,
        ['r1'],
        ['r1'],
        'Chaos play',
        params
      );

      expect(outcome.toString()).toBe(
        'Chaos play (1 RBI, 2 outs) [Aggressive, Error, Running Error]'
      );
    });

    it('should format outcome with 3 outs', () => {
      const outcome = ValidOutcome.withOuts(baseState, 0, 3, [], 'Triple play');

      expect(outcome.toString()).toBe('Triple play (0 RBIs, 3 outs)');
    });
  });

  describe('isValidWithParameters method', () => {
    const outcomeRequiringAggressive = ValidOutcome.withParameters(
      baseState,
      1,
      0,
      ['r1'],
      ['r1'],
      'Aggressive play',
      {
        runner_is_aggressive: true,
        has_fielding_error: false,
        has_running_error: false,
      }
    );

    const outcomeRequiringError = ValidOutcome.withParameters(
      baseState,
      0,
      0,
      ['r1'],
      [],
      'Error play',
      {
        runner_is_aggressive: false,
        has_fielding_error: true,
        has_running_error: false,
      }
    );

    const outcomeRequiringRunningError = ValidOutcome.withParameters(
      baseState,
      0,
      1,
      [],
      [],
      'Running error',
      {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: true,
      }
    );

    it('should return true when all required parameters are provided', () => {
      const providedParams: OutcomeParameters = {
        runner_is_aggressive: true,
        has_fielding_error: true,
        has_running_error: true,
      };

      expect(
        outcomeRequiringAggressive.isValidWithParameters(providedParams)
      ).toBe(true);
      expect(outcomeRequiringError.isValidWithParameters(providedParams)).toBe(
        true
      );
      expect(
        outcomeRequiringRunningError.isValidWithParameters(providedParams)
      ).toBe(true);
    });

    it('should return false when required aggressive parameter is missing', () => {
      const providedParams: OutcomeParameters = {
        runner_is_aggressive: false, // Missing required parameter
        has_fielding_error: false,
        has_running_error: false,
      };

      expect(
        outcomeRequiringAggressive.isValidWithParameters(providedParams)
      ).toBe(false);
    });

    it('should return false when required fielding error parameter is missing', () => {
      const providedParams: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: false, // Missing required parameter
        has_running_error: false,
      };

      expect(outcomeRequiringError.isValidWithParameters(providedParams)).toBe(
        false
      );
    });

    it('should return false when required running error parameter is missing', () => {
      const providedParams: OutcomeParameters = {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: false, // Missing required parameter
      };

      expect(
        outcomeRequiringRunningError.isValidWithParameters(providedParams)
      ).toBe(false);
    });

    it('should return true for standard outcome with any parameters', () => {
      const standardOutcome = ValidOutcome.standard(
        baseState,
        1,
        ['r1'],
        'Standard'
      );

      const anyParams: OutcomeParameters = {
        runner_is_aggressive: true,
        has_fielding_error: true,
        has_running_error: true,
      };

      expect(standardOutcome.isValidWithParameters(anyParams)).toBe(true);
      expect(standardOutcome.isValidWithParameters(defaultParameters)).toBe(
        true
      );
    });

    it('should validate complex parameter combinations', () => {
      const complexOutcome = ValidOutcome.withParameters(
        baseState,
        1,
        1,
        ['r1'],
        ['r1'],
        'Complex',
        {
          runner_is_aggressive: true,
          has_fielding_error: false,
          has_running_error: true,
        }
      );

      // Valid - has both required parameters
      expect(
        complexOutcome.isValidWithParameters({
          runner_is_aggressive: true,
          has_fielding_error: true,
          has_running_error: true,
        })
      ).toBe(true);

      // Invalid - missing aggressive
      expect(
        complexOutcome.isValidWithParameters({
          runner_is_aggressive: false,
          has_fielding_error: true,
          has_running_error: true,
        })
      ).toBe(false);

      // Invalid - missing running error
      expect(
        complexOutcome.isValidWithParameters({
          runner_is_aggressive: true,
          has_fielding_error: true,
          has_running_error: false,
        })
      ).toBe(false);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle maximum complexity outcome', () => {
      const complexState = new BaserunnerState('batter', 'r2', 'r3');
      const maxParams: OutcomeParameters = {
        runner_is_aggressive: true,
        has_fielding_error: true,
        has_running_error: true,
      };

      const outcome = ValidOutcome.withParameters(
        complexState,
        2,
        1,
        ['r1', 'r2', 'r3'],
        ['r1', 'r2'],
        'Maximum complexity play',
        maxParams
      );

      expect(outcome.rbis).toBe(2);
      expect(outcome.outs).toBe(1);
      expect(outcome.runsScored).toEqual(['r1', 'r2', 'r3']);
      expect(outcome.runsEarnedByHit).toEqual(['r1', 'r2']);
      expect(outcome.toString()).toContain(
        '[Aggressive, Error, Running Error]'
      );

      // Should be valid with matching parameters
      expect(outcome.isValidWithParameters(maxParams)).toBe(true);

      // Should be invalid without all required parameters
      expect(outcome.isValidWithParameters(defaultParameters)).toBe(false);
    });

    it('should handle edge case with all zeros', () => {
      const outcome = ValidOutcome.standard(baseState, 0, [], 'No action');

      expect(outcome.rbis).toBe(0);
      expect(outcome.outs).toBe(0);
      expect(outcome.runsScored).toEqual([]);
      expect(outcome.runsEarnedByHit).toEqual([]);
      expect(outcome.toString()).toBe('No action (0 RBIs)');
      expect(outcome.isValidWithParameters(defaultParameters)).toBe(true);
    });
  });
});
