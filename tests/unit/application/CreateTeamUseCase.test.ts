import {
  CreateTeamUseCase,
  CreateTeamCommand,
} from '@/application/use-cases/CreateTeamUseCase';
import { Team, TeamRepository } from '@/domain';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('CreateTeamUseCase', () => {
  let useCase: CreateTeamUseCase;
  let mockTeamRepository: jest.Mocked<TeamRepository>;

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repository
    mockTeamRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findBySeasonId: jest.fn(),
      findByName: jest.fn(),
      delete: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      addSeason: jest.fn(),
      removeSeason: jest.fn(),
      search: jest.fn(),
    };

    useCase = new CreateTeamUseCase(mockTeamRepository);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('execute', () => {
    it('should create a new team successfully', async () => {
      const command: CreateTeamCommand = {
        name: 'Red Sox',
        seasonIds: ['season1'],
        playerIds: ['player1', 'player2'],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe('Red Sox');
      expect(result.value!.seasonIds).toEqual(['season1']);
      expect(result.value!.playerIds).toEqual(['player1', 'player2']);

      expect(mockTeamRepository.findByName).toHaveBeenCalledWith('Red Sox');
      expect(mockTeamRepository.save).toHaveBeenCalled();
    });

    it('should fail when team name already exists', async () => {
      const command: CreateTeamCommand = {
        name: 'Red Sox',
        seasonIds: ['season1'],
        playerIds: [],
      };

      const existingTeam = new Team('existing', 'Red Sox', [], []);
      mockTeamRepository.findByName.mockResolvedValue(existingTeam);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name Red Sox already exists');
      expect(mockTeamRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when team name is empty', async () => {
      const command: CreateTeamCommand = {
        name: '',
        seasonIds: [],
        playerIds: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name cannot be empty');
      expect(mockTeamRepository.findByName).not.toHaveBeenCalled();
      expect(mockTeamRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when team name contains only whitespace', async () => {
      const command: CreateTeamCommand = {
        name: '   ',
        seasonIds: [],
        playerIds: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name cannot be empty');
    });

    it('should create team with empty season and player lists', async () => {
      const command: CreateTeamCommand = {
        name: 'Red Sox',
        seasonIds: [],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.seasonIds).toEqual([]);
      expect(result.value!.playerIds).toEqual([]);
    });

    it('should trim team name whitespace', async () => {
      const command: CreateTeamCommand = {
        name: '  Dodgers  ',
        seasonIds: [],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Dodgers');
      expect(mockTeamRepository.findByName).toHaveBeenCalledWith('  Dodgers  ');
    });

    it('should handle repository save failure', async () => {
      const command: CreateTeamCommand = {
        name: 'Giants',
        seasonIds: [],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to create team: Database error');
    });

    it('should handle repository findByName failure', async () => {
      const command: CreateTeamCommand = {
        name: 'Angels',
        seasonIds: [],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Failed to create team: Database connection failed'
      );
    });

    it('should validate maximum team name length', async () => {
      const command: CreateTeamCommand = {
        name: 'A'.repeat(101), // Assuming 100 char limit
        seasonIds: [],
        playerIds: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name cannot exceed 100 characters');
    });

    it('should generate unique team ID', async () => {
      const command: CreateTeamCommand = {
        name: 'Cardinals',
        seasonIds: [],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result1 = await useCase.execute(command);
      const result2 = await useCase.execute({ ...command, name: 'Cardinals2' });

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result1.value!.id).not.toBe(result2.value!.id);
    });

    it('should validate season IDs format', async () => {
      const command: CreateTeamCommand = {
        name: 'Mets',
        seasonIds: ['', 'season1', null as any],
        playerIds: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'All season IDs must be valid non-empty strings'
      );
    });

    it('should validate player IDs format', async () => {
      const command: CreateTeamCommand = {
        name: 'Phillies',
        seasonIds: [],
        playerIds: ['player1', '', null as any],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'All player IDs must be valid non-empty strings'
      );
    });

    it('should handle case-insensitive name checking', async () => {
      const command: CreateTeamCommand = {
        name: 'YANKEES',
        seasonIds: [],
        playerIds: [],
      };

      const existingTeam = new Team('existing', 'red sox', [], []);
      mockTeamRepository.findByName.mockResolvedValue(existingTeam);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name YANKEES already exists');
    });
  });

  describe('business rules validation', () => {
    it('should enforce team name uniqueness across all seasons', async () => {
      const command: CreateTeamCommand = {
        name: 'Red Sox',
        seasonIds: ['season2'],
        playerIds: [],
      };

      // Team exists in different season
      const existingTeam = new Team('existing', 'Red Sox', ['season1'], []);
      mockTeamRepository.findByName.mockResolvedValue(existingTeam);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team name Red Sox already exists');
    });

    it('should allow duplicate season IDs in seasonIds array', async () => {
      const command: CreateTeamCommand = {
        name: 'Brewers',
        seasonIds: ['season1', 'season1', 'season2'],
        playerIds: [],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      // Should deduplicate automatically
      expect(result.value!.seasonIds).toEqual(['season1', 'season2']);
    });

    it('should allow duplicate player IDs in playerIds array', async () => {
      const command: CreateTeamCommand = {
        name: 'Astros',
        seasonIds: [],
        playerIds: ['player1', 'player1', 'player2'],
      };

      mockTeamRepository.findByName.mockResolvedValue(null);
      mockTeamRepository.save.mockImplementation(async (team) => team);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      // Should deduplicate automatically
      expect(result.value!.playerIds).toEqual(['player1', 'player2']);
    });
  });
});
