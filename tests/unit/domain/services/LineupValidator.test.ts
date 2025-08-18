import { describe, expect, test, beforeEach } from '@jest/globals';
import { LineupValidator } from '../../../../src/domain/services/LineupValidator';
import { Lineup } from '../../../../src/domain/entities/Lineup';
import { LineupPosition } from '../../../../src/domain/entities/LineupPosition';
import { Player } from '../../../../src/domain/entities/Player';
import { Position } from '../../../../src/domain/values/Position';

/**
 * TDD Unit Tests for LineupValidator
 *
 * These tests are written BEFORE implementation and will initially fail.
 * They define the expected behavior for lineup validation logic.
 */

describe('LineupValidator - TDD Tests', () => {
  let validator: LineupValidator;
  let mockPlayers: Player[];

  beforeEach(() => {
    validator = new LineupValidator();

    // Create mock players for testing
    mockPlayers = [
      new Player('player-1', 'Player One', 1, Position.pitcher(), 'team-1'),
      new Player('player-2', 'Player Two', 2, Position.catcher(), 'team-1'),
      new Player('player-3', 'Player Three', 3, Position.firstBase(), 'team-1'),
      new Player('player-4', 'Player Four', 4, Position.secondBase(), 'team-1'),
      new Player('player-5', 'Player Five', 5, Position.thirdBase(), 'team-1'),
      new Player('player-6', 'Player Six', 6, Position.shortstop(), 'team-1'),
      new Player('player-7', 'Player Seven', 7, Position.leftField(), 'team-1'),
      new Player(
        'player-8',
        'Player Eight',
        8,
        Position.centerField(),
        'team-1'
      ),
      new Player('player-9', 'Player Nine', 9, Position.rightField(), 'team-1'),
      new Player('player-10', 'Player Ten', 10, Position.leftField(), 'team-1'),
    ];
  });

  describe('Minimum Batting Positions Validation', () => {
    test('should return invalid for lineup with fewer than 9 batting positions', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'Catcher', true),
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LINEUP_INCOMPLETE');
      expect(result.getErrorMessage('LINEUP_INCOMPLETE')).toBe(
        'Lineup must have at least 9 batting positions and all defensive positions assigned'
      );
    });

    test('should return valid for lineup with exactly 9 batting positions', () => {
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('LINEUP_INCOMPLETE');
    });

    test('should return valid for lineup with more than 9 batting positions', () => {
      const lineupPositions = createValidLineupPositions(11);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('LINEUP_INCOMPLETE');
    });
  });

  describe('Batting Order Sequence Validation', () => {
    test('should return invalid for non-sequential batting order', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'Catcher', true),
        new LineupPosition(4, 'player-3', 'First Base', true), // Missing position 3
        new LineupPosition(5, 'player-4', 'Second Base', true),
        new LineupPosition(6, 'player-5', 'Third Base', true),
        new LineupPosition(7, 'player-6', 'Shortstop', true),
        new LineupPosition(8, 'player-7', 'Left Field', true),
        new LineupPosition(9, 'player-8', 'Center Field', true),
        new LineupPosition(10, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BATTING_ORDER_INVALID');
      expect(result.getErrorMessage('BATTING_ORDER_INVALID')).toBe(
        'Batting order must be sequential starting from 1'
      );
    });

    test('should return invalid for batting order not starting from 1', () => {
      const lineupPositions = [
        new LineupPosition(2, 'player-1', 'Pitcher', true), // Should start from 1
        new LineupPosition(3, 'player-2', 'Catcher', true),
        new LineupPosition(4, 'player-3', 'First Base', true),
        new LineupPosition(5, 'player-4', 'Second Base', true),
        new LineupPosition(6, 'player-5', 'Third Base', true),
        new LineupPosition(7, 'player-6', 'Shortstop', true),
        new LineupPosition(8, 'player-7', 'Left Field', true),
        new LineupPosition(9, 'player-8', 'Center Field', true),
        new LineupPosition(10, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BATTING_ORDER_INVALID');
    });

    test('should return valid for sequential batting order starting from 1', () => {
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('BATTING_ORDER_INVALID');
    });
  });

  describe('Unique Defensive Positions Validation', () => {
    test('should return invalid for duplicate defensive positions', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'Pitcher', true), // Duplicate pitcher
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
        new LineupPosition(6, 'player-6', 'Shortstop', true),
        new LineupPosition(7, 'player-7', 'Left Field', true),
        new LineupPosition(8, 'player-8', 'Center Field', true),
        new LineupPosition(9, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('POSITION_DUPLICATE');
      expect(result.getErrorMessage('POSITION_DUPLICATE')).toBe(
        'Each defensive position can only be assigned to one player'
      );
    });

    test('should return valid for unique defensive positions', () => {
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('POSITION_DUPLICATE');
    });

    test('should allow multiple Extra Player positions but not other duplicates', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'Catcher', true),
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
        new LineupPosition(6, 'player-6', 'Shortstop', true),
        new LineupPosition(7, 'player-7', 'Left Field', true),
        new LineupPosition(8, 'player-8', 'Center Field', true),
        new LineupPosition(9, 'player-9', 'Right Field', true),
        new LineupPosition(10, 'player-10', 'Extra Player', true), // EP is allowed
        new LineupPosition(11, 'player-1', 'Extra Player', true), // Multiple EP allowed
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('POSITION_DUPLICATE');
    });
  });

  describe('Player Team Validation', () => {
    test('should return invalid when player is not on the team', () => {
      // Create a player not on the correct team
      new Player(
        'invalid-player',
        'Invalid Player',
        99,
        Position.pitcher(),
        'other-team'
      );
      const lineupPositions = [
        new LineupPosition(1, 'invalid-player', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'Catcher', true),
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
        new LineupPosition(6, 'player-6', 'Shortstop', true),
        new LineupPosition(7, 'player-7', 'Left Field', true),
        new LineupPosition(8, 'player-8', 'Center Field', true),
        new LineupPosition(9, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('PLAYER_NOT_ON_TEAM');
      expect(result.getErrorMessage('PLAYER_NOT_ON_TEAM')).toBe(
        'Selected player is not on the chosen team'
      );
    });

    test('should return valid when all players are on the team', () => {
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('PLAYER_NOT_ON_TEAM');
    });
  });

  describe('Essential Defensive Positions Validation', () => {
    test('should return invalid when missing pitcher', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Catcher', true), // No pitcher
        new LineupPosition(2, 'player-2', 'Catcher', true),
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
        new LineupPosition(6, 'player-6', 'Shortstop', true),
        new LineupPosition(7, 'player-7', 'Left Field', true),
        new LineupPosition(8, 'player-8', 'Center Field', true),
        new LineupPosition(9, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MISSING_ESSENTIAL_POSITIONS');
      expect(result.getErrorMessage('MISSING_ESSENTIAL_POSITIONS')).toBe(
        'Lineup must include pitcher and catcher positions'
      );
    });

    test('should return invalid when missing catcher', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
        new LineupPosition(2, 'player-2', 'First Base', true), // No catcher
        new LineupPosition(3, 'player-3', 'First Base', true),
        new LineupPosition(4, 'player-4', 'Second Base', true),
        new LineupPosition(5, 'player-5', 'Third Base', true),
        new LineupPosition(6, 'player-6', 'Shortstop', true),
        new LineupPosition(7, 'player-7', 'Left Field', true),
        new LineupPosition(8, 'player-8', 'Center Field', true),
        new LineupPosition(9, 'player-9', 'Right Field', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MISSING_ESSENTIAL_POSITIONS');
    });
  });

  describe('Empty Lineup Validation', () => {
    test('should return invalid for completely empty lineup', () => {
      const lineup = new Lineup('lineup-1', 'game-1', [], []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LINEUP_INCOMPLETE');
    });

    test('should handle null lineup positions gracefully', () => {
      // The Lineup constructor will throw an error for null batting order
      expect(() => {
        new Lineup('lineup-1', 'game-1', null as any, []);
      }).toThrow('Batting order must be an array');
    });
  });

  describe('No Players Available Validation', () => {
    test('should return invalid when no players are provided', () => {
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('NO_PLAYERS_AVAILABLE');
      expect(result.getErrorMessage('NO_PLAYERS_AVAILABLE')).toBe(
        'Selected team has no active players available for lineup'
      );
    });

    test('should return invalid when insufficient players are provided', () => {
      const insufficientPlayers = mockPlayers.slice(0, 5); // Only 5 players
      const lineupPositions = createValidLineupPositions(9);
      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, insufficientPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('INSUFFICIENT_PLAYERS');
      expect(result.getErrorMessage('INSUFFICIENT_PLAYERS')).toBe(
        'Team needs at least 9 active players to create a complete lineup'
      );
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('should return multiple errors for lineup with multiple issues', () => {
      const lineupPositions = [
        new LineupPosition(2, 'player-1', 'Pitcher', true), // Wrong batting order start
        new LineupPosition(3, 'player-2', 'Pitcher', true), // Duplicate position
        new LineupPosition(5, 'player-3', 'First Base', true), // Gap in batting order
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('LINEUP_INCOMPLETE');
      expect(result.errors).toContain('BATTING_ORDER_INVALID');
      expect(result.errors).toContain('POSITION_DUPLICATE');
      expect(result.errors).toContain('MISSING_ESSENTIAL_POSITIONS');
    });

    test('should provide helpful validation summary', () => {
      const lineupPositions = [
        new LineupPosition(1, 'player-1', 'Pitcher', true),
      ];

      const lineup = new Lineup('lineup-1', 'game-1', lineupPositions, []);
      const result = validator.validate(lineup, mockPlayers);

      expect(result.isValid).toBe(false);
      // The actual number of errors will be: LINEUP_INCOMPLETE, MISSING_ESSENTIAL_POSITIONS (2 errors)
      expect(result.getValidationSummary()).toBe(
        'Lineup has 2 validation errors that must be resolved'
      );
    });
  });

  describe('Performance Validation', () => {
    test('should validate large lineup efficiently', () => {
      // LineupPosition constrains batting order to 1-15, so use 15 players
      const largeLineupPositions = createValidLineupPositions(15);
      const lineup = new Lineup('lineup-1', 'game-1', largeLineupPositions, []);

      const start = Date.now();
      const result = validator.validate(lineup, mockPlayers);
      const duration = Date.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  // Helper function to create valid lineup positions
  function createValidLineupPositions(count: number): LineupPosition[] {
    const positions = [
      'Pitcher',
      'Catcher',
      'First Base',
      'Second Base',
      'Third Base',
      'Shortstop',
      'Left Field',
      'Center Field',
      'Right Field',
      'Short Fielder', // Position 10
      'Extra Player', // Position 11+
    ];

    const lineupPositions: LineupPosition[] = [];

    for (let i = 1; i <= count; i++) {
      const position = i <= 10 ? positions[i - 1] : 'Extra Player'; // EP can be duplicated
      const playerId =
        i <= mockPlayers.length
          ? `player-${i}`
          : `player-${(i % mockPlayers.length) + 1}`;
      lineupPositions.push(new LineupPosition(i, playerId, position, true));
    }

    return lineupPositions;
  }
});
