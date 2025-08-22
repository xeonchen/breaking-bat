import { Player, PlayerStatistics } from '@/domain/entities/Player';
import { Position } from '@/domain/values';

describe('Player Entity', () => {
  const validPlayerData = {
    id: 'player-1',
    name: 'David Ortiz',
    jerseyNumber: 34,
    teamId: 'team-1',
    positions: [Position.firstBase()],
    isActive: true,
  };

  describe('Constructor and Validation', () => {
    it('should create a valid player with all required fields', () => {
      const player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        validPlayerData.positions,
        validPlayerData.isActive
      );

      expect(player.id).toBe(validPlayerData.id);
      expect(player.name).toBe(validPlayerData.name);
      expect(player.jerseyNumber).toBe(validPlayerData.jerseyNumber);
      expect(player.teamId).toBe(validPlayerData.teamId);
      expect(player.positions).toEqual(validPlayerData.positions);
      expect(player.isActive).toBe(validPlayerData.isActive);
      expect(player.statistics).toEqual(Player.createEmptyStatistics());
    });

    it('should create player with default values when optionals omitted', () => {
      const player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId
      );

      expect(player.positions).toEqual([Position.extraPlayer()]);
      expect(player.isActive).toBe(true);
      expect(player.statistics).toEqual(Player.createEmptyStatistics());
    });

    it('should trim whitespace from name', () => {
      const player = new Player(
        validPlayerData.id,
        '  David Ortiz  ',
        validPlayerData.jerseyNumber,
        validPlayerData.teamId
      );

      expect(player.name).toBe('David Ortiz');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        new Player(
          validPlayerData.id,
          '',
          validPlayerData.jerseyNumber,
          validPlayerData.teamId
        );
      }).toThrow('Player name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => {
        new Player(
          validPlayerData.id,
          '   ',
          validPlayerData.jerseyNumber,
          validPlayerData.teamId
        );
      }).toThrow('Player name cannot be empty');
    });

    it('should throw error for negative jersey number', () => {
      expect(() => {
        new Player(
          validPlayerData.id,
          validPlayerData.name,
          -1,
          validPlayerData.teamId
        );
      }).toThrow('Jersey number must be between 0 and 999');
    });

    it('should throw error for jersey number over 999', () => {
      expect(() => {
        new Player(
          validPlayerData.id,
          validPlayerData.name,
          1000,
          validPlayerData.teamId
        );
      }).toThrow('Jersey number must be between 0 and 999');
    });

    it('should accept jersey number 0', () => {
      const player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        0,
        validPlayerData.teamId
      );

      expect(player.jerseyNumber).toBe(0);
    });

    it('should accept jersey number 999', () => {
      const player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        999,
        validPlayerData.teamId
      );

      expect(player.jerseyNumber).toBe(999);
    });

    it('should accept custom statistics on construction', () => {
      const customStats: PlayerStatistics = {
        games: 10,
        atBats: 25,
        hits: 8,
        runs: 5,
        rbis: 6,
        singles: 5,
        doubles: 2,
        triples: 1,
        homeRuns: 0,
        walks: 3,
        strikeouts: 7,
        battingAverage: 0.32,
        onBasePercentage: 0.39,
        sluggingPercentage: 0.48,
      };

      const player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        validPlayerData.positions,
        validPlayerData.isActive,
        customStats
      );

      expect(player.statistics).toBe(customStats);
    });
  });

  describe('Static Methods', () => {
    describe('createEmptyStatistics', () => {
      it('should return zero statistics for new player', () => {
        const stats = Player.createEmptyStatistics();

        expect(stats).toEqual({
          games: 0,
          atBats: 0,
          hits: 0,
          runs: 0,
          rbis: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          homeRuns: 0,
          walks: 0,
          strikeouts: 0,
          battingAverage: 0,
          onBasePercentage: 0,
          sluggingPercentage: 0,
        });
      });

      it('should return new object instance each time', () => {
        const stats1 = Player.createEmptyStatistics();
        const stats2 = Player.createEmptyStatistics();

        expect(stats1).not.toBe(stats2);
        expect(stats1).toEqual(stats2);
      });
    });
  });

  describe('Position Management', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        [Position.firstBase()],
        validPlayerData.isActive
      );
    });

    describe('updatePositions', () => {
      it('should return new player with updated positions', () => {
        const newPositions = [Position.pitcher(), Position.catcher()];
        const updatedPlayer = player.updatePositions(newPositions);

        expect(updatedPlayer).not.toBe(player);
        expect(updatedPlayer.positions).toEqual(newPositions);
        expect(updatedPlayer.id).toBe(player.id);
        expect(updatedPlayer.name).toBe(player.name);
        expect(updatedPlayer.updatedAt).not.toBe(player.updatedAt);
      });

      it('should preserve all other properties', () => {
        const newPositions = [Position.pitcher()];
        const updatedPlayer = player.updatePositions(newPositions);

        expect(updatedPlayer.id).toBe(player.id);
        expect(updatedPlayer.name).toBe(player.name);
        expect(updatedPlayer.jerseyNumber).toBe(player.jerseyNumber);
        expect(updatedPlayer.teamId).toBe(player.teamId);
        expect(updatedPlayer.isActive).toBe(player.isActive);
        expect(updatedPlayer.statistics).toBe(player.statistics);
        expect(updatedPlayer.createdAt).toBe(player.createdAt);
      });
    });

    describe('addPosition', () => {
      it('should add new position to player', () => {
        const updatedPlayer = player.addPosition(Position.pitcher());

        expect(updatedPlayer.positions).toHaveLength(2);
        expect(
          updatedPlayer.positions.some((p) => p.equals(Position.firstBase()))
        ).toBe(true);
        expect(
          updatedPlayer.positions.some((p) => p.equals(Position.pitcher()))
        ).toBe(true);
      });

      it('should not add duplicate position', () => {
        const updatedPlayer = player.addPosition(Position.firstBase());

        expect(updatedPlayer).toBe(player);
        expect(updatedPlayer.positions).toHaveLength(1);
      });

      it('should maintain position order when adding', () => {
        const updatedPlayer = player
          .addPosition(Position.pitcher())
          .addPosition(Position.catcher());

        expect(updatedPlayer.positions[0]).toEqual(Position.firstBase());
        expect(updatedPlayer.positions[1].equals(Position.pitcher())).toBe(
          true
        );
        expect(updatedPlayer.positions[2].equals(Position.catcher())).toBe(
          true
        );
      });
    });

    describe('removePosition', () => {
      beforeEach(() => {
        player = player
          .addPosition(Position.pitcher())
          .addPosition(Position.catcher());
      });

      it('should remove existing position', () => {
        const updatedPlayer = player.removePosition(Position.pitcher());

        expect(updatedPlayer.positions).toHaveLength(2);
        expect(
          updatedPlayer.positions.some((p) => p.equals(Position.pitcher()))
        ).toBe(false);
        expect(
          updatedPlayer.positions.some((p) => p.equals(Position.firstBase()))
        ).toBe(true);
        expect(
          updatedPlayer.positions.some((p) => p.equals(Position.catcher()))
        ).toBe(true);
      });

      it('should return unchanged player if position not found', () => {
        const updatedPlayer = player.removePosition(Position.secondBase());

        expect(updatedPlayer.positions).toHaveLength(3);
        expect(updatedPlayer.positions).toEqual(player.positions);
      });

      it('should handle removing all positions', () => {
        const updatedPlayer = player
          .removePosition(Position.firstBase())
          .removePosition(Position.pitcher())
          .removePosition(Position.catcher());

        expect(updatedPlayer.positions).toHaveLength(0);
      });
    });
  });

  describe('Activity Management', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        validPlayerData.positions,
        true
      );
    });

    it('should set player inactive', () => {
      const inactivePlayer = player.setActive(false);

      expect(inactivePlayer).not.toBe(player);
      expect(inactivePlayer.isActive).toBe(false);
      expect(inactivePlayer.id).toBe(player.id);
      expect(inactivePlayer.updatedAt).not.toBe(player.updatedAt);
    });

    it('should set player active', () => {
      const inactivePlayer = player.setActive(false);
      const activePlayer = inactivePlayer.setActive(true);

      expect(activePlayer.isActive).toBe(true);
      expect(activePlayer).not.toBe(inactivePlayer);
    });

    it('should preserve all other properties when changing activity', () => {
      const updatedPlayer = player.setActive(false);

      expect(updatedPlayer.id).toBe(player.id);
      expect(updatedPlayer.name).toBe(player.name);
      expect(updatedPlayer.jerseyNumber).toBe(player.jerseyNumber);
      expect(updatedPlayer.teamId).toBe(player.teamId);
      expect(updatedPlayer.positions).toBe(player.positions);
      expect(updatedPlayer.statistics).toBe(player.statistics);
      expect(updatedPlayer.createdAt).toBe(player.createdAt);
    });
  });

  describe('Statistics Management', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        validPlayerData.positions,
        validPlayerData.isActive
      );
    });

    describe('updateStatistics', () => {
      it('should update statistics and recalculate derived values', () => {
        const newStats: PlayerStatistics = {
          games: 10,
          atBats: 30,
          hits: 12,
          runs: 8,
          rbis: 10,
          singles: 8,
          doubles: 3,
          triples: 1,
          homeRuns: 0,
          walks: 5,
          strikeouts: 8,
          battingAverage: 0, // Will be recalculated
          onBasePercentage: 0, // Will be recalculated
          sluggingPercentage: 0, // Will be recalculated
        };

        const updatedPlayer = player.updateStatistics(newStats);

        expect(updatedPlayer.statistics.games).toBe(10);
        expect(updatedPlayer.statistics.atBats).toBe(30);
        expect(updatedPlayer.statistics.hits).toBe(12);
        expect(updatedPlayer.statistics.battingAverage).toBeCloseTo(0.4); // 12/30
        expect(updatedPlayer.statistics.onBasePercentage).toBeCloseTo(0.486); // (12+5)/(30+5)
        expect(updatedPlayer.statistics.sluggingPercentage).toBeCloseTo(0.567); // (8+6+3+0)/30 = 17/30
      });

      it('should handle zero at-bats for batting average', () => {
        const newStats: PlayerStatistics = {
          games: 1,
          atBats: 0,
          hits: 0,
          runs: 0,
          rbis: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          homeRuns: 0,
          walks: 2,
          strikeouts: 0,
          battingAverage: 0,
          onBasePercentage: 0,
          sluggingPercentage: 0,
        };

        const updatedPlayer = player.updateStatistics(newStats);

        expect(updatedPlayer.statistics.battingAverage).toBe(0);
        expect(updatedPlayer.statistics.sluggingPercentage).toBe(0);
        expect(updatedPlayer.statistics.onBasePercentage).toBe(1); // 2 walks, 2 walks = 100%
      });

      it('should handle zero plate appearances for OBP', () => {
        const newStats: PlayerStatistics = {
          games: 1,
          atBats: 0,
          hits: 0,
          runs: 0,
          rbis: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          homeRuns: 0,
          walks: 0,
          strikeouts: 0,
          battingAverage: 0,
          onBasePercentage: 0,
          sluggingPercentage: 0,
        };

        const updatedPlayer = player.updateStatistics(newStats);

        expect(updatedPlayer.statistics.onBasePercentage).toBe(0);
      });

      it('should calculate total bases correctly for slugging percentage', () => {
        const newStats: PlayerStatistics = {
          games: 10,
          atBats: 20,
          hits: 10,
          runs: 8,
          rbis: 12,
          singles: 4,
          doubles: 3,
          triples: 2,
          homeRuns: 1,
          walks: 3,
          strikeouts: 5,
          battingAverage: 0,
          onBasePercentage: 0,
          sluggingPercentage: 0,
        };

        const updatedPlayer = player.updateStatistics(newStats);

        // Total bases: 4(1) + 3(2) + 2(3) + 1(4) = 4 + 6 + 6 + 4 = 20
        // Slugging: 20 / 20 = 1.0
        expect(updatedPlayer.statistics.sluggingPercentage).toBe(1.0);
      });

      it('should preserve all other properties when updating statistics', () => {
        const newStats = Player.createEmptyStatistics();
        const updatedPlayer = player.updateStatistics(newStats);

        expect(updatedPlayer.id).toBe(player.id);
        expect(updatedPlayer.name).toBe(player.name);
        expect(updatedPlayer.jerseyNumber).toBe(player.jerseyNumber);
        expect(updatedPlayer.teamId).toBe(player.teamId);
        expect(updatedPlayer.positions).toBe(player.positions);
        expect(updatedPlayer.isActive).toBe(player.isActive);
        expect(updatedPlayer.createdAt).toBe(player.createdAt);
        expect(updatedPlayer.updatedAt).not.toBe(player.updatedAt);
      });
    });
  });

  describe('Display Methods', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(
        validPlayerData.id,
        'David Ortiz',
        34,
        validPlayerData.teamId,
        [Position.firstBase(), Position.pitcher()],
        validPlayerData.isActive
      );
    });

    describe('getDisplayName', () => {
      it('should return formatted name with jersey number', () => {
        expect(player.getDisplayName()).toBe('#34 David Ortiz');
      });

      it('should handle jersey number 0', () => {
        const playerZero = new Player(
          validPlayerData.id,
          'Player Zero',
          0,
          validPlayerData.teamId
        );

        expect(playerZero.getDisplayName()).toBe('#0 Player Zero');
      });
    });

    describe('getDefaultPosition', () => {
      it('should return first position in array', () => {
        expect(player.getDefaultPosition()).toEqual(Position.firstBase());
      });

      it('should return extra player when no positions', () => {
        const emptyPositionPlayer = player.updatePositions([]);

        expect(emptyPositionPlayer.getDefaultPosition()).toEqual(
          Position.extraPlayer()
        );
      });
    });

    describe('canPlayPosition', () => {
      it('should return true for positions player can play', () => {
        expect(player.canPlayPosition(Position.firstBase())).toBe(true);
        expect(player.canPlayPosition(Position.pitcher())).toBe(true);
      });

      it('should return false for positions player cannot play', () => {
        expect(player.canPlayPosition(Position.catcher())).toBe(false);
        expect(player.canPlayPosition(Position.secondBase())).toBe(false);
      });
    });

    describe('getDefensivePositions', () => {
      it('should return only defensive positions', () => {
        const mixedPlayer = new Player(
          validPlayerData.id,
          validPlayerData.name,
          validPlayerData.jerseyNumber,
          validPlayerData.teamId,
          [Position.firstBase(), Position.extraPlayer(), Position.pitcher()],
          validPlayerData.isActive
        );

        const defensivePositions = mixedPlayer.getDefensivePositions();

        expect(defensivePositions).toHaveLength(2);
        expect(
          defensivePositions.some((p) => p.equals(Position.firstBase()))
        ).toBe(true);
        expect(
          defensivePositions.some((p) => p.equals(Position.pitcher()))
        ).toBe(true);
        expect(
          defensivePositions.some((p) => p.equals(Position.extraPlayer()))
        ).toBe(false);
      });

      it('should return empty array when player has only EP', () => {
        const epPlayer = new Player(
          validPlayerData.id,
          validPlayerData.name,
          validPlayerData.jerseyNumber,
          validPlayerData.teamId,
          [Position.extraPlayer()],
          validPlayerData.isActive
        );

        expect(epPlayer.getDefensivePositions()).toHaveLength(0);
      });
    });

    describe('isExtraPlayer', () => {
      it('should return true when player has EP position', () => {
        const epPlayer = player.addPosition(Position.extraPlayer());

        expect(epPlayer.isExtraPlayer()).toBe(true);
      });

      it('should return false when player has no EP position', () => {
        expect(player.isExtraPlayer()).toBe(false);
      });

      it('should return true when player only has EP position', () => {
        const onlyEpPlayer = new Player(
          validPlayerData.id,
          validPlayerData.name,
          validPlayerData.jerseyNumber,
          validPlayerData.teamId,
          [Position.extraPlayer()],
          validPlayerData.isActive
        );

        expect(onlyEpPlayer.isExtraPlayer()).toBe(true);
      });
    });

    describe('getPositionsDisplay', () => {
      it('should return comma-separated abbreviations', () => {
        expect(player.getPositionsDisplay()).toBe('1B, P');
      });

      it('should handle single position', () => {
        const singlePosPlayer = new Player(
          validPlayerData.id,
          validPlayerData.name,
          validPlayerData.jerseyNumber,
          validPlayerData.teamId,
          [Position.catcher()],
          validPlayerData.isActive
        );

        expect(singlePosPlayer.getPositionsDisplay()).toBe('C');
      });
    });

    describe('getPositionsFullDisplay', () => {
      it('should return comma-separated display names', () => {
        expect(player.getPositionsFullDisplay()).toBe(
          'First Base (1B), Pitcher (P)'
        );
      });
    });

    describe('getPositionNames', () => {
      it('should return comma-separated full names', () => {
        expect(player.getPositionNames()).toBe('First Base, Pitcher');
      });
    });
  });

  describe('Immutability', () => {
    let originalPlayer: Player;

    beforeEach(() => {
      originalPlayer = new Player(
        validPlayerData.id,
        validPlayerData.name,
        validPlayerData.jerseyNumber,
        validPlayerData.teamId,
        validPlayerData.positions,
        validPlayerData.isActive
      );
    });

    it('should not mutate original when updating positions', () => {
      const originalPositions = originalPlayer.positions;
      const updatedPlayer = originalPlayer.addPosition(Position.pitcher());

      expect(originalPlayer.positions).toBe(originalPositions);
      expect(originalPlayer.positions).not.toBe(updatedPlayer.positions);
    });

    it('should not mutate original when updating activity status', () => {
      const originalActive = originalPlayer.isActive;
      const updatedPlayer = originalPlayer.setActive(false);

      expect(originalPlayer.isActive).toBe(originalActive);
      expect(originalPlayer).not.toBe(updatedPlayer);
    });

    it('should not mutate original when updating statistics', () => {
      const originalStats = originalPlayer.statistics;
      const newStats = { ...originalStats, games: 10 };
      const updatedPlayer = originalPlayer.updateStatistics(newStats);

      expect(originalPlayer.statistics).toBe(originalStats);
      expect(originalPlayer.statistics).not.toBe(updatedPlayer.statistics);
    });
  });
});
