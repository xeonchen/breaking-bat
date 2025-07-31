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
        [Position.firstBase()],
        true
      );

      expect(player.name).toBe('John Doe');
      expect(player.jerseyNumber).toBe(23);
      expect(player.positions).toHaveLength(1);
      expect(player.positions[0].value).toBe('first-base');
      expect(player.isActive).toBe(true);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        new Player('player1', '', 23, 'team1');
      }).toThrow('Player name cannot be empty');
    });

    it('should throw error for invalid jersey number', () => {
      expect(() => {
        new Player('player1', 'John Doe', -1, 'team1');
      }).toThrow('Jersey number must be between 0 and 999');

      expect(() => {
        new Player('player1', 'John Doe', 1000, 'team1');
      }).toThrow('Jersey number must be between 0 and 999');
    });

    it('should allow jersey number 0', () => {
      const player = new Player('player1', 'John Doe', 0, 'team1');
      expect(player.jerseyNumber).toBe(0);
    });

    it('should allow jersey number 999', () => {
      const player = new Player('player1', 'John Doe', 999, 'team1');
      expect(player.jerseyNumber).toBe(999);
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
        rbis: 1,
      };

      const updatedPlayer = player.updateStatistics(newStats);
      expect(updatedPlayer.statistics.battingAverage).toBe(0.3);
      expect(updatedPlayer.statistics.hits).toBe(3);
    });
  });

  describe('position management', () => {
    it('should default to extra player position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      expect(player.positions).toHaveLength(1);
      expect(player.positions[0].value).toBe('extra-player');
      expect(player.isExtraPlayer()).toBe(true);
    });

    it('should update positions', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.firstBase(),
      ]);
      const updated = player.updatePositions([
        Position.pitcher(),
        Position.firstBase(),
      ]);

      expect(updated.positions).toHaveLength(2);
      expect(updated.positions[0].value).toBe('pitcher');
      expect(updated.positions[1].value).toBe('first-base');
      expect(updated.updatedAt).not.toBe(player.updatedAt);
    });

    it('should add position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.firstBase(),
      ]);
      const updated = player.addPosition(Position.pitcher());

      expect(updated.positions).toHaveLength(2);
      expect(updated.canPlayPosition(Position.pitcher())).toBe(true);
    });

    it('should not add duplicate position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.firstBase(),
      ]);
      const updated = player.addPosition(Position.firstBase());

      expect(updated.positions).toHaveLength(1);
      expect(updated).toBe(player); // Should return same instance
    });

    it('should remove position', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.firstBase(),
        Position.pitcher(),
      ]);
      const updated = player.removePosition(Position.firstBase());

      expect(updated.positions).toHaveLength(1);
      expect(updated.positions[0].value).toBe('pitcher');
    });

    it('should get defensive positions only', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.firstBase(),
        Position.extraPlayer(),
        Position.pitcher(),
      ]);

      const defensivePositions = player.getDefensivePositions();
      expect(defensivePositions).toHaveLength(2);
      expect(defensivePositions.some((p) => p.value === 'extra-player')).toBe(
        false
      );
    });
  });

  describe('activation', () => {
    it('should activate/deactivate player', () => {
      const player = new Player(
        'player1',
        'John Doe',
        23,
        'team1',
        [Position.pitcher()],
        true
      );
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
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.pitcher(),
        Position.firstBase(),
      ]);
      expect(player.canPlayPosition(Position.pitcher())).toBe(true);
      expect(player.canPlayPosition(Position.firstBase())).toBe(true);
      expect(player.canPlayPosition(Position.catcher())).toBe(false);
    });

    it('should support new slowpitch positions', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1', [
        Position.shortFielder(),
        Position.extraPlayer(),
      ]);

      expect(player.canPlayPosition(Position.shortFielder())).toBe(true);
      expect(player.isExtraPlayer()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should create new instance on updates', () => {
      const original = new Player('player1', 'John Doe', 23, 'team1');
      const updated = original.updatePositions([Position.pitcher()]);

      expect(updated).not.toBe(original);
      expect(updated.id).toBe(original.id);
      expect(updated.createdAt).toBe(original.createdAt);
    });
  });
});
