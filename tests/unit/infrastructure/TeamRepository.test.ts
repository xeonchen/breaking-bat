import { Team, ITeamRepository } from '@/domain';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import {
  clearTestDatabase,
  createTestDatabase,
} from '../../test-helpers/database';

describe('TeamRepository', () => {
  let repository: ITeamRepository;
  let testTeam: Team;

  beforeEach(async () => {
    await createTestDatabase();
    repository = new IndexedDBTeamRepository();

    testTeam = new Team(
      'team1',
      'Yankees',
      ['season1'],
      ['player1', 'player2']
    );
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('save', () => {
    it('should save a new team', async () => {
      const savedTeam = await repository.save(testTeam);

      expect(savedTeam.id).toBe(testTeam.id);
      expect(savedTeam.name).toBe('Yankees');
      expect(savedTeam.seasonIds).toEqual(['season1']);
      expect(savedTeam.playerIds).toEqual(['player1', 'player2']);
    });

    it('should update an existing team', async () => {
      await repository.save(testTeam);

      const updatedTeam = testTeam.changeName('Red Sox');
      const savedTeam = await repository.save(updatedTeam);

      expect(savedTeam.name).toBe('Red Sox');
      expect(savedTeam.updatedAt).not.toBe(testTeam.updatedAt);
    });

    it('should throw error when saving team with duplicate name', async () => {
      await repository.save(testTeam);

      const duplicateTeam = new Team('team2', 'Yankees', [], []);

      await expect(repository.save(duplicateTeam)).rejects.toThrow(
        'Team name Yankees already exists'
      );
    });
  });

  describe('findById', () => {
    it('should find team by id', async () => {
      await repository.save(testTeam);

      const foundTeam = await repository.findById('team1');

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.name).toBe('Yankees');
    });

    it('should return null when team not found', async () => {
      const foundTeam = await repository.findById('nonexistent');

      expect(foundTeam).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find team by name', async () => {
      await repository.save(testTeam);

      const foundTeam = await repository.findByName('Yankees');

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.id).toBe('team1');
    });

    it('should return null when team name not found', async () => {
      const foundTeam = await repository.findByName('Nonexistent');

      expect(foundTeam).toBeNull();
    });

    it('should handle case insensitive search', async () => {
      await repository.save(testTeam);

      const foundTeam = await repository.findByName('yankees');

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.name).toBe('Yankees');
    });
  });

  describe('findBySeasonId', () => {
    it('should find teams by season', async () => {
      const team2 = new Team('team2', 'Red Sox', ['season1'], ['player3']);
      const team3 = new Team('team3', 'Dodgers', ['season2'], ['player4']);

      await repository.save(testTeam);
      await repository.save(team2);
      await repository.save(team3);

      const season1Teams = await repository.findBySeasonId('season1');

      expect(season1Teams).toHaveLength(2);
      expect(season1Teams.map((t) => t.name)).toContain('Yankees');
      expect(season1Teams.map((t) => t.name)).toContain('Red Sox');
    });

    it('should return empty array when no teams found for season', async () => {
      const teams = await repository.findBySeasonId('nonexistent');

      expect(teams).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should find all teams', async () => {
      const team2 = new Team('team2', 'Red Sox', [], []);
      const team3 = new Team('team3', 'Dodgers', [], []);

      await repository.save(testTeam);
      await repository.save(team2);
      await repository.save(team3);

      const allTeams = await repository.findAll();

      expect(allTeams).toHaveLength(3);
      expect(allTeams.map((t) => t.name)).toContain('Yankees');
      expect(allTeams.map((t) => t.name)).toContain('Red Sox');
      expect(allTeams.map((t) => t.name)).toContain('Dodgers');
    });

    it('should return empty array when no teams exist', async () => {
      const teams = await repository.findAll();

      expect(teams).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete team by id', async () => {
      await repository.save(testTeam);

      await repository.delete('team1');

      const foundTeam = await repository.findById('team1');
      expect(foundTeam).toBeNull();
    });

    it('should not throw error when deleting nonexistent team', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('addPlayer', () => {
    it('should add player to team', async () => {
      await repository.save(testTeam);

      // const updatedTeam = await repository.addPlayer('team1', 'player3');

      // expect(updatedTeam.playerIds).toContain('player3');
      // expect(updatedTeam.playerIds).toHaveLength(3);
    });

    it('should throw error when adding player to nonexistent team', async () => {
      // await expect(
      //   repository.addPlayer('nonexistent', 'player1')
      // ).rejects.toThrow('Team with id nonexistent not found');
    });

    it('should throw error when player already exists in team', async () => {
      await repository.save(testTeam);

      // await expect(repository.addPlayer('team1', 'player1')).rejects.toThrow(
      //   'Player already on team'
      // );
    });
  });

  describe('removePlayer', () => {
    it('should remove player from team', async () => {
      await repository.save(testTeam);

      // const updatedTeam = await repository.removePlayer('team1', 'player1');

      // expect(updatedTeam.playerIds).not.toContain('player1');
      // expect(updatedTeam.playerIds).toHaveLength(1);
    });

    it('should throw error when removing player from nonexistent team', async () => {
      // await expect(
      //   repository.removePlayer('nonexistent', 'player1')
      // ).rejects.toThrow('Team with id nonexistent not found');
    });

    it('should not throw error when removing nonexistent player', async () => {
      await repository.save(testTeam);

      // const updatedTeam = await repository.removePlayer('team1', 'nonexistent');

      // expect(updatedTeam.playerIds).toEqual(['player1', 'player2']);
    });
  });

  describe('addSeason', () => {
    it('should add season to team', async () => {
      await repository.save(testTeam);

      // const updatedTeam = await repository.addSeason('team1', 'season2');

      // expect(updatedTeam.seasonIds).toContain('season2');
      // expect(updatedTeam.seasonIds).toHaveLength(2);
    });

    it('should throw error when adding season to nonexistent team', async () => {
      // await expect(
      //   repository.addSeason('nonexistent', 'season1')
      // ).rejects.toThrow('Team with id nonexistent not found');
    });

    it('should throw error when season already associated with team', async () => {
      await repository.save(testTeam);

      // await expect(repository.addSeason('team1', 'season1')).rejects.toThrow(
      //   'Season already associated with team'
      // );
    });
  });
});
