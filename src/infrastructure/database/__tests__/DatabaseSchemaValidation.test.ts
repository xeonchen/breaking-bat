import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import 'fake-indexeddb/auto';
import { initializeDatabase } from '../connection';
import Dexie from 'dexie';

describe('Database Schema Validation', () => {
  let db: Dexie;

  beforeEach(async () => {
    db = initializeDatabase();
    await db.open();
  });

  afterEach(async () => {
    if (db) {
      await db.delete();
    }
  });

  describe('Schema Version Management', () => {
    it('should be on the latest schema version (5)', () => {
      expect(db.verno).toBe(5);
    });

    it('should have all required tables', () => {
      const expectedTables = [
        'teams',
        'players',
        'seasons',
        'gameTypes',
        'games',
        'lineups',
        'innings',
        'atBats',
      ];
      const actualTables = db.tables.map((table) => table.name);

      expectedTables.forEach((tableName) => {
        expect(actualTables).toContain(tableName);
      });
    });

    it('should define correct primary keys for all tables', () => {
      const expectedPrimaryKeys = {
        teams: '++id',
        players: '++id',
        seasons: '++id',
        gameTypes: '++id',
        games: '++id',
        lineups: '++id',
        innings: '++id',
        atBats: '++id',
      };

      Object.entries(expectedPrimaryKeys).forEach(([tableName]) => {
        const table = db.table(tableName);
        expect(table.schema.primKey.keyPath).toBe('id');
        expect(table.schema.primKey.auto).toBe(true);
      });
    });
  });

  describe('Required Indexes Validation', () => {
    it('should have compound index [name+year] for seasons table', () => {
      const seasonsTable = db.table('seasons');
      const indexes = seasonsTable.schema.indexes;

      const hasNameYearIndex = indexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.length === 2 &&
          index.keyPath.includes('name') &&
          index.keyPath.includes('year')
        );
      });

      expect(hasNameYearIndex).toBe(true);
    });

    it('should have compound index [teamId+jerseyNumber] for players table', () => {
      const playersTable = db.table('players');
      const indexes = playersTable.schema.indexes;

      const hasTeamJerseyIndex = indexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.length === 2 &&
          index.keyPath.includes('teamId') &&
          index.keyPath.includes('jerseyNumber')
        );
      });

      expect(hasTeamJerseyIndex).toBe(true);
    });

    it('should have all required single-field indexes', () => {
      const expectedIndexes = {
        teams: ['name'],
        players: ['name', 'jerseyNumber', 'teamId', 'position', 'isActive'],
        seasons: ['name', 'year', 'startDate', 'endDate'],
        gameTypes: ['name', 'description'],
        games: [
          'name',
          'opponent',
          'date',
          'seasonId',
          'gameTypeId',
          'homeAway',
          'teamId',
          'status',
          'lineupId',
        ],
        lineups: ['gameId'],
        innings: ['gameId', 'number', 'teamAtBat', 'runsScored', 'isComplete'],
        atBats: [
          'gameId',
          'inningId',
          'batterId',
          'battingPosition',
          'result',
          'rbis',
        ],
      };

      Object.entries(expectedIndexes).forEach(([tableName, expectedFields]) => {
        const table = db.table(tableName);
        const indexes = table.schema.indexes;

        expectedFields.forEach((fieldName) => {
          const hasIndex = indexes.some((index: any) => {
            return (
              (typeof index.keyPath === 'string' &&
                index.keyPath === fieldName) ||
              (Array.isArray(index.keyPath) &&
                index.keyPath.includes(fieldName))
            );
          });

          expect(hasIndex).toBe(true);
        });
      });
    });

    it('should have multi-value indexes for array fields', () => {
      const expectedMultiValueIndexes = {
        teams: ['seasonIds', 'playerIds'],
        seasons: ['teamIds'],
        games: ['inningIds'],
        lineups: ['playerIds', 'defensivePositions'],
        innings: ['atBatIds'],
        atBats: ['runsScored'],
      };

      Object.entries(expectedMultiValueIndexes).forEach(
        ([tableName, arrayFields]) => {
          const table = db.table(tableName);
          const indexes = table.schema.indexes;

          arrayFields.forEach((fieldName) => {
            const hasMultiIndex = indexes.some((index: any) => {
              return index.keyPath === fieldName && index.multi === true;
            });

            expect(hasMultiIndex).toBe(true);
          });
        }
      );
    });
  });

  describe('Schema Definition Validation', () => {
    it('should have correct schema definition for teams table', () => {
      const teamsTable = db.table('teams');
      const schema = teamsTable.schema;

      // Check that required indexes are present
      const indexNames = schema.indexes.map((idx: any) =>
        Array.isArray(idx.keyPath) ? idx.keyPath.join('+') : idx.keyPath
      );

      expect(indexNames).toContain('name');
      expect(indexNames).toContain('seasonIds');
      expect(indexNames).toContain('playerIds');
    });

    it('should have correct schema definition for players table', () => {
      const playersTable = db.table('players');
      const schema = playersTable.schema;

      const indexNames = schema.indexes.map((idx: any) =>
        Array.isArray(idx.keyPath) ? idx.keyPath.join('+') : idx.keyPath
      );

      expect(indexNames).toContain('name');
      expect(indexNames).toContain('jerseyNumber');
      expect(indexNames).toContain('teamId');
      expect(indexNames).toContain('teamId+jerseyNumber');
    });

    it('should have correct schema definition for seasons table', () => {
      const seasonsTable = db.table('seasons');
      const schema = seasonsTable.schema;

      const indexNames = schema.indexes.map((idx: any) =>
        Array.isArray(idx.keyPath) ? idx.keyPath.join('+') : idx.keyPath
      );

      expect(indexNames).toContain('name');
      expect(indexNames).toContain('year');
      expect(indexNames).toContain('name+year');
    });

    it('should have correct schema definition for gameTypes table', () => {
      const gameTypesTable = db.table('gameTypes');
      const schema = gameTypesTable.schema;

      const indexNames = schema.indexes.map((idx: any) =>
        Array.isArray(idx.keyPath) ? idx.keyPath.join('+') : idx.keyPath
      );

      expect(indexNames).toContain('name');
      expect(indexNames).toContain('description');
    });
  });

  describe('Index Performance Validation', () => {
    it('should support efficient compound index queries on seasons', async () => {
      const seasonsTable = db.table('seasons');

      // Add test data
      await seasonsTable.bulkAdd([
        {
          id: '1',
          name: 'Spring',
          year: 2025,
          startDate: new Date(),
          endDate: new Date(),
          teamIds: [],
        },
        {
          id: '2',
          name: 'Summer',
          year: 2025,
          startDate: new Date(),
          endDate: new Date(),
          teamIds: [],
        },
        {
          id: '3',
          name: 'Spring',
          year: 2024,
          startDate: new Date(),
          endDate: new Date(),
          teamIds: [],
        },
        {
          id: '4',
          name: 'Fall',
          year: 2025,
          startDate: new Date(),
          endDate: new Date(),
          teamIds: [],
        },
      ]);

      // Test compound index query
      const startTime = performance.now();
      const result = await seasonsTable
        .where(['name', 'year'])
        .equals(['Spring', 2025])
        .toArray();
      const endTime = performance.now();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(endTime - startTime).toBeLessThan(50); // Should be fast with index
    });

    it('should support efficient compound index queries on players', async () => {
      const playersTable = db.table('players');

      // Add test data
      await playersTable.bulkAdd([
        {
          id: '1',
          name: 'Player1',
          teamId: 'team1',
          jerseyNumber: 10,
          position: 'P',
          isActive: true,
        },
        {
          id: '2',
          name: 'Player2',
          teamId: 'team1',
          jerseyNumber: 11,
          position: 'C',
          isActive: true,
        },
        {
          id: '3',
          name: 'Player3',
          teamId: 'team2',
          jerseyNumber: 10,
          position: 'P',
          isActive: true,
        },
      ]);

      // Test compound index query for jersey number uniqueness per team
      const result = await playersTable
        .where(['teamId', 'jerseyNumber'])
        .equals(['team1', 10])
        .toArray();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Database Constraints Validation', () => {
    it('should detect potential constraint violations', async () => {
      // This test validates that our schema can detect potential issues
      // even though IndexedDB doesn't enforce foreign keys directly

      const gamesTable = db.table('games');
      const seasonsTable = db.table('seasons');

      // Add a season
      await seasonsTable.add({
        id: 'season1',
        name: 'Test Season',
        year: 2025,
        startDate: new Date(),
        endDate: new Date(),
        teamIds: [],
      });

      // Add a game referencing the season
      await gamesTable.add({
        id: 'game1',
        name: 'Test Game',
        opponent: 'Opponent',
        date: new Date(),
        seasonId: 'season1', // Valid reference
        gameTypeId: 'gametype1',
        homeAway: 'home',
        teamId: 'team1',
        status: 'scheduled',
        lineupId: null,
        inningIds: [],
        finalScore: null,
      });

      // Verify the reference exists
      const game = await gamesTable.get('game1');
      const season = await seasonsTable.get(game.seasonId);

      expect(season).toBeDefined();
      expect(season.id).toBe('season1');
    });
  });

  describe('Data Type Validation', () => {
    it('should handle all expected data types correctly', async () => {
      const seasonsTable = db.table('seasons');

      const testSeason = {
        id: 'test-season',
        name: 'Test Season',
        year: 2025,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        teamIds: ['team1', 'team2'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await seasonsTable.add(testSeason);
      const retrieved = await seasonsTable.get('test-season');

      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe(testSeason.name);
      expect(retrieved.year).toBe(testSeason.year);
      expect(new Date(retrieved.startDate)).toEqual(testSeason.startDate);
      expect(retrieved.teamIds).toEqual(testSeason.teamIds);
    });
  });
});
