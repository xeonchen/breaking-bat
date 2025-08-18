import { GameSession, CurrentBatter } from '../GameSession';
import { CleanGame } from '../../entities/CleanGame';

describe('GameSession', () => {
  let game: any; // Using any for test compatibility
  let lineup: CurrentBatter[];
  let gameSession: GameSession;

  beforeEach(() => {
    game = new CleanGame(
      'game-1',
      'Test Game',
      'Opponent Team',
      new Date('2025-08-17'),
      'season-1',
      'regular',
      'home',
      'team-1',
      'setup'
    );

    lineup = [
      {
        playerId: 'player-1',
        playerName: 'Player 1',
        jerseyNumber: '1',
        battingOrder: 1,
      },
      {
        playerId: 'player-2',
        playerName: 'Player 2',
        jerseyNumber: '2',
        battingOrder: 2,
      },
    ];

    gameSession = new GameSession(game, lineup);
  });

  describe('initialization', () => {
    it('should initialize with correct game and lineup', () => {
      expect(gameSession.gameId).toBe('game-1');
      expect(gameSession.opponent).toBe('Opponent Team');
      expect(gameSession.lineup).toHaveLength(2);
      expect(gameSession.currentBatter?.playerId).toBe('player-1');
    });

    it('should initialize with default session state', () => {
      expect(gameSession.currentInning).toBe(1);
      expect(gameSession.isTopInning).toBe(true);
      expect(gameSession.currentOuts).toBe(0);
      expect(gameSession.totalRunsScored).toBe(0);
    });
  });

  describe('game state management', () => {
    it('should start game successfully', () => {
      gameSession.startGame();
      expect(gameSession.status).toBe('in_progress');
      expect(gameSession.currentBatter?.playerId).toBe('player-1');
    });

    it('should advance to next batter', () => {
      gameSession.advanceToNextBatter();
      expect(gameSession.currentBatter?.playerId).toBe('player-2');
    });

    it('should wrap around to first batter after last', () => {
      gameSession.advanceToNextBatter(); // player-2
      gameSession.advanceToNextBatter(); // back to player-1
      expect(gameSession.currentBatter?.playerId).toBe('player-1');
    });
  });

  describe('inning management', () => {
    beforeEach(() => {
      gameSession.startGame();
    });

    it('should advance inning correctly', () => {
      expect(gameSession.currentInning).toBe(1);
      expect(gameSession.isTopInning).toBe(true);

      gameSession.advanceInning();
      expect(gameSession.currentInning).toBe(1);
      expect(gameSession.isTopInning).toBe(false);

      gameSession.advanceInning();
      expect(gameSession.currentInning).toBe(2);
      expect(gameSession.isTopInning).toBe(true);
    });

    it('should reset outs and baserunners when advancing inning', () => {
      gameSession.addOuts(2);
      gameSession.updateBaserunners({
        first: { playerId: 'player-1', playerName: 'Player 1' },
        second: null,
        third: null,
      });

      gameSession.advanceInning();

      expect(gameSession.currentOuts).toBe(0);
      expect(gameSession.baserunners.first).toBeNull();
    });
  });

  describe('count and outs management', () => {
    it('should detect walk condition', () => {
      gameSession.updateCount({ balls: 4, strikes: 2 });
      expect(gameSession.isWalk()).toBe(true);
    });

    it('should detect strikeout condition', () => {
      gameSession.updateCount({ balls: 2, strikes: 3 });
      expect(gameSession.isStrikeout()).toBe(true);
    });

    it('should detect full count', () => {
      gameSession.updateCount({ balls: 3, strikes: 2 });
      expect(gameSession.isFullCount()).toBe(true);
    });

    it('should return true when 3 outs are reached', () => {
      const shouldAdvanceInning = gameSession.addOuts(3);
      expect(shouldAdvanceInning).toBe(true);
      expect(gameSession.currentOuts).toBe(3);
    });
  });

  describe('runs management', () => {
    it('should add runs correctly', () => {
      gameSession.addRuns(3);
      expect(gameSession.totalRunsScored).toBe(3);

      gameSession.addRuns(2);
      expect(gameSession.totalRunsScored).toBe(5);
    });

    it('should throw error for negative runs', () => {
      expect(() => gameSession.addRuns(-1)).toThrow('Cannot add negative runs');
    });
  });

  describe('session snapshots', () => {
    it('should create and restore snapshots correctly', () => {
      gameSession.startGame();
      gameSession.addRuns(2);
      gameSession.updateCount({ balls: 2, strikes: 1 });
      gameSession.addPitch('strike');

      const snapshot = gameSession.getSessionSnapshot();

      // Modify state
      gameSession.addRuns(3);
      gameSession.updateCount({ balls: 3, strikes: 2 });

      // Restore from snapshot
      gameSession.restoreFromSnapshot(snapshot);

      expect(gameSession.totalRunsScored).toBe(2);
      expect(gameSession.currentCount.balls).toBe(2);
      expect(gameSession.currentCount.strikes).toBe(1);
      expect(gameSession.pitchSequence).toEqual(['strike']);
    });
  });
});
