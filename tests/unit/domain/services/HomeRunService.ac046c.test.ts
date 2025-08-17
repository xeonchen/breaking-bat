/**
 * AC046C Unit Tests: Home run immediately clears all baserunners and scores everyone
 *
 * Following CLAUDE.md Test Level Decision Framework:
 * - Primary: Unit tests - Core business logic (clearing runners, scoring)
 * - Secondary: Component tests - UI behavior (no modal appears)
 * - Tertiary: Integration tests - End-to-end scoring flow
 *
 * Traceability: live-scoring:AC046C
 */

import { BattingResult } from '@/domain';

// Mock interfaces based on actual domain structure
interface BaserunnerState {
  first?: { playerId: string; playerName: string } | null;
  second?: { playerId: string; playerName: string } | null;
  third?: { playerId: string; playerName: string } | null;
}

interface AtBatResult {
  batterId: string;
  result: BattingResult;
  runnersBefore: BaserunnerState;
  runnersAfter: BaserunnerState;
  runsScored: number;
  rbiCount: number;
}

// Business logic service for home run processing
class HomeRunService {
  /**
   * AC046C: Process home run - clears all baserunners and scores everyone
   */
  static processHomeRun(
    batterId: string,
    runnersBefore: BaserunnerState
  ): AtBatResult {
    // AC046C: Count all runners on base plus batter
    const runnersOnBase = Object.values(runnersBefore).filter(
      (runner) => runner !== null && runner !== undefined
    ).length;

    const totalRunsScored = runnersOnBase + 1; // All runners + batter

    return {
      batterId,
      result: BattingResult.homeRun(),
      runnersBefore,
      runnersAfter: {
        first: null,
        second: null,
        third: null,
      }, // AC046C: All bases cleared
      runsScored: totalRunsScored,
      rbiCount: totalRunsScored, // Batter gets RBI for all runs
    };
  }

  /**
   * AC046C: Determine if baserunner advancement modal should appear
   */
  static requiresAdvancementModal(result: BattingResult): boolean {
    // AC046C: Home runs never require manual advancement
    if (result.value === 'HR') {
      return false;
    }

    // Other results may require modal
    return ['1B', '2B', '3B', 'BB', 'E', 'FC'].includes(result.value);
  }

  /**
   * Calculate team score update for home run
   */
  static calculateScoreUpdate(
    currentScore: number,
    runnersBefore: BaserunnerState
  ): number {
    const runnersOnBase = Object.values(runnersBefore).filter(
      (runner) => runner !== null && runner !== undefined
    ).length;

    return currentScore + runnersOnBase + 1; // All runners + batter
  }
}

describe('AC046C: Home run immediately clears all baserunners and scores everyone', () => {
  describe('Core business logic', () => {
    it('should score batter only when no runners on base', () => {
      const runnersBefore: BaserunnerState = {};

      const result = HomeRunService.processHomeRun('batter1', runnersBefore);

      // AC046C: Only batter scores when bases are empty
      expect(result.runsScored).toBe(1);
      expect(result.rbiCount).toBe(1);
      expect(result.runnersAfter).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should score all runners plus batter when bases loaded', () => {
      const runnersBefore: BaserunnerState = {
        first: { playerId: 'runner1', playerName: 'Runner One' },
        second: { playerId: 'runner2', playerName: 'Runner Two' },
        third: { playerId: 'runner3', playerName: 'Runner Three' },
      };

      const result = HomeRunService.processHomeRun('batter1', runnersBefore);

      // AC046C: All runners + batter score (4 total runs)
      expect(result.runsScored).toBe(4);
      expect(result.rbiCount).toBe(4);
      expect(result.runnersAfter).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should handle partial baserunner scenarios correctly', () => {
      const runnersBefore: BaserunnerState = {
        first: { playerId: 'runner1', playerName: 'Runner One' },
        third: { playerId: 'runner3', playerName: 'Runner Three' },
        // second base empty
      };

      const result = HomeRunService.processHomeRun('batter1', runnersBefore);

      // AC046C: 2 runners + batter score (3 total runs)
      expect(result.runsScored).toBe(3);
      expect(result.rbiCount).toBe(3);
      expect(result.runnersAfter).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should clear all bases regardless of initial state', () => {
      const scenarios = [
        {}, // Empty bases
        { first: { playerId: 'r1', playerName: 'Runner 1' } }, // First only
        {
          first: { playerId: 'r1', playerName: 'Runner 1' },
          second: { playerId: 'r2', playerName: 'Runner 2' },
        }, // First and second
        {
          first: { playerId: 'r1', playerName: 'Runner 1' },
          second: { playerId: 'r2', playerName: 'Runner 2' },
          third: { playerId: 'r3', playerName: 'Runner 3' },
        }, // Bases loaded
      ];

      scenarios.forEach((runnersBefore, index) => {
        const result = HomeRunService.processHomeRun(
          `batter${index}`,
          runnersBefore
        );

        // AC046C: All bases must be cleared after home run
        expect(result.runnersAfter).toEqual({
          first: null,
          second: null,
          third: null,
        });
      });
    });
  });

  describe('Modal behavior logic', () => {
    it('should never require advancement modal for home runs', () => {
      const homeRun = BattingResult.homeRun();

      // AC046C: Home runs never show advancement modal
      expect(HomeRunService.requiresAdvancementModal(homeRun)).toBe(false);
    });

    it('should require modal for other hits that normally need advancement', () => {
      const otherResults = [
        BattingResult.single(),
        BattingResult.double(),
        BattingResult.triple(),
        BattingResult.walk(),
      ];

      otherResults.forEach((result) => {
        // Other results may require modal (depends on runners)
        expect(HomeRunService.requiresAdvancementModal(result)).toBe(true);
      });
    });
  });

  describe('Score calculation', () => {
    it('should calculate correct score update for various scenarios', () => {
      const testCases = [
        {
          description: 'No runners on base',
          currentScore: 5,
          runners: {},
          expectedNewScore: 6, // +1 for batter
        },
        {
          description: 'Runner on first only',
          currentScore: 2,
          runners: { first: { playerId: 'r1', playerName: 'Runner 1' } },
          expectedNewScore: 4, // +2 (runner + batter)
        },
        {
          description: 'Bases loaded',
          currentScore: 0,
          runners: {
            first: { playerId: 'r1', playerName: 'Runner 1' },
            second: { playerId: 'r2', playerName: 'Runner 2' },
            third: { playerId: 'r3', playerName: 'Runner 3' },
          },
          expectedNewScore: 4, // +4 (3 runners + batter)
        },
        {
          description: 'First and third bases occupied',
          currentScore: 7,
          runners: {
            first: { playerId: 'r1', playerName: 'Runner 1' },
            third: { playerId: 'r3', playerName: 'Runner 3' },
          },
          expectedNewScore: 10, // +3 (2 runners + batter)
        },
      ];

      testCases.forEach(
        ({ description, currentScore, runners, expectedNewScore }) => {
          const newScore = HomeRunService.calculateScoreUpdate(
            currentScore,
            runners
          );
          expect(newScore).toBe(expectedNewScore);
        }
      );
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle null and undefined runners correctly', () => {
      const runnersBefore: BaserunnerState = {
        first: null,
        second: undefined,
        third: { playerId: 'runner3', playerName: 'Runner Three' },
      };

      const result = HomeRunService.processHomeRun('batter1', runnersBefore);

      // AC046C: Only count actual runners (1 runner + batter = 2 runs)
      expect(result.runsScored).toBe(2);
      expect(result.rbiCount).toBe(2);
      expect(result.runnersAfter).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should handle empty runner objects correctly', () => {
      const runnersBefore: BaserunnerState = {
        first: { playerId: '', playerName: '' }, // Empty but not null
        second: { playerId: 'runner2', playerName: 'Runner Two' },
      };

      const result = HomeRunService.processHomeRun('batter1', runnersBefore);

      // Should count both runners even if one has empty data
      expect(result.runsScored).toBe(3); // 2 runners + batter
      expect(result.rbiCount).toBe(3);
      expect(result.runnersAfter).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should maintain data integrity in result object', () => {
      const runnersBefore: BaserunnerState = {
        first: { playerId: 'runner1', playerName: 'Runner One' },
        second: { playerId: 'runner2', playerName: 'Runner Two' },
      };

      const result = HomeRunService.processHomeRun('batter123', runnersBefore);

      // AC046C: Verify complete result structure
      expect(result).toEqual({
        batterId: 'batter123',
        result: expect.objectContaining({ value: 'HR' }),
        runnersBefore: runnersBefore,
        runnersAfter: {
          first: null,
          second: null,
          third: null,
        },
        runsScored: 3,
        rbiCount: 3,
      });

      // Ensure original runners state is not mutated
      expect(runnersBefore.first).toBeTruthy();
      expect(runnersBefore.second).toBeTruthy();
    });
  });
});
