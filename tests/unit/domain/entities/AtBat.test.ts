import { AtBat } from '@/domain/entities/AtBat';
import { BattingResult } from '@/domain/values/BattingResult';
import { BaserunnerState } from '@/domain/values/BaserunnerState';

describe('AtBat Entity', () => {
  const createTestAtBat = (
    runningErrors: string[] = [],
    runsScored: string[] = [],
    rbis: number = 0
  ): AtBat => {
    return new AtBat(
      'at-bat-1',
      'game-1',
      'inning-1',
      'batter-1',
      1,
      BattingResult.single(),
      'Test at-bat',
      rbis,
      runsScored,
      runningErrors,
      new BaserunnerState(),
      new BaserunnerState('batter-1')
    );
  };

  describe('Running Error Tracking', () => {
    it('should track when no running errors occur', () => {
      const atBat = createTestAtBat();

      expect(atBat.runningErrors).toEqual([]);
      expect(atBat.hasRunningErrors()).toBe(false);
      expect(atBat.getRunningErrorCount()).toBe(0);
    });

    it('should track single running error', () => {
      const atBat = createTestAtBat(['player2']);

      expect(atBat.runningErrors).toEqual(['player2']);
      expect(atBat.hasRunningErrors()).toBe(true);
      expect(atBat.getRunningErrorCount()).toBe(1);
    });

    it('should track multiple running errors', () => {
      const atBat = createTestAtBat(['player2', 'player3']);

      expect(atBat.runningErrors).toEqual(['player2', 'player3']);
      expect(atBat.hasRunningErrors()).toBe(true);
      expect(atBat.getRunningErrorCount()).toBe(2);
    });

    it('should create defensive copy of running errors array', () => {
      const originalErrors = ['player2'];
      const atBat = createTestAtBat(originalErrors);

      // Modify original array
      originalErrors.push('player3');

      // AtBat should still have only the original error
      expect(atBat.runningErrors).toEqual(['player2']);
      expect(atBat.getRunningErrorCount()).toBe(1);
    });
  });

  describe('getSummary with Running Errors', () => {
    it('should include running error in summary when present', () => {
      const atBat = createTestAtBat(['player2'], ['player3'], 1);
      const summary = atBat.getSummary();

      expect(summary).toContain('1B');
      expect(summary).toContain('1 RBI');
      expect(summary).toContain('1 run scored');
      expect(summary).toContain('[1 running error]');
    });

    it('should handle multiple running errors in summary', () => {
      const atBat = createTestAtBat(['player2', 'player4'], [], 0);
      const summary = atBat.getSummary();

      expect(summary).toContain('1B');
      expect(summary).toContain('[2 running errors]');
      expect(summary).not.toContain('RBI');
      expect(summary).not.toContain('run scored');
    });

    it('should not include running error text when none present', () => {
      const atBat = createTestAtBat([], ['player3'], 1);
      const summary = atBat.getSummary();

      expect(summary).toContain('1B');
      expect(summary).toContain('1 RBI');
      expect(summary).toContain('1 run scored');
      expect(summary).not.toContain('running error');
    });
  });

  describe('updateResult with Running Errors', () => {
    it('should update running errors when correcting at-bat', () => {
      const originalAtBat = createTestAtBat(['player2']);

      const updatedAtBat = originalAtBat.updateResult(
        BattingResult.double(),
        'Corrected to double',
        1,
        ['player3'],
        ['player4'], // New running error
        new BaserunnerState(null, 'batter-1')
      );

      expect(updatedAtBat.runningErrors).toEqual(['player4']);
      expect(updatedAtBat.hasRunningErrors()).toBe(true);
      expect(updatedAtBat.result).toEqual(BattingResult.double());
      expect(updatedAtBat.runsScored).toEqual(['player3']);
    });

    it('should clear running errors when correcting at-bat', () => {
      const originalAtBat = createTestAtBat(['player2']);

      const updatedAtBat = originalAtBat.updateResult(
        BattingResult.triple(),
        'Corrected to triple',
        0,
        [],
        [], // No running errors
        new BaserunnerState(null, null, 'batter-1')
      );

      expect(updatedAtBat.runningErrors).toEqual([]);
      expect(updatedAtBat.hasRunningErrors()).toBe(false);
    });
  });

  describe('Constructor Validation', () => {
    it('should accept valid running errors', () => {
      expect(() => {
        new AtBat(
          'at-bat-1',
          'game-1',
          'inning-1',
          'batter-1',
          1,
          BattingResult.single(),
          'Test',
          0,
          [],
          ['player2'],
          new BaserunnerState(),
          new BaserunnerState('batter-1')
        );
      }).not.toThrow();
    });

    it('should accept empty running errors', () => {
      expect(() => {
        new AtBat(
          'at-bat-1',
          'game-1',
          'inning-1',
          'batter-1',
          1,
          BattingResult.single(),
          'Test',
          0,
          [],
          [],
          new BaserunnerState(),
          new BaserunnerState('batter-1')
        );
      }).not.toThrow();
    });
  });
});
