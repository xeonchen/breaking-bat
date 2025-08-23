import {
  RecordAtBatUseCase,
  RecordAtBatCommand,
} from '@/application/use-cases/RecordAtBatUseCase';
import { IAtBatRepository, IGameRepository } from '@/domain';
import { Game } from '@/domain/entities/Game';
import { BattingResult } from '@/domain/values/BattingResult';
import { BaserunnerState } from '@/domain/values/BaserunnerState';
import { Scoreboard } from '@/domain/values/Scoreboard';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('RecordAtBatUseCase', () => {
  let useCase: RecordAtBatUseCase;
  let mockAtBatRepository: jest.Mocked<IAtBatRepository>;
  let mockGameRepository: jest.Mocked<IGameRepository>;

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repositories
    mockAtBatRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByGameId: jest.fn(),
      findByBatterId: jest.fn(),
      findByInning: jest.fn(),
      findByResult: jest.fn(),
      delete: jest.fn(),
      getPlayerStats: jest.fn(),
    };

    mockGameRepository = {
      findById: jest.fn(),
      findCurrent: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findByTeamId: jest.fn(),
      findBySeasonId: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn(),
      getLineup: jest.fn(),
      saveLineup: jest.fn(),
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
        result: BattingResult.single(),
        description: 'Single to center field',
        rbi: 1,
        baserunnersBefore: new BaserunnerState(null, null, 'player2'),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: ['player2'],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );

      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.result).toEqual(BattingResult.single());
      expect(result.value!.rbis).toBe(1);
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
        result: BattingResult.homeRun(),
        description: 'Grand slam home run',
        rbi: 4,
        baserunnersBefore: new BaserunnerState('player2', 'player3', 'player4'),
        baserunnersAfter: BaserunnerState.empty(),
        runsScored: ['player2', 'player3', 'player4', 'player1'],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game 2',
        'Opponent Team 2',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );

      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.result).toEqual(BattingResult.homeRun());
      expect(result.value!.rbis).toBe(4);
      expect(result.value!.runsScored).toHaveLength(4);
      // Game score is not updated by RecordAtBatUseCase - handled at inning/game level
      // Note: Game entity doesn't track ourScore - that's handled at GameSession level
    });

    it('should record a strikeout with no RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 2,
        isTopInning: true,
        result: BattingResult.strikeout(),
        description: 'Swinging strikeout',
        rbi: 0,
        baserunnersBefore: new BaserunnerState('player2', null, null),
        baserunnersAfter: new BaserunnerState('player2', null, null),
        runsScored: [],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game 3',
        'Opponent Team 3',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );

      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.result).toEqual(BattingResult.strikeout());
      expect(result.value!.rbis).toBe(0);
      expect(result.value!.runsScored).toHaveLength(0);
      // Note: Game entity doesn't track ourScore - that's handled at GameSession level
    });

    it('should fail when game is not found', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'nonexistent',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: -1,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 2,
        baserunnersBefore: new BaserunnerState(null, null, 'player2'),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: ['player2'],
        runningErrors: [], // Only 1 run but RBI is 2
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'RBI count must match the number of runs scored'
      );
    });

    it('should validate description length', async () => {
      const longDescription = 'A'.repeat(501); // Assuming 500 char limit

      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.single(),
        description: longDescription,
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.single(),
        description: '',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
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
        result: BattingResult.single(),
        description: 'Single',
        rbi: 0,
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
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
    });
  });

  describe('business rules validation', () => {
    it('should enforce that home runs clear all bases', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.homeRun(),
        description: 'Home run',
        rbi: 2,
        baserunnersBefore: new BaserunnerState(null, 'player2', null),
        baserunnersAfter: BaserunnerState.empty(),
        runsScored: ['player2', 'player1'],
        runningErrors: [],
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.baserunnersAfter.firstBase).toBeNull();
      expect(result.value!.baserunnersAfter.secondBase).toBeNull();
      expect(result.value!.baserunnersAfter.thirdBase).toBeNull();
    });

    it('should validate strikeout has no RBIs', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.strikeout(),
        description: 'Strikeout',
        rbi: 1, // Invalid - strikeouts can't have RBIs
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: BaserunnerState.empty(),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.groundOut(),
        description: 'Groundout',
        rbi: 1, // Invalid - groundouts can't have RBIs (unless sacrifice)
        baserunnersBefore: BaserunnerState.empty(),
        baserunnersAfter: BaserunnerState.empty(),
        runsScored: [],
        runningErrors: [],
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
        result: BattingResult.homeRun(),
        description: 'Home run',
        rbi: 5, // Invalid - max 4 RBIs (bases loaded grand slam)
        baserunnersBefore: new BaserunnerState('player2', 'player3', 'player4'),
        baserunnersAfter: BaserunnerState.empty(),
        runsScored: ['player2', 'player3', 'player4', 'player1', 'extra'],
        runningErrors: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Maximum RBI per at-bat is 4');
    });

    it('should record running errors when players make base running mistakes', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.single(),
        description: 'Single, runner thrown out at 3rd',
        rbi: 0,
        baserunnersBefore: new BaserunnerState('player2', null, null),
        baserunnersAfter: new BaserunnerState('player1', null, null),
        runsScored: [],
        runningErrors: ['player2'], // Player2 made running error
      };

      const mockGame = new Game(
        'game1',
        'Test Game',
        'Opponent Team',
        new Date(),
        'season-1',
        'regular',
        'home',
        'team-1',
        'in_progress',
        'lineup-1',
        [],
        Scoreboard.empty()
      );
      mockGameRepository.findById.mockResolvedValue(mockGame);
      mockAtBatRepository.save.mockImplementation(async (atBat) => atBat);
      mockGameRepository.save.mockImplementation(async (game) => game);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.runningErrors).toEqual(['player2']);
      expect(result.value!.hasRunningErrors()).toBe(true);
      expect(result.value!.getRunningErrorCount()).toBe(1);
      expect(result.value!.getSummary()).toContain('[1 running error]');
    });

    it('should validate player cannot score multiple times in same at-bat', async () => {
      const command: RecordAtBatCommand = {
        gameId: 'game1',
        batterId: 'player1',
        inning: 1,
        isTopInning: true,
        result: BattingResult.triple(),
        description: 'Triple',
        rbi: 2,
        baserunnersBefore: new BaserunnerState('player2', 'player2', null), // Same player on multiple bases - invalid
        baserunnersAfter: new BaserunnerState(null, null, 'player1'),
        runsScored: ['player2', 'player2'], // Same player scoring twice
        runningErrors: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'A player cannot score multiple times in the same at-bat'
      );
    });
  });
});
