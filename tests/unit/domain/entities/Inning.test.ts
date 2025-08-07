import { Inning, HomeAway } from '@/domain/entities/Inning';

describe('Inning', () => {
  const baseInningData = {
    id: 'inning-1',
    gameId: 'game-1',
    number: 1,
    teamAtBat: 'home' as HomeAway,
    runsScored: 0,
    atBatIds: [],
    isComplete: false,
  };

  describe('Constructor', () => {
    it('should create an Inning with required parameters', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat
      );

      expect(inning.id).toBe(baseInningData.id);
      expect(inning.gameId).toBe(baseInningData.gameId);
      expect(inning.number).toBe(baseInningData.number);
      expect(inning.teamAtBat).toBe(baseInningData.teamAtBat);
      expect(inning.runsScored).toBe(0);
      expect(inning.atBatIds).toEqual([]);
      expect(inning.isComplete).toBe(false);
      expect(inning.createdAt).toBeDefined();
      expect(inning.updatedAt).toBeDefined();
    });

    it('should create an Inning with all parameters', () => {
      const atBatIds = ['at-bat-1', 'at-bat-2'];
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        5,
        'away',
        3,
        atBatIds,
        true,
        createdAt,
        updatedAt
      );

      expect(inning.number).toBe(5);
      expect(inning.teamAtBat).toBe('away');
      expect(inning.runsScored).toBe(3);
      expect(inning.atBatIds).toEqual(atBatIds);
      expect(inning.atBatIds).not.toBe(atBatIds); // Should be a copy
      expect(inning.isComplete).toBe(true);
      expect(inning.createdAt).toBe(createdAt);
      expect(inning.updatedAt).toBe(updatedAt);
    });

    it('should throw error for invalid inning number (too low)', () => {
      expect(() => {
        new Inning(
          baseInningData.id,
          baseInningData.gameId,
          0, // Invalid
          baseInningData.teamAtBat
        );
      }).toThrow('Inning number must be between 1 and 15');
    });

    it('should throw error for invalid inning number (too high)', () => {
      expect(() => {
        new Inning(
          baseInningData.id,
          baseInningData.gameId,
          16, // Invalid
          baseInningData.teamAtBat
        );
      }).toThrow('Inning number must be between 1 and 15');
    });

    it('should throw error for negative runs scored', () => {
      expect(() => {
        new Inning(
          baseInningData.id,
          baseInningData.gameId,
          baseInningData.number,
          baseInningData.teamAtBat,
          -1 // Invalid
        );
      }).toThrow('Runs scored cannot be negative');
    });

    it('should allow maximum inning number (15)', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        15,
        baseInningData.teamAtBat
      );

      expect(inning.number).toBe(15);
    });

    it('should allow minimum inning number (1)', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        1,
        baseInningData.teamAtBat
      );

      expect(inning.number).toBe(1);
    });
  });

  describe('addAtBat', () => {
    it('should add at-bat without runs', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        2,
        ['existing-at-bat']
      );

      const result = inning.addAtBat('new-at-bat');

      expect(result.atBatIds).toEqual(['existing-at-bat', 'new-at-bat']);
      expect(result.runsScored).toBe(2); // No additional runs
      expect(result.updatedAt).not.toBe(inning.updatedAt);
      expect(result.createdAt).toBe(inning.createdAt);
    });

    it('should add at-bat with runs', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        1,
        ['existing-at-bat']
      );

      const result = inning.addAtBat('new-at-bat', 2);

      expect(result.atBatIds).toEqual(['existing-at-bat', 'new-at-bat']);
      expect(result.runsScored).toBe(3); // 1 + 2
      expect(result.updatedAt).not.toBe(inning.updatedAt);
    });

    it('should throw error when adding at-bat to completed inning', () => {
      const completedInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        0,
        [],
        true // Complete
      );

      expect(() => {
        completedInning.addAtBat('new-at-bat');
      }).toThrow('Cannot add at-bat to completed inning');
    });

    it('should preserve original inning immutability', () => {
      const originalIds = ['at-bat-1'];
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        0,
        originalIds
      );

      const result = inning.addAtBat('at-bat-2');

      expect(inning.atBatIds).toEqual(['at-bat-1']); // Original unchanged
      expect(result.atBatIds).toEqual(['at-bat-1', 'at-bat-2']); // New version updated
    });
  });

  describe('complete', () => {
    it('should mark inning as complete', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        3,
        ['at-bat-1', 'at-bat-2'],
        false
      );

      const result = inning.complete();

      expect(result.isComplete).toBe(true);
      expect(result.runsScored).toBe(3); // Preserved
      expect(result.atBatIds).toEqual(['at-bat-1', 'at-bat-2']); // Preserved
      expect(result.updatedAt).not.toBe(inning.updatedAt);
      expect(result.createdAt).toBe(inning.createdAt);
    });

    it('should handle completing already completed inning', () => {
      const completedInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        2,
        ['at-bat-1'],
        true
      );

      const result = completedInning.complete();

      expect(result.isComplete).toBe(true);
      expect(result.runsScored).toBe(2);
      expect(result.atBatIds).toEqual(['at-bat-1']);
    });
  });

  describe('getAtBatCount', () => {
    it('should return zero for no at-bats', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat
      );

      expect(inning.getAtBatCount()).toBe(0);
    });

    it('should return correct count for multiple at-bats', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        0,
        ['at-bat-1', 'at-bat-2', 'at-bat-3']
      );

      expect(inning.getAtBatCount()).toBe(3);
    });
  });

  describe('isTop and isBottom', () => {
    it('should identify top of inning (away team)', () => {
      const awayInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        'away'
      );

      expect(awayInning.isTop()).toBe(true);
      expect(awayInning.isBottom()).toBe(false);
    });

    it('should identify bottom of inning (home team)', () => {
      const homeInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        'home'
      );

      expect(homeInning.isTop()).toBe(false);
      expect(homeInning.isBottom()).toBe(true);
    });
  });

  describe('getDisplayText', () => {
    it('should format first inning correctly', () => {
      const topFirst = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        1,
        'away'
      );
      const bottomFirst = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        1,
        'home'
      );

      expect(topFirst.getDisplayText()).toBe('Top 1st');
      expect(bottomFirst.getDisplayText()).toBe('Bottom 1st');
    });

    it('should format second inning correctly', () => {
      const topSecond = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        2,
        'away'
      );
      const bottomSecond = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        2,
        'home'
      );

      expect(topSecond.getDisplayText()).toBe('Top 2nd');
      expect(bottomSecond.getDisplayText()).toBe('Bottom 2nd');
    });

    it('should format third inning correctly', () => {
      const topThird = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        3,
        'away'
      );
      const bottomThird = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        3,
        'home'
      );

      expect(topThird.getDisplayText()).toBe('Top 3rd');
      expect(bottomThird.getDisplayText()).toBe('Bottom 3rd');
    });

    it('should format fourth and higher innings correctly', () => {
      const topFourth = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        4,
        'away'
      );
      const bottomSeventh = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        7,
        'home'
      );
      const topTenth = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        10,
        'away'
      );

      expect(topFourth.getDisplayText()).toBe('Top 4th');
      expect(bottomSeventh.getDisplayText()).toBe('Bottom 7th');
      expect(topTenth.getDisplayText()).toBe('Top 10th');
    });
  });

  describe('isExtraInning', () => {
    it('should identify regular innings as not extra', () => {
      const firstInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        1,
        baseInningData.teamAtBat
      );
      const seventhInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        7,
        baseInningData.teamAtBat
      );

      expect(firstInning.isExtraInning()).toBe(false);
      expect(seventhInning.isExtraInning()).toBe(false);
    });

    it('should identify extra innings correctly', () => {
      const eighthInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        8,
        baseInningData.teamAtBat
      );
      const tenthInning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        10,
        baseInningData.teamAtBat
      );

      expect(eighthInning.isExtraInning()).toBe(true);
      expect(tenthInning.isExtraInning()).toBe(true);
    });
  });

  describe('updateRuns', () => {
    it('should update runs scored', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        2,
        ['at-bat-1']
      );

      const result = inning.updateRuns(5);

      expect(result.runsScored).toBe(5);
      expect(result.atBatIds).toEqual(['at-bat-1']); // Preserved
      expect(result.isComplete).toBe(false); // Preserved
      expect(result.updatedAt).not.toBe(inning.updatedAt);
      expect(result.createdAt).toBe(inning.createdAt);
    });

    it('should update runs to zero', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        3
      );

      const result = inning.updateRuns(0);

      expect(result.runsScored).toBe(0);
    });

    it('should throw error for negative runs', () => {
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        2
      );

      expect(() => {
        inning.updateRuns(-1);
      }).toThrow('Runs scored cannot be negative');
    });

    it('should preserve immutability', () => {
      const originalRuns = 3;
      const inning = new Inning(
        baseInningData.id,
        baseInningData.gameId,
        baseInningData.number,
        baseInningData.teamAtBat,
        originalRuns
      );

      const result = inning.updateRuns(7);

      expect(inning.runsScored).toBe(originalRuns); // Original unchanged
      expect(result.runsScored).toBe(7); // New version updated
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complete inning workflow', () => {
      // Start with empty inning
      let inning = new Inning('inning-workflow', 'game-workflow', 9, 'home');

      expect(inning.getAtBatCount()).toBe(0);
      expect(inning.runsScored).toBe(0);
      expect(inning.isComplete).toBe(false);
      expect(inning.isExtraInning()).toBe(true);
      expect(inning.getDisplayText()).toBe('Bottom 9th');

      // Add first at-bat with runs
      inning = inning.addAtBat('at-bat-1', 2);
      expect(inning.getAtBatCount()).toBe(1);
      expect(inning.runsScored).toBe(2);
      expect(inning.isComplete).toBe(false);

      // Add second at-bat without runs
      inning = inning.addAtBat('at-bat-2');
      expect(inning.getAtBatCount()).toBe(2);
      expect(inning.runsScored).toBe(2);

      // Add third at-bat with more runs
      inning = inning.addAtBat('at-bat-3', 1);
      expect(inning.getAtBatCount()).toBe(3);
      expect(inning.runsScored).toBe(3);

      // Complete the inning
      inning = inning.complete();
      expect(inning.isComplete).toBe(true);
      expect(inning.getAtBatCount()).toBe(3);
      expect(inning.runsScored).toBe(3);

      // Verify cannot add more at-bats
      expect(() => {
        inning.addAtBat('at-bat-4');
      }).toThrow('Cannot add at-bat to completed inning');
    });

    it('should handle run corrections on complex inning', () => {
      let inning = new Inning(
        'correction-test',
        'game-correction',
        4,
        'away',
        5,
        ['at-bat-1', 'at-bat-2', 'at-bat-3'],
        false
      );

      expect(inning.runsScored).toBe(5);
      expect(inning.getDisplayText()).toBe('Top 4th');
      expect(inning.isExtraInning()).toBe(false);

      // Correct the runs (scoring error)
      inning = inning.updateRuns(3);
      expect(inning.runsScored).toBe(3);
      expect(inning.atBatIds).toEqual(['at-bat-1', 'at-bat-2', 'at-bat-3']); // Preserved
      expect(inning.isComplete).toBe(false); // Preserved
    });

    it('should handle edge case inning numbers and display', () => {
      const maxInning = new Inning('max-inning', 'marathon-game', 15, 'away');

      expect(maxInning.getDisplayText()).toBe('Top 15th');
      expect(maxInning.isExtraInning()).toBe(true);

      const minInning = new Inning('min-inning', 'normal-game', 1, 'home');

      expect(minInning.getDisplayText()).toBe('Bottom 1st');
      expect(minInning.isExtraInning()).toBe(false);
    });
  });
});
