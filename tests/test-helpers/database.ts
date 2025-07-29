import Dexie from 'dexie';

// Test database instance
let testDb: Dexie;

/**
 * Create a test database instance for testing
 */
export async function createTestDatabase(): Promise<void> {
  // Use a unique database name for each test
  const dbName = `test-breaking-bat-${Date.now()}-${Math.random()}`;

  testDb = new Dexie(dbName);

  // Define database schema matching the production schema
  testDb.version(1).stores({
    teams: '++id, name, *seasonIds, *playerIds',
    players: '++id, name, jerseyNumber, teamId, position, isActive, statistics',
    seasons: '++id, name, year, startDate, endDate, *teamIds',
    games:
      '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
    innings:
      '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
    atBats:
      '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
  });

  await testDb.open();
}

/**
 * Clear the test database and close the connection
 */
export async function clearTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.delete();
    testDb.close();
  }
}

/**
 * Get the current test database instance
 */
export function getTestDatabase(): Dexie {
  if (!testDb) {
    throw new Error(
      'Test database not initialized. Call createTestDatabase() first.'
    );
  }
  return testDb;
}

/**
 * Clear all data from test database tables without deleting the database
 */
export async function clearTestData(): Promise<void> {
  if (!testDb) return;

  await testDb.transaction('rw', testDb.tables, async () => {
    for (const table of testDb.tables) {
      await table.clear();
    }
  });
}
