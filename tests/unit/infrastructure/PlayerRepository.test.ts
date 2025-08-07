import { Player, PlayerRepository } from '@/domain';
import { Position } from '@/domain/values';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import {
  clearTestDatabase,
  createTestDatabase,
} from '../../test-helpers/database';

describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let testPlayer: Player;

  beforeEach(async () => {
    await createTestDatabase();
    repository = new IndexedDBPlayerRepository();

    testPlayer = new Player(
      'player1',
      'John Doe',
      23,
      'team1',
      [Position.firstBase()],
      true
    );
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('save', () => {
    it('should save a new player', async () => {
      const savedPlayer = await repository.save(testPlayer);

      expect(savedPlayer.id).toBe(testPlayer.id);
      expect(savedPlayer.name).toBe('John Doe');
      expect(savedPlayer.jerseyNumber).toBe(23);
    });

    it('should update an existing player', async () => {
      await repository.save(testPlayer);

      const updatedPlayer = testPlayer.updatePositions([Position.pitcher()]);
      const savedPlayer = await repository.save(updatedPlayer);

      expect(savedPlayer.positions[0].value).toBe('pitcher');
      expect(savedPlayer.updatedAt).not.toBe(testPlayer.updatedAt);
    });

    it('should throw error when saving player with duplicate jersey number in same team', async () => {
      await repository.save(testPlayer);

      const duplicatePlayer = new Player(
        'player2',
        'Jane Doe',
        23, // Same jersey number
        'team1', // Same team
        [Position.catcher()]
      );

      await expect(repository.save(duplicatePlayer)).rejects.toThrow(
        'Jersey number 23 already exists for team team1'
      );
    });
  });

  describe('findById', () => {
    it('should find player by id', async () => {
      await repository.save(testPlayer);

      const foundPlayer = await repository.findById('player1');

      expect(foundPlayer).not.toBeNull();
      expect(foundPlayer?.name).toBe('John Doe');
    });

    it('should return null when player not found', async () => {
      const foundPlayer = await repository.findById('nonexistent');

      expect(foundPlayer).toBeNull();
    });
  });

  describe('findByTeamId', () => {
    it('should find all players for a team', async () => {
      const player2 = new Player('player2', 'Jane Doe', 24, 'team1', [
        Position.extraPlayer(),
      ]);
      const player3 = new Player('player3', 'Bob Smith', 25, 'team2', [
        Position.extraPlayer(),
      ]);

      await repository.save(testPlayer);
      await repository.save(player2);
      await repository.save(player3);

      const team1Players = await repository.findByTeamId('team1');

      expect(team1Players).toHaveLength(2);
      expect(team1Players.map((p) => p.name)).toContain('John Doe');
      expect(team1Players.map((p) => p.name)).toContain('Jane Doe');
    });

    it('should return empty array when no players found for team', async () => {
      const players = await repository.findByTeamId('nonexistent');

      expect(players).toEqual([]);
    });
  });

  describe('findByJerseyNumber', () => {
    it('should find player by jersey number within team', async () => {
      await repository.save(testPlayer);

      const foundPlayer = await repository.findByJerseyNumber('team1', 23);

      expect(foundPlayer).not.toBeNull();
      expect(foundPlayer?.name).toBe('John Doe');
    });

    it('should return null when jersey number not found in team', async () => {
      await repository.save(testPlayer);

      const foundPlayer = await repository.findByJerseyNumber('team1', 99);

      expect(foundPlayer).toBeNull();
    });

    it('should not find player from different team with same jersey number', async () => {
      await repository.save(testPlayer);

      const foundPlayer = await repository.findByJerseyNumber('team2', 23);

      expect(foundPlayer).toBeNull();
    });
  });

  describe('findActiveByTeamId', () => {
    it('should find only active players for team', async () => {
      const inactivePlayer = new Player(
        'player2',
        'Jane Doe',
        24,
        'team1',
        [Position.extraPlayer()],
        false
      );

      await repository.save(testPlayer);
      await repository.save(inactivePlayer);

      const activePlayers = await repository.findActiveByTeamId('team1');

      expect(activePlayers).toHaveLength(1);
      expect(activePlayers[0].name).toBe('John Doe');
    });
  });

  describe('delete', () => {
    it('should delete player by id', async () => {
      await repository.save(testPlayer);

      await repository.delete('player1');

      const foundPlayer = await repository.findById('player1');
      expect(foundPlayer).toBeNull();
    });

    it('should not throw error when deleting nonexistent player', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('updateStatistics', () => {
    it('should update player statistics', async () => {
      await repository.save(testPlayer);

      const newStats = {
        ...Player.createEmptyStatistics(),
        atBats: 10,
        hits: 3,
        runs: 2,
        rbis: 1,
      };

      const updatedPlayer = await repository.updateStatistics(
        'player1',
        newStats
      );

      expect(updatedPlayer.statistics.atBats).toBe(10);
      expect(updatedPlayer.statistics.battingAverage).toBe(0.3);
    });

    it('should throw error when updating statistics of nonexistent player', async () => {
      const newStats = Player.createEmptyStatistics();

      await expect(
        repository.updateStatistics('nonexistent', newStats)
      ).rejects.toThrow('Player with id nonexistent not found');
    });
  });

  describe('search', () => {
    it('should search players by name', async () => {
      const player2 = new Player('player2', 'Jane Doe', 24, 'team1', [
        Position.extraPlayer(),
      ]);
      const player3 = new Player('player3', 'John Smith', 25, 'team1', [
        Position.extraPlayer(),
      ]);

      await repository.save(testPlayer);
      await repository.save(player2);
      await repository.save(player3);

      const results = await repository.searchByName('John');

      expect(results).toHaveLength(2);
      expect(results.map((p) => p.name)).toContain('John Doe');
      expect(results.map((p) => p.name)).toContain('John Smith');
    });

    it('should return empty array when no matches found', async () => {
      await repository.save(testPlayer);

      const results = await repository.searchByName('Nonexistent');

      expect(results).toEqual([]);
    });
  });
});
