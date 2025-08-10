import Dexie from 'dexie';

// Production database instance
let productionDb: Dexie | null = null;

/**
 * Initialize the production database
 */
export function initializeDatabase(): Dexie {
  if (productionDb) {
    return productionDb;
  }

  productionDb = new Dexie('breaking-bat');

  console.log('🗄️ Initializing IndexedDB schema...');

  // Define database schema - Version 1 (original)
  productionDb.version(1).stores({
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

  // Version 2 - Add compound index for jersey number uniqueness per team
  productionDb
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
      console.log(
        '🔄 Upgrading database to version 2 - adding compound index for players'
      );
      // No data migration needed, just index addition in schema
    });

  // Version 3 - Add gameTypes table
  productionDb
    .version(3)
    .stores({
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
    })
    .upgrade(() => {
      console.log(
        '🔄 Upgrading database to version 3 - adding gameTypes table'
      );
      // No data migration needed, just new table
    });

  // Version 4 - Add compound index for seasons [name+year]
  productionDb
    .version(4)
    .stores({
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
    })
    .upgrade(() => {
      console.log(
        '🔄 Upgrading database to version 4 - adding compound index [name+year] for seasons'
      );
      // No data migration needed, just index addition in schema
    });

  // Version 5 - Add lineups table for proper lineup storage
  productionDb
    .version(5)
    .stores({
      teams: '++id, name, *seasonIds, *playerIds',
      players:
        '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
      seasons: '++id, name, year, startDate, endDate, *teamIds, [name+year]',
      gameTypes: '++id, name, description',
      games:
        '++id, name, opponent, date, seasonId, gameTypeId, homeAway, teamId, status, lineupId, *inningIds, finalScore',
      lineups: '++id, gameId, *playerIds, *defensivePositions',
      innings:
        '++id, gameId, number, teamAtBat, runsScored, *atBatIds, isComplete',
      atBats:
        '++id, gameId, inningId, batterId, battingPosition, result, rbis, *runsScored, baserunnersBefore, baserunnersAfter',
    })
    .upgrade(() => {
      console.log('🔄 Upgrading database to version 5 - adding lineups table');
      // No data migration needed, just new table
    });

  return productionDb;
}

/**
 * Get the current database instance
 */
export function getDatabase(): Dexie {
  if (!productionDb) {
    return initializeDatabase();
  }
  return productionDb;
}
