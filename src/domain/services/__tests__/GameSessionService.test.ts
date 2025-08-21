import { GameSessionService } from '../GameSessionService';
import { Game } from '@/domain/entities/Game';
import { BattingResult } from '@/domain/values/BattingResult';
import type { BaserunnerState } from '@/presentation/types/BaserunnerState';
import { GameSessionState } from '../../interfaces/IGameSessionService';

describe('GameSessionService', () => {
  let gameSessionService: GameSessionService;
  let mockGame: Game;
  let mockGameState: GameSessionState;

  beforeEach(() => {
    gameSessionService = new GameSessionService();

    // Create mock game
    mockGame = new Game(
      'game-1',
      'Test Game',
      'Test Opponent',
      new Date(),
      'season-1',
      'game-type-1',
      'home',
      'team-1',
      'in_progress',
      'lineup-1',
      [],
      {
        homeScore: 2,
        awayScore: 1,
        inningScores: [],
      }
    );

    // Create mock game session state
    mockGameState = {
      gameId: 'game-1',
      currentInning: 5,
      isTopInning: false,
      currentOuts: 1,
      currentBatterId: 'batter-1',
      currentCount: { balls: 0, strikes: 0 },
      baserunners: {
        first: null,
        second: { playerId: 'runner-1', playerName: 'Runner One' },
        third: null,
      },
    } as GameSessionState;
  });

  describe('advanceInning', () => {
    it('should advance from bottom of inning to top of next inning', () => {
      const currentState = {
        ...mockGameState,
        currentInning: 3,
        isTopInning: false,
      };

      const result = gameSessionService.advanceInning(currentState, mockGame);

      expect(result.newState.currentInning).toBe(4);
      expect(result.newState.isTopInning).toBe(true);
      expect(result.newState.currentOuts).toBe(0);
      expect(result.newState.baserunners).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should advance from top of inning to bottom of same inning', () => {
      const currentState = {
        ...mockGameState,
        currentInning: 3,
        isTopInning: true,
      };

      const result = gameSessionService.advanceInning(currentState, mockGame);

      expect(result.newState.currentInning).toBe(3);
      expect(result.newState.isTopInning).toBe(false);
      expect(result.newState.currentOuts).toBe(0);
      expect(result.newState.baserunners).toEqual({
        first: null,
        second: null,
        third: null,
      });
    });

    it('should complete game after 7 innings regulation with home team leading', () => {
      const gameWithHomeLeading = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'game-type-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        {
          homeScore: 5,
          awayScore: 3,
          inningScores: [],
        }
      );

      const currentState = {
        ...mockGameState,
        currentInning: 7,
        isTopInning: false,
        currentOuts: 0,
      };

      const result = gameSessionService.advanceInning(
        currentState,
        gameWithHomeLeading
      );

      expect(result.gameCompleted).toBe(true);
      expect(result.reason).toBe('Home team leads after regulation');
    });

    it('should continue to extra innings when game is tied after regulation', () => {
      const tiedGame = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'game-type-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        {
          homeScore: 3,
          awayScore: 3,
          inningScores: [],
        }
      );

      const currentState = {
        ...mockGameState,
        currentInning: 7,
        isTopInning: false,
        currentOuts: 0,
      };

      const result = gameSessionService.advanceInning(currentState, tiedGame);

      expect(result.gameCompleted).toBe(false);
      expect(result.newState.currentInning).toBe(8);
      expect(result.newState.isTopInning).toBe(true);
    });
  });

  describe('processAtBat', () => {
    it('should process a single and advance baserunners correctly', () => {
      const baserunners: BaserunnerState = {
        first: null,
        second: { playerId: 'runner-2', playerName: 'Runner Two' },
        third: null,
      };

      const currentState = {
        ...mockGameState,
        baserunners,
        currentOuts: 1,
      };

      const result = gameSessionService.processAtBat(
        currentState,
        'batter-1',
        BattingResult.single(),
        'lineup-1'
      );

      expect(result.runsScored).toBe(1); // Runner from second scores
      expect(result.newGameState.baserunners.first?.playerId).toBe('batter-1');
      expect(result.newGameState.baserunners.second).toBeNull();
      expect(result.newGameState.baserunners.third).toBeNull();
      expect(result.advanceInning).toBe(false);
    });

    it('should advance inning after third out', () => {
      const currentState = {
        ...mockGameState,
        currentOuts: 2, // One more out will end the inning
      };

      const result = gameSessionService.processAtBat(
        currentState,
        'batter-1',
        BattingResult.strikeout(),
        'lineup-1'
      );

      expect(result.newGameState.currentOuts).toBe(0); // Reset for new inning
      expect(result.advanceInning).toBe(true);
      expect(result.runsScored).toBe(0);
    });

    it('should handle home run with bases loaded', () => {
      const basesLoaded: BaserunnerState = {
        first: { playerId: 'runner-1', playerName: 'Runner One' },
        second: { playerId: 'runner-2', playerName: 'Runner Two' },
        third: { playerId: 'runner-3', playerName: 'Runner Three' },
      };

      const currentState = {
        ...mockGameState,
        baserunners: basesLoaded,
        currentOuts: 0,
      };

      const result = gameSessionService.processAtBat(
        currentState,
        'batter-1',
        BattingResult.homeRun(),
        'lineup-1'
      );

      expect(result.runsScored).toBe(4); // 3 runners + batter
      expect(result.newGameState.baserunners.first).toBeNull();
      expect(result.newGameState.baserunners.second).toBeNull();
      expect(result.newGameState.baserunners.third).toBeNull();
      expect(result.advanceInning).toBe(false);
    });

    it('should handle walk with bases loaded (forced run)', () => {
      const basesLoaded: BaserunnerState = {
        first: { playerId: 'runner-1', playerName: 'Runner One' },
        second: { playerId: 'runner-2', playerName: 'Runner Two' },
        third: { playerId: 'runner-3', playerName: 'Runner Three' },
      };

      const currentState = {
        ...mockGameState,
        baserunners: basesLoaded,
        currentOuts: 1,
      };

      const result = gameSessionService.processAtBat(
        currentState,
        'batter-1',
        BattingResult.walk(),
        'lineup-1'
      );

      expect(result.runsScored).toBe(1); // Runner from third forced home
      expect(result.newGameState.baserunners.first?.playerId).toBe('batter-1');
      expect(result.newGameState.baserunners.second?.playerId).toBe('runner-1');
      expect(result.newGameState.baserunners.third?.playerId).toBe('runner-2');
      expect(result.advanceInning).toBe(false);
    });
  });

  describe('validateGameState', () => {
    it('should validate a correct game state', () => {
      const validState = {
        ...mockGameState,
        currentOuts: 2,
        currentInning: 5,
      };

      const result = gameSessionService.validateGameState(validState);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject game state with invalid outs count', () => {
      const invalidState = {
        ...mockGameState,
        currentOuts: 4, // More than 3 outs
      };

      const result = gameSessionService.validateGameState(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Outs must be between 0 and 3');
    });

    it('should reject game state with negative inning', () => {
      const invalidState = {
        ...mockGameState,
        currentInning: 0,
      };

      const result = gameSessionService.validateGameState(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current inning must be at least 1');
    });

    it('should reject game state with negative scores', () => {
      const invalidState = {
        ...mockGameState,
        homeScore: -1,
      };

      const result = gameSessionService.validateGameState(invalidState);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scores cannot be negative');
    });
  });

  describe('getNextBatter', () => {
    it('should return next batter in lineup order', () => {
      const mockLineup = [
        { playerId: 'player-1', playerName: 'Player 1', battingOrder: 1 },
        { playerId: 'player-2', playerName: 'Player 2', battingOrder: 2 },
        { playerId: 'player-3', playerName: 'Player 3', battingOrder: 3 },
      ];

      const currentState = {
        ...mockGameState,
        currentBatterId: 'player-1',
      };

      const nextBatter = gameSessionService.getNextBatter(
        currentState,
        mockLineup
      );

      expect(nextBatter?.playerId).toBe('player-2');
    });

    it('should wrap around to first batter after last in lineup', () => {
      const mockLineup = [
        { playerId: 'player-1', playerName: 'Player 1', battingOrder: 1 },
        { playerId: 'player-2', playerName: 'Player 2', battingOrder: 2 },
        { playerId: 'player-3', playerName: 'Player 3', battingOrder: 3 },
      ];

      const currentState = {
        ...mockGameState,
        currentBatterId: 'player-3',
      };

      const nextBatter = gameSessionService.getNextBatter(
        currentState,
        mockLineup
      );

      expect(nextBatter?.playerId).toBe('player-1');
    });

    it('should handle empty lineup gracefully', () => {
      const emptyLineup: any[] = [];

      const currentState = {
        ...mockGameState,
        currentBatterId: 'player-1',
      };

      const nextBatter = gameSessionService.getNextBatter(
        currentState,
        emptyLineup
      );

      expect(nextBatter).toBeNull();
    });
  });
});
