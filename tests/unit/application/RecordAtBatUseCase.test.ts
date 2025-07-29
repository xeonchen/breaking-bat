import {
  RecordAtBatUseCase,
  RecordAtBatCommand,
} from '@/application/use-cases/RecordAtBatUseCase';
import {
  AtBatRepository,
  GameRepository,
  AtBatResult,
} from '@/domain';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('RecordAtBatUseCase', () => {
  let useCase: RecordAtBatUseCase;
  let mockAtBatRepository: jest.Mocked<AtBatRepository>;
  let mockGameRepository: jest.Mocked<GameRepository>;

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repositories
    mockAtBatRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByPlayerId: jest.fn(),
      findByGameId: jest.fn(),
      findByBatterId: jest.fn(),
      delete: jest.fn(),
      getPlayerStatistics: jest.fn(),
    };

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

    useCase = new RecordAtBatUseCase(mockAtBatRepository, mockGameRepository);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('execute', () => {
    it('should record a successful at-bat with single', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single to center field',
        rbi: 1,
        baserunnersBefore: {
          first: null,
          second: null,
          third: 'player2',
        },
        baserunnersAfter: {
          first: 'player1',
          second: null,
          third: null,
        },
        runsScored: ['player2'],
      };

      const mockGame = {
        id: 'game1',
        ourScore: 0,
        currentInning: 1,
        isTopInning: true,
      };

      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.result).toBe(AtBatResult.SINGLE);
      expect(result.value!.rbi).toBe(1);
      expect(result.value!.runsScored).toEqual(['player2']);

      expect(mockAtBatRepository.save).toHaveBeenCalled();
      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('should record a home run with multiple RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 3,
        isTopInning: false,
        result: AtBatResult.HOME_RUN,
        description: 'Grand slam home run',
        rbi: 4,
        baserunnersBefore: {
          first: 'player2',
          second: 'player3',
          third: 'player4',
        },
        baserunnersAfter: {
          first: null,
          second: null,
          third: null,
        },
        runsScored: ['player2', 'player3', 'player4', 'player1'],
      };

      const mockGame = {
        id: 'game1',
        ourScore: 2,
        currentInning: 3,
        isTopInning: false,
      };

      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.result).toBe(AtBatResult.HOME_RUN);
      expect(result.value!.rbi).toBe(4);
      expect(result.value!.runsScored).toHaveLength(4);
      expect((mockGame as any).ourScore).toBe(6); // 2 + 4 RBIs
    });

    it('should record a strikeout with no RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 2,
        isTopInning: true,
        result: AtBatResult.STRIKEOUT,
        description: 'Swinging strikeout',
        rbi: 0,
        baserunnersBefore: {
          first: 'player2',
          second: null,
          third: null,
        },
        baserunnersAfter: {
          first: 'player2',
          second: null,
          third: null,
        },
        runsScored: [],
      };

      const mockGame = {
        id: 'game1',
        ourScore: 1,
        currentInning: 2,
        isTopInning: true,
      };

      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.result).toBe(AtBatResult.STRIKEOUT);
      expect(result.value!.rbi).toBe(0);
      expect(result.value!.runsScored).toHaveLength(0);
      expect((mockGame as any).ourScore).toBe(1); // No change
    });

    it('should fail when game is not found', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'nonexistent',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      mockGameRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    it('should fail when batter ID is empty', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: '',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batter ID is required');
    });

    it('should fail when inning is invalid', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 0,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Inning must be a positive number');
    });

    it('should fail when RBI is negative', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: -1,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('RBI cannot be negative');
    });

    it('should fail when RBI does not match runs scored', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 2,
        baserunnersBefore: { first: null, second: null, third: 'player2' },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: ['player2'], // Only 1 run but RBI is 2
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('RBI count must match the number of runs scored');
    });

    it('should validate description length', async () => {
      const longDescription = 'A'.repeat(501); // Assuming 500 char limit
      
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: longDescription,
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Description cannot exceed 500 characters');
    });

    it('should allow empty description', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: '',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const mockGame = { id: 'game1', ourScore: 0 };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('');
    });

    it('should handle repository save failure', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const mockGame = { id: 'game1', ourScore: 0 };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to record at-bat: Database error');
    });

    it('should generate unique at-bat ID', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const mockGame = { id: 'game1', ourScore: 0 };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result1 = await useCase.execute(command);
      const result2 = await useCase.execute({
        ...command,
        batterId: 'player2',
      });

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result1.value!.id).not.toBe(result2.value!.id);
    });

    it('should set current timestamp on at-bat', async () => {
      const beforeTime = new Date();

      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.SINGLE,
        description: 'Single',
        rbi: 0,
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: 'player1', second: null, third: null },
        runsScored: [],
      };

      const mockGame = { id: 'game1', ourScore: 0 };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);
      const afterTime = new Date();

      expect(result.isSuccess).toBe(true);
      expect(result.value!.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.value!.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('business rules validation', () => {
    it('should enforce that home runs clear all bases', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.HOME_RUN,
        description: 'Home run',
        rbi: 2,
        baserunnersBefore: {
          first: null,
          second: 'player2',
          third: null,
        },
        baserunnersAfter: {
          first: null,
          second: null,
          third: null,
        },
        runsScored: ['player2', 'player1'],
      };

      const mockGame = { id: 'game1', ourScore: 0 };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.baserunnersAfter.first).toBeNull();
      expect(result.value!.baserunnersAfter.second).toBeNull();
      expect(result.value!.baserunnersAfter.third).toBeNull();
    });

    it('should validate strikeout has no RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.STRIKEOUT,
        description: 'Strikeout',
        rbi: 1, // Invalid - strikeouts can't have RBIs
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: null, second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Strikeouts and groundouts cannot have RBIs');
    });

    it('should validate groundout has no RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.GROUNDOUT,
        description: 'Groundout',
        rbi: 1, // Invalid - groundouts can't have RBIs (unless sacrifice)
        baserunnersBefore: { first: null, second: null, third: null },
        baserunnersAfter: { first: null, second: null, third: null },
        runsScored: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Strikeouts and groundouts cannot have RBIs');
    });

    it('should validate maximum RBI per at-bat', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.HOME_RUN,
        description: 'Home run',
        rbi: 5, // Invalid - max 4 RBIs (bases loaded grand slam)
        baserunnersBefore: {
          first: 'player2',
          second: 'player3',
          third: 'player4',
        },
        baserunnersAfter: { first: null, second: null, third: null },
        runsScored: ['player2', 'player3', 'player4', 'player1', 'extra'],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Maximum RBI per at-bat is 4');
    });

    it('should validate player cannot score multiple times in same at-bat', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: AtBatResult.TRIPLE,
        description: 'Triple',
        rbi: 2,
        baserunnersBefore: {
          first: 'player2',
          second: 'player2', // Same player on multiple bases - invalid
          third: null,
        },
        baserunnersAfter: { first: null, second: null, third: 'player1' },
        runsScored: ['player2', 'player2'], // Same player scoring twice
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('A player cannot score multiple times in the same at-bat');
    });
  });
});