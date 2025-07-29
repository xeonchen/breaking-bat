import {
  CreateGameUseCase,
  CreateGameCommand,
} from '@/application/use-cases/CreateGameUseCase';
import { GameRepository, GameStatus } from '@/domain';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('CreateGameUseCase', () => {
  let useCase: CreateGameUseCase;
  let mockGameRepository: jest.Mocked<GameRepository>;

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repository
    mockGameRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByTeamId: jest.fn(),
      findBySeasonId: jest.fn(),
      findByDateRange: jest.fn(),
      findByOpponent: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      getGameStatistics: jest.fn(),
      searchByOpponent: jest.fn(),
    };

    useCase = new CreateGameUseCase(mockGameRepository);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('execute', () => {
    it('should create a new game successfully', async () => {
      const command: CreateGameCommand = {
        name: 'Season Opener',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: false,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe('Season Opener');
      expect(result.value!.teamId).toBe('team1');
      expect(result.value!.opponent).toBe('Red Sox');
      expect(result.value!.status).toBe(GameStatus.SETUP);
      expect(result.value!.isHomeGame).toBe(false);

      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('should fail when game name is empty', async () => {
      const command: CreateGameCommand = {
        name: '',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Season ID is required');
    });

    it('should fail when game type ID is empty', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: '',
        opponent: 'Red Sox',
        date: new Date('2024-04-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game type ID is required');
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
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
    });

    it('should validate time format', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: 'invalid-time',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Time must be in HH:MM format');
    });

    it('should accept valid time formats', async () => {
      const validTimes = ['14:00', '09:30', '23:45', '00:00'];

      for (const time of validTimes) {
        const command: CreateGameCommand = {
          name: `Test Game ${time}`,
          teamId: 'team1',
          seasonId: 'season1',
          gameTypeId: 'regular',
          opponent: 'Red Sox',
          date: new Date('2024-12-01'),
          time,
          location: 'Fenway Park',
          isHomeGame: true,
        };

        mockGameRepository.save.mockImplementation(async (game) => game);

        const result = await useCase.execute(command);

        expect(result.isSuccess).toBe(true);
      }
    });

    it('should trim whitespace from string fields', async () => {
      const command: CreateGameCommand = {
        name: '  Championship Game  ',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: '  Yankees  ',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: '  Yankee Stadium  ',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Championship Game');
      expect(result.value!.opponent).toBe('Yankees');
      expect(result.value!.location).toBe('Yankee Stadium');
    });

    it('should handle optional location field', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: '',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.location).toBe('');
    });

    it('should generate unique game ID', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result1 = await useCase.execute(command);
      const result2 = await useCase.execute({
        ...command,
        name: 'Test Game 2',
      });

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result1.value!.id).not.toBe(result2.value!.id);
    });

    it('should initialize game with setup status and empty statistics', async () => {
      const command: CreateGameCommand = {
        name: 'New Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(GameStatus.SETUP);
      expect(result.value!.ourScore).toBe(0);
      expect(result.value!.opponentScore).toBe(0);
      expect(result.value!.currentInning).toBe(1);
      expect(result.value!.isTopInning).toBe(true);
    });

    it('should handle repository save failure', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
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
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Opponent name cannot exceed 100 characters');
    });

    it('should validate maximum location length', async () => {
      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'A'.repeat(201), // Assuming 200 char limit
        isHomeGame: true,
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Location cannot exceed 200 characters');
    });
  });

  describe('business rules validation', () => {
    it('should set correct initial game state for home games', async () => {
      const command: CreateGameCommand = {
        name: 'Home Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Our Stadium',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.isHomeGame).toBe(true);
      expect(result.value!.isTopInning).toBe(true); // Visitors bat first
    });

    it('should set correct initial game state for away games', async () => {
      const command: CreateGameCommand = {
        name: 'Away Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: false,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.isHomeGame).toBe(false);
      expect(result.value!.isTopInning).toBe(true); // We bat first as visitors
    });

    it('should create game with current timestamp', async () => {
      const beforeTime = new Date();

      const command: CreateGameCommand = {
        name: 'Test Game',
        teamId: 'team1',
        seasonId: 'season1',
        gameTypeId: 'regular',
        opponent: 'Red Sox',
        date: new Date('2024-12-01'),
        time: '14:00',
        location: 'Fenway Park',
        isHomeGame: true,
      };

      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);
      const afterTime = new Date();

      expect(result.isSuccess).toBe(true);
      expect(result.value!.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(result.value!.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
      expect(result.value!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(result.value!.updatedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });
  });
});
