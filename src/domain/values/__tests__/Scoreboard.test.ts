import { Scoreboard } from '../Scoreboard';

describe('Scoreboard', () => {
  describe('construction', () => {
    it('should create empty scoreboard', () => {
      const scoreboard = Scoreboard.empty();
      expect(scoreboard.homeScore).toBe(0);
      expect(scoreboard.awayScore).toBe(0);
      expect(scoreboard.inningScores).toHaveLength(0);
    });

    it('should create scoreboard with initial scores', () => {
      const inningScores = [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 0, awayRuns: 3 },
      ];
      const scoreboard = new Scoreboard(2, 4, inningScores);

      expect(scoreboard.homeScore).toBe(2);
      expect(scoreboard.awayScore).toBe(4);
      expect(scoreboard.inningScores).toHaveLength(2);
    });

    it('should throw error for negative scores', () => {
      expect(() => new Scoreboard(-1, 0)).toThrow('Scores cannot be negative');
      expect(() => new Scoreboard(0, -1)).toThrow('Scores cannot be negative');
    });

    it('should throw error for non-integer scores', () => {
      expect(() => new Scoreboard(1.5, 0)).toThrow(
        'Scores must be whole numbers'
      );
      expect(() => new Scoreboard(0, 2.3)).toThrow(
        'Scores must be whole numbers'
      );
    });

    it('should validate inning scores consistency', () => {
      const inningScores = [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 1, awayRuns: 2 },
      ];

      // Should fail because total doesn't match
      expect(() => new Scoreboard(5, 3, inningScores)).toThrow(
        'Home score (5) does not match'
      );
      expect(() => new Scoreboard(3, 5, inningScores)).toThrow(
        'Away score (5) does not match'
      );
    });
  });

  describe('adding runs', () => {
    let scoreboard: Scoreboard;

    beforeEach(() => {
      scoreboard = new Scoreboard(2, 1, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
      ]);
    });

    it('should add home runs to existing inning', () => {
      const newScoreboard = scoreboard.addHomeRuns(3, 1);

      expect(newScoreboard.homeScore).toBe(5);
      expect(newScoreboard.awayScore).toBe(1);
      expect(newScoreboard.getInningScore(1)?.homeRuns).toBe(5);
    });

    it('should add away runs to existing inning', () => {
      const newScoreboard = scoreboard.addAwayRuns(2, 1);

      expect(newScoreboard.homeScore).toBe(2);
      expect(newScoreboard.awayScore).toBe(3);
      expect(newScoreboard.getInningScore(1)?.awayRuns).toBe(3);
    });

    it('should create new inning when adding to non-existing inning', () => {
      const newScoreboard = scoreboard.addHomeRuns(1, 2);

      expect(newScoreboard.homeScore).toBe(3);
      expect(newScoreboard.getInningScore(2)?.homeRuns).toBe(1);
      expect(newScoreboard.getInningScore(2)?.awayRuns).toBe(0);
    });

    it('should sort innings by inning number', () => {
      const newScoreboard = scoreboard.addHomeRuns(1, 3).addAwayRuns(2, 2);

      const innings = newScoreboard.inningScores;
      expect(innings[0].inning).toBe(1);
      expect(innings[1].inning).toBe(2);
      expect(innings[2].inning).toBe(3);
    });

    it('should throw error for negative runs', () => {
      expect(() => scoreboard.addHomeRuns(-1, 1)).toThrow(
        'Cannot add negative runs'
      );
      expect(() => scoreboard.addAwayRuns(-1, 1)).toThrow(
        'Cannot add negative runs'
      );
    });

    it('should throw error for invalid inning', () => {
      expect(() => scoreboard.addHomeRuns(1, 0)).toThrow(
        'Inning must be positive'
      );
      expect(() => scoreboard.addAwayRuns(1, -1)).toThrow(
        'Inning must be positive'
      );
    });
  });

  describe('score analysis', () => {
    it('should calculate run differential correctly', () => {
      const scoreboard1 = new Scoreboard(5, 2);
      const scoreboard2 = new Scoreboard(3, 7);
      const scoreboard3 = new Scoreboard(4, 4);

      expect(scoreboard1.getRunDifferential()).toBe(3);
      expect(scoreboard2.getRunDifferential()).toBe(4);
      expect(scoreboard3.getRunDifferential()).toBe(0);
    });

    it('should determine winner correctly', () => {
      const homeWin = new Scoreboard(5, 2);
      const awayWin = new Scoreboard(3, 7);
      const tie = new Scoreboard(4, 4);

      expect(homeWin.getWinner()).toBe('home');
      expect(awayWin.getWinner()).toBe('away');
      expect(tie.getWinner()).toBe('tied');
    });

    it('should detect mercy rule', () => {
      const mercyGame = new Scoreboard(15, 2);
      const closeGame = new Scoreboard(5, 2);

      expect(mercyGame.isMercyRule()).toBe(true);
      expect(mercyGame.isMercyRule(10)).toBe(true);
      expect(mercyGame.isMercyRule(15)).toBe(false);
      expect(closeGame.isMercyRule()).toBe(false);
    });

    it('should get innings played correctly', () => {
      const scoreboard = new Scoreboard(5, 3, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 2 },
      ]);

      expect(scoreboard.getInningsPlayed()).toBe(2);
    });
  });

  describe('display methods', () => {
    it('should format score display correctly', () => {
      const scoreboard = new Scoreboard(7, 3);
      expect(scoreboard.getScoreDisplay()).toBe('7-3');
    });

    it('should provide comprehensive summary', () => {
      const scoreboard = new Scoreboard(12, 2, [
        { inning: 1, homeRuns: 5, awayRuns: 1 },
        { inning: 2, homeRuns: 7, awayRuns: 1 },
      ]);

      const summary = scoreboard.getSummary();

      expect(summary.homeScore).toBe(12);
      expect(summary.awayScore).toBe(2);
      expect(summary.winner).toBe('home');
      expect(summary.runDifferential).toBe(10);
      expect(summary.inningsPlayed).toBe(2);
      expect(summary.isMercyRule).toBe(true);
    });

    it('should convert to string representation', () => {
      const scoreboard = new Scoreboard(5, 3, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 2 },
      ]);

      const str = scoreboard.toString();
      expect(str).toContain('Scoreboard(5-3)');
      expect(str).toContain('1:(H:2,A:1)');
      expect(str).toContain('2:(H:3,A:2)');
    });
  });

  describe('equality and conversion', () => {
    it('should check equality correctly', () => {
      const scoreboard1 = new Scoreboard(5, 3, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 2 },
      ]);

      const scoreboard2 = new Scoreboard(5, 3, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 2 },
      ]);

      const scoreboard3 = new Scoreboard(5, 4, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 3 },
      ]);

      expect(scoreboard1.equals(scoreboard2)).toBe(true);
      expect(scoreboard1.equals(scoreboard3)).toBe(false);
    });

    it('should convert to and from legacy format', () => {
      const inningScores = [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
        { inning: 2, homeRuns: 3, awayRuns: 2 },
      ];

      const scoreboard = new Scoreboard(5, 3, inningScores);
      const legacy = scoreboard.toGameScore();
      const restored = Scoreboard.fromGameScore(legacy);

      expect(restored.equals(scoreboard)).toBe(true);
      expect(legacy.homeScore).toBe(5);
      expect(legacy.awayScore).toBe(3);
      expect(legacy.inningScores).toHaveLength(2);
    });
  });

  describe('immutability', () => {
    it('should not modify original scoreboard when adding runs', () => {
      const original = new Scoreboard(2, 1, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
      ]);
      const modified = original.addHomeRuns(3, 1);

      expect(original.homeScore).toBe(2);
      expect(modified.homeScore).toBe(5);
    });

    it('should have frozen inning scores array', () => {
      const scoreboard = new Scoreboard(2, 1, [
        { inning: 1, homeRuns: 2, awayRuns: 1 },
      ]);

      expect(Object.isFrozen(scoreboard.inningScores)).toBe(true);
    });
  });
});
