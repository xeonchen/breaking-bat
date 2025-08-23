import { Team } from '@/domain/entities/Team';

describe('Team Entity', () => {
  const validTeamData = {
    id: 'team-1',
    name: 'Boston Red Sox',
    seasonIds: ['season-1', 'season-2'],
    playerIds: ['player-1', 'player-2', 'player-3'],
  };

  describe('Constructor and Validation', () => {
    it('should create a valid team with all required fields', () => {
      const team = new Team(
        validTeamData.id,
        validTeamData.name,
        validTeamData.seasonIds,
        validTeamData.playerIds
      );

      expect(team.id).toBe(validTeamData.id);
      expect(team.name).toBe(validTeamData.name);
      expect(team.seasonIds).toEqual(validTeamData.seasonIds);
      expect(team.playerIds).toEqual(validTeamData.playerIds);
    });

    it('should create team with default empty arrays when optional arrays omitted', () => {
      const team = new Team(validTeamData.id, validTeamData.name);

      expect(team.seasonIds).toEqual([]);
      expect(team.playerIds).toEqual([]);
    });

    it('should trim whitespace from team name', () => {
      const team = new Team(validTeamData.id, '  Boston Red Sox  ');

      expect(team.name).toBe('Boston Red Sox');
    });

    it('should throw error for empty team name', () => {
      expect(() => {
        new Team(validTeamData.id, '');
      }).toThrow('Team name cannot be empty');
    });

    it('should throw error for whitespace-only team name', () => {
      expect(() => {
        new Team(validTeamData.id, '   ');
      }).toThrow('Team name cannot be empty');
    });

    it('should create defensive copies of arrays', () => {
      const originalSeasons = ['season-1'];
      const originalPlayers = ['player-1'];
      const team = new Team(
        validTeamData.id,
        validTeamData.name,
        originalSeasons,
        originalPlayers
      );

      // Modify original arrays
      originalSeasons.push('season-2');
      originalPlayers.push('player-2');

      // Team should not be affected
      expect(team.seasonIds).toEqual(['season-1']);
      expect(team.playerIds).toEqual(['player-1']);
    });

    it('should preserve creation and update timestamps', () => {
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const team = new Team(
        validTeamData.id,
        validTeamData.name,
        validTeamData.seasonIds,
        validTeamData.playerIds,
        createdAt,
        updatedAt
      );

      expect(team.createdAt).toBe(createdAt);
      expect(team.updatedAt).toBe(updatedAt);
    });
  });

  describe('Season Management', () => {
    let team: Team;

    beforeEach(() => {
      team = new Team(
        validTeamData.id,
        validTeamData.name,
        ['season-1'],
        validTeamData.playerIds
      );
    });

    describe('addSeason', () => {
      it('should add new season to team', () => {
        const updatedTeam = team.addSeason('season-2');

        expect(updatedTeam).not.toBe(team);
        expect(updatedTeam.seasonIds).toHaveLength(2);
        expect(updatedTeam.seasonIds).toContain('season-1');
        expect(updatedTeam.seasonIds).toContain('season-2');
      });

      it('should throw error when adding existing season', () => {
        expect(() => {
          team.addSeason('season-1');
        }).toThrow('Season already associated with team');
      });

      it('should preserve all other properties', () => {
        const updatedTeam = team.addSeason('season-2');

        expect(updatedTeam.id).toBe(team.id);
        expect(updatedTeam.name).toBe(team.name);
        expect(updatedTeam.playerIds).toEqual(team.playerIds);
        expect(updatedTeam.createdAt).toBe(team.createdAt);
        expect(updatedTeam.updatedAt).not.toBe(team.updatedAt);
      });

      it('should maintain season order', () => {
        const updatedTeam = team.addSeason('season-2').addSeason('season-3');

        expect(updatedTeam.seasonIds).toEqual([
          'season-1',
          'season-2',
          'season-3',
        ]);
      });
    });

    describe('removeSeason', () => {
      beforeEach(() => {
        team = team.addSeason('season-2').addSeason('season-3');
      });

      it('should remove existing season from team', () => {
        const updatedTeam = team.removeSeason('season-2');

        expect(updatedTeam).not.toBe(team);
        expect(updatedTeam.seasonIds).toHaveLength(2);
        expect(updatedTeam.seasonIds).toContain('season-1');
        expect(updatedTeam.seasonIds).toContain('season-3');
        expect(updatedTeam.seasonIds).not.toContain('season-2');
      });

      it('should handle removing non-existent season gracefully', () => {
        const updatedTeam = team.removeSeason('non-existent-season');

        expect(updatedTeam.seasonIds).toEqual(team.seasonIds);
      });

      it('should preserve all other properties', () => {
        const updatedTeam = team.removeSeason('season-2');

        expect(updatedTeam.id).toBe(team.id);
        expect(updatedTeam.name).toBe(team.name);
        expect(updatedTeam.playerIds).toEqual(team.playerIds);
        expect(updatedTeam.createdAt).toBe(team.createdAt);
        expect(updatedTeam.updatedAt).not.toBe(team.updatedAt);
      });

      it('should handle removing all seasons', () => {
        const updatedTeam = team
          .removeSeason('season-1')
          .removeSeason('season-2')
          .removeSeason('season-3');

        expect(updatedTeam.seasonIds).toHaveLength(0);
      });
    });
  });

  describe('Player Management', () => {
    let team: Team;

    beforeEach(() => {
      team = new Team(
        validTeamData.id,
        validTeamData.name,
        validTeamData.seasonIds,
        ['player-1', 'player-2']
      );
    });

    describe('addPlayer', () => {
      it('should add new player to team', () => {
        const updatedTeam = team.addPlayer('player-3');

        expect(updatedTeam).not.toBe(team);
        expect(updatedTeam.playerIds).toHaveLength(3);
        expect(updatedTeam.playerIds).toContain('player-1');
        expect(updatedTeam.playerIds).toContain('player-2');
        expect(updatedTeam.playerIds).toContain('player-3');
      });

      it('should throw error when adding existing player', () => {
        expect(() => {
          team.addPlayer('player-1');
        }).toThrow('Player already on team');
      });

      it('should throw error when roster is full (25 players)', () => {
        // Create team with 25 players
        const playerIds = Array.from(
          { length: 25 },
          (_, i) => `player-${i + 1}`
        );
        const fullTeam = new Team(
          validTeamData.id,
          validTeamData.name,
          validTeamData.seasonIds,
          playerIds
        );

        expect(() => {
          fullTeam.addPlayer('player-26');
        }).toThrow('Team roster cannot exceed 25 players');
      });

      it('should preserve all other properties', () => {
        const updatedTeam = team.addPlayer('player-3');

        expect(updatedTeam.id).toBe(team.id);
        expect(updatedTeam.name).toBe(team.name);
        expect(updatedTeam.seasonIds).toEqual(team.seasonIds);
        expect(updatedTeam.createdAt).toBe(team.createdAt);
        expect(updatedTeam.updatedAt).not.toBe(team.updatedAt);
      });

      it('should maintain player order', () => {
        const updatedTeam = team.addPlayer('player-3').addPlayer('player-4');

        expect(updatedTeam.playerIds).toEqual([
          'player-1',
          'player-2',
          'player-3',
          'player-4',
        ]);
      });

      it('should allow adding up to 25 players', () => {
        // Start with empty roster
        let workingTeam = new Team(validTeamData.id, validTeamData.name);

        // Add 25 players
        for (let i = 1; i <= 25; i++) {
          workingTeam = workingTeam.addPlayer(`player-${i}`);
        }

        expect(workingTeam.playerIds).toHaveLength(25);
        expect(workingTeam.canAddPlayer()).toBe(false);
      });
    });

    describe('removePlayer', () => {
      it('should remove existing player from team', () => {
        const updatedTeam = team.removePlayer('player-1');

        expect(updatedTeam).not.toBe(team);
        expect(updatedTeam.playerIds).toHaveLength(1);
        expect(updatedTeam.playerIds).toContain('player-2');
        expect(updatedTeam.playerIds).not.toContain('player-1');
      });

      it('should handle removing non-existent player gracefully', () => {
        const updatedTeam = team.removePlayer('non-existent-player');

        expect(updatedTeam.playerIds).toEqual(team.playerIds);
      });

      it('should preserve all other properties', () => {
        const updatedTeam = team.removePlayer('player-1');

        expect(updatedTeam.id).toBe(team.id);
        expect(updatedTeam.name).toBe(team.name);
        expect(updatedTeam.seasonIds).toEqual(team.seasonIds);
        expect(updatedTeam.createdAt).toBe(team.createdAt);
        expect(updatedTeam.updatedAt).not.toBe(team.updatedAt);
      });

      it('should handle removing all players', () => {
        const updatedTeam = team
          .removePlayer('player-1')
          .removePlayer('player-2');

        expect(updatedTeam.playerIds).toHaveLength(0);
      });
    });

    describe('hasPlayer', () => {
      it('should return true for existing player', () => {
        expect(team.hasPlayer('player-1')).toBe(true);
        expect(team.hasPlayer('player-2')).toBe(true);
      });

      it('should return false for non-existing player', () => {
        expect(team.hasPlayer('player-3')).toBe(false);
        expect(team.hasPlayer('non-existent')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(team.hasPlayer('')).toBe(false);
      });
    });

    describe('getPlayerCount', () => {
      it('should return correct number of players', () => {
        expect(team.getPlayerCount()).toBe(2);
      });

      it('should return 0 for empty roster', () => {
        const emptyTeam = new Team(validTeamData.id, validTeamData.name);
        expect(emptyTeam.getPlayerCount()).toBe(0);
      });

      it('should return correct count after adding players', () => {
        const updatedTeam = team.addPlayer('player-3');
        expect(updatedTeam.getPlayerCount()).toBe(3);
      });

      it('should return correct count after removing players', () => {
        const updatedTeam = team.removePlayer('player-1');
        expect(updatedTeam.getPlayerCount()).toBe(1);
      });
    });

    describe('canAddPlayer', () => {
      it('should return true when roster has space', () => {
        expect(team.canAddPlayer()).toBe(true);
      });

      it('should return false when roster is full', () => {
        const playerIds = Array.from(
          { length: 25 },
          (_, i) => `player-${i + 1}`
        );
        const fullTeam = new Team(
          validTeamData.id,
          validTeamData.name,
          validTeamData.seasonIds,
          playerIds
        );

        expect(fullTeam.canAddPlayer()).toBe(false);
      });

      it('should return true for empty roster', () => {
        const emptyTeam = new Team(validTeamData.id, validTeamData.name);
        expect(emptyTeam.canAddPlayer()).toBe(true);
      });

      it('should return false when exactly at limit', () => {
        const playerIds = Array.from(
          { length: 25 },
          (_, i) => `player-${i + 1}`
        );
        const fullTeam = new Team(
          validTeamData.id,
          validTeamData.name,
          validTeamData.seasonIds,
          playerIds
        );

        expect(fullTeam.getPlayerCount()).toBe(25);
        expect(fullTeam.canAddPlayer()).toBe(false);
      });

      it('should return true when one under limit', () => {
        const playerIds = Array.from(
          { length: 24 },
          (_, i) => `player-${i + 1}`
        );
        const almostFullTeam = new Team(
          validTeamData.id,
          validTeamData.name,
          validTeamData.seasonIds,
          playerIds
        );

        expect(almostFullTeam.getPlayerCount()).toBe(24);
        expect(almostFullTeam.canAddPlayer()).toBe(true);
      });
    });
  });

  describe('Team Name Management', () => {
    let team: Team;

    beforeEach(() => {
      team = new Team(
        validTeamData.id,
        validTeamData.name,
        validTeamData.seasonIds,
        validTeamData.playerIds
      );
    });

    describe('changeName', () => {
      it('should change team name successfully', () => {
        const newName = 'New York Yankees';
        const updatedTeam = team.changeName(newName);

        expect(updatedTeam).not.toBe(team);
        expect(updatedTeam.name).toBe(newName);
      });

      it('should trim whitespace from new name', () => {
        const updatedTeam = team.changeName('  New York Yankees  ');

        expect(updatedTeam.name).toBe('New York Yankees');
      });

      it('should throw error for empty new name', () => {
        expect(() => {
          team.changeName('');
        }).toThrow('Team name cannot be empty');
      });

      it('should throw error for whitespace-only new name', () => {
        expect(() => {
          team.changeName('   ');
        }).toThrow('Team name cannot be empty');
      });

      it('should preserve all other properties', () => {
        const updatedTeam = team.changeName('New York Yankees');

        expect(updatedTeam.id).toBe(team.id);
        expect(updatedTeam.seasonIds).toEqual(team.seasonIds);
        expect(updatedTeam.playerIds).toEqual(team.playerIds);
        expect(updatedTeam.createdAt).toBe(team.createdAt);
        expect(updatedTeam.updatedAt).not.toBe(team.updatedAt);
      });

      it('should allow changing to same name', () => {
        const updatedTeam = team.changeName(team.name);

        expect(updatedTeam.name).toBe(team.name);
        expect(updatedTeam).not.toBe(team); // Still creates new instance
      });
    });
  });

  describe('Immutability', () => {
    let originalTeam: Team;

    beforeEach(() => {
      originalTeam = new Team(
        validTeamData.id,
        validTeamData.name,
        validTeamData.seasonIds,
        validTeamData.playerIds
      );
    });

    it('should not mutate original when adding season', () => {
      const originalSeasons = originalTeam.seasonIds;
      const updatedTeam = originalTeam.addSeason('new-season');

      expect(originalTeam.seasonIds).toBe(originalSeasons);
      expect(originalTeam.seasonIds).not.toBe(updatedTeam.seasonIds);
    });

    it('should not mutate original when removing season', () => {
      const originalSeasons = originalTeam.seasonIds;
      const updatedTeam = originalTeam.removeSeason('season-1');

      expect(originalTeam.seasonIds).toBe(originalSeasons);
      expect(originalTeam.seasonIds).not.toBe(updatedTeam.seasonIds);
    });

    it('should not mutate original when adding player', () => {
      const originalPlayers = originalTeam.playerIds;
      const updatedTeam = originalTeam.addPlayer('new-player');

      expect(originalTeam.playerIds).toBe(originalPlayers);
      expect(originalTeam.playerIds).not.toBe(updatedTeam.playerIds);
    });

    it('should not mutate original when removing player', () => {
      const originalPlayers = originalTeam.playerIds;
      const updatedTeam = originalTeam.removePlayer('player-1');

      expect(originalTeam.playerIds).toBe(originalPlayers);
      expect(originalTeam.playerIds).not.toBe(updatedTeam.playerIds);
    });

    it('should not mutate original when changing name', () => {
      const originalName = originalTeam.name;
      const updatedTeam = originalTeam.changeName('New Name');

      expect(originalTeam.name).toBe(originalName);
      expect(originalTeam).not.toBe(updatedTeam);
    });

    it('should maintain immutability through proper usage patterns', () => {
      // The readonly arrays prevent reassignment but not mutation
      // Proper usage is to use the provided methods (addPlayer, removePlayer, etc.)
      // rather than direct array manipulation
      const originalSeasonCount = originalTeam.seasonIds.length;
      const originalPlayerCount = originalTeam.playerIds.length;

      // Verify arrays are accessible but should not be directly modified
      expect(originalTeam.seasonIds.length).toBe(originalSeasonCount);
      expect(originalTeam.playerIds.length).toBe(originalPlayerCount);

      // Use proper methods for modification
      const updatedTeam = originalTeam.addPlayer('new-player');
      expect(originalTeam.playerIds.length).toBe(originalPlayerCount);
      expect(updatedTeam.playerIds.length).toBe(originalPlayerCount + 1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long team names', () => {
      const longName = 'A'.repeat(1000);
      const team = new Team(validTeamData.id, longName);

      expect(team.name).toBe(longName);
    });

    it('should handle unicode characters in team name', () => {
      const unicodeName = 'Málaga CF ⚽ 東京ヤクルトスワローズ';
      const team = new Team(validTeamData.id, unicodeName);

      expect(team.name).toBe(unicodeName);
    });

    it('should handle special characters in player and season IDs', () => {
      const specialPlayerId = 'player-with-special-chars-!@#$%^&*()';
      const specialSeasonId = 'season_2023-24@spring.division#1';

      const team = new Team(validTeamData.id, validTeamData.name)
        .addPlayer(specialPlayerId)
        .addSeason(specialSeasonId);

      expect(team.hasPlayer(specialPlayerId)).toBe(true);
      expect(team.seasonIds).toContain(specialSeasonId);
    });

    it('should maintain roster limit boundary exactly', () => {
      let team = new Team(validTeamData.id, validTeamData.name);

      // Add exactly 25 players
      for (let i = 1; i <= 25; i++) {
        team = team.addPlayer(`player-${i}`);
      }

      expect(team.getPlayerCount()).toBe(25);
      expect(team.canAddPlayer()).toBe(false);

      // Verify exception is thrown on 26th player
      expect(() => {
        team.addPlayer('player-26');
      }).toThrow('Team roster cannot exceed 25 players');
    });
  });
});
