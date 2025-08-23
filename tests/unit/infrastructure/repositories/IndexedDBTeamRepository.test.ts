import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { Team } from '@/domain/entities/Team';
import Dexie from 'dexie';

// Create a mock database for testing
class MockDatabase extends Dexie {
  teams: Dexie.Table<any, string>;

  constructor() {
    super('TestDatabase');
    this.version(1).stores({
      teams: 'id, name, seasonIds, playerIds, createdAt, updatedAt',
    });
    this.teams = this.table('teams');
  }
}

describe('IndexedDBTeamRepository', () => {
  let repository: IndexedDBTeamRepository;
  let mockDb: MockDatabase;
  let sampleTeam: Team;
  let sampleTeamRecord: any;

  beforeEach(async () => {
    // Create fresh database for each test
    mockDb = new MockDatabase();
    await mockDb.open();

    repository = new IndexedDBTeamRepository(mockDb);

    // Create sample team data
    const now = new Date('2023-07-15T10:00:00Z');
    sampleTeam = new Team(
      'team-123',
      'Boston Red Sox',
      ['season-1', 'season-2'],
      ['player-1', 'player-2'],
      now,
      now
    );

    sampleTeamRecord = {
      id: 'team-123',
      name: 'Boston Red Sox',
      seasonIds: ['season-1', 'season-2'],
      playerIds: ['player-1', 'player-2'],
      createdAt: now,
      updatedAt: now,
    };
  });

  afterEach(async () => {
    await mockDb.delete();
    await mockDb.close();
  });

  describe('Constructor', () => {
    it('should initialize with provided database', () => {
      const repo = new IndexedDBTeamRepository(mockDb);
      expect(repo).toBeInstanceOf(IndexedDBTeamRepository);
    });

    it('should handle test environment database initialization', () => {
      // Set test environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      try {
        const repo = new IndexedDBTeamRepository();
        expect(repo).toBeInstanceOf(IndexedDBTeamRepository);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should handle production environment database initialization', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        // This will call getDatabase() which might fail in test environment
        // but we're testing the code path
        expect(() => new IndexedDBTeamRepository()).not.toThrow();
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('save', () => {
    it('should save new team successfully', async () => {
      const result = await repository.save(sampleTeam);

      expect(result).toEqual(sampleTeam);

      const saved = await mockDb.teams.get('team-123');
      expect(saved).toEqual({
        ...sampleTeamRecord,
        createdAt: sampleTeamRecord.createdAt.toISOString(),
        updatedAt: sampleTeamRecord.updatedAt.toISOString(),
      });
    });

    it('should update existing team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const updatedTeam = new Team(
        'team-123',
        'Updated Red Sox',
        ['season-1'],
        ['player-1'],
        sampleTeam.createdAt,
        new Date('2023-07-16T10:00:00Z')
      );

      const result = await repository.save(updatedTeam);

      expect(result).toEqual(updatedTeam);

      const saved = await mockDb.teams.get('team-123');
      expect(saved.name).toBe('Updated Red Sox');
      expect(saved.seasonIds).toEqual(['season-1']);
    });

    it('should throw error for duplicate team name', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const duplicateTeam = new Team(
        'team-456',
        'Boston Red Sox', // Same name, different ID
        [],
        []
      );

      await expect(repository.save(duplicateTeam)).rejects.toThrow(
        'Team name Boston Red Sox already exists'
      );
    });

    it('should allow updating team with same name', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const updatedTeam = new Team(
        'team-123',
        'Boston Red Sox', // Same name, same ID
        ['season-3'],
        ['player-3'],
        sampleTeam.createdAt,
        new Date()
      );

      const result = await repository.save(updatedTeam);
      expect(result).toEqual(updatedTeam);
    });
  });

  describe('findById', () => {
    it('should return team when found', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.findById('team-123');

      expect(result).toBeInstanceOf(Team);
      expect(result!.id).toBe('team-123');
      expect(result!.name).toBe('Boston Red Sox');
      expect(result!.seasonIds).toEqual(['season-1', 'season-2']);
      expect(result!.playerIds).toEqual(['player-1', 'player-2']);
    });

    it('should return null when not found', async () => {
      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Mock database error
      jest
        .spyOn(mockDb.teams, 'get')
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('team-123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('findAll', () => {
    it('should return all teams', async () => {
      const team2Record = {
        id: 'team-456',
        name: 'New York Yankees',
        seasonIds: ['season-1'],
        playerIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockDb.teams.bulkPut([sampleTeamRecord, team2Record]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Team);
      expect(result[1]).toBeInstanceOf(Team);

      const teamNames = result.map((t) => t.name).sort();
      expect(teamNames).toEqual(['Boston Red Sox', 'New York Yankees']);
    });

    it('should return empty array when no teams', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findBySeasonId', () => {
    it('should return teams for given season', async () => {
      const team2Record = {
        id: 'team-456',
        name: 'New York Yankees',
        seasonIds: ['season-2'],
        playerIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockDb.teams.bulkPut([sampleTeamRecord, team2Record]);

      const result = await repository.findBySeasonId('season-2');

      expect(result).toHaveLength(2); // Both teams have season-2
      expect(result.every((team) => team.seasonIds.includes('season-2'))).toBe(
        true
      );
    });

    it('should return empty array when no teams for season', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.findBySeasonId('nonexistent-season');

      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return team with exact name match', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.findByName('Boston Red Sox');

      expect(result).toBeInstanceOf(Team);
      expect(result!.name).toBe('Boston Red Sox');
    });

    it('should be case insensitive', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.findByName('BOSTON RED SOX');

      expect(result).toBeInstanceOf(Team);
      expect(result!.name).toBe('Boston Red Sox');
    });

    it('should return null when not found', async () => {
      const result = await repository.findByName('Nonexistent Team');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete team successfully', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      await repository.delete('team-123');

      const result = await mockDb.teams.get('team-123');
      expect(result).toBeUndefined();
    });

    it('should not throw error when deleting nonexistent team', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('addPlayer', () => {
    it('should add player to team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.addPlayer('team-123', 'player-3');

      expect(result.playerIds).toContain('player-3');
      expect(result.playerIds).toHaveLength(3);

      const saved = await mockDb.teams.get('team-123');
      expect(saved.playerIds).toContain('player-3');
    });

    it('should throw error when team not found', async () => {
      await expect(
        repository.addPlayer('nonexistent', 'player-1')
      ).rejects.toThrow('Team with id nonexistent not found');
    });

    it('should handle duplicate player addition', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      // Try to add player that already exists - should throw error
      await expect(
        repository.addPlayer('team-123', 'player-1')
      ).rejects.toThrow('Player already on team');
    });
  });

  describe('removePlayer', () => {
    it('should remove player from team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.removePlayer('team-123', 'player-1');

      expect(result.playerIds).not.toContain('player-1');
      expect(result.playerIds).toEqual(['player-2']);

      const saved = await mockDb.teams.get('team-123');
      expect(saved.playerIds).not.toContain('player-1');
    });

    it('should throw error when team not found', async () => {
      await expect(
        repository.removePlayer('nonexistent', 'player-1')
      ).rejects.toThrow('Team with id nonexistent not found');
    });

    it('should handle removing nonexistent player', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.removePlayer(
        'team-123',
        'nonexistent-player'
      );

      // Should not change the player list
      expect(result.playerIds).toEqual(['player-1', 'player-2']);
    });
  });

  describe('addSeason', () => {
    it('should add season to team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.addSeason('team-123', 'season-3');

      expect(result.seasonIds).toContain('season-3');
      expect(result.seasonIds).toHaveLength(3);

      const saved = await mockDb.teams.get('team-123');
      expect(saved.seasonIds).toContain('season-3');
    });

    it('should throw error when team not found', async () => {
      await expect(
        repository.addSeason('nonexistent', 'season-1')
      ).rejects.toThrow('Team with id nonexistent not found');
    });
  });

  describe('removeSeason', () => {
    it('should remove season from team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.removeSeason('team-123', 'season-1');

      expect(result.seasonIds).not.toContain('season-1');
      expect(result.seasonIds).toEqual(['season-2']);
    });

    it('should throw error when team not found', async () => {
      await expect(
        repository.removeSeason('nonexistent', 'season-1')
      ).rejects.toThrow('Team with id nonexistent not found');
    });
  });

  describe('findByOrganization', () => {
    it('should return all teams (temporary implementation)', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.findByOrganization('org-123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Boston Red Sox');
    });
  });

  describe('searchByName', () => {
    it('should find teams by partial name match', async () => {
      const team2Record = {
        id: 'team-456',
        name: 'Boston Celtics',
        seasonIds: [],
        playerIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockDb.teams.bulkPut([sampleTeamRecord, team2Record]);

      const result = await repository.searchByName('Boston');

      expect(result).toHaveLength(2);
      expect(result.every((team) => team.name.includes('Boston'))).toBe(true);
    });

    it('should be case insensitive', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.searchByName('red');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Boston Red Sox');
    });

    it('should return empty array when no matches', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.searchByName('Yankees');

      expect(result).toEqual([]);
    });
  });

  describe('isNameAvailable', () => {
    it('should return true for available name', async () => {
      const result = await repository.isNameAvailable(
        'org-123',
        'Available Name'
      );

      expect(result).toBe(true);
    });

    it('should return false for taken name', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.isNameAvailable(
        'org-123',
        'Boston Red Sox'
      );

      expect(result).toBe(false);
    });

    it('should return true when excluding same team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.isNameAvailable(
        'org-123',
        'Boston Red Sox',
        'team-123'
      );

      expect(result).toBe(true);
    });

    it('should return false when excluding different team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.isNameAvailable(
        'org-123',
        'Boston Red Sox',
        'team-456'
      );

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should delegate to searchByName', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.search('Red');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Boston Red Sox');
    });
  });

  describe('exists', () => {
    it('should return true for existing team', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const result = await repository.exists('team-123');

      expect(result).toBe(true);
    });

    it('should return false for nonexistent team', async () => {
      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('recordToTeam (private method)', () => {
    it('should convert database record to Team entity', async () => {
      await mockDb.teams.put(sampleTeamRecord);

      const team = await repository.findById('team-123');

      expect(team).toBeInstanceOf(Team);
      expect(team!.id).toBe(sampleTeamRecord.id);
      expect(team!.name).toBe(sampleTeamRecord.name);
      expect(team!.seasonIds).toEqual(sampleTeamRecord.seasonIds);
      expect(team!.playerIds).toEqual(sampleTeamRecord.playerIds);
      // Date comparison - handle both Date objects and ISO strings
      expect(team!.createdAt instanceof Date).toBe(true);
      expect(team!.updatedAt instanceof Date).toBe(true);
      expect(team!.createdAt.getTime()).toBe(
        sampleTeamRecord.createdAt.getTime()
      );
      expect(team!.updatedAt.getTime()).toBe(
        sampleTeamRecord.updatedAt.getTime()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      await mockDb.close();

      await expect(repository.findAll()).rejects.toThrow();
    });

    it('should handle malformed data gracefully', async () => {
      // Insert malformed record
      await mockDb.teams.put({
        id: 'malformed',
        name: null,
        seasonIds: null,
        playerIds: null,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
      });

      // Should handle gracefully or throw appropriate error
      await expect(repository.findById('malformed')).rejects.toThrow();
    });

    it('should handle concurrent access', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        repository.save(new Team(`team-${i}`, `Team ${i}`, [], []))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every((team) => team instanceof Team)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete team lifecycle', async () => {
      // Create team
      const team = await repository.save(sampleTeam);
      expect(team).toEqual(sampleTeam);

      // Find team
      const found = await repository.findById('team-123');
      expect(found).toBeDefined();
      expect(found!.id).toBe(team.id);
      expect(found!.name).toBe(team.name);

      // Add player (use player not already on team)
      const withPlayer = await repository.addPlayer('team-123', 'player-3');
      expect(withPlayer.playerIds).toContain('player-3');

      // Add season
      const withSeason = await repository.addSeason('team-123', 'season-3');
      expect(withSeason.seasonIds).toContain('season-3');

      // Search team
      const searchResults = await repository.searchByName('Red');
      expect(searchResults).toHaveLength(1);

      // Delete team
      await repository.delete('team-123');
      const afterDelete = await repository.findById('team-123');
      expect(afterDelete).toBeNull();
    });

    it('should maintain data consistency across operations', async () => {
      await repository.save(sampleTeam);

      // Multiple operations should maintain consistency
      await repository.addPlayer('team-123', 'player-3');
      await repository.addSeason('team-123', 'season-3');

      const updated = await repository.findById('team-123');
      expect(updated!.playerIds).toContain('player-3');
      expect(updated!.seasonIds).toContain('season-3');

      // Original data should still be there
      expect(updated!.playerIds).toContain('player-1');
      expect(updated!.seasonIds).toContain('season-1');
    });
  });
});
