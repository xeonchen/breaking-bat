import { ScoreCalculationService } from '../ScoreCalculationService';
import { Game, GameScore } from '@/domain';

describe('ScoreCalculationService', () => {
  let service: ScoreCalculationService;

  beforeEach(() => {
    service = new ScoreCalculationService();
  });

  const createMockGame = (
    homeAway: 'home' | 'away',
    initialScore?: GameScore
  ): Game => {
    const score = initialScore || {
      homeScore: 5,
      awayScore: 3,
      inningScores: [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 1, awayRuns: 0 },
        { inning: 3, homeRuns: 2, awayRuns: 2 },
      ],
    };

    return new Game(
      'game-1',
      'Test Game',
      'Test Opponent',
      new Date(),
      'season-1',
      'gametype-1',
      homeAway,
      'team-1',
      'in_progress',
      'lineup-1',
      ['inning-1', 'inning-2', 'inning-3'],
      score
    );
  };

  describe('updateGameScore', () => {
    it('should update home team score when home team is batting', () => {
      const homeGame = createMockGame('home');
      const result = service.updateGameScore(homeGame, 2, 4, false); // bottom of 4th

      expect(result.newScore.homeScore).toBe(7); // 5 + 2
      expect(result.newScore.awayScore).toBe(3); // unchanged
      expect(result.newScore.inningScores).toContainEqual({
        inning: 4,
        homeRuns: 2,
        awayRuns: 0,
      });
    });

    it('should update away team score when away team is batting', () => {
      const awayGame = createMockGame('away');
      const result = service.updateGameScore(awayGame, 3, 4, true); // top of 4th

      expect(result.newScore.homeScore).toBe(5); // unchanged
      expect(result.newScore.awayScore).toBe(6); // 3 + 3
      expect(result.newScore.inningScores).toContainEqual({
        inning: 4,
        homeRuns: 0,
        awayRuns: 3,
      });
    });

    it('should update existing inning score', () => {
      const homeGame = createMockGame('home');
      const result = service.updateGameScore(homeGame, 1, 3, false); // bottom of 3rd

      expect(result.newScore.homeScore).toBe(6); // 5 + 1
      expect(result.newScore.awayScore).toBe(3); // unchanged

      const inning3Score = result.newScore.inningScores.find(
        (s) => s.inning === 3
      );
      expect(inning3Score).toEqual({
        inning: 3,
        homeRuns: 3, // 2 + 1
        awayRuns: 2, // unchanged
      });
    });

    it('should throw error for game without initialized score', () => {
      const game = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'gametype-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        null // no score
      );

      expect(() => service.updateGameScore(game, 2, 1, false)).toThrow(
        'Game must have an initialized score to update'
      );
    });

    it('should return updated game with new timestamp', () => {
      const homeGame = createMockGame('home');
      const originalUpdatedAt = homeGame.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      setTimeout(() => {
        const result = service.updateGameScore(homeGame, 1, 4, false);
        expect(result.updatedGame.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('calculateRunDifferential', () => {
    it('should calculate run differential correctly', () => {
      const game = createMockGame('home');
      const differential = service.calculateRunDifferential(game);
      expect(differential).toBe(2); // |5 - 3|
    });

    it('should return 0 for tied games', () => {
      const tiedScore: GameScore = {
        homeScore: 5,
        awayScore: 5,
        inningScores: [],
      };
      const game = createMockGame('home', tiedScore);
      const differential = service.calculateRunDifferential(game);
      expect(differential).toBe(0);
    });

    it('should return 0 for games without score', () => {
      const game = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'gametype-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        null
      );
      const differential = service.calculateRunDifferential(game);
      expect(differential).toBe(0);
    });
  });

  describe('getWinningTeam', () => {
    it('should return home when home team is winning', () => {
      const game = createMockGame('home'); // home: 5, away: 3
      const winner = service.getWinningTeam(game);
      expect(winner).toBe('home');
    });

    it('should return away when away team is winning', () => {
      const awayWinningScore: GameScore = {
        homeScore: 2,
        awayScore: 5,
        inningScores: [],
      };
      const game = createMockGame('home', awayWinningScore);
      const winner = service.getWinningTeam(game);
      expect(winner).toBe('away');
    });

    it('should return tied when scores are equal', () => {
      const tiedScore: GameScore = {
        homeScore: 5,
        awayScore: 5,
        inningScores: [],
      };
      const game = createMockGame('home', tiedScore);
      const winner = service.getWinningTeam(game);
      expect(winner).toBe('tied');
    });

    it('should return tied for games without score', () => {
      const game = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'gametype-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        null
      );
      const winner = service.getWinningTeam(game);
      expect(winner).toBe('tied');
    });
  });

  describe('shouldApplyMercyRule', () => {
    it('should apply mercy rule after 5 innings with 10 run difference', () => {
      const blowoutScore: GameScore = {
        homeScore: 15,
        awayScore: 2,
        inningScores: [],
      };
      const game = createMockGame('home', blowoutScore);
      const shouldApply = service.shouldApplyMercyRule(game, 5);
      expect(shouldApply).toBe(true);
    });

    it('should not apply mercy rule before 5 innings', () => {
      const blowoutScore: GameScore = {
        homeScore: 15,
        awayScore: 2,
        inningScores: [],
      };
      const game = createMockGame('home', blowoutScore);
      const shouldApply = service.shouldApplyMercyRule(game, 4);
      expect(shouldApply).toBe(false);
    });

    it('should not apply mercy rule with insufficient run difference', () => {
      const closeScore: GameScore = {
        homeScore: 8,
        awayScore: 3,
        inningScores: [],
      };
      const game = createMockGame('home', closeScore);
      const shouldApply = service.shouldApplyMercyRule(game, 5);
      expect(shouldApply).toBe(false); // 5 run difference < 10
    });

    it('should use custom mercy run difference', () => {
      const customMercyScore: GameScore = {
        homeScore: 10,
        awayScore: 5,
        inningScores: [],
      };
      const game = createMockGame('home', customMercyScore);
      const shouldApply = service.shouldApplyMercyRule(game, 5, 5); // 5 run mercy rule
      expect(shouldApply).toBe(true);
    });
  });

  describe('validateScoreUpdate', () => {
    const currentScore: GameScore = {
      homeScore: 5,
      awayScore: 3,
      inningScores: [],
    };

    it('should validate reasonable score updates', () => {
      const result = service.validateScoreUpdate(currentScore, 3);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject negative runs', () => {
      const result = service.validateScoreUpdate(currentScore, -1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Runs scored cannot be negative');
    });

    it('should reject excessive runs per inning', () => {
      const result = service.validateScoreUpdate(currentScore, 25, 20);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Runs scored (25) exceeds maximum per inning (20)'
      );
    });

    it('should reject unreasonable total scores', () => {
      const highScore: GameScore = {
        homeScore: 95,
        awayScore: 3,
        inningScores: [],
      };
      const result = service.validateScoreUpdate(highScore, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Total game score would exceed reasonable maximum (100)'
      );
    });
  });

  describe('getScoreSummary', () => {
    it('should return complete score summary', () => {
      const game = createMockGame('home');
      const summary = service.getScoreSummary(game);

      expect(summary).toEqual({
        homeScore: 5,
        awayScore: 3,
        currentLeader: 'home',
        runDifferential: 2,
        inningByInningScores: [
          { inning: 1, homeRuns: 2, awayRuns: 1 },
          { inning: 2, homeRuns: 1, awayRuns: 0 },
          { inning: 3, homeRuns: 2, awayRuns: 2 },
        ],
      });
    });

    it('should return empty summary for games without score', () => {
      const game = new Game(
        'game-1',
        'Test Game',
        'Test Opponent',
        new Date(),
        'season-1',
        'gametype-1',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        null
      );
      const summary = service.getScoreSummary(game);

      expect(summary).toEqual({
        homeScore: 0,
        awayScore: 0,
        currentLeader: 'tied',
        runDifferential: 0,
        inningByInningScores: [],
      });
    });
  });
});
