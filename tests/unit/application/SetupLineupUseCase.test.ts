import {
  SetupLineupUseCase,
  SetupLineupCommand,
  LineupPosition,
} from '@/application/use-cases/SetupLineupUseCase';
import { GameRepository, PlayerRepository, Position } from '@/domain';
import {
  createTestDatabase,
  clearTestDatabase,
} from '../../test-helpers/database';

describe('SetupLineupUseCase', () => {
  let useCase: SetupLineupUseCase;
  let mockGameRepository: jest.Mocked<GameRepository>;
  let mockPlayerRepository: jest.Mocked<PlayerRepository>;

  // Helper function to create a valid 10-player lineup for slowpitch softball
  const createValidLineup = (): LineupPosition[] => [
    { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
    { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
    { battingOrder: 3, playerId: 'player3', position: Position.firstBase() },
    { battingOrder: 4, playerId: 'player4', position: Position.secondBase() },
    { battingOrder: 5, playerId: 'player5', position: Position.thirdBase() },
    { battingOrder: 6, playerId: 'player6', position: Position.shortstop() },
    { battingOrder: 7, playerId: 'player7', position: Position.leftField() },
    { battingOrder: 8, playerId: 'player8', position: Position.centerField() },
    { battingOrder: 9, playerId: 'player9', position: Position.rightField() },
    {
      battingOrder: 10,
      playerId: 'player10',
      position: Position.shortFielder(),
    },
  ];

  beforeEach(async () => {
    await createTestDatabase();

    // Create mock repositories
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

    mockPlayerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByTeamId: jest.fn(),
      findByJerseyNumber: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getPlayerStatistics: jest.fn(),
    };

    useCase = new SetupLineupUseCase(mockGameRepository, mockPlayerRepository);
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('execute', () => {
    it('should setup lineup successfully with 10 players', async () => {
      const lineupPositions = createValidLineup();

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player11', 'player12'],
      };

      const mockGame = {
        id: 'game1',
        lineupPositions: [],
        substitutes: [],
        save: jest.fn(),
      };

      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockGameRepository.save.mockImplementation(async (game) => game);

      // Mock players exist
      for (let i = 1; i <= 12; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
          name: `Player ${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      if (!result.isSuccess) {
        console.log('Setup failed with error:', result.error);
        console.log('Lineup positions count:', lineupPositions.length);
        console.log(
          'Batting orders:',
          lineupPositions.map((lp) => lp.battingOrder)
        );
      }

      expect(result.isSuccess).toBe(true);
      expect(mockGameRepository.findById).toHaveBeenCalledWith('game1');
      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('should fail when game is not found', async () => {
      const command: SetupLineupCommand = {
        gameId: 'nonexistent',
        lineupPositions: createValidLineup(),
        substitutes: [],
      };

      mockGameRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    it('should fail when lineup has less than 10 players', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Lineup must have exactly 10 players');
    });

    it('should fail when lineup has more than 10 players', async () => {
      const lineupPositions: LineupPosition[] = [];
      for (let i = 1; i <= 11; i++) {
        // Actually create 11 players
        lineupPositions.push({
          battingOrder: i,
          playerId: `player${i}`,
          position: Position.pitcher(), // This will test duplicate positions
        });
      }

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Lineup must have exactly 10 players');
    });

    it('should fail when batting orders are not 1-10', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 11, // Invalid batting order - should be 10
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 10');
    });

    it('should fail when there are duplicate batting orders', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 8, // Duplicate batting order
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 10');
    });

    it('should fail when there are duplicate players in lineup', async () => {
      const lineupPositions = createValidLineup();
      // Make the last player a duplicate of the first
      lineupPositions[9] = { ...lineupPositions[9], playerId: 'player1' };

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Each player can only appear once in the lineup'
      );
    });

    it('should fail when there are duplicate defensive positions', async () => {
      const lineupPositions = createValidLineup();
      // Make the last position a duplicate of the first
      lineupPositions[9] = {
        ...lineupPositions[9],
        position: Position.pitcher(),
      };

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Each position can only be assigned to one player'
      );
    });

    it('should fail when a player does not exist', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'nonexistent',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);

      // Mock first 8 players exist, 9th doesn't, 10th exists
      for (let i = 1; i <= 8; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }
      mockPlayerRepository.findById.mockResolvedValueOnce(null); // nonexistent player
      mockPlayerRepository.findById.mockResolvedValueOnce({
        id: 'player10',
      } as any);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Player nonexistent not found');
    });

    it('should fail when a substitute player does not exist', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player11', 'nonexistent'],
      };

      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);

      // Mock lineup players exist
      for (let i = 1; i <= 10; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      // Mock first substitute exists, second doesn't
      mockPlayerRepository.findById.mockResolvedValueOnce({
        id: 'player11',
      } as any);
      mockPlayerRepository.findById.mockResolvedValueOnce(null); // nonexistent

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Substitute player nonexistent not found');
    });

    it('should fail when substitute is already in the lineup', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player1'], // Already in lineup
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Substitute player1 is already in the starting lineup'
      );
    });

    it('should fail when there are duplicate substitutes', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player11', 'player11'], // Duplicate
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Substitute player11 appears multiple times');
    });

    it('should allow empty substitutes list', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const mockGame = {
        id: 'game1',
        lineupPositions: [],
        substitutes: [],
      };

      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockGameRepository.save.mockImplementation(async (game) => game);

      // Mock players exist
      for (let i = 1; i <= 10; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle repository save failure', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);
      mockGameRepository.save.mockRejectedValue(new Error('Database error'));

      // Mock players exist
      for (let i = 1; i <= 10; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to setup lineup: Database error');
    });
  });

  describe('business rules validation', () => {
    it('should require all 10 defensive positions to be filled', async () => {
      // Test missing the shortFielder position specifically
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.pitcher() },
        { battingOrder: 2, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 3,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 7,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.rightField(),
        },
        // Missing shortFielder, add a duplicate pitcher instead
        {
          battingOrder: 10,
          playerId: 'player10',
          position: Position.pitcher(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      // Mock game and players exist
      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);

      for (let i = 1; i <= 10; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        'Each position can only be assigned to one player'
      );
    });

    it('should validate that batting order starts from 1', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 2, playerId: 'player1', position: Position.pitcher() }, // Starts from 2
        { battingOrder: 3, playerId: 'player2', position: Position.catcher() },
        {
          battingOrder: 4,
          playerId: 'player3',
          position: Position.firstBase(),
        },
        {
          battingOrder: 5,
          playerId: 'player4',
          position: Position.secondBase(),
        },
        {
          battingOrder: 6,
          playerId: 'player5',
          position: Position.thirdBase(),
        },
        {
          battingOrder: 7,
          playerId: 'player6',
          position: Position.shortstop(),
        },
        {
          battingOrder: 8,
          playerId: 'player7',
          position: Position.leftField(),
        },
        {
          battingOrder: 9,
          playerId: 'player8',
          position: Position.centerField(),
        },
        {
          battingOrder: 10,
          playerId: 'player9',
          position: Position.rightField(),
        },
        {
          battingOrder: 11,
          playerId: 'player10',
          position: Position.shortFielder(),
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 10');
    });
  });
});
