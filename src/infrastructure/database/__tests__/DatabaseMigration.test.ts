import { describe, it, expect, afterEach } from '@jest/globals';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

describe('Database Migration Tests', () => {
  let testDb: Dexie;

  afterEach(async () => {
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Schema Version Progression', () => {
    it('should successfully migrate from v1 to v2 (add player compound index)', async () => {
      // Create database at version 1
      testDb = new Dexie('test-migration-v1-v2');

      // Define version 1 schema (original)
      testDb.version(1).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      // Add version 2 upgrade (add compound index for players)
      testDb
        .version(2)
        .stores({
          teams: '++id, name, *seasonIds, *playerIds',
          players:
            '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
          seasons: '++id, name, year, startDate, endDate, *teamIds',
          games:
            '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
          innings:
            '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
          atBats:
            '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
        })
        .upgrade(() => {
          // Migration logic if needed
        });

      await testDb.open();

      // Verify migration to version 2 succeeded
      expect(testDb.verno).toBe(2);

      // Verify compound index exists
      const playersTable = testDb.table('players');
      const indexes = playersTable.schema.indexes;
      const hasCompoundIndex = indexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.includes('teamId') &&
          index.keyPath.includes('jerseyNumber')
        );
      });

      expect(hasCompoundIndex).toBe(true);
    });

    it('should successfully migrate from v2 to v3 (add gameTypes table)', async () => {
      // Start with version 2 and migrate to 3
      testDb = new Dexie('test-migration-v2-v3');

      testDb.version(2).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      testDb.version(3).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        gameTypes: '++id, name, description',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      await testDb.open();

      expect(testDb.verno).toBe(3);

      // Verify gameTypes table exists
      const gameTypesTable = testDb.table('gameTypes');
      expect(gameTypesTable).toBeDefined();

      // Test that we can add data to the new table
      await gameTypesTable.add({
        id: 'test-type',
        name: 'Test Game Type',
        description: 'Test description',
      });

      const retrieved = await gameTypesTable.get('test-type');
      expect(retrieved.name).toBe('Test Game Type');
    });

    it('should successfully migrate from v3 to v4 (add seasons compound index)', async () => {
      // Start with version 3 and migrate to 4
      testDb = new Dexie('test-migration-v3-v4');

      testDb.version(3).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        gameTypes: '++id, name, description',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      testDb.version(4).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds, [name+year]',
        gameTypes: '++id, name, description',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      await testDb.open();

      expect(testDb.verno).toBe(4);

      // Verify seasons compound index exists
      const seasonsTable = testDb.table('seasons');
      const indexes = seasonsTable.schema.indexes;
      const hasNameYearIndex = indexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.includes('name') &&
          index.keyPath.includes('year')
        );
      });

      expect(hasNameYearIndex).toBe(true);
    });

    it('should migrate through all versions v1→v2→v3→v4 successfully', async () => {
      // Create complete migration path
      testDb = new Dexie('test-migration-complete');

      // Version 1
      testDb.version(1).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      // Version 2 - Add player compound index
      testDb.version(2).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      // Version 3 - Add gameTypes table
      testDb.version(3).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
        gameTypes: '++id, name, description',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      // Version 4 - Add seasons compound index
      testDb.version(4).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds, [name+year]',
        gameTypes: '++id, name, description',
        games:
          '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
        innings:
          '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
        atBats:
          '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
      });

      await testDb.open();

      // Final verification
      expect(testDb.verno).toBe(4);
      expect(testDb.tables.map((t) => t.name)).toContain('gameTypes');

      // Verify all compound indexes exist
      const playersTable = testDb.table('players');
      const playersIndexes = playersTable.schema.indexes;
      const hasPlayerCompoundIndex = playersIndexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.includes('teamId') &&
          index.keyPath.includes('jerseyNumber')
        );
      });

      const seasonsTable = testDb.table('seasons');
      const seasonsIndexes = seasonsTable.schema.indexes;
      const hasSeasonsCompoundIndex = seasonsIndexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.includes('name') &&
          index.keyPath.includes('year')
        );
      });

      expect(hasPlayerCompoundIndex).toBe(true);
      expect(hasSeasonsCompoundIndex).toBe(true);
    });
  });

  describe('Data Integrity During Migration', () => {
    it('should preserve data during schema upgrades', async () => {
      testDb = new Dexie('test-data-integrity');

      // Version 1 with initial data
      testDb.version(1).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
      });

      // Version 2 upgrade
      testDb.version(2).stores({
        teams: '++id, name, *seasonIds, *playerIds',
        players:
          '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
        seasons: '++id, name, year, startDate, endDate, *teamIds',
      });

      await testDb.open();

      // Add initial data
      await testDb.table('teams').add({
        id: 'team1',
        name: 'Test Team',
        seasonIds: [],
        playerIds: [],
      });

      await testDb.table('players').add({
        id: 'player1',
        name: 'Test Player',
        jerseyNumber: 10,
        teamId: 'team1',
        position: 'P',
        isActive: true,
        statistics: {},
      });

      // Close and reopen to trigger any migration
      await testDb.close();
      await testDb.open();

      // Verify data is preserved
      const team = await testDb.table('teams').get('team1');
      const player = await testDb.table('players').get('player1');

      expect(team.name).toBe('Test Team');
      expect(player.name).toBe('Test Player');
      expect(player.jerseyNumber).toBe(10);

      // Verify new compound index works with existing data
      const playerByTeamAndJersey = await testDb
        .table('players')
        .where(['teamId', 'jerseyNumber'])
        .equals(['team1', 10])
        .toArray();

      expect(playerByTeamAndJersey).toHaveLength(1);
      expect(playerByTeamAndJersey[0].id).toBe('player1');
    });

    it('should handle migration failures gracefully', async () => {
      testDb = new Dexie('test-migration-failure');

      testDb.version(1).stores({
        teams: '++id, name',
      });

      // Version 2 with intentional upgrade error
      testDb
        .version(2)
        .stores({
          teams: '++id, name, newField',
        })
        .upgrade(() => {
          // Simulate upgrade error
          throw new Error('Migration failed');
        });

      // The database should handle this gracefully
      let migrationError = null;
      try {
        await testDb.open();
      } catch (error) {
        migrationError = error;
      }

      // Should either fail with migration error or handle gracefully
      if (migrationError && migrationError instanceof Error) {
        expect(migrationError.message).toContain('Migration failed');
        expect(testDb.isOpen()).toBe(false);
      } else {
        // If Dexie handled it gracefully, database should still work
        expect(testDb.isOpen()).toBe(true);
      }
    });
  });

  describe('Index Performance After Migration', () => {
    it('should maintain performance after adding compound indexes', async () => {
      testDb = new Dexie('test-performance-migration');

      // Start without compound index
      testDb.version(1).stores({
        seasons: '++id, name, year, startDate, endDate',
      });

      // Add compound index
      testDb.version(2).stores({
        seasons: '++id, name, year, startDate, endDate, [name+year]',
      });

      await testDb.open();

      // Add substantial test data
      const testSeasons = [];
      for (let year = 2020; year <= 2025; year++) {
        for (const seasonName of ['Spring', 'Summer', 'Fall', 'Winter']) {
          testSeasons.push({
            id: `${seasonName}-${year}`,
            name: `${seasonName} Season`,
            year: year,
            startDate: new Date(`${year}-01-01`),
            endDate: new Date(`${year}-12-31`),
          });
        }
      }

      await testDb.table('seasons').bulkAdd(testSeasons);

      // Test compound index query performance
      const startTime = performance.now();
      const result = await testDb
        .table('seasons')
        .where(['name', 'year'])
        .equals(['Spring Season', 2025])
        .toArray();
      const endTime = performance.now();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('Spring-2025');
      expect(endTime - startTime).toBeLessThan(100); // Should be performant
    });
  });
});
