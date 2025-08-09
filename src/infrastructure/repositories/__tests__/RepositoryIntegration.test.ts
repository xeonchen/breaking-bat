import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import 'fake-indexeddb/auto';
import { IndexedDBSeasonRepository } from '../IndexedDBSeasonRepository';
import { IndexedDBTeamRepository } from '../IndexedDBTeamRepository';
import { IndexedDBPlayerRepository } from '../IndexedDBPlayerRepository';
import { IndexedDBGameTypeRepository } from '../IndexedDBGameTypeRepository';
import { IndexedDBGameRepository } from '../IndexedDBGameRepository';
import { Season, Team, Player, GameType, Game } from '@/domain/entities';
import { Position } from '@/domain/values';
import { getDatabase } from '../../database/connection';

describe('Repository Integration Tests with Real IndexedDB', () => {
  let seasonRepository: IndexedDBSeasonRepository;
  let teamRepository: IndexedDBTeamRepository;
  let playerRepository: IndexedDBPlayerRepository;
  let gameTypeRepository: IndexedDBGameTypeRepository;
  let gameRepository: IndexedDBGameRepository;
  let testDb: any;

  beforeEach(async () => {
    // Initialize all repositories
    seasonRepository = new IndexedDBSeasonRepository();
    teamRepository = new IndexedDBTeamRepository();
    playerRepository = new IndexedDBPlayerRepository();
    gameTypeRepository = new IndexedDBGameTypeRepository();
    gameRepository = new IndexedDBGameRepository();

    testDb = getDatabase();
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Compound Index Operations', () => {
    it('should enforce unique combinations using compound indexes', async () => {
      // Test seasons compound index [name+year]
      const season1 = new Season(
        's1',
        'Spring Season',
        2025,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      const season2 = new Season(
        's2',
        'Summer Season',
        2025,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      const season3 = new Season(
        's3',
        'Spring Season',
        2024,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      ); // Different year

      await seasonRepository.save(season1);
      await seasonRepository.save(season2);
      await seasonRepository.save(season3);

      // Test compound index queries
      const spring2025Exists = await seasonRepository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      const spring2024Exists = await seasonRepository.existsByNameAndYear(
        'Spring Season',
        2024
      );
      const winter2025Exists = await seasonRepository.existsByNameAndYear(
        'Winter Season',
        2025
      );

      expect(spring2025Exists).toBe(true);
      expect(spring2024Exists).toBe(true);
      expect(winter2025Exists).toBe(false);
    });

    it('should enforce unique jersey numbers per team using compound index', async () => {
      // Create a team first
      const team = new Team('team1', 'Test Team');
      await teamRepository.save(team);

      // Create players with unique jersey numbers per team
      const player1 = new Player('p1', 'Player 1', 10, 'team1', [
        Position.pitcher(),
      ]);
      const player2 = new Player('p2', 'Player 2', 11, 'team1', [
        Position.catcher(),
      ]);
      const player3 = new Player('p3', 'Player 3', 10, 'team2', [
        Position.pitcher(),
      ]); // Same jersey, different team

      await playerRepository.save(player1);
      await playerRepository.save(player2);
      await playerRepository.save(player3);

      // Test compound index queries for jersey uniqueness
      const existsTeam1Jersey10 = await playerRepository.existsByTeamAndJersey(
        'team1',
        10
      );
      const existsTeam1Jersey11 = await playerRepository.existsByTeamAndJersey(
        'team1',
        11
      );
      const existsTeam2Jersey10 = await playerRepository.existsByTeamAndJersey(
        'team2',
        10
      );
      const existsTeam1Jersey99 = await playerRepository.existsByTeamAndJersey(
        'team1',
        99
      );

      expect(existsTeam1Jersey10).toBe(true);
      expect(existsTeam1Jersey11).toBe(true);
      expect(existsTeam2Jersey10).toBe(true);
      expect(existsTeam1Jersey99).toBe(false);
    });
  });

  describe('Cross-Repository Operations', () => {
    it('should maintain referential integrity across repositories', async () => {
      // Create a season
      const season = new Season(
        'season1',
        'Test Season',
        2025,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      await seasonRepository.save(season);

      // Create a game type
      const gameType = new GameType(
        'gametype1',
        'Regular Season',
        'Standard game'
      );
      await gameTypeRepository.save(gameType);

      // Create a team
      const team = new Team('team1', 'Test Team');
      await teamRepository.save(team);

      // Create a game that references the season, game type, and team
      const game = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season1',
        'gametype1',
        'home',
        'team1'
      );
      await gameRepository.save(game);

      // Verify all relationships exist
      const savedGame = await gameRepository.findById('game1');
      const referencedSeason = savedGame?.seasonId
        ? await seasonRepository.findById(savedGame.seasonId)
        : null;
      const referencedGameType = savedGame?.gameTypeId
        ? await gameTypeRepository.findById(savedGame.gameTypeId)
        : null;
      const referencedTeam = await teamRepository.findById(savedGame!.teamId);

      expect(savedGame).toBeDefined();
      expect(referencedSeason).toBeDefined();
      expect(referencedGameType).toBeDefined();
      expect(referencedTeam).toBeDefined();

      expect(referencedSeason!.name).toBe('Test Season');
      expect(referencedGameType!.name).toBe('Regular Season');
      expect(referencedTeam!.name).toBe('Test Team');
    });

    it('should handle complex queries across multiple repositories', async () => {
      // Create test data
      const season = new Season(
        'season1',
        '2025 Season',
        2025,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      await seasonRepository.save(season);

      const team = new Team('team1', 'Test Team');
      await teamRepository.save(team);

      // Create multiple games for the season and team
      const games = [
        new Game(
          'g1',
          'Game 1',
          'Opponent A',
          new Date(),
          'season1',
          'gt1',
          'home',
          'team1'
        ),
        new Game(
          'g2',
          'Game 2',
          'Opponent B',
          new Date(),
          'season1',
          'gt1',
          'away',
          'team1'
        ),
        new Game(
          'g3',
          'Game 3',
          'Opponent C',
          new Date(),
          'season2',
          'gt1',
          'home',
          'team1'
        ), // Different season
      ];

      for (const game of games) {
        await gameRepository.save(game);
      }

      // Query games by season
      const gamesInSeason1 = await gameRepository.findBySeasonId('season1');
      const gamesInSeason2 = await gameRepository.findBySeasonId('season2');

      expect(gamesInSeason1).toHaveLength(2);
      expect(gamesInSeason2).toHaveLength(1);

      // Verify the season reference still exists
      const seasonStillExists = await seasonRepository.findById('season1');
      expect(seasonStillExists).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous saves correctly', async () => {
      // Create multiple seasons concurrently
      const seasons = Array.from(
        { length: 10 },
        (_, i) =>
          new Season(
            `season${i}`,
            `Season ${i}`,
            2025,
            new Date('2025-01-01'),
            new Date('2025-12-31')
          )
      );

      // Save all seasons concurrently
      await Promise.all(seasons.map((season) => seasonRepository.save(season)));

      // Verify all were saved
      const allSeasons = await seasonRepository.findAll();
      expect(allSeasons).toHaveLength(10);

      // Verify each season exists
      for (let i = 0; i < 10; i++) {
        const season = await seasonRepository.findById(`season${i}`);
        expect(season).toBeDefined();
        expect(season!.name).toBe(`Season ${i}`);
      }
    });

    it('should handle concurrent compound index queries correctly', async () => {
      // Add test data
      await seasonRepository.save(
        new Season(
          's1',
          'Spring',
          2025,
          new Date('2025-01-01'),
          new Date('2025-12-31')
        )
      );
      await seasonRepository.save(
        new Season(
          's2',
          'Summer',
          2025,
          new Date('2025-01-01'),
          new Date('2025-12-31')
        )
      );
      await seasonRepository.save(
        new Season(
          's3',
          'Fall',
          2025,
          new Date('2025-01-01'),
          new Date('2025-12-31')
        )
      );

      // Perform multiple concurrent compound index queries
      const queries = [
        seasonRepository.existsByNameAndYear('Spring', 2025),
        seasonRepository.existsByNameAndYear('Summer', 2025),
        seasonRepository.existsByNameAndYear('Fall', 2025),
        seasonRepository.existsByNameAndYear('Winter', 2025),
        seasonRepository.existsByNameAndYear('Spring', 2024),
      ];

      const results = await Promise.all(queries);

      expect(results[0]).toBe(true); // Spring 2025
      expect(results[1]).toBe(true); // Summer 2025
      expect(results[2]).toBe(true); // Fall 2025
      expect(results[3]).toBe(false); // Winter 2025 (doesn't exist)
      expect(results[4]).toBe(false); // Spring 2024 (doesn't exist)
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency during complex operations', async () => {
      // Create a team and add players to it
      const team = new Team('team1', 'Test Team');
      await teamRepository.save(team);

      const players = [
        new Player('p1', 'Player 1', 1, 'team1', [Position.pitcher()]),
        new Player('p2', 'Player 2', 2, 'team1', [Position.catcher()]),
        new Player('p3', 'Player 3', 3, 'team1', [Position.firstBase()]),
      ];

      // Save all players
      for (const player of players) {
        await playerRepository.save(player);
      }

      // Update team to reference players
      const updatedTeam = team.addPlayer('p1').addPlayer('p2').addPlayer('p3');
      await teamRepository.save(updatedTeam);

      // Verify consistency
      const savedTeam = await teamRepository.findById('team1');
      expect(savedTeam!.playerIds).toHaveLength(3);
      expect(savedTeam!.playerIds).toContain('p1');
      expect(savedTeam!.playerIds).toContain('p2');
      expect(savedTeam!.playerIds).toContain('p3');

      // Verify all players exist and reference the correct team
      for (const playerId of savedTeam!.playerIds) {
        const player = await playerRepository.findById(playerId);
        expect(player).toBeDefined();
        expect(player!.teamId).toBe('team1');
      }
    });

    it('should handle cascade operations correctly', async () => {
      // Create a season with teams
      const season = new Season(
        'season1',
        'Test Season',
        2025,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      await seasonRepository.save(season);

      const team = new Team('team1', 'Test Team');
      await teamRepository.save(team);

      // Add team to season and season to team (bidirectional relationship)
      const updatedSeason = season.addTeam('team1');
      await seasonRepository.save(updatedSeason);

      const updatedTeamWithSeason = team.addSeason('season1');
      await teamRepository.save(updatedTeamWithSeason);

      // Create players for the team
      const players = [
        new Player('p1', 'Player 1', 1, 'team1', [Position.pitcher()]),
        new Player('p2', 'Player 2', 2, 'team1', [Position.catcher()]),
      ];

      for (const player of players) {
        await playerRepository.save(player);
      }

      // Update team with players (using the updated team that has the season)
      const updatedTeamWithPlayers = updatedTeamWithSeason
        .addPlayer('p1')
        .addPlayer('p2');
      await teamRepository.save(updatedTeamWithPlayers);

      // Verify the full relationship chain
      const savedSeason = await seasonRepository.findById('season1');
      expect(savedSeason!.teamIds).toContain('team1');

      const savedTeam = await teamRepository.findById('team1');
      expect(savedTeam!.playerIds).toHaveLength(2);

      // Verify we can query relationships
      const teamsInSeason = await teamRepository.findBySeasonId('season1');
      expect(teamsInSeason).toHaveLength(1);
      expect(teamsInSeason[0].id).toBe('team1');

      const playersInTeam = await playerRepository.findByTeamId('team1');
      expect(playersInTeam).toHaveLength(2);
    });
  });

  describe('Performance with Real Database', () => {
    it('should perform indexed queries efficiently with large datasets', async () => {
      // Create a large dataset
      const seasons = [];
      for (let year = 2000; year <= 2025; year++) {
        for (const name of ['Spring', 'Summer', 'Fall', 'Winter']) {
          seasons.push(
            new Season(
              `${name}-${year}`,
              `${name} Season`,
              year,
              new Date(`${year}-01-01`),
              new Date(`${year}-12-31`)
            )
          );
        }
      }

      // Save all seasons (100+ seasons)
      await Promise.all(seasons.map((season) => seasonRepository.save(season)));

      // Perform compound index query and measure performance
      const startTime = performance.now();
      const springSeasons2025 = await seasonRepository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      const endTime = performance.now();

      expect(springSeasons2025).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with compound index

      // Test range query performance
      const startTime2 = performance.now();
      const allSpringSeasons = await seasonRepository.findByYear(2025);
      const endTime2 = performance.now();

      expect(allSpringSeasons.length).toBeGreaterThan(0);
      expect(endTime2 - startTime2).toBeLessThan(100); // Should be fast with year index
    });

    it('should handle bulk operations efficiently', async () => {
      // Create bulk data
      const teams = Array.from(
        { length: 50 },
        (_, i) => new Team(`team${i}`, `Team ${i}`)
      );

      const players = [];
      for (let teamIndex = 0; teamIndex < 50; teamIndex++) {
        for (let playerIndex = 0; playerIndex < 20; playerIndex++) {
          players.push(
            new Player(
              `p${teamIndex}-${playerIndex}`,
              `Player ${playerIndex}`,
              playerIndex + 1,
              `team${teamIndex}`,
              [Position.pitcher()]
            )
          );
        }
      }

      // Measure bulk save performance
      const startTime = performance.now();

      await Promise.all(teams.map((team) => teamRepository.save(team)));
      await Promise.all(players.map((player) => playerRepository.save(player)));

      const endTime = performance.now();

      // Verify data was saved
      const allTeams = await teamRepository.findAll();
      const allPlayers = await playerRepository.findAll();

      expect(allTeams).toHaveLength(50);
      expect(allPlayers).toHaveLength(1000); // 50 teams × 20 players

      // Performance should be reasonable for bulk operations
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
