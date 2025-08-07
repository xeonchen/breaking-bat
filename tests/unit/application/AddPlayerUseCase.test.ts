import {
  AddPlayerUseCase,
  AddPlayerCommand,
} from '@/application/use-cases/AddPlayerUseCase';
import {
  Player,
  Team,
  PlayerRepository,
  TeamRepository,
  Position,
} from '@/domain';
import { Result } from '@/application/common/Result';

// Mock the repositories
class MockPlayerRepository implements PlayerRepository {
  private players: Map<string, Player> = new Map();

  async create(player: Player): Promise<Player> {
    this.players.set(player.id, player);
    return player;
  }

  async findById(id: string): Promise<Player | null> {
    return this.players.get(id) || null;
  }

  async findByTeamId(teamId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter((p) => p.teamId === teamId);
  }

  async update(player: Player): Promise<Player> {
    this.players.set(player.id, player);
    return player;
  }

  async delete(id: string): Promise<void> {
    this.players.delete(id);
  }

  async isJerseyNumberUnique(
    teamId: string,
    jerseyNumber: number
  ): Promise<boolean> {
    const teamPlayers = Array.from(this.players.values()).filter(
      (p) => p.teamId === teamId
    );
    return !teamPlayers.some((p) => p.jerseyNumber === jerseyNumber);
  }
}

class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();

  async save(team: Team): Promise<Team> {
    this.teams.set(team.id, team);
    return team;
  }

  async findById(id: string): Promise<Team | null> {
    return this.teams.get(id) || null;
  }

  async findByName(name: string): Promise<Team | null> {
    return Array.from(this.teams.values()).find((t) => t.name === name) || null;
  }

  async findAll(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async findBySeasonId(seasonId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter((t) =>
      t.seasonIds.includes(seasonId)
    );
  }

  async delete(id: string): Promise<void> {
    this.teams.delete(id);
  }
}

describe('AddPlayerUseCase', () => {
  let addPlayerUseCase: AddPlayerUseCase;
  let mockPlayerRepository: MockPlayerRepository;
  let mockTeamRepository: MockTeamRepository;
  let mockTeam: Team;

  beforeEach(() => {
    mockPlayerRepository = new MockPlayerRepository();
    mockTeamRepository = new MockTeamRepository();
    addPlayerUseCase = new AddPlayerUseCase(
      mockPlayerRepository,
      mockTeamRepository
    );

    // Create a mock team
    mockTeam = new Team('team-1', 'Test Team', 'TT');
    mockTeamRepository.save(mockTeam);
  });

  describe('Successful Player Addition', () => {
    it('should successfully add a player with valid data', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe('John Doe');
      expect(result.value!.jerseyNumber).toBe(10);
      expect(result.value!.teamId).toBe('team-1');
      expect(result.value!.positions).toEqual([Position.PITCHER]);
      expect(result.value!.isActive).toBe(true);
    });

    it('should trim player name whitespace', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: '  John Doe  ',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('John Doe');
    });

    it('should handle multiple positions', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'Utility Player',
        jerseyNumber: 15,
        positions: [
          Position.SHORTSTOP,
          Position.SECOND_BASE,
          Position.THIRD_BASE,
        ],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.positions).toEqual([
        Position.SHORTSTOP,
        Position.SECOND_BASE,
        Position.THIRD_BASE,
      ]);
    });

    it('should add inactive player', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'Inactive Player',
        jerseyNumber: 20,
        positions: [Position.OUTFIELD],
        isActive: false,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.isActive).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when player name is empty', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: '',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should fail when player name is only whitespace', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: '   ',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should fail when player name exceeds 100 characters', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'A'.repeat(101),
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Player name cannot exceed 100 characters');
    });

    it('should fail when jersey number is not an integer', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10.5,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Jersey number must be a valid integer');
    });

    it('should fail when jersey number is negative', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: -1,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Jersey number must be between 0 and 999');
    });

    it('should fail when jersey number exceeds 999', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 1000,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Jersey number must be between 0 and 999');
    });

    it('should fail when team ID is empty', async () => {
      const command: AddPlayerCommand = {
        teamId: '',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team ID is required');
    });

    it('should fail when team ID is only whitespace', async () => {
      const command: AddPlayerCommand = {
        teamId: '   ',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team ID is required');
    });

    it('should fail when positions array is empty', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('At least one position is required');
    });

    it('should fail when positions array is null', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: null as any,
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('At least one position is required');
    });
  });

  describe('Business Rule Violations', () => {
    it('should fail when team does not exist', async () => {
      const command: AddPlayerCommand = {
        teamId: 'non-existent-team',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team with id non-existent-team not found');
    });

    it('should fail when team roster is full', async () => {
      // Create a team with full roster (25 players is the limit)
      let fullTeam = new Team('full-team', 'Full Team', 'FT');
      // Simulate full roster by adding 25 players to the team
      for (let i = 0; i < 25; i++) {
        fullTeam = fullTeam.addPlayer(`player-${i}`);
      }
      await mockTeamRepository.save(fullTeam);

      const command: AddPlayerCommand = {
        teamId: 'full-team',
        name: 'Overflow Player',
        jerseyNumber: 26,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team roster is full (maximum 25 players)');
    });

    it('should fail when jersey number is already in use', async () => {
      // Add first player
      const firstCommand: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'First Player',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };
      await addPlayerUseCase.execute(firstCommand);

      // Try to add second player with same jersey number
      const secondCommand: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'Second Player',
        jerseyNumber: 10,
        positions: [Position.CATCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(secondCommand);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Jersey number 10 is already in use for this team'
      );
    });

    it('should allow same jersey number on different teams', async () => {
      // Create second team
      const team2 = new Team('team-2', 'Second Team', 'ST');
      await mockTeamRepository.save(team2);

      // Add player to first team
      const firstCommand: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'First Player',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };
      await addPlayerUseCase.execute(firstCommand);

      // Add player with same jersey number to second team
      const secondCommand: AddPlayerCommand = {
        teamId: 'team-2',
        name: 'Second Player',
        jerseyNumber: 10,
        positions: [Position.CATCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(secondCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.jerseyNumber).toBe(10);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      jest
        .spyOn(mockPlayerRepository, 'create')
        .mockRejectedValue(new Error('Database error'));

      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to add player: Database error');
    });

    it('should handle team repository save error', async () => {
      // Mock team repository save to throw error
      jest
        .spyOn(mockTeamRepository, 'save')
        .mockRejectedValue(new Error('Team save failed'));

      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to add player: Team save failed');
    });

    it('should handle jersey number uniqueness check error', async () => {
      // Mock jersey uniqueness check to throw error
      jest
        .spyOn(mockPlayerRepository, 'isJerseyNumberUnique')
        .mockRejectedValue(new Error('Uniqueness check failed'));

      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Failed to add player: Uniqueness check failed'
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Mock repository to throw non-Error object
      jest
        .spyOn(mockPlayerRepository, 'create')
        .mockRejectedValue('String error');

      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'John Doe',
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to add player: String error');
    });
  });

  describe('Boundary Value Testing', () => {
    it('should accept 100 character name', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'A'.repeat(100),
        jerseyNumber: 10,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
    });

    it('should accept jersey number 0', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'Player Zero',
        jerseyNumber: 0,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.jerseyNumber).toBe(0);
    });

    it('should accept jersey number 999', async () => {
      const command: AddPlayerCommand = {
        teamId: 'team-1',
        name: 'Player 999',
        jerseyNumber: 999,
        positions: [Position.PITCHER],
        isActive: true,
      };

      const result = await addPlayerUseCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.jerseyNumber).toBe(999);
    });
  });
});
