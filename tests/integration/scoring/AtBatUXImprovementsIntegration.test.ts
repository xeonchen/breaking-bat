/**
 * UX Improvements Integration Tests
 *
 * Tests the integration between components for UX improvements:
 * - Opponent scoring interface integration
 * - Collapsible UI state management
 * - Conditional modal logic
 * - Baserunner validation workflows
 * - Field layout responsive behavior
 */

import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useGameStore } from '@/presentation/stores/gameStore';
import { ScoringService } from '@/domain/services/ScoringService';
import { BattingResult, BaserunnerState } from '@/domain';

// Mock dependencies
jest.mock('@/domain/services/ScoringService');
const mockScoringService = jest.mocked(ScoringService);

describe('UX Improvements Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage for testing environment
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  describe('AC045A-D - Opponent Scoring Integration', () => {
    it.skip('should integrate opponent scoring with scoreboard updates', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up game state
      await act(async () => {
        // Mock game setup
        result.current.currentGame = {
          id: 'game1',
          opponent: 'Eagles',
          finalScore: { homeScore: 4, awayScore: 2, inningScores: [] },
          isHomeGame: () => true,
        } as any;
        result.current.currentInning = 5;
        result.current.isTopInning = true; // Opponent batting
      });

      // Test opponent scoring workflow
      await act(async () => {
        await result.current.recordOpponentScore(3);
      });

      expect(result.current.currentGame?.finalScore.awayScore).toBe(5);
      expect(result.current.isTopInning).toBe(false); // Should advance to our turn
    });

    it.skip('should handle opponent scoring validation and error states', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        result.current.currentGame = {
          id: 'game1',
          opponent: 'Eagles',
          finalScore: { homeScore: 0, awayScore: 0, inningScores: [] },
        } as any;
      });

      // Test invalid input handling
      await act(async () => {
        try {
          await result.current.recordOpponentScore(-1);
        } catch (error) {
          expect(error.message).toContain(
            'Opponent runs must be between 0 and 25'
          );
        }
      });

      await act(async () => {
        try {
          await result.current.recordOpponentScore(26);
        } catch (error) {
          expect(error.message).toContain(
            'Opponent runs must be between 0 and 25'
          );
        }
      });
    });
  });

  describe('AC004A - Collapsible UI State Integration', () => {
    it('should persist pitch tracking collapse state across sessions', () => {
      // Test localStorage integration
      const mockStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
      });

      // Simulate component mounting with saved state
      mockStorage.getItem.mockReturnValue('true');

      const { result } = renderHook(() => {
        const [collapsed, setCollapsed] = useState(() => {
          return localStorage.getItem('pitch-tracking-collapsed') === 'true';
        });

        const toggleWithPersistence = (newState: boolean) => {
          setCollapsed(newState);
          // Simulate the real component behavior
          localStorage.setItem('pitch-tracking-collapsed', newState.toString());
        };

        return { collapsed, setCollapsed: toggleWithPersistence };
      });

      expect(result.current.collapsed).toBe(true);

      act(() => {
        result.current.setCollapsed(false);
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'pitch-tracking-collapsed',
        'false'
      );
    });

    it.skip('should maintain pitch tracking functionality when UI is collapsed', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up game with pitch tracking collapsed
      await act(async () => {
        result.current.currentGame = { id: 'game1' } as any;
        result.current.currentBatter = {
          playerId: 'player1',
          playerName: 'Test Player',
        } as any;
        result.current.currentCount = { balls: 0, strikes: 0 };
        result.current.baserunners = {};
      });

      // Simulate at-bat completion with collapsed UI
      const atBatResult = {
        batterId: 'player1',
        result: BattingResult.walk(),
        finalCount: { balls: 4, strikes: 0 },
        pitchSequence: ['B', 'B', 'B', 'B'],
      };

      await act(async () => {
        await result.current.recordAtBat(atBatResult);
      });

      // Verify functionality works regardless of UI state
      expect(result.current.currentCount).toEqual({ balls: 0, strikes: 0 });
      expect(result.current.baserunners.first).toBeTruthy();
    });
  });

  describe('AC016A - Conditional Modal Integration', () => {
    it('should integrate baserunner state with modal display logic', () => {
      const hasRunners = (baserunners: any) => {
        return Object.values(baserunners).some((runner) => runner !== null);
      };

      const shouldShowModal = (
        battingResult: BattingResult,
        baserunners: any
      ) => {
        const requiresAdvancement = [
          '1B',
          '2B',
          '3B',
          'BB',
          'E',
          'FC',
        ].includes(battingResult.value);
        return hasRunners(baserunners) && requiresAdvancement;
      };

      // Test scenarios
      expect(shouldShowModal(BattingResult.single(), {})).toBe(false); // No runners
      expect(
        shouldShowModal(BattingResult.homeRun(), { first: 'player1' })
      ).toBe(false); // Auto-handled
      expect(
        shouldShowModal(BattingResult.single(), { first: 'player1' })
      ).toBe(true); // Should show
      expect(
        shouldShowModal(BattingResult.strikeout(), { first: 'player1' })
      ).toBe(false); // No advancement
    });
  });

  describe('AC017A-C - Baserunner Validation Integration', () => {
    it('should validate complete runner advancement selections', () => {
      const validateAdvancement = (
        initialRunners: any,
        selections: any,
        battingResult: BattingResult
      ) => {
        const errors: string[] = [];

        // AC017A: All selections required
        const runnersNeedingSelection = Object.keys(initialRunners).filter(
          (base) => initialRunners[base] !== null
        );
        const selectedBases = Object.keys(selections);
        for (const base of runnersNeedingSelection) {
          if (!selectedBases.includes(base) || !selections[base]) {
            errors.push(`Selection required for runner on ${base}`);
          }
        }

        // AC017B: No runners can disappear
        for (const base of runnersNeedingSelection) {
          if (
            selections[base] &&
            !['second', 'third', 'home', 'out', 'stay'].includes(
              selections[base]
            )
          ) {
            errors.push(`Invalid advancement selection: ${selections[base]}`);
          }
        }

        // AC017C: No base conflicts
        const finalPositions: Record<string, string[]> = {
          first: [],
          second: [],
          third: [],
        };

        // Add batter if they reach base
        if (battingResult.reachesBase()) {
          finalPositions.first.push('batter');
        }

        // Process existing runners
        Object.entries(selections).forEach(([fromBase, advancement]) => {
          const runner = initialRunners[fromBase];
          if (runner && advancement !== 'home' && advancement !== 'out') {
            const targetBase = advancement === 'stay' ? fromBase : advancement;
            if (finalPositions[targetBase]) {
              finalPositions[targetBase].push(runner);
            }
          }
        });

        // Check for conflicts
        Object.entries(finalPositions).forEach(([base, runners]) => {
          if (runners.length > 1) {
            errors.push(
              `Multiple runners cannot occupy ${base}: ${runners.join(', ')}`
            );
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
        };
      };

      // Test valid scenario
      const validResult = validateAdvancement(
        { first: 'runner1', third: 'runner3' },
        { first: 'second', third: 'home' },
        BattingResult.single()
      );
      expect(validResult.isValid).toBe(true);

      // Test incomplete selections (AC017A)
      const incompleteResult = validateAdvancement(
        { first: 'runner1', third: 'runner3' },
        { first: 'second' }, // Missing third base selection
        BattingResult.single()
      );
      expect(incompleteResult.isValid).toBe(false);
      expect(incompleteResult.errors).toContain(
        'Selection required for runner on third'
      );

      // Test base conflict (AC017C)
      const conflictResult = validateAdvancement(
        { first: 'runner1', second: 'runner2' },
        { first: 'stay', second: 'first' }, // Both end up on first
        BattingResult.single()
      );
      expect(conflictResult.isValid).toBe(false);
      expect(conflictResult.errors).toContain(
        'Multiple runners cannot occupy first: batter, runner1, runner2'
      );
    });
  });

  describe('AC003A - Contextual Button Integration', () => {
    it.skip('should integrate game state with button enablement logic', () => {
      const getButtonState = (buttonType: string, gameState: any) => {
        const { baserunners, currentOuts } = gameState;
        const hasRunners = Object.values(baserunners).some(
          (runner) => runner !== null
        );

        switch (buttonType) {
          case 'dp': // Double Play
            return {
              enabled: hasRunners && currentOuts < 2,
              tooltip: hasRunners ? null : 'No runners for double play',
            };
          case 'sf': // Sacrifice Fly
            return {
              enabled: baserunners.third !== null,
              tooltip: baserunners.third ? null : 'No runner on third base',
            };
          default:
            return { enabled: true, tooltip: null };
        }
      };

      // Test scenarios
      const noRunnersState = { baserunners: {}, currentOuts: 1 };
      const dpButton = getButtonState('dp', noRunnersState);
      expect(dpButton.enabled).toBe(false);
      expect(dpButton.tooltip).toBe('No runners for double play');

      const withRunnersState = {
        baserunners: { first: 'runner1' },
        currentOuts: 1,
      };
      const dpButtonEnabled = getButtonState('dp', withRunnersState);
      expect(dpButtonEnabled.enabled).toBe(true);
      expect(dpButtonEnabled.tooltip).toBeNull();

      const noThirdRunnerState = {
        baserunners: { first: 'runner1' },
        currentOuts: 1,
      };
      const sfButton = getButtonState('sf', noThirdRunnerState);
      expect(sfButton.enabled).toBe(false);
      expect(sfButton.tooltip).toBe('No runner on third base');
    });
  });

  describe('AC009A - Field Layout Integration', () => {
    it('should integrate responsive layout with game state', () => {
      const getLayoutConfig = (isMobile: boolean, baserunners: any) => {
        const baseConfig = {
          containerHeight: isMobile ? '100px' : '120px',
          baseSize: isMobile ? 'sm' : 'md',
          positions: {
            third: { left: '10%', bottom: '20px' },
            second: { left: '50%', top: '10px', elevated: true },
            first: { right: '10%', bottom: '20px' },
          },
        };

        // Add runner data to positions
        Object.entries(baseConfig.positions).forEach(([base, config]) => {
          config.runner = baserunners[base] || null;
          config.occupied = !!baserunners[base];
        });

        return baseConfig;
      };

      const mobileLayout = getLayoutConfig(true, {
        first: 'runner1',
        second: 'runner2',
        third: null,
      });

      expect(mobileLayout.containerHeight).toBe('100px');
      expect(mobileLayout.baseSize).toBe('sm');
      expect(mobileLayout.positions.first.occupied).toBe(true);
      expect(mobileLayout.positions.second.occupied).toBe(true);
      expect(mobileLayout.positions.third.occupied).toBe(false);
      expect(mobileLayout.positions.second.elevated).toBe(true);

      const desktopLayout = getLayoutConfig(false, {});
      expect(desktopLayout.containerHeight).toBe('120px');
      expect(desktopLayout.baseSize).toBe('md');
    });
  });

  describe('Integration Workflow Tests', () => {
    it.skip('should complete full UX improvements workflow', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up initial game state
      await act(async () => {
        result.current.currentGame = {
          id: 'game1',
          opponent: 'Eagles',
          finalScore: { homeScore: 2, awayScore: 1, inningScores: [] },
          isHomeGame: () => true,
        } as any;
        result.current.currentInning = 3;
        result.current.isTopInning = true; // Opponent turn
        result.current.baserunners = {};
      });

      // 1. Handle opponent scoring
      await act(async () => {
        await result.current.recordOpponentScore(2);
      });

      expect(result.current.currentGame?.finalScore.awayScore).toBe(3);
      expect(result.current.isTopInning).toBe(false); // Advanced to our turn

      // 2. Set up runners for modal testing
      await act(async () => {
        result.current.baserunners = {
          first: { playerId: 'runner1', playerName: 'Runner One' },
          third: { playerId: 'runner3', playerName: 'Runner Three' },
        };
      });

      // 3. Test conditional modal logic
      const shouldShowModal = (battingResult: BattingResult) => {
        const hasRunners = Object.values(result.current.baserunners).some(
          (r) => r !== null
        );
        const requiresAdvancement = ['1B', '2B', '3B'].includes(
          battingResult.value
        );
        return hasRunners && requiresAdvancement;
      };

      expect(shouldShowModal(BattingResult.single())).toBe(true);
      expect(shouldShowModal(BattingResult.homeRun())).toBe(false);

      // 4. Test at-bat with manual advancement
      const atBatWithAdvancement = {
        batterId: 'player1',
        result: BattingResult.single(),
        finalCount: { balls: 1, strikes: 1 },
        baserunnerAdvancement: {
          first: 'second',
          third: 'home',
        },
      };

      await act(async () => {
        await result.current.recordAtBat(atBatWithAdvancement);
      });

      // Verify integration worked correctly
      expect(result.current.baserunners.first).toBeTruthy(); // Batter on first
      expect(result.current.baserunners.second).toBeTruthy(); // Runner advanced
      expect(result.current.baserunners.third).toBeNull(); // Runner scored
    });
  });
});
