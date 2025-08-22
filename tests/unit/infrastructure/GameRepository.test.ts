import { Game, GameRepository, GameScore, Scoreboard } from '@/domain';
import { IndexedDBGameRepository } from '@/infrastructure/repositories/IndexedDBGameRepository';
import {
  clearTestDatabase,
  createTestDatabase,
} from '../../test-helpers/database';

describe('GameRepository', () => {
  let repository: GameRepository;
  let testGame: Game;

  beforeEach(async () => {
    await createTestDatabase();
    repository = new IndexedDBGameRepository();

    testGame = new Game(
      'game1',
      'Season Opener',
      'Red Sox',
      new Date('2024-04-01T14:00:00'),
      'season1',
      'regular',
      'home',
      'team1',
      'setup', // status
      null, // lineupId
      [], // inningIds
      null // scoreboard
    );
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('save', () => {
    it('should save a new game', async () => {
      const savedGame = await repository.save(testGame);

      expect(savedGame.id).toBe(testGame.id);
      expect(savedGame.name).toBe('Season Opener');
      expect(savedGame.opponent).toBe('Red Sox');
      expect(savedGame.homeAway).toBe('home');
      expect(savedGame.status).toBe('setup');
    });

    it('should update an existing game', async () => {
      await repository.save(testGame);

      const startedGame = testGame.start('lineup1');
      const savedGame = await repository.save(startedGame);

      expect(savedGame.status).toBe('in_progress');
      expect(savedGame.lineupId).toBe('lineup1');
      expect(savedGame.updatedAt).not.toBe(testGame.updatedAt);
    });

    it('should save game with final score', async () => {
      const finalScore: GameScore = {
        homeScore: 7,
        awayScore: 4,
        inningScores: [
          { inning: 1, homeRuns: 2, awayRuns: 1 },
          { inning: 2, homeRuns: 1, awayRuns: 0 },
          { inning: 3, homeRuns: 4, awayRuns: 3 },
        ],
      };

      const startedGame = testGame.start('lineup1');
      const finalScoreboard = Scoreboard.fromGameScore(finalScore);
      const completedGame = startedGame.complete(finalScoreboard);
      const savedGame = await repository.save(completedGame);

      expect(savedGame.status).toBe('completed');
      expect(savedGame.scoreboard?.homeScore).toBe(7);
      expect(savedGame.scoreboard?.awayScore).toBe(4);
    });
  });

  describe('findById', () => {
    it('should find game by id', async () => {
      await repository.save(testGame);

      const foundGame = await repository.findById('game1');

      expect(foundGame).not.toBeNull();
      expect(foundGame?.name).toBe('Season Opener');
    });

    it('should return null when game not found', async () => {
      const foundGame = await repository.findById('nonexistent');

      expect(foundGame).toBeNull();
    });
  });

  describe('findByTeamId', () => {
    it('should find all games for a team', async () => {
      const game2 = new Game(
        'game2',
        'Away Game',
        'Yankees',
        new Date('2024-04-08'),
        'season1',
        'regular',
        'away',
        'team1'
      );
      const game3 = new Game(
        'game3',
        'Other Team Game',
        'Dodgers',
        new Date('2024-04-15'),
        'season1',
        'regular',
        'home',
        'team2'
      );

      await repository.save(testGame);
      await repository.save(game2);
      await repository.save(game3);

      const team1Games = await repository.findByTeamId('team1');

      expect(team1Games).toHaveLength(2);
      expect(team1Games.map((g) => g.name)).toContain('Season Opener');
      expect(team1Games.map((g) => g.name)).toContain('Away Game');
    });

    it('should return empty array when no games found for team', async () => {
      const games = await repository.findByTeamId('nonexistent');

      expect(games).toEqual([]);
    });
  });

  describe('findBySeasonId', () => {
    it('should find all games in a season', async () => {
      const game2 = new Game(
        'game2',
        'Game 2',
        'Yankees',
        new Date('2024-04-08'),
        'season1',
        'regular',
        'away',
        'team1'
      );
      const game3 = new Game(
        'game3',
        'Different Season',
        'Dodgers',
        new Date('2024-04-15'),
        'season2',
        'regular',
        'home',
        'team1'
      );

      await repository.save(testGame);
      await repository.save(game2);
      await repository.save(game3);

      const season1Games = await repository.findBySeasonId('season1');

      expect(season1Games).toHaveLength(2);
      expect(season1Games.map((g) => g.name)).toContain('Season Opener');
      expect(season1Games.map((g) => g.name)).toContain('Game 2');
    });
  });

  describe('findByStatus', () => {
    it('should find games by status', async () => {
      // Create a separate game for in-progress status to avoid ID conflicts
      const inProgressGame = new Game(
        'game-in-progress',
        'In Progress Game',
        'Pirates',
        new Date('2024-03-02'),
        'season1',
        'regular',
        'home',
        'team1',
        'in_progress', // status
        'lineup-1', // lineupId - required for in_progress games
        [], // inningIds
        null // scoreboard
      );
      const completedGame = new Game(
        'game2',
        'Completed Game',
        'Yankees',
        new Date('2024-03-01'),
        'season1',
        'regular',
        'home',
        'team1',
        'completed', // status
        'lineup-1', // lineupId
        [], // inningIds
        new Scoreboard(5, 3) // scoreboard - required for completed games
      );

      await repository.save(testGame); // setup
      await repository.save(inProgressGame); // in_progress
      await repository.save(completedGame); // completed

      const setupGames = await repository.findByStatus('setup');
      const inProgressGames = await repository.findByStatus('in_progress');
      const completedGames = await repository.findByStatus('completed');

      expect(setupGames).toHaveLength(1);
      expect(inProgressGames).toHaveLength(1);
      expect(completedGames).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('should find games within date range', async () => {
      const game2 = new Game(
        'game2',
        'Early Game',
        'Yankees',
        new Date('2024-03-15'),
        'season1',
        'regular',
        'away',
        'team1'
      );
      const game3 = new Game(
        'game3',
        'Late Game',
        'Dodgers',
        new Date('2024-05-15'),
        'season1',
        'regular',
        'home',
        'team1'
      );

      await repository.save(testGame); // 2024-04-01
      await repository.save(game2); // 2024-03-15
      await repository.save(game3); // 2024-05-15

      const aprilGames = await repository.findByDateRange(
        new Date('2024-04-01T00:00:00.000Z'),
        new Date('2024-04-30T23:59:59.999Z')
      );

      expect(aprilGames).toHaveLength(1);
      expect(aprilGames[0].name).toBe('Season Opener');
    });

    it('should return empty array when no games in range', async () => {
      await repository.save(testGame);

      const games = await repository.findByDateRange(
        new Date('2024-05-01'),
        new Date('2024-05-31')
      );

      expect(games).toEqual([]);
    });
  });

  describe('findActiveGames', () => {
    it('should find only active games (in_progress)', async () => {
      const inProgressGame = new Game(
        'game-in-progress',
        'In Progress Game',
        'Pirates',
        new Date('2024-03-02'),
        'season1',
        'regular',
        'home',
        'team1',
        'in_progress', // status
        'lineup-1', // lineupId - required for in_progress games
        [], // inningIds
        null // scoreboard
      );
      const suspendedGame = new Game(
        'game-suspended',
        'Suspended Game',
        'Cardinals',
        new Date('2024-03-03'),
        'season1',
        'regular',
        'away',
        'team1',
        'suspended'
      );
      const completedGame = new Game(
        'game2',
        'Completed Game',
        'Yankees',
        new Date('2024-03-01'),
        'season1',
        'regular',
        'home',
        'team1',
        'completed',
        'lineup-2', // lineupId required for completed games
        [], // inningIds
        new Scoreboard(5, 3) // scoreboard required for completed games
      );

      await repository.save(testGame); // setup
      await repository.save(inProgressGame); // in_progress
      await repository.save(suspendedGame); // suspended
      await repository.save(completedGame); // completed

      const activeGames = await repository.findActiveGames();

      expect(activeGames).toHaveLength(1);
      expect(activeGames[0].status).toBe('in_progress');
    });
  });

  describe('delete', () => {
    it('should delete game by id', async () => {
      await repository.save(testGame);

      await repository.delete('game1');

      const foundGame = await repository.findById('game1');
      expect(foundGame).toBeNull();
    });

    it('should not throw error when deleting nonexistent game', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('addInning', () => {
    it('should add inning to game', async () => {
      const startedGame = testGame.start('lineup1');
      await repository.save(startedGame);

      const updatedGame = await repository.addInning('game1', 'inning1');

      expect(updatedGame.inningIds).toContain('inning1');
      expect(updatedGame.inningIds).toHaveLength(1);
    });

    it('should throw error when adding inning to nonexistent game', async () => {
      await expect(
        repository.addInning('nonexistent', 'inning1')
      ).rejects.toThrow('Game with id nonexistent not found');
    });

    it('should throw error when adding inning to non-active game', async () => {
      await repository.save(testGame); // status: setup

      await expect(repository.addInning('game1', 'inning1')).rejects.toThrow(
        'Can only add innings to in-progress games'
      );
    });
  });

  describe('updateScore', () => {
    it('should update game final score', async () => {
      await repository.save(testGame);

      const finalScore: GameScore = {
        homeScore: 8,
        awayScore: 5,
        inningScores: [
          { inning: 1, homeRuns: 3, awayRuns: 2 },
          { inning: 2, homeRuns: 5, awayRuns: 3 },
        ],
      };

      const updatedGame = await repository.updateScore('game1', finalScore);

      expect(updatedGame.scoreboard?.homeScore).toBe(8);
      expect(updatedGame.scoreboard?.awayScore).toBe(5);
      expect(updatedGame.scoreboard?.toGameScore().inningScores).toHaveLength(
        2
      );
    });

    it('should throw error when updating score of nonexistent game', async () => {
      const score: GameScore = {
        homeScore: 1,
        awayScore: 0,
        inningScores: [],
      };

      await expect(
        repository.updateScore('nonexistent', score)
      ).rejects.toThrow('Game with id nonexistent not found');
    });
  });

  describe('search', () => {
    it('should search games by name', async () => {
      const game2 = new Game(
        'game2',
        'Season Finale',
        'Yankees',
        new Date('2024-09-01'),
        'season1',
        'regular',
        'home',
        'team1'
      );
      const game3 = new Game(
        'game3',
        'Playoff Game',
        'Dodgers',
        new Date('2024-10-01'),
        'season1',
        'playoff',
        'away',
        'team1'
      );

      await repository.save(testGame);
      await repository.save(game2);
      await repository.save(game3);

      const seasonResults = await repository.search('Season');

      expect(seasonResults).toHaveLength(2);
      expect(seasonResults.map((g) => g.name)).toContain('Season Opener');
      expect(seasonResults.map((g) => g.name)).toContain('Season Finale');
    });

    it('should search games by opponent', async () => {
      const game2 = new Game(
        'game2',
        'Away Game',
        'Red Sox',
        new Date('2024-04-08'),
        'season1',
        'regular',
        'away',
        'team1'
      );

      await repository.save(testGame);
      await repository.save(game2);

      const redSoxGames = await repository.search('Red Sox');

      expect(redSoxGames).toHaveLength(2);
    });

    it('should return empty array when no matches found', async () => {
      await repository.save(testGame);

      const results = await repository.search('Nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle case insensitive search', async () => {
      await repository.save(testGame);

      const results = await repository.search('opener');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Season Opener');
    });
  });

  describe('getGameStatistics', () => {
    it('should calculate basic game statistics', async () => {
      const completedGame = new Game(
        'game1',
        'Test Game',
        'Red Sox',
        new Date('2024-04-01'),
        'season1',
        'regular',
        'home',
        'team1',
        'completed',
        'lineup1',
        ['inning1', 'inning2'],
        new Scoreboard(7, 4, [
          { inning: 1, homeRuns: 3, awayRuns: 2 },
          { inning: 2, homeRuns: 4, awayRuns: 2 },
        ])
      );

      await repository.save(completedGame);

      const stats = await repository.getGameStatistics('game1');

      expect(stats.totalRuns).toBe(11);
      expect(stats.ourScore).toBe(7);
      expect(stats.opponentScore).toBe(4);
      expect(stats.result).toBe('W');
      expect(stats.inningsPlayed).toBe(2);
    });

    it('should throw error for nonexistent game', async () => {
      await expect(repository.getGameStatistics('nonexistent')).rejects.toThrow(
        'Game with id nonexistent not found'
      );
    });
  });
});
