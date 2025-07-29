import { Player } from '../Player';
import { Position } from '../../values';

describe('Player', () => {
  describe('construction', () => {
    it('should create player with valid data', () => {
      const player = new Player(
        'player1',
        'John Doe',
        23,
        'team1',
        Position.firstBase(),
        true
      );

      expect(player.name).toBe('John Doe');
      expect(player.jerseyNumber).toBe(23);
      expect(player.position?.value).toBe('first-base');
      expect(player.isActive).toBe(true);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        new Player('player1', '', 23, 'team1');
      }).toThrow('Player name cannot be empty');
    });

    it('should throw error for invalid jersey number', () => {
      expect(() => {
        new Player('player1', 'John Doe', 0, 'team1');
      }).toThrow('Jersey number must be between 1 and 99');

      expect(() => {
        new Player('player1', 'John Doe', 100, 'team1');
      }).toThrow('Jersey number must be between 1 and 99');
    });

    it('should trim whitespace from name', () => {
      const player = new Player('player1', '  John Doe  ', 23, 'team1');
      expect(player.name).toBe('John Doe');
    });
  });

  describe('statistics', () => {
    it('should create empty statistics by default', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      const stats = player.statistics;

      expect(stats.games).toBe(0);
      expect(stats.atBats).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.battingAverage).toBe(0);
    });

    it('should update statistics correctly', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      const newStats = {
        ...Player.createEmptyStatistics(),
        atBats: 10,
        hits: 3,
        runs: 2,
        rbis: 1
      };

      const updatedPlayer = player.updateStatistics(newStats);
      expect(updatedPlayer.statistics.battingAverage).toBe(0.3);
      expect(updatedPlayer.statistics.hits).toBe(3);
    });
  });

  describe('position changes', () => {
    it('should change position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', Position.firstBase());
      const updated = player.changePosition(Position.pitcher());

      expect(updated.position?.value).toBe('pitcher');
      expect(updated.updatedAt).not.toBe(player.updatedAt);
    });

    it('should handle null position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', Position.firstBase());
      const updated = player.changePosition(null);

      expect(updated.position).toBe(null);
    });
  });

  describe('activation', () => {
    it('should activate/deactivate player', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', null, true);
      const deactivated = player.setActive(false);

      expect(deactivated.isActive).toBe(false);
      expect(deactivated.updatedAt).not.toBe(player.updatedAt);
    });
  });

  describe('display methods', () => {
    it('should generate display name', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      expect(player.getDisplayName()).toBe('#23 John Doe');
    });

    it('should check position capability', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      expect(player.canPlayPosition(Position.pitcher())).toBe(true);
      expect(player.canPlayPosition(Position.catcher())).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should create new instance on updates', () => {
      const original = new Player('player1', 'John Doe', 23, 'team1');
      const updated = original.changePosition(Position.pitcher());

      expect(updated).not.toBe(original);
      expect(updated.id).toBe(original.id);
      expect(updated.createdAt).toBe(original.createdAt);
    });
  });
});