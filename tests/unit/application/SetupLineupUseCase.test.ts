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
    it('should setup lineup successfully with 9 players', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player10', 'player11'],
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
      for (let i = 1; i <= 11; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
          name: `Player ${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
      expect(mockGameRepository.findById).toHaveBeenCalledWith('game1');
      expect(mockGameRepository.save).toHaveBeenCalled();
    });

    it('should fail when game is not found', async () => {
      const command: SetupLineupCommand = {
        gameId: 'nonexistent',
        lineupPositions: [],
        substitutes: [],
      };

      mockGameRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    it('should fail when lineup has less than 9 players', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Lineup must have exactly 9 players');
    });

    it('should fail when lineup has more than 9 players', async () => {
      const lineupPositions: LineupPosition[] = [];
      for (let i = 1; i <= 10; i++) {
        lineupPositions.push({
          battingOrder: i,
          playerId: `player${i}`,
          position: Position.PITCHER,
        });
      }

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Lineup must have exactly 9 players');
    });

    it('should fail when batting orders are not 1-9', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 10,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        }, // Invalid batting order
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 9');
    });

    it('should fail when there are duplicate batting orders', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 8,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        }, // Duplicate batting order
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 9');
    });

    it('should fail when there are duplicate players in lineup', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player1',
          position: Position.RIGHT_FIELD,
        }, // Duplicate player
      ];

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
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        { battingOrder: 9, playerId: 'player9', position: Position.PITCHER }, // Duplicate position
      ];

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
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'nonexistent',
          position: Position.RIGHT_FIELD,
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);

      // Mock first 8 players exist, 9th doesn't
      for (let i = 1; i <= 8; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }
      mockPlayerRepository.findById.mockResolvedValueOnce(null); // nonexistent player

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Player nonexistent not found');
    });

    it('should fail when a substitute player does not exist', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player10', 'nonexistent'],
      };

      const mockGame = { id: 'game1' };
      mockGameRepository.findById.mockResolvedValue(mockGame as any);

      // Mock lineup players exist
      for (let i = 1; i <= 9; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      // Mock first substitute exists, second doesn't
      mockPlayerRepository.findById.mockResolvedValueOnce({
        id: 'player10',
      } as any);
      mockPlayerRepository.findById.mockResolvedValueOnce(null); // nonexistent

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Substitute player nonexistent not found');
    });

    it('should fail when substitute is already in the lineup', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
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
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: ['player10', 'player10'], // Duplicate
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Substitute player10 appears multiple times');
    });

    it('should allow empty substitutes list', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
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
      for (let i = 1; i <= 9; i++) {
        mockPlayerRepository.findById.mockResolvedValueOnce({
          id: `player${i}`,
        } as any);
      }

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(true);
    });

    it('should handle repository save failure', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 1, playerId: 'player1', position: Position.PITCHER },
        { battingOrder: 2, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 3, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 4,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 5, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 6, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 7, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 8,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 9,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
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
      for (let i = 1; i <= 9; i++) {
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
    it('should require all 9 defensive positions to be filled', async () => {
      const requiredPositions = [
        Position.PITCHER,
        Position.CATCHER,
        Position.FIRST_BASE,
        Position.SECOND_BASE,
        Position.THIRD_BASE,
        Position.SHORTSTOP,
        Position.LEFT_FIELD,
        Position.CENTER_FIELD,
        Position.RIGHT_FIELD,
      ];

      // Test missing each position
      for (const missingPosition of requiredPositions) {
        const lineupPositions: LineupPosition[] = [];
        let battingOrder = 1;

        for (const position of requiredPositions) {
          if (position !== missingPosition) {
            lineupPositions.push({
              battingOrder: battingOrder++,
              playerId: `player${battingOrder}`,
              position,
            });
          }
        }

        // Fill remaining spots with duplicate positions
        while (lineupPositions.length < 9) {
          lineupPositions.push({
            battingOrder: battingOrder++,
            playerId: `player${battingOrder}`,
            position: Position.PITCHER, // Duplicate
          });
        }

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
      }
    });

    it('should validate that batting order starts from 1', async () => {
      const lineupPositions: LineupPosition[] = [
        { battingOrder: 2, playerId: 'player1', position: Position.PITCHER }, // Starts from 2
        { battingOrder: 3, playerId: 'player2', position: Position.CATCHER },
        { battingOrder: 4, playerId: 'player3', position: Position.FIRST_BASE },
        {
          battingOrder: 5,
          playerId: 'player4',
          position: Position.SECOND_BASE,
        },
        { battingOrder: 6, playerId: 'player5', position: Position.THIRD_BASE },
        { battingOrder: 7, playerId: 'player6', position: Position.SHORTSTOP },
        { battingOrder: 8, playerId: 'player7', position: Position.LEFT_FIELD },
        {
          battingOrder: 9,
          playerId: 'player8',
          position: Position.CENTER_FIELD,
        },
        {
          battingOrder: 10,
          playerId: 'player9',
          position: Position.RIGHT_FIELD,
        },
      ];

      const command: SetupLineupCommand = {
        gameId: 'game1',
        lineupPositions,
        substitutes: [],
      };

      const result = await useCase.execute(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Batting orders must be exactly 1 through 9');
    });
  });
});
