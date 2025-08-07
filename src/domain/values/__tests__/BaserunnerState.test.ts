import { BaserunnerState } from '../BaserunnerState';

describe('BaserunnerState', () => {
  describe('construction', () => {
    it('should create empty state', () => {
      const empty = BaserunnerState.empty();
      expect(empty.isEmpty()).toBe(true);
      expect(empty.runnerCount()).toBe(0);
    });

    it('should create state with runners', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      expect(state.isLoaded()).toBe(true);
      expect(state.runnerCount()).toBe(3);
    });
  });

  describe('runner queries', () => {
    const state = new BaserunnerState('player1', null, 'player3');

    it('should identify runners correctly', () => {
      expect(state.hasRunner('player1')).toBe(true);
      expect(state.hasRunner('player2')).toBe(false);
      expect(state.hasRunner('player3')).toBe(true);
    });

    it('should get runner base positions', () => {
      expect(state.getRunnerBase('player1')).toBe('first');
      expect(state.getRunnerBase('player2')).toBe(null);
      expect(state.getRunnerBase('player3')).toBe('third');
    });

    it('should get all runners', () => {
      const runners = state.getRunners();
      expect(runners).toEqual(['player1', 'player3']);
    });
  });

  describe('advancement', () => {
    it('should advance all runners', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = state.advanceAll();

      expect(result.runsScored).toEqual(['player3']);
      expect(result.newState.firstBase).toBe(null);
      expect(result.newState.secondBase).toBe('player1');
      expect(result.newState.thirdBase).toBe('player2');
    });

    it('should handle forced advancement', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = state.advanceForced();

      expect(result.runsScored).toEqual(['player3']);
      expect(result.newState.firstBase).toBe(null); // Will be filled by new batter
      expect(result.newState.secondBase).toBe('player1');
      expect(result.newState.thirdBase).toBe('player2');
    });

    it('should handle custom advancement', () => {
      const state = new BaserunnerState('player1', null, 'player3');
      const result = state.withAdvancement(true, false, true);

      expect(result.runsScored).toEqual(['player3']);
      expect(result.newState.firstBase).toBe(null);
      expect(result.newState.secondBase).toBe('player1');
      expect(result.newState.thirdBase).toBe(null);
    });

    it('should throw error for invalid advancement', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');

      expect(() => {
        state.withAdvancement(true, false, false); // Try to move first to occupied second
      }).toThrow('Cannot advance runner to occupied second base');
    });
  });

  describe('adding runners', () => {
    it('should add runner to first base', () => {
      const empty = BaserunnerState.empty();
      const withRunner = empty.addRunnerToFirst('player1');

      expect(withRunner.firstBase).toBe('player1');
      expect(withRunner.secondBase).toBe(null);
      expect(withRunner.thirdBase).toBe(null);
    });
  });

  describe('equality', () => {
    it('should compare states correctly', () => {
      const state1 = new BaserunnerState('player1', 'player2', null);
      const state2 = new BaserunnerState('player1', 'player2', null);
      const state3 = new BaserunnerState('player1', null, 'player3');

      expect(state1.equals(state2)).toBe(true);
      expect(state1.equals(state3)).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should format empty state', () => {
      const empty = BaserunnerState.empty();
      expect(empty.toString()).toBe('Bases empty');
    });

    it('should format state with runners', () => {
      const state = new BaserunnerState('player1', null, 'player3');
      expect(state.toString()).toBe('1B: player1, 3B: player3');
    });
  });
});
