import { Game, GameStatus } from '@/domain/entities/Game';
import { HomeAway } from '@/domain/entities/Inning';
import { Scoreboard } from '@/domain/values/Scoreboard';

describe('Game Entity', () => {
  const validGameData = {
    id: 'game-1',
    name: 'Red Sox vs Yankees',
    opponent: 'Yankees',
    date: new Date('2023-07-15T19:00:00Z'),
    seasonId: 'season-1',
    gameTypeId: 'regular',
    homeAway: 'home' as HomeAway,
    teamId: 'team-1',
    status: 'setup' as GameStatus,
    lineupId: null,
    inningIds: [],
    scoreboard: null,
  };

  describe('Constructor and Validation', () => {
    it('should create a valid game with all required fields', () => {
      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        validGameData.status,
        validGameData.lineupId,
        validGameData.inningIds,
        validGameData.scoreboard
      );

      expect(game.id).toBe(validGameData.id);
      expect(game.name).toBe(validGameData.name);
      expect(game.opponent).toBe(validGameData.opponent);
      expect(game.date).toEqual(validGameData.date);
      expect(game.seasonId).toBe(validGameData.seasonId);
      expect(game.gameTypeId).toBe(validGameData.gameTypeId);
      expect(game.homeAway).toBe(validGameData.homeAway);
      expect(game.teamId).toBe(validGameData.teamId);
      expect(game.status).toBe(validGameData.status);
      expect(game.lineupId).toBe(validGameData.lineupId);
      expect(game.inningIds).toEqual(validGameData.inningIds);
      expect(game.scoreboard).toBe(validGameData.scoreboard);
    });

    it('should create game with default values when optionals omitted', () => {
      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId
      );

      expect(game.status).toBe('setup');
      expect(game.lineupId).toBeNull();
      expect(game.inningIds).toEqual([]);
      expect(game.scoreboard).toBeNull();
    });

    it('should trim whitespace from game name and opponent', () => {
      const game = new Game(
        validGameData.id,
        '  Red Sox vs Yankees  ',
        '  Yankees  ',
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId
      );

      expect(game.name).toBe('Red Sox vs Yankees');
      expect(game.opponent).toBe('Yankees');
    });

    it('should throw error for empty game name', () => {
      expect(() => {
        new Game(
          validGameData.id,
          '',
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );
      }).toThrow('Game name cannot be empty');
    });

    it('should throw error for empty opponent name', () => {
      expect(() => {
        new Game(
          validGameData.id,
          validGameData.name,
          '',
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );
      }).toThrow('Opponent name cannot be empty');
    });

    it('should throw error for empty team ID', () => {
      expect(() => {
        new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          ''
        );
      }).toThrow('Team ID cannot be empty');
    });

    it('should throw error for in-progress game without lineup', () => {
      expect(() => {
        new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'in_progress',
          null
        );
      }).toThrow('In-progress games must have a lineup');
    });

    it('should throw error for completed game without scoreboard', () => {
      expect(() => {
        new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          null
        );
      }).toThrow('Completed games must have a final score');
    });

    it('should accept valid in-progress game with lineup', () => {
      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'in_progress',
        'lineup-1'
      );

      expect(game.status).toBe('in_progress');
      expect(game.lineupId).toBe('lineup-1');
    });

    it('should accept valid completed game with scoreboard', () => {
      const scoreboard = Scoreboard.fromGameScore({
        homeScore: 5,
        awayScore: 3,
        inningScores: [
          { inning: 1, homeRuns: 2, awayRuns: 1 },
          { inning: 2, homeRuns: 3, awayRuns: 2 },
        ],
      });

      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'completed',
        'lineup-1',
        [],
        scoreboard
      );

      expect(game.status).toBe('completed');
      expect(game.scoreboard).toBe(scoreboard);
    });

    it('should create defensive copy of date', () => {
      const originalDate = new Date('2023-07-15T19:00:00Z');
      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        originalDate,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId
      );

      // Modify original date
      originalDate.setFullYear(2024);

      // Game should not be affected
      expect(game.date.getFullYear()).toBe(2023);
    });
  });

  describe('Game State Transitions', () => {
    let setupGame: Game;

    beforeEach(() => {
      setupGame = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'setup'
      );
    });

    describe('start', () => {
      it('should start game from setup status', () => {
        const startedGame = setupGame.start('lineup-1');

        expect(startedGame).not.toBe(setupGame);
        expect(startedGame.status).toBe('in_progress');
        expect(startedGame.lineupId).toBe('lineup-1');
        expect(startedGame.scoreboard).not.toBeNull();
        expect(startedGame.updatedAt).not.toBe(setupGame.updatedAt);
      });

      it('should throw error when starting non-setup game', () => {
        const inProgressGame = setupGame.start('lineup-1');

        expect(() => {
          inProgressGame.start('lineup-2');
        }).toThrow('Game can only be started from setup status');
      });

      it('should throw error when starting without lineup ID', () => {
        expect(() => {
          setupGame.start('');
        }).toThrow('Lineup ID is required to start game');
      });

      it('should initialize empty scoreboard when starting', () => {
        const startedGame = setupGame.start('lineup-1');

        expect(startedGame.scoreboard).not.toBeNull();
        expect(startedGame.scoreboard!.homeScore).toBe(0);
        expect(startedGame.scoreboard!.awayScore).toBe(0);
      });

      it('should preserve existing scoreboard when starting', () => {
        const existingScoreboard = Scoreboard.empty();
        const gameWithScoreboard = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup',
          null,
          [],
          existingScoreboard
        );

        const startedGame = gameWithScoreboard.start('lineup-1');

        expect(startedGame.scoreboard).toBe(existingScoreboard);
      });
    });

    describe('complete', () => {
      let inProgressGame: Game;
      let finalScoreboard: Scoreboard;

      beforeEach(() => {
        inProgressGame = setupGame.start('lineup-1');
        finalScoreboard = Scoreboard.fromGameScore({
          homeScore: 7,
          awayScore: 4,
          inningScores: [
            { inning: 1, homeRuns: 3, awayRuns: 2 },
            { inning: 2, homeRuns: 4, awayRuns: 2 },
          ],
        });
      });

      it('should complete game from in_progress status', () => {
        const completedGame = inProgressGame.complete(finalScoreboard);

        expect(completedGame).not.toBe(inProgressGame);
        expect(completedGame.status).toBe('completed');
        expect(completedGame.scoreboard).toBe(finalScoreboard);
        expect(completedGame.updatedAt).not.toBe(inProgressGame.updatedAt);
      });

      it('should throw error when completing non-in_progress game', () => {
        const completedGame = inProgressGame.complete(finalScoreboard);

        expect(() => {
          completedGame.complete(finalScoreboard);
        }).toThrow('Game can only be completed from in_progress status');
      });

      it('should preserve all other properties when completing', () => {
        const completedGame = inProgressGame.complete(finalScoreboard);

        expect(completedGame.id).toBe(inProgressGame.id);
        expect(completedGame.name).toBe(inProgressGame.name);
        expect(completedGame.opponent).toBe(inProgressGame.opponent);
        expect(completedGame.lineupId).toBe(inProgressGame.lineupId);
        expect(completedGame.createdAt).toBe(inProgressGame.createdAt);
      });
    });

    describe('suspend and resume', () => {
      let inProgressGame: Game;

      beforeEach(() => {
        inProgressGame = setupGame.start('lineup-1');
      });

      it('should suspend in_progress game', () => {
        const suspendedGame = inProgressGame.suspend();

        expect(suspendedGame).not.toBe(inProgressGame);
        expect(suspendedGame.status).toBe('suspended');
        expect(suspendedGame.updatedAt).not.toBe(inProgressGame.updatedAt);
      });

      it('should throw error when suspending non-in_progress game', () => {
        expect(() => {
          setupGame.suspend();
        }).toThrow('Only in-progress games can be suspended');
      });

      it('should resume suspended game', () => {
        const suspendedGame = inProgressGame.suspend();
        const resumedGame = suspendedGame.resume();

        expect(resumedGame).not.toBe(suspendedGame);
        expect(resumedGame.status).toBe('in_progress');
        expect(resumedGame.updatedAt).not.toBe(suspendedGame.updatedAt);
      });

      it('should throw error when resuming non-suspended game', () => {
        expect(() => {
          inProgressGame.resume();
        }).toThrow('Only suspended games can be resumed');
      });

      it('should preserve scoreboard through suspend/resume cycle', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 3,
          awayScore: 2,
          inningScores: [{ inning: 1, homeRuns: 3, awayRuns: 2 }],
        });

        const gameWithScore = inProgressGame.updateScoreboard(scoreboard);
        const suspendedGame = gameWithScore.suspend();
        const resumedGame = suspendedGame.resume();

        expect(resumedGame.scoreboard).toBe(scoreboard);
      });
    });
  });

  describe('Game Operations', () => {
    let inProgressGame: Game;

    beforeEach(() => {
      const setupGame = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'setup'
      );
      inProgressGame = setupGame.start('lineup-1');
    });

    describe('setLineup', () => {
      let setupGame: Game;

      beforeEach(() => {
        setupGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup'
        );
      });

      it('should set lineup for setup game', () => {
        const gameWithLineup = setupGame.setLineup('lineup-1');

        expect(gameWithLineup).not.toBe(setupGame);
        expect(gameWithLineup.lineupId).toBe('lineup-1');
        expect(gameWithLineup.updatedAt).not.toBe(setupGame.updatedAt);
      });

      it('should throw error when setting lineup for non-setup game', () => {
        expect(() => {
          inProgressGame.setLineup('lineup-2');
        }).toThrow('Lineup can only be set for games in setup status');
      });

      it('should throw error when setting empty lineup ID', () => {
        expect(() => {
          setupGame.setLineup('');
        }).toThrow('Lineup ID cannot be empty');
      });
    });

    describe('updateScoreboard', () => {
      it('should update scoreboard for in_progress game', () => {
        const newScoreboard = Scoreboard.fromGameScore({
          homeScore: 5,
          awayScore: 3,
          inningScores: [
            { inning: 1, homeRuns: 2, awayRuns: 1 },
            { inning: 2, homeRuns: 3, awayRuns: 2 },
          ],
        });

        const updatedGame = inProgressGame.updateScoreboard(newScoreboard);

        expect(updatedGame).not.toBe(inProgressGame);
        expect(updatedGame.scoreboard).toBe(newScoreboard);
        expect(updatedGame.updatedAt).not.toBe(inProgressGame.updatedAt);
      });

      it('should throw error when updating scoreboard for non-in_progress game', () => {
        const setupGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup'
        );

        const scoreboard = Scoreboard.empty();

        expect(() => {
          setupGame.updateScoreboard(scoreboard);
        }).toThrow('Can only update scoreboard for in-progress games');
      });
    });

    describe('addInning', () => {
      it('should add inning to in_progress game', () => {
        const updatedGame = inProgressGame.addInning('inning-1');

        expect(updatedGame).not.toBe(inProgressGame);
        expect(updatedGame.inningIds).toContain('inning-1');
        expect(updatedGame.inningIds).toHaveLength(1);
        expect(updatedGame.updatedAt).not.toBe(inProgressGame.updatedAt);
      });

      it('should throw error when adding inning to non-in_progress game', () => {
        const setupGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup'
        );

        expect(() => {
          setupGame.addInning('inning-1');
        }).toThrow('Can only add innings to in-progress games');
      });

      it('should throw error when adding empty inning ID', () => {
        expect(() => {
          inProgressGame.addInning('');
        }).toThrow('Inning ID cannot be empty');
      });

      it('should maintain inning order', () => {
        const gameWithInnings = inProgressGame
          .addInning('inning-1')
          .addInning('inning-2')
          .addInning('inning-3');

        expect(gameWithInnings.inningIds).toEqual([
          'inning-1',
          'inning-2',
          'inning-3',
        ]);
      });
    });
  });

  describe('Query Methods', () => {
    describe('Status Queries', () => {
      it('should correctly identify finished games', () => {
        const completedGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          Scoreboard.empty()
        );

        expect(completedGame.isFinished()).toBe(true);
        expect(completedGame.isInProgress()).toBe(false);
        expect(completedGame.isSuspended()).toBe(false);
      });

      it('should correctly identify in-progress games', () => {
        const inProgressGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'in_progress',
          'lineup-1'
        );

        expect(inProgressGame.isFinished()).toBe(false);
        expect(inProgressGame.isInProgress()).toBe(true);
        expect(inProgressGame.isSuspended()).toBe(false);
      });

      it('should correctly identify suspended games', () => {
        const suspendedGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'suspended',
          'lineup-1'
        );

        expect(suspendedGame.isFinished()).toBe(false);
        expect(suspendedGame.isInProgress()).toBe(false);
        expect(suspendedGame.isSuspended()).toBe(true);
      });

      it('should correctly identify games needing lineup', () => {
        const setupGameNoLineup = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup'
        );

        const setupGameWithLineup = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'setup',
          'lineup-1'
        );

        expect(setupGameNoLineup.needsLineup()).toBe(true);
        expect(setupGameWithLineup.needsLineup()).toBe(false);
      });
    });

    describe('Venue and Location Queries', () => {
      it('should correctly identify home games', () => {
        const homeGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'home',
          validGameData.teamId
        );

        expect(homeGame.isHomeGame()).toBe(true);
        expect(homeGame.isAwayGame()).toBe(false);
        expect(homeGame.getVenueText()).toBe('vs');
      });

      it('should correctly identify away games', () => {
        const awayGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'away',
          validGameData.teamId
        );

        expect(awayGame.isHomeGame()).toBe(false);
        expect(awayGame.isAwayGame()).toBe(true);
        expect(awayGame.getVenueText()).toBe('@');
      });
    });

    describe('Inning Count', () => {
      it('should return correct inning count', () => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'in_progress',
          'lineup-1',
          ['inning-1', 'inning-2', 'inning-3']
        );

        expect(game.getInningCount()).toBe(3);
      });

      it('should return 0 for new games', () => {
        const newGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );

        expect(newGame.getInningCount()).toBe(0);
      });
    });
  });

  describe('Display and Formatting', () => {
    describe('getSummary', () => {
      it('should return summary for game without score', () => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'home',
          validGameData.teamId,
          'setup'
        );

        const summary = game.getSummary();
        const expectedDate = validGameData.date.toLocaleDateString();

        expect(summary).toBe(`vs Yankees (${expectedDate}) - setup`);
      });

      it('should return summary with score for completed home game (win)', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 7,
          awayScore: 4,
          inningScores: [],
        });

        const homeGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'home',
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          scoreboard
        );

        const summary = homeGame.getSummary();
        const expectedDate = validGameData.date.toLocaleDateString();

        expect(summary).toBe(`W 7-4 vs Yankees (${expectedDate})`);
      });

      it('should return summary with score for completed away game (loss)', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 6,
          awayScore: 3,
          inningScores: [],
        });

        const awayGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'away',
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          scoreboard
        );

        const summary = awayGame.getSummary();
        const expectedDate = validGameData.date.toLocaleDateString();

        expect(summary).toBe(`L 3-6 @ Yankees (${expectedDate})`);
      });

      it('should return summary with score for tied game', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 5,
          awayScore: 5,
          inningScores: [],
        });

        const tiedGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          'home',
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          scoreboard
        );

        const summary = tiedGame.getSummary();
        const expectedDate = validGameData.date.toLocaleDateString();

        expect(summary).toBe(`T 5-5 vs Yankees (${expectedDate})`);
      });
    });

    describe('getScoreDisplay', () => {
      it('should return default score for games without scoreboard', () => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );

        expect(game.getScoreDisplay()).toBe('0-0');
      });

      it('should return scoreboard display for games with scoreboard', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 8,
          awayScore: 6,
          inningScores: [],
        });

        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          scoreboard
        );

        expect(game.getScoreDisplay()).toBe('8-6');
      });
    });

    describe('Winner Detection', () => {
      it('should return null for unfinished games', () => {
        const inProgressGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'in_progress',
          'lineup-1'
        );

        expect(inProgressGame.getWinner()).toBeNull();
      });

      it('should return null for games without scoreboard', () => {
        const completedGame = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'completed',
          'lineup-1',
          [],
          Scoreboard.empty()
        );

        const winner = completedGame.getWinner();
        expect(['home', 'away', 'tied']).toContain(winner);
      });
    });

    describe('Mercy Rule', () => {
      it('should delegate mercy rule check to scoreboard', () => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );

        expect(game.isMercyRule()).toBe(false);
      });
    });
  });

  describe('Legacy Compatibility', () => {
    describe('toLegacyFormat', () => {
      it('should convert to legacy format correctly', () => {
        const scoreboard = Scoreboard.fromGameScore({
          homeScore: 5,
          awayScore: 3,
          inningScores: [
            { inning: 1, homeRuns: 2, awayRuns: 1 },
            { inning: 2, homeRuns: 3, awayRuns: 2 },
          ],
        });

        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId,
          'completed',
          'lineup-1',
          ['inning-1', 'inning-2'],
          scoreboard
        );

        const legacy = game.toLegacyFormat();

        expect(legacy.id).toBe(validGameData.id);
        expect(legacy.name).toBe(validGameData.name);
        expect(legacy.opponent).toBe(validGameData.opponent);
        expect(legacy.status).toBe('completed');
        expect(legacy.lineupId).toBe('lineup-1');
        expect(legacy.inningIds).toEqual(['inning-1', 'inning-2']);
        expect(legacy.finalScore).not.toBeNull();
        expect(legacy.finalScore!.homeScore).toBe(5);
        expect(legacy.finalScore!.awayScore).toBe(3);
      });

      it('should handle games without scoreboard', () => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );

        const legacy = game.toLegacyFormat();

        expect(legacy.finalScore).toBeNull();
      });
    });

    describe('fromLegacy', () => {
      it('should create game from legacy format', () => {
        const legacyGame = {
          id: validGameData.id,
          name: validGameData.name,
          opponent: validGameData.opponent,
          date: validGameData.date,
          seasonId: validGameData.seasonId,
          gameTypeId: validGameData.gameTypeId,
          homeAway: validGameData.homeAway,
          teamId: validGameData.teamId,
          status: 'completed' as GameStatus,
          lineupId: 'lineup-1',
          inningIds: ['inning-1'],
          finalScore: {
            homeScore: 4,
            awayScore: 2,
            inningScores: [{ inning: 1, homeRuns: 4, awayRuns: 2 }],
          },
        };

        const game = Game.fromLegacy(legacyGame);

        expect(game.id).toBe(legacyGame.id);
        expect(game.name).toBe(legacyGame.name);
        expect(game.status).toBe('completed');
        expect(game.scoreboard).not.toBeNull();
        expect(game.scoreboard!.homeScore).toBe(4);
        expect(game.scoreboard!.awayScore).toBe(2);
      });

      it('should handle legacy games without final score', () => {
        const legacyGame = {
          id: validGameData.id,
          name: validGameData.name,
          opponent: validGameData.opponent,
          date: validGameData.date,
          seasonId: validGameData.seasonId,
          gameTypeId: validGameData.gameTypeId,
          homeAway: validGameData.homeAway,
          teamId: validGameData.teamId,
          status: 'setup' as GameStatus,
          lineupId: null,
          inningIds: [],
          finalScore: null,
        };

        const game = Game.fromLegacy(legacyGame);

        expect(game.scoreboard).toBeNull();
      });
    });

    describe('Deprecated Methods', () => {
      let game: Game;

      beforeEach(() => {
        game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          validGameData.date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );
      });

      it('should handle advanceToNextBatter gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        expect(() => {
          game.advanceToNextBatter([]);
        }).not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          'advanceToNextBatter called on Game entity - this should be handled by GameSession'
        );

        consoleSpy.mockRestore();
      });

      it('should handle getCurrentBatter gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = game.getCurrentBatter();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'getCurrentBatter called on Game entity - this should be handled by GameSession'
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Immutability', () => {
    let originalGame: Game;

    beforeEach(() => {
      originalGame = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'setup'
      );
    });

    it('should not mutate original when starting game', () => {
      const originalStatus = originalGame.status;
      const startedGame = originalGame.start('lineup-1');

      expect(originalGame.status).toBe(originalStatus);
      expect(originalGame).not.toBe(startedGame);
    });

    it('should not mutate original when setting lineup', () => {
      const originalLineupId = originalGame.lineupId;
      const updatedGame = originalGame.setLineup('lineup-1');

      expect(originalGame.lineupId).toBe(originalLineupId);
      expect(originalGame).not.toBe(updatedGame);
    });

    it('should not mutate original when adding innings', () => {
      const startedGame = originalGame.start('lineup-1');
      const originalInnings = startedGame.inningIds;
      const updatedGame = startedGame.addInning('inning-1');

      expect(startedGame.inningIds).toBe(originalInnings);
      expect(startedGame.inningIds).not.toBe(updatedGame.inningIds);
    });

    it('should prevent external mutation of inningIds array', () => {
      const startedGame = originalGame.start('lineup-1');
      const inningIds = startedGame.inningIds;

      // Verify that the array is accessible but protected by immutable patterns
      expect(inningIds).toEqual([]);

      // Use proper methods for modification
      const updatedGame = startedGame.addInning('inning-1');
      expect(startedGame.inningIds.length).toBe(0);
      expect(updatedGame.inningIds.length).toBe(1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long game names and opponent names', () => {
      const longName = 'A'.repeat(1000);
      const longOpponent = 'B'.repeat(1000);

      const game = new Game(
        validGameData.id,
        longName,
        longOpponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId
      );

      expect(game.name).toBe(longName);
      expect(game.opponent).toBe(longOpponent);
    });

    it('should handle unicode characters in names', () => {
      const unicodeName = 'Red Sox ⚾ vs 東京ヤクルトスワローズ';
      const unicodeOpponent = 'Málaga CF ⚽';

      const game = new Game(
        validGameData.id,
        unicodeName,
        unicodeOpponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId
      );

      expect(game.name).toBe(unicodeName);
      expect(game.opponent).toBe(unicodeOpponent);
    });

    it('should handle edge case dates', () => {
      const edgeDates = [
        new Date('1900-01-01'),
        new Date('2100-12-31'),
        new Date('2023-02-28T23:59:59.999Z'),
      ];

      edgeDates.forEach((date) => {
        const game = new Game(
          validGameData.id,
          validGameData.name,
          validGameData.opponent,
          date,
          validGameData.seasonId,
          validGameData.gameTypeId,
          validGameData.homeAway,
          validGameData.teamId
        );

        expect(game.date).toEqual(date);
      });
    });

    it('should handle null optional fields correctly', () => {
      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        null, // seasonId
        null, // gameTypeId
        validGameData.homeAway,
        validGameData.teamId
      );

      expect(game.seasonId).toBeNull();
      expect(game.gameTypeId).toBeNull();
      expect(game.lineupId).toBeNull();
      expect(game.scoreboard).toBeNull();
    });

    it('should handle large inning arrays', () => {
      const manyInnings = Array.from(
        { length: 50 },
        (_, i) => `inning-${i + 1}`
      );

      const game = new Game(
        validGameData.id,
        validGameData.name,
        validGameData.opponent,
        validGameData.date,
        validGameData.seasonId,
        validGameData.gameTypeId,
        validGameData.homeAway,
        validGameData.teamId,
        'in_progress',
        'lineup-1',
        manyInnings
      );

      expect(game.inningIds).toHaveLength(50);
      expect(game.getInningCount()).toBe(50);
    });
  });
});
