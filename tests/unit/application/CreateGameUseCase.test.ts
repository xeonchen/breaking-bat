import {
  CreateGameUseCase,
  CreateGameCommand,
} from '@/application/use-cases/CreateGameUseCase';
import type { IGameRepository } from '@/domain';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('CreateGameUseCase', () => {
  let useCase: CreateGameUseCase;
  let mockGameRepository: jest.Mocked<IGameRepository>;

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repository
    mockGameRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByTeamId: jest.fn(),
      findBySeasonId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IGameRepository>;

    useCase = new CreateGameUseCase(mockGameRepository);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('execute', () => {
    it('should create a new game successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const command: CreateGameCommand = {
        name: 'Season Opener',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: tomorrow,
        homeAway: 'away',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      if (result.value) {
        expect(result.value.name).toBe('Season Opener');
        expect(result.value.teamId).toBe('team1');
        expect(result.value.opponent).toBe('Red Sox');
        expect(result.value.status).toBe('setup');
        expect(result.value.homeAway).toBe('away');
      }

      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('should fail when game name is empty', async () => {
      const command: CreateGameCommand = {
        name: '',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-04-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game name cannot be empty');
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when opponent name is empty', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: '',
        date: new Date('2025-04-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Opponent name is required');
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when team ID is empty', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: '',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-04-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team ID is required');
    });

    it('should fail when season ID is empty', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: '',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-04-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Season ID cannot be empty when provided');
    });

    it('should fail when game type ID is empty', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: '',
        opponent: 'Red Sox',
        date: new Date('2025-04-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game type ID cannot be empty when provided');
    });

    it('should fail when game date is in the past', async () => {
      const pastDate = new Date('2020-01-01');
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: pastDate,
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game date cannot be in the past');
    });

    it('should allow game date to be today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      const command: CreateGameCommand = {
        name: 'Today Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: today,
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
    });

    // Time validation test removed - time field not in current interface

    // Valid time formats test removed - time field not in current interface

    it('should trim whitespace from string fields', async () => {
      const command: CreateGameCommand = {
        name: '  Championship Game  ',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: '  Yankees  ',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      if (result.value) {
        expect(result.value.name).toBe('Championship Game');
        expect(result.value.opponent).toBe('Yankees');
      }
    });

    // Optional location test removed - location field not in current interface

    it('should generate unique game ID', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result1 = await useCase.execute(command);
      const result2 = await useCase.execute({
        ...command,
        name: 'Test Game 2',
      });

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      if (result1.value && result2.value) {
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it('should initialize game with setup status', async () => {
      const command: CreateGameCommand = {
        name: 'New Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.status).toBe('setup');
        expect(result.value.lineupId).toBeNull();
        expect(result.value.inningIds).toEqual([]);
        expect(result.value.scoreboard).toBeNull();
      }
    });

    it('should handle repository save failure', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: tomorrow,
        homeAway: 'home',
      };

      mockGameRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to create game: Database error');
    });

    it('should validate maximum name length', async () => {
      const command: CreateGameCommand = {
        name: 'A'.repeat(201), // Assuming 200 char limit
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game name cannot exceed 200 characters');
    });

    it('should validate maximum opponent name length', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'A'.repeat(101), // Assuming 100 char limit
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Opponent name cannot exceed 100 characters');
    });

    // Location length validation test removed - location field not in current interface
  });

  describe('business rules validation', () => {
    it('should set correct initial game state for home games', async () => {
      const command: CreateGameCommand = {
        name: 'Home Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.homeAway).toBe('home');
        expect(result.value.isHomeGame()).toBe(true);
      }
    });

    it('should set correct initial game state for away games', async () => {
      const command: CreateGameCommand = {
        name: 'Away Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'away',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.homeAway).toBe('away');
        expect(result.value.isAwayGame()).toBe(true);
      }
    });

    it('should create game with current timestamp', async () => {
      const beforeTime = new Date();

      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);
      const afterTime = new Date();

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(result.value.updatedAt.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      }
    });
  });

  describe('optional fields support', () => {
    it('should create game successfully with null season ID', async () => {
      const command: CreateGameCommand = {
        name: 'Quick Game',
        teamId: 'team1',
        seasonId: null,
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.seasonId).toBeNull();
        expect(result.value.gameTypeId).toBe('regular');
      }
    });

    it('should create game successfully with null game type ID', async () => {
      const command: CreateGameCommand = {
        name: 'Quick Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: null,
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.seasonId).toBe('season1');
        expect(result.value.gameTypeId).toBeNull();
      }
    });

    it('should create game successfully with both season ID and game type ID null', async () => {
      const command: CreateGameCommand = {
        name: 'Pickup Game',
        teamId: 'team1',
        seasonId: null,
        gameTypeId: null,
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      if (result.value) {
        expect(result.value.seasonId).toBeNull();
        expect(result.value.gameTypeId).toBeNull();
        expect(result.value.name).toBe('Pickup Game');
        expect(result.value.opponent).toBe('Red Sox');
      }
    });

    it('should not require season ID validation when null', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: null,
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not require game type ID validation when null', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: null,
        opponent: 'Red Sox',
        date: new Date('2025-12-01'),
        homeAway: 'home',
      };

      mockGameRepository.save.mockImplementation(async (game: any) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
