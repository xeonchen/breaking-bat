import { BaserunnerAdvancementService } from '@/domain/services/BaserunnerAdvancementService';
import { BattingResult, BaserunnerState } from '@/domain';
import type { BaserunnerUI } from '@/presentation/types/BaserunnerUI';

describe('BaserunnerAdvancementService', () => {
  let service: BaserunnerAdvancementService;

  beforeEach(() => {
    service = new BaserunnerAdvancementService();
  });

  describe('Standard Advancement Rules (@live-game-scoring:AC006)', () => {
    it('should advance runners correctly for a single', () => {
      // Given: runners on 1st and 3rd
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        null, // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.single();
      const batterId = 'batter-1';

      // When: batter hits a single
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: standard advancement should apply
      expect(result.finalBaserunners.firstBase).toBe('batter-1');
      expect(result.finalBaserunners.secondBase).toBe('player-a');
      expect(result.finalBaserunners.thirdBase).toBeNull();
      expect(result.scoringRunners).toContain('player-c');
      expect(result.rbis).toBe(1);
    });

    it('should advance all runners two bases for a double', () => {
      // Given: runners on 1st and 2nd
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        'player-b', // secondBase
        null // thirdBase
      );
      const battingResult = BattingResult.double();
      const batterId = 'batter-1';

      // When: batter hits a double
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: all runners should advance two bases
      expect(result.finalBaserunners.firstBase).toBeNull();
      expect(result.finalBaserunners.secondBase).toBe('batter-1');
      expect(result.finalBaserunners.thirdBase).toBeNull();
      expect(result.scoringRunners).toEqual(['player-a', 'player-b']);
      expect(result.rbis).toBe(2);
    });

    it('should advance only forced runners on a walk', () => {
      // Given: runners on 1st and 3rd
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        null, // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.walk();
      const batterId = 'batter-1';

      // When: batter walks
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: only forced runner should advance
      expect(result.finalBaserunners.firstBase).toBe('batter-1');
      expect(result.finalBaserunners.secondBase).toBe('player-a');
      expect(result.finalBaserunners.thirdBase).toBe('player-c');
      expect(result.scoringRunners).toEqual([]);
      expect(result.rbis).toBe(0);
    });

    it('should score all runners plus batter on home run', () => {
      // Given: runners on all bases
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        'player-b', // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.homeRun();
      const batterId = 'batter-1';

      // When: batter hits home run
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: all runners plus batter should score
      expect(result.finalBaserunners.firstBase).toBeNull();
      expect(result.finalBaserunners.secondBase).toBeNull();
      expect(result.finalBaserunners.thirdBase).toBeNull();
      expect(result.scoringRunners).toEqual([
        'player-a',
        'player-b',
        'player-c',
        'batter-1',
      ]);
      expect(result.rbis).toBe(4);
    });

    it('should not advance runners on strikeout', () => {
      // Given: runners on all bases
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        'player-b', // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.strikeout();
      const batterId = 'batter-1';

      // When: batter strikes out
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: no runners should advance
      expect(result.finalBaserunners).toEqual(initialState);
      expect(result.scoringRunners).toEqual([]);
      expect(result.rbis).toBe(0);
    });
  });

  describe('Manual Override Capability (@live-game-scoring:AC007)', () => {
    it('should allow manual override of standard advancement', () => {
      // Given: standard advancement would score runner from 2nd on single
      const initialState = new BaserunnerState(
        null, // firstBase
        'player-b', // secondBase
        null // thirdBase
      );
      const battingResult = BattingResult.single();
      const batterId = 'batter-1';

      const manualOverrides = {
        'player-b': 'stay', // Override: runner stays at 2nd instead of scoring
      };

      // When: manual override is applied
      const result = service.applyManualOverrides(
        initialState,
        battingResult,
        batterId,
        manualOverrides
      );

      // Then: manual override should be applied
      expect(result.finalBaserunners.firstBase).toBe('batter-1');
      expect(result.finalBaserunners.secondBase).toBe('player-b');
      expect(result.scoringRunners).toEqual([]);
      expect(result.rbis).toBe(0);
    });

    it('should support all manual override options', () => {
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        'player-b', // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.double();
      const batterId = 'batter-1';

      const manualOverrides = {
        'player-a': 'third', // Advance to 3rd instead of scoring
        'player-b': 'out', // Out instead of scoring
        'player-c': 'home', // Score (same as standard)
      };

      // When: various overrides are applied
      const result = service.applyManualOverrides(
        initialState,
        battingResult,
        batterId,
        manualOverrides
      );

      // Then: each override should be respected
      expect(result.finalBaserunners.secondBase).toBe('batter-1');
      expect(result.finalBaserunners.thirdBase).toBe('player-a');
      expect(result.scoringRunners).toEqual(['player-c']);
      expect(result.rbis).toBe(1);
    });
  });

  describe('RBI Calculation (@live-game-scoring:AC008)', () => {
    it('should calculate RBIs based on scoring runners', () => {
      const initialState = new BaserunnerState(
        null, // firstBase
        'player-b', // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.double();
      const batterId = 'batter-1';

      // When: double should score both runners
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: RBIs should match scoring runners
      expect(result.scoringRunners).toEqual(['player-b', 'player-c']);
      expect(result.rbis).toBe(2);
    });

    it('should not count RBI for scoring on errors', () => {
      const initialState = new BaserunnerState(
        null, // firstBase
        null, // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.error();
      const batterId = 'batter-1';

      // When: error allows runner to score
      const manualOverrides = {
        'player-c': 'home', // Runner scores on error
      };

      const result = service.applyManualOverrides(
        initialState,
        battingResult,
        batterId,
        manualOverrides
      );

      // Then: no RBI should be awarded for error
      expect(result.scoringRunners).toEqual(['player-c']);
      expect(result.rbis).toBe(0); // No RBI on error
    });
  });

  describe('Validation Rules', () => {
    it('should validate that runners cannot pass each other', () => {
      const initialState = new BaserunnerState(
        'player-a', // firstBase
        null, // secondBase
        'player-c' // thirdBase
      );
      const battingResult = BattingResult.single();
      const batterId = 'batter-1';

      const invalidOverrides = {
        'player-a': 'home', // 1st base runner cannot score before 3rd base runner
        'player-c': 'stay', // 3rd base runner stays
      };

      // When/Then: invalid override should throw error
      expect(() => {
        service.applyManualOverrides(
          initialState,
          battingResult,
          batterId,
          invalidOverrides
        );
      }).toThrow('Runner cannot pass another runner');
    });

    it('should validate RBI limits', () => {
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: null,
        third: null,
      };
      const battingResult = BattingResult.single();
      const batterId = 'batter-1';

      // When: calculating advancement
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: RBIs should not exceed possible runners
      expect(result.rbis).toBeLessThanOrEqual(4); // Max 3 runners + batter
      expect(result.scoringRunners.length).toBeLessThanOrEqual(4);
    });
  });
});
