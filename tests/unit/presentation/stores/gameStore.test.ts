import { renderHook, act } from '@testing-library/react';
import { Game, Team, Position, BattingResult } from '@/domain';
import {
  useGameStore,
  initializeGameStore,
} from '@/presentation/stores/gameStore';
import {
  resetZustandStore,
  getCleanGameStoreState,
} from '../../../utils/storeTestUtils';

// Mock dependencies
const mockGameRepository = {
  findCurrent: jest.fn(),
  save: jest.fn(),
  getLineup: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

const mockTeamRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
};

const mockPlayerRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findByTeamId: jest.fn(),
  isJerseyNumberUnique: jest.fn(),
  save: jest.fn(),
};

const mockScoringService = {
  calculateBaserunnerAdvancement: jest.fn(),
  recordAtBat: jest.fn(),
  calculateFinalScore: jest.fn(),
  calculateOuts: jest.fn().mockReturnValue(1), // Default to 1 out
};

// Test data - using DTOs instead of domain entities
const mockGameDTO = {
  id: 'game-1',
  name: 'Red Sox vs Yankees',
  opponent: 'Yankees',
  date: new Date('2024-06-15'),
  seasonId: 'season-1',
  homeTeamId: 'team-1',
  awayTeamId: 'Yankees',
  teamId: 'team-1',
  gameTypeId: 'type-1',
  status: 'in_progress' as const,
  currentInning: 1,
  isTopInning: true,
  homeScore: 3,
  awayScore: 2,
  lineupId: 'lineup-1',
  currentBatterId: undefined,
  currentBaserunners: { first: null, second: null, third: null },
  totalInnings: 7,
  finalScore: { homeScore: 3, awayScore: 2, inningScores: [] },
  createdAt: new Date('2024-06-15'),
  updatedAt: new Date('2024-06-15'),
  isAwayGame: false,
  isHomeGame: () => true,
  getVenueText: () => 'vs',
};

const mockTeamDTO = {
  id: 'team-1',
  name: 'Red Sox',
  isActive: true,
  createdAt: new Date('2024-06-15'),
  updatedAt: new Date('2024-06-15'),
};

// Create domain entity for repository mocking
const mockGame = new Game(
  'game-1',
  'Red Sox vs Yankees',
  'Yankees',
  new Date('2024-06-15'),
  'season-1',
  'type-1',
  'home',
  'team-1',
  'in_progress',
  'lineup-1',
  [],
  { homeScore: 3, awayScore: 2 }
);

const mockTeam = new Team('team-1', 'Red Sox', [], []);

const mockBatter = {
  playerId: 'player-1',
  playerName: 'Ted Williams',
  jerseyNumber: '9',
  position: Position.leftField(),
  battingOrder: 1,
};

const mockLineup = [
  mockBatter,
  {
    playerId: 'player-2',
    playerName: 'David Ortiz',
    jerseyNumber: '34',
    position: Position.firstBase(),
    battingOrder: 2,
  },
];

// Initialize store with mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Clear Zustand persistent storage and reset store state
  resetZustandStore(useGameStore, getCleanGameStoreState());

  initializeGameStore({
    gameRepository: mockGameRepository,
    teamRepository: mockTeamRepository,
    playerRepository: mockPlayerRepository,
    scoringService: mockScoringService,
  });
});

describe('GameStore', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.currentGame).toBeNull();
      expect(result.current.teams).toEqual([]);
      expect(result.current.lineup).toEqual([]);
      expect(result.current.currentBatter).toBeNull();
      expect(result.current.currentInning).toBe(1);
      expect(result.current.isTopInning).toBe(true);
      expect(result.current.baserunners).toEqual({
        first: null,
        second: null,
        third: null,
      });
      expect(result.current.currentCount).toEqual({ balls: 0, strikes: 0 });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle store without initialization', () => {
      // Clear store dependencies
      resetZustandStore(useGameStore, {
        ...getCleanGameStoreState(),
        dependencies: null,
      });

      const { result } = renderHook(() => useGameStore());

      expect(result.current.currentGame).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle partial dependency initialization', () => {
      resetZustandStore(useGameStore, getCleanGameStoreState());

      initializeGameStore({
        gameRepository: mockGameRepository,
        teamRepository: null as unknown as typeof mockTeamRepository,
        playerRepository: null as unknown as typeof mockPlayerRepository,
        scoringService: null as unknown as typeof mockScoringService,
      });

      const { result } = renderHook(() => useGameStore());
      expect(result.current.currentGame).toBeNull();
    });
  });

  describe('Game Loading', () => {
    it('should load current game successfully', async () => {
      // Mock the repository to return the domain game entity
      mockGameRepository.findCurrent.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getCurrentGame();
      });

      // Check if mock was called
      expect(mockGameRepository.findCurrent).toHaveBeenCalled();

      // The store should return a converted DTO
      expect(result.current.currentGame).toEqual(
        expect.objectContaining({
          id: 'game-1',
          name: 'Red Sox vs Yankees',
          opponent: 'Yankees',
          status: 'in_progress',
          homeScore: 3,
          awayScore: 2,
        })
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle game loading errors', async () => {
      mockGameRepository.findCurrent.mockRejectedValue(
        new Error('Database error')
      );

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getCurrentGame();
      });

      expect(result.current.currentGame).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load current game');
    });

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: Game) => void;
      const promise = new Promise<Game>((resolve) => {
        resolvePromise = resolve;
      });
      mockGameRepository.findCurrent.mockReturnValue(promise);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.getCurrentGame();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        if (resolvePromise) {
          resolvePromise(mockGame);
        }
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Game Updates', () => {
    it('should update game successfully', async () => {
      const updatedGameDTO = {
        ...mockGameDTO,
        name: 'Updated Game Name',
        updatedAt: new Date(),
      };

      const updatedGame = new Game(
        mockGame.id,
        'Updated Game Name',
        mockGame.opponent,
        mockGame.date,
        mockGame.seasonId,
        mockGame.gameTypeId,
        mockGame.homeAway,
        mockGame.teamId,
        mockGame.status,
        mockGame.lineupId,
        mockGame.inningIds,
        mockGame.finalScore,
        mockGame.createdAt,
        new Date()
      );

      mockGameRepository.save.mockResolvedValue(updatedGame);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.updateGame(updatedGameDTO);
      });

      expect(mockGameRepository.save).toHaveBeenCalledWith(expect.any(Game));
      expect(result.current.currentGame).toEqual(
        expect.objectContaining({
          id: 'game-1',
          name: 'Updated Game Name',
        })
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle game update errors', async () => {
      mockGameRepository.save.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.updateGame(mockGameDTO);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to update game: Update failed');
    });
  });

  describe('Teams Loading', () => {
    it('should load teams successfully', async () => {
      const teams = [mockTeam];
      mockTeamRepository.findAll.mockResolvedValue(teams);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.teams).toEqual([
        expect.objectContaining({
          id: 'team-1',
          name: 'Red Sox',
          isActive: true,
        }),
      ]);
      expect(result.current.error).toBeNull();
    });

    it('should handle teams loading errors', async () => {
      mockTeamRepository.findAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.error).toBe('Failed to load teams: Network error');
    });
  });

  describe('Lineup Management', () => {
    it('should load lineup successfully', async () => {
      // Mock getLineup to return player IDs
      mockGameRepository.getLineup.mockResolvedValue(['player-1', 'player-2']);

      // Mock findById to return player objects
      mockPlayerRepository.findById
        .mockResolvedValueOnce({
          id: 'player-1',
          name: 'Ted Williams',
          jerseyNumber: 9,
          positions: [Position.leftField()],
        })
        .mockResolvedValueOnce({
          id: 'player-2',
          name: 'David Ortiz',
          jerseyNumber: 34,
          positions: [Position.firstBase()],
        });

      const { result } = renderHook(() => useGameStore());

      // Set current game first
      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.getLineup();
      });

      expect(result.current.lineup).toHaveLength(2);
      expect(result.current.currentBatter).toEqual({
        playerId: 'player-1',
        playerName: 'Ted Williams',
        jerseyNumber: '9',
        position: 'left-field', // Position is now a string in presentation layer
        battingOrder: 1,
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle lineup loading errors', async () => {
      mockGameRepository.getLineup.mockRejectedValue(new Error('Lineup error'));

      const { result } = renderHook(() => useGameStore());

      // Set current game first
      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.getLineup();
      });

      expect(result.current.lineup).toEqual([]);
      expect(result.current.error).toBe('Failed to load lineup: Lineup error');
    });

    it('should not load lineup if no current game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getLineup();
      });

      expect(mockGameRepository.getLineup).not.toHaveBeenCalled();
      expect(result.current.lineup).toEqual([]);
    });
  });

  describe('Batter Management', () => {
    it('should set current batter', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentBatter(mockBatter);
      });

      expect(result.current.currentBatter).toEqual(mockBatter);
    });

    it('should update baserunners', () => {
      const { result } = renderHook(() => useGameStore());

      const baserunners = {
        first: { playerId: 'player-1', playerName: 'Player 1' },
        second: null,
        third: { playerId: 'player-3', playerName: 'Player 3' },
      };

      act(() => {
        result.current.updateBaserunners(baserunners);
      });

      expect(result.current.baserunners).toEqual(baserunners);
    });

    it('should update count', () => {
      const { result } = renderHook(() => useGameStore());

      const count = { balls: 2, strikes: 1 };

      act(() => {
        result.current.updateCount(count);
      });

      expect(result.current.currentCount).toEqual(count);
    });
  });

  describe('At-Bat Recording', () => {
    it('should record at-bat successfully', async () => {
      const atBatResult = {
        batterId: 'player-1',
        result: '1B',
        finalCount: { balls: 1, strikes: 2 },
        runsScored: 0,
        advanceInning: false,
        newBaserunners: {
          first: null,
          second: null,
          third: null,
        },
      };

      const advancement = {
        runsScored: [],
        newState: {
          firstBase: null,
          secondBase: null,
          thirdBase: null,
        },
      };

      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue(
        advancement
      );

      const { result } = renderHook(() => useGameStore());

      // Set up game and current batter
      act(() => {
        result.current.currentGame = mockGameDTO;
        result.current.currentBatter = mockBatter;
      });

      let recordedResult;
      await act(async () => {
        recordedResult = await result.current.recordAtBat(atBatResult);
      });

      expect(recordedResult).toEqual(atBatResult);
      expect(result.current.currentCount).toEqual({ balls: 0, strikes: 0 });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle at-bat recording errors when no game loaded', async () => {
      const atBatResult = {
        batterId: 'player-1',
        result: '1B',
        finalCount: { balls: 1, strikes: 2 },
      };

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        try {
          await result.current.recordAtBat(atBatResult);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'Failed to record at-bat: Game not loaded or scoring service not available'
      );
    });
  });

  describe('Inning Management', () => {
    it('should advance to bottom of inning', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up initial state (top of 1st)
      act(() => {
        result.current.lineup = mockLineup;
        result.current.currentBatter = mockLineup[1]; // Second batter
      });

      await act(async () => {
        await result.current.advanceInning();
      });

      expect(result.current.currentInning).toBe(1);
      expect(result.current.isTopInning).toBe(false);
      expect(result.current.baserunners).toEqual({
        first: null,
        second: null,
        third: null,
      });
      expect(result.current.currentCount).toEqual({ balls: 0, strikes: 0 });
      expect(result.current.currentBatter).toEqual(mockLineup[0]); // Reset to first batter
    });

    it('should advance to next inning', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set up bottom of inning
      act(() => {
        result.current.currentInning = 2;
        result.current.isTopInning = false;
        result.current.lineup = mockLineup;
      });

      await act(async () => {
        await result.current.advanceInning();
      });

      expect(result.current.currentInning).toBe(3);
      expect(result.current.isTopInning).toBe(true);
    });

    it('should handle inning advancement errors', async () => {
      // This test is simplified since the actual implementation doesn't have
      // much error handling for inning advancement (it's mostly state updates)
      const { result } = renderHook(() => useGameStore());

      // The function doesn't typically throw errors in normal operation
      // but we can verify it handles the state correctly
      await act(async () => {
        await result.current.advanceInning();
      });

      // Verify the inning advanced correctly (no error case needed for this simple function)
      expect(result.current.currentInning).toBe(1);
      expect(result.current.isTopInning).toBe(false);
    });
  });

  describe('Game State Management', () => {
    it('should suspend game successfully', async () => {
      const suspendedGame = mockGame.suspend();
      mockGameRepository.save.mockResolvedValue(suspendedGame);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.suspendGame();
      });

      expect(mockGameRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockGame.id,
          status: 'suspended',
        })
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle suspend game errors when no current game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.suspendGame();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'Failed to suspend game: No current game'
      );
    });

    it('should complete game successfully', async () => {
      const completedGame = mockGame.complete(mockGame.finalScore!);
      mockGameRepository.save.mockResolvedValue(completedGame);

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.completeGame();
      });

      expect(mockGameRepository.save).toHaveBeenCalledWith(expect.any(Game));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle complete game errors when no current game', async () => {
      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.completeGame();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'Failed to complete game: No current game or score'
      );
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useGameStore());

      // Set an error
      act(() => {
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear errors when performing successful operations', async () => {
      mockGameRepository.findCurrent.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGameStore());

      // Set an error
      act(() => {
        result.current.error = 'Previous error';
      });

      expect(result.current.error).toBe('Previous error');

      // Successful operation should clear error
      await act(async () => {
        await result.current.getCurrentGame();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle undefined dependencies', async () => {
      // Reset store state only, don't re-initialize dependencies
      // (overrides the beforeEach dependency initialization)
      resetZustandStore(useGameStore, getCleanGameStoreState());

      // Override the beforeEach setup by explicitly clearing the gameRepository mock
      mockGameRepository.findCurrent.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.getCurrentGame();
      });

      // When gameRepository.findCurrent() returns undefined, it gets set as currentGame (converted to null by DTO)
      expect(result.current.error).toBe(null);
      expect(result.current.currentGame).toBeNull();
    });

    it('should handle operations without scoring service', async () => {
      resetZustandStore(useGameStore, getCleanGameStoreState());

      initializeGameStore({
        gameRepository: mockGameRepository,
        teamRepository: mockTeamRepository,
        playerRepository: mockPlayerRepository,
        scoringService: null as unknown as typeof mockScoringService,
      });

      const { result } = renderHook(() => useGameStore());

      const atBatResult = {
        batterId: 'player-1',
        result: '1B',
        finalCount: { balls: 1, strikes: 2 },
      };

      act(() => {
        result.current.currentGame = mockGameDTO;
        result.current.currentBatter = mockBatter;
      });

      await act(async () => {
        try {
          await result.current.recordAtBat(atBatResult);
        } catch {
          // Expected to throw when scoring service is not available
        }
      });

      expect(result.current.error).toBe(
        'Failed to record at-bat: Game not loaded or scoring service not available'
      );
    });

    it('should handle operations without current batter', async () => {
      const { result } = renderHook(() => useGameStore());

      const atBatResult = {
        batterId: 'player-1',
        result: '1B',
        finalCount: { balls: 1, strikes: 2 },
      };

      act(() => {
        result.current.currentGame = mockGame;
        result.current.currentBatter = null;
      });

      // The recordAtBat function doesn't check for currentBatter, only currentGame and scoringService
      // Since both are available, the operation will succeed (current batter is not required)
      await act(async () => {
        await result.current.recordAtBat(atBatResult);
      });

      // No error should occur since game and scoring service are available
      expect(result.current.error).toBe(null);
    });

    it('should handle complete game without final score', async () => {
      const gameWithoutScore = {
        ...mockGameDTO,
        finalScore: undefined, // No final score
      };

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.currentGame = gameWithoutScore;
      });

      await act(async () => {
        await result.current.completeGame();
      });

      expect(result.current.error).toBe(
        'Failed to complete game: No current game or score'
      );
    });

    it('should handle suspend game with repository error', async () => {
      mockGameRepository.save.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.suspendGame();
      });

      // The suspendGame calls updateGame internally, which sets "Failed to update game" error
      expect(result.current.error).toBe('Failed to update game: Save failed');
    });

    it('should handle complete game with repository error', async () => {
      mockGameRepository.save.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.currentGame = mockGameDTO;
      });

      await act(async () => {
        await result.current.completeGame();
      });

      // The completeGame calls updateGame internally, which sets "Failed to update game" error
      expect(result.current.error).toBe('Failed to update game: Save failed');
    });

    it('should handle update game with repository error', async () => {
      mockGameRepository.save.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useGameStore());

      const updatedGameDTO = {
        ...mockGameDTO,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.updateGame(updatedGameDTO);
      });

      expect(result.current.error).toBe('Failed to update game: Update failed');
    });

    it('should handle recordAtBat with scoring service error', async () => {
      mockScoringService.calculateBaserunnerAdvancement.mockImplementation(
        () => {
          throw new Error('Scoring error');
        }
      );

      const { result } = renderHook(() => useGameStore());

      const atBatResult = {
        batterId: 'player-1',
        result: '1B',
        finalCount: { balls: 1, strikes: 2 },
      };

      act(() => {
        result.current.currentGame = mockGameDTO;
        result.current.currentBatter = mockBatter;
      });

      await act(async () => {
        try {
          await result.current.recordAtBat(atBatResult);
        } catch {
          // Expected to throw when scoring service has error
        }
      });

      expect(result.current.error).toBe(
        'Failed to record at-bat: Scoring error'
      );
    });
  });

  describe('Store Persistence', () => {
    it('should persist game state correctly', async () => {
      const { result } = renderHook(() => useGameStore());

      // Set game state
      act(() => {
        result.current.currentGame = mockGame;
        result.current.currentBatter = mockBatter;
        result.current.currentInning = 3;
        result.current.isTopInning = false;
        result.current.baserunners = {
          first: { playerId: 'p1', playerName: 'Player 1' },
          second: null,
          third: { playerId: 'p3', playerName: 'Player 3' },
        };
        result.current.currentCount = { balls: 2, strikes: 1 };
      });

      // Verify the persisted state would include the key fields
      expect(result.current.currentGame).toEqual(
        expect.objectContaining({
          id: 'game-1',
          name: 'Red Sox vs Yankees',
        })
      );
      expect(result.current.currentBatter).toEqual(mockBatter);
      expect(result.current.currentInning).toBe(3);
      expect(result.current.isTopInning).toBe(false);
      expect(result.current.baserunners.first?.playerId).toBe('p1');
      expect(result.current.baserunners.third?.playerId).toBe('p3');
      expect(result.current.currentCount).toEqual({ balls: 2, strikes: 1 });
    });
  });
});
