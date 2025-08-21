import { BaserunnerAdvancementService } from '@/domain/services/BaserunnerAdvancementService';
import { BattingResult } from '@/domain';
import type { BaserunnerState } from '@/presentation/types/BaserunnerState';

describe('BaserunnerAdvancementService', () => {
  let service: BaserunnerAdvancementService;

  beforeEach(() => {
    service = new BaserunnerAdvancementService();
  });

  describe('Standard Advancement Rules (@live-game-scoring:AC006)', () => {
    it('should advance runners correctly for a single', () => {
      // Given: runners on 1st and 3rd
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: null,
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
      const battingResult = BattingResult.single();
      const batterId = 'batter-1';

      // When: batter hits a single
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: standard advancement should apply
      expect(result.finalBaserunners.first).toEqual({
        playerId: 'batter-1',
        playerName: expect.any(String),
      });
      expect(result.finalBaserunners.second).toEqual({
        playerId: 'player-a',
        playerName: 'Player A',
      });
      expect(result.finalBaserunners.third).toBeNull();
      expect(result.scoringRunners).toContain('player-c');
      expect(result.rbis).toBe(1);
    });

    it('should advance all runners two bases for a double', () => {
      // Given: runners on 1st and 2nd
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: null,
      };
      const battingResult = BattingResult.double();
      const batterId = 'batter-1';

      // When: batter hits a double
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: all runners should advance two bases
      expect(result.finalBaserunners.first).toBeNull();
      expect(result.finalBaserunners.second).toEqual({
        playerId: 'batter-1',
        playerName: expect.any(String),
      });
      expect(result.finalBaserunners.third).toBeNull();
      expect(result.scoringRunners).toEqual(['player-a', 'player-b']);
      expect(result.rbis).toBe(2);
    });

    it('should advance only forced runners on a walk', () => {
      // Given: runners on 1st and 3rd
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: null,
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
      const battingResult = BattingResult.walk();
      const batterId = 'batter-1';

      // When: batter walks
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: only forced runner should advance
      expect(result.finalBaserunners.first).toEqual({
        playerId: 'batter-1',
        playerName: expect.any(String),
      });
      expect(result.finalBaserunners.second).toEqual({
        playerId: 'player-a',
        playerName: 'Player A',
      });
      expect(result.finalBaserunners.third).toEqual({
        playerId: 'player-c',
        playerName: 'Player C',
      });
      expect(result.scoringRunners).toEqual([]);
      expect(result.rbis).toBe(0);
    });

    it('should score all runners plus batter on home run', () => {
      // Given: runners on all bases
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
      const battingResult = BattingResult.homeRun();
      const batterId = 'batter-1';

      // When: batter hits home run
      const result = service.calculateStandardAdvancement(
        initialState,
        battingResult,
        batterId
      );

      // Then: all runners plus batter should score
      expect(result.finalBaserunners.first).toBeNull();
      expect(result.finalBaserunners.second).toBeNull();
      expect(result.finalBaserunners.third).toBeNull();
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
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
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
      const initialState: BaserunnerState = {
        first: null,
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: null,
      };
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
      expect(result.finalBaserunners.first).toEqual({
        playerId: 'batter-1',
        playerName: expect.any(String),
      });
      expect(result.finalBaserunners.second).toEqual({
        playerId: 'player-b',
        playerName: 'Player B',
      });
      expect(result.scoringRunners).toEqual([]);
      expect(result.rbis).toBe(0);
    });

    it('should support all manual override options', () => {
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
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
      expect(result.finalBaserunners.second).toEqual({
        playerId: 'batter-1',
        playerName: expect.any(String),
      });
      expect(result.finalBaserunners.third).toEqual({
        playerId: 'player-a',
        playerName: 'Player A',
      });
      expect(result.scoringRunners).toEqual(['player-c']);
      expect(result.rbis).toBe(1);
    });
  });

  describe('RBI Calculation (@live-game-scoring:AC008)', () => {
    it('should calculate RBIs based on scoring runners', () => {
      const initialState: BaserunnerState = {
        first: null,
        second: { playerId: 'player-b', playerName: 'Player B' },
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
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
      const initialState: BaserunnerState = {
        first: null,
        second: null,
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
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
      const initialState: BaserunnerState = {
        first: { playerId: 'player-a', playerName: 'Player A' },
        second: null,
        third: { playerId: 'player-c', playerName: 'Player C' },
      };
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
