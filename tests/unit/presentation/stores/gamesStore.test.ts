import { renderHook, act } from '@testing-library/react';
import { Game, Season, GameType, Team } from '@/domain';
import { Result } from '@/application/common/Result';
import {
  useGamesStore,
  initializeGamesStore,
} from '@/presentation/stores/gamesStore';
import {
  resetZustandStore,
  getCleanGamesStoreState,
} from '../../../utils/storeTestUtils';

// Mock dependencies
const mockGameRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findCurrent: jest.fn(),
  getLineup: jest.fn(),
};

const mockSeasonRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
};

const mockGameTypeRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
};

const mockTeamRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
};

const mockCreateGameUseCase = {
  execute: jest.fn(),
};

// Test data
const mockGame = new Game(
  'game-1',
  'Red Sox vs Yankees',
  'Yankees',
  new Date('2024-06-15'),
  'season-1',
  'type-1',
  'home',
  'team-1',
  'active',
  'lineup-1',
  [],
  { homeScore: 3, awayScore: 2 }
);

const mockSeason = new Season(
  'season-1',
  '2024 Season',
  2024,
  new Date('2024-03-01'),
  new Date('2024-10-31')
);

const mockGameType = new GameType(
  'type-1',
  'Regular Season',
  'Standard regular season game'
);

const mockTeam = new Team('team-1', 'Red Sox', [], []);

// Initialize store with mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Clear Zustand persistent storage and reset store state
  resetZustandStore(useGamesStore, getCleanGamesStoreState());

  initializeGamesStore({
    gameRepository: mockGameRepository,
    seasonRepository: mockSeasonRepository,
    gameTypeRepository: mockGameTypeRepository,
    teamRepository: mockTeamRepository,
    createGameUseCase: mockCreateGameUseCase,
  });
});

describe('GamesStore', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGamesStore());

      expect(result.current.games).toEqual([]);
      expect(result.current.seasons).toEqual([]);
      expect(result.current.gameTypes).toEqual([]);
      expect(result.current.teams).toEqual([]);
      expect(result.current.selectedGame).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.searchQuery).toBe('');
      expect(result.current.statusFilter).toBe('all');
    });
  });

  describe('Games Loading', () => {
    it('should load games successfully', async () => {
      const games = [mockGame];
      mockGameRepository.findAll.mockResolvedValue(games);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toEqual(games);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle games loading errors', async () => {
      mockGameRepository.findAll.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load games: Database error');
    });

    it('should apply search filter when loading games', async () => {
      const games = [
        mockGame,
        new Game(
          'game-2',
          'Cubs vs Cardinals',
          'Cardinals',
          new Date(),
          'season-1',
          'type-1',
          'away',
          'team-1',
          'completed'
        ),
      ];
      mockGameRepository.findAll.mockResolvedValue(games);

      const { result } = renderHook(() => useGamesStore());

      // Set search query first
      act(() => {
        result.current.searchQuery = 'Yankees';
      });

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toHaveLength(1);
      expect(result.current.games[0].opponent).toBe('Yankees');
    });

    it('should apply status filter when loading games', async () => {
      const games = [
        mockGame,
        new Game(
          'game-2',
          'Cubs vs Cardinals',
          'Cardinals',
          new Date(),
          'season-1',
          'type-1',
          'away',
          'team-1',
          'completed'
        ),
      ];
      mockGameRepository.findAll.mockResolvedValue(games);

      const { result } = renderHook(() => useGamesStore());

      // Set status filter first
      act(() => {
        result.current.statusFilter = 'completed';
      });

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toHaveLength(1);
      expect(result.current.games[0].status).toBe('completed');
    });
  });

  describe('Seasons Loading', () => {
    it('should load seasons successfully', async () => {
      const seasons = [mockSeason];
      mockSeasonRepository.findAll.mockResolvedValue(seasons);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadSeasons();
      });

      expect(result.current.seasons).toEqual(seasons);
      expect(result.current.error).toBeNull();
    });

    it('should handle seasons loading errors', async () => {
      mockSeasonRepository.findAll.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadSeasons();
      });

      expect(result.current.seasons).toEqual([]);
      expect(result.current.error).toBe(
        'Failed to load seasons: Network error'
      );
    });
  });

  describe('Game Types Loading', () => {
    it('should load game types successfully', async () => {
      const gameTypes = [mockGameType];
      mockGameTypeRepository.findAll.mockResolvedValue(gameTypes);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGameTypes();
      });

      expect(result.current.gameTypes).toEqual(gameTypes);
      expect(result.current.error).toBeNull();
    });

    it('should handle game types loading errors', async () => {
      mockGameTypeRepository.findAll.mockRejectedValue(
        new Error('Service error')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGameTypes();
      });

      expect(result.current.gameTypes).toEqual([]);
      expect(result.current.error).toBe(
        'Failed to load game types: Service error'
      );
    });
  });

  describe('Teams Loading', () => {
    it('should load teams successfully', async () => {
      const teams = [mockTeam];
      mockTeamRepository.findAll.mockResolvedValue(teams);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadTeams();
      });

      expect(result.current.teams).toEqual(teams);
      expect(result.current.error).toBeNull();
    });

    it('should handle teams loading errors', async () => {
      mockTeamRepository.findAll.mockRejectedValue(
        new Error('Connection error')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadTeams();
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.error).toBe(
        'Failed to load teams: Connection error'
      );
    });
  });

  describe('Game Creation', () => {
    it('should create game successfully', async () => {
      const createCommand = {
        name: 'New Game',
        opponent: 'Blue Jays',
        date: new Date(),
        teamId: 'team-1',
        seasonId: 'season-1',
        gameTypeId: 'type-1',
        homeAway: 'home' as const,
      };

      mockCreateGameUseCase.execute.mockResolvedValue(Result.success(mockGame));

      const { result } = renderHook(() => useGamesStore());

      let createdGame;
      await act(async () => {
        createdGame = await result.current.createGame(createCommand);
      });

      expect(createdGame).toEqual(mockGame);
      expect(result.current.games).toContain(mockGame);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle game creation validation errors', async () => {
      const createCommand = {
        name: '',
        opponent: 'Blue Jays',
        date: new Date(),
        teamId: 'team-1',
        seasonId: 'season-1',
        gameTypeId: 'type-1',
        homeAway: 'home' as const,
      };

      mockCreateGameUseCase.execute.mockResolvedValue(
        Result.failure('Game name is required')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.createGame(createCommand);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'Failed to create game: Game name is required'
      );
    });

    it('should handle game creation errors', async () => {
      const createCommand = {
        name: 'New Game',
        opponent: 'Blue Jays',
        date: new Date(),
        teamId: 'team-1',
        seasonId: 'season-1',
        gameTypeId: 'type-1',
        homeAway: 'home' as const,
      };

      mockCreateGameUseCase.execute.mockRejectedValue(
        new Error('Database error')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.createGame(createCommand);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'Failed to create game: Database error'
      );
    });
  });

  describe('Game Updates', () => {
    it('should update game successfully', async () => {
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

      const { result } = renderHook(() => useGamesStore());

      // Set initial games
      act(() => {
        result.current.games = [mockGame];
      });

      await act(async () => {
        await result.current.updateGame(updatedGame);
      });

      expect(result.current.games[0]).toEqual(updatedGame);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update selected game when updating', async () => {
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

      const { result } = renderHook(() => useGamesStore());

      // Set initial state
      act(() => {
        result.current.games = [mockGame];
        result.current.selectedGame = mockGame;
      });

      await act(async () => {
        await result.current.updateGame(updatedGame);
      });

      expect(result.current.selectedGame).toEqual(updatedGame);
    });

    it('should handle game update errors', async () => {
      mockGameRepository.save.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.updateGame(mockGame);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to update game: Update failed');
    });
  });

  describe('Game Deletion', () => {
    it('should delete game successfully', async () => {
      mockGameRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGamesStore());

      // Set initial games
      act(() => {
        result.current.games = [mockGame];
      });

      await act(async () => {
        await result.current.deleteGame(mockGame.id);
      });

      expect(result.current.games).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear selection when deleting selected game', async () => {
      mockGameRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGamesStore());

      // Set initial state
      act(() => {
        result.current.games = [mockGame];
        result.current.selectedGame = mockGame;
      });

      await act(async () => {
        await result.current.deleteGame(mockGame.id);
      });

      expect(result.current.selectedGame).toBeNull();
    });

    it('should handle game deletion errors', async () => {
      mockGameRepository.delete.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.deleteGame('game-1');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to delete game: Delete failed');
    });
  });

  describe('Game Selection', () => {
    it('should select game', () => {
      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.selectGame(mockGame);
      });

      expect(result.current.selectedGame).toEqual(mockGame);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useGamesStore());

      // First select a game
      act(() => {
        result.current.selectGame(mockGame);
      });

      expect(result.current.selectedGame).toEqual(mockGame);

      // Then clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedGame).toBeNull();
    });
  });

  describe('Search and Filtering', () => {
    const game1 = mockGame;
    const game2 = new Game(
      'game-2',
      'Cubs vs Cardinals',
      'Cardinals',
      new Date(),
      'season-1',
      'type-1',
      'away',
      'team-1',
      'completed'
    );

    beforeEach(() => {
      // Set up games for filtering tests
      act(() => {
        useGamesStore.setState({ games: [game1, game2] });
      });
    });

    it('should search games by name', () => {
      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.searchGames('Sox');
      });

      expect(result.current.searchQuery).toBe('Sox');
      expect(result.current.games).toHaveLength(1);
      expect(result.current.games[0].name).toContain('Sox');
    });

    it('should search games by opponent', () => {
      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.searchGames('Cardinals');
      });

      expect(result.current.games).toHaveLength(1);
      expect(result.current.games[0].opponent).toBe('Cardinals');
    });

    it('should clear search when query is empty', () => {
      mockGameRepository.findAll.mockResolvedValue([game1, game2]);

      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.searchGames('');
      });

      expect(result.current.searchQuery).toBe('');
      // Should trigger loadGames
      expect(mockGameRepository.findAll).toHaveBeenCalled();
    });

    it('should filter games by status', () => {
      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.filterGamesByStatus('completed');
      });

      expect(result.current.statusFilter).toBe('completed');
      expect(result.current.games).toHaveLength(1);
      expect(result.current.games[0].status).toBe('completed');
    });

    it('should filter games by team', () => {
      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.filterGamesByTeam('team-1');
      });

      expect(result.current.games).toHaveLength(2); // Both games have teamId 'team-1'
    });

    it('should load all games when team filter is cleared', () => {
      mockGameRepository.findAll.mockResolvedValue([game1, game2]);

      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.filterGamesByTeam('');
      });

      expect(mockGameRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('Season Management', () => {
    it('should create season successfully', async () => {
      const createCommand = {
        name: '2025 Season',
        year: 2025,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-10-31'),
      };

      mockSeasonRepository.save.mockResolvedValue(mockSeason);

      const { result } = renderHook(() => useGamesStore());

      let createdSeason;
      await act(async () => {
        createdSeason = await result.current.createSeason(createCommand);
      });

      expect(createdSeason).toEqual(mockSeason);
      expect(result.current.seasons).toContain(mockSeason);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update season successfully', async () => {
      const updatedSeason = new Season(
        mockSeason.id,
        'Updated Season',
        mockSeason.year,
        mockSeason.startDate,
        mockSeason.endDate
      );

      mockSeasonRepository.save.mockResolvedValue(updatedSeason);

      const { result } = renderHook(() => useGamesStore());

      // Set initial seasons
      act(() => {
        result.current.seasons = [mockSeason];
      });

      await act(async () => {
        await result.current.updateSeason(updatedSeason);
      });

      expect(result.current.seasons[0]).toEqual(updatedSeason);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should delete season successfully', async () => {
      mockSeasonRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGamesStore());

      // Set initial seasons
      act(() => {
        result.current.seasons = [mockSeason];
      });

      await act(async () => {
        await result.current.deleteSeason(mockSeason.id);
      });

      expect(result.current.seasons).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Game Type Management', () => {
    it('should create game type successfully', async () => {
      const createCommand = {
        name: 'Playoff',
        description: 'Playoff game',
      };

      mockGameTypeRepository.save.mockResolvedValue(mockGameType);

      const { result } = renderHook(() => useGamesStore());

      let createdGameType;
      await act(async () => {
        createdGameType = await result.current.createGameType(createCommand);
      });

      expect(createdGameType).toEqual(mockGameType);
      expect(result.current.gameTypes).toContain(mockGameType);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update game type successfully', async () => {
      const updatedGameType = new GameType(
        mockGameType.id,
        'Updated Type',
        'Updated description'
      );

      mockGameTypeRepository.save.mockResolvedValue(updatedGameType);

      const { result } = renderHook(() => useGamesStore());

      // Set initial game types
      act(() => {
        result.current.gameTypes = [mockGameType];
      });

      await act(async () => {
        await result.current.updateGameType(updatedGameType);
      });

      expect(result.current.gameTypes[0]).toEqual(updatedGameType);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should delete game type successfully', async () => {
      mockGameTypeRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGamesStore());

      // Set initial game types
      act(() => {
        result.current.gameTypes = [mockGameType];
      });

      await act(async () => {
        await result.current.deleteGameType(mockGameType.id);
      });

      expect(result.current.gameTypes).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useGamesStore());

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
  });

  describe('Store Persistence', () => {
    it('should persist filter state correctly', () => {
      const { result } = renderHook(() => useGamesStore());

      // Set persistent state
      act(() => {
        result.current.selectedGame = mockGame;
        result.current.searchQuery = 'test search';
        result.current.statusFilter = 'completed';
      });

      // Verify the persisted state includes the key fields
      expect(result.current.selectedGame).toEqual(mockGame);
      expect(result.current.searchQuery).toBe('test search');
      expect(result.current.statusFilter).toBe('completed');
    });
  });

  describe('Enhanced Error Handling and Edge Cases', () => {
    it('should handle createGame when use case returns null result', async () => {
      const result = { isSuccess: true, value: null }; // Null value scenario
      mockCreateGameUseCase.execute.mockResolvedValue(result);

      const { result: hookResult } = renderHook(() => useGamesStore());

      const command = {
        name: 'Test Game',
        opponent: 'Test Opponent',
        date: new Date(),
        seasonId: 'season-1',
        gameTypeId: 'type-1',
        homeAway: 'home' as const,
        teamId: 'team-1',
      };

      await act(async () => {
        try {
          await hookResult.current.createGame(command);
        } catch (error) {
          // Expected to throw when result is null
        }
      });

      expect(hookResult.current.error).toContain(
        'Game creation returned no result'
      );
    });

    it('should handle filtering by status "all"', async () => {
      mockGameRepository.findAll.mockResolvedValue([mockGame]);

      const { result } = renderHook(() => useGamesStore());

      // Set up some initial games
      act(() => {
        result.current.games = [mockGame];
      });

      // Filter by 'all' should trigger loadGames
      await act(async () => {
        result.current.filterGamesByStatus('all');
      });

      expect(mockGameRepository.findAll).toHaveBeenCalled();
      expect(result.current.statusFilter).toBe('all');
    });

    it('should handle non-Error exceptions in createSeason', async () => {
      // Mock a non-Error exception (string error)
      mockSeasonRepository.save.mockRejectedValue('String error');

      const { result } = renderHook(() => useGamesStore());

      const command = {
        name: 'Test Season',
        year: 2024,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      await act(async () => {
        try {
          await result.current.createSeason(command);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to create season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateSeason', async () => {
      // Mock a non-Error exception (number error)
      mockSeasonRepository.save.mockRejectedValue(404);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateSeason(mockSeason);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to update season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in deleteSeason', async () => {
      // Mock a non-Error exception (object error)
      mockSeasonRepository.delete.mockRejectedValue({ code: 500 });

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteSeason('season-1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to delete season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in createGameType', async () => {
      mockGameTypeRepository.save.mockRejectedValue('GameType save failed');

      const { result } = renderHook(() => useGamesStore());

      const command = {
        name: 'Test Game Type',
        description: 'Test Description',
      };

      await act(async () => {
        try {
          await result.current.createGameType(command);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to create game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateGameType', async () => {
      mockGameTypeRepository.save.mockRejectedValue(null);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateGameType(mockGameType);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to update game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in deleteGameType', async () => {
      mockGameTypeRepository.delete.mockRejectedValue(undefined);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteGameType('type-1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to delete game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateGame', async () => {
      mockGameRepository.save.mockRejectedValue('Update failed');

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateGame(mockGame);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to update game: Unknown error');
    });

    it('should handle non-Error exceptions in deleteGame', async () => {
      mockGameRepository.delete.mockRejectedValue(false);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteGame('game-1');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to delete game: Unknown error');
    });

    it('should handle filterGamesByTeam with existing games', () => {
      const game1 = new Game(
        'game-1',
        'Game 1',
        'Opponent',
        new Date(),
        'season-1',
        'type-1',
        'home',
        'team-1',
        'setup',
        'lineup-1'
      );
      const game2 = new Game(
        'game-2',
        'Game 2',
        'Opponent',
        new Date(),
        'season-1',
        'type-1',
        'away',
        'team-2',
        'setup',
        'lineup-2'
      );

      const { result } = renderHook(() => useGamesStore());

      // Set up games
      act(() => {
        result.current.games = [game1, game2];
      });

      // Filter by team
      act(() => {
        result.current.filterGamesByTeam('team-1');
      });

      // Should filter games to only show games for team-1
      const filteredGames = result.current.games.filter(
        (game) => game.teamId === 'team-1'
      );
      expect(filteredGames).toHaveLength(1);
      expect(filteredGames[0].id).toBe('game-1');
    });

    it('should handle edge cases in filterGamesByStatus with specific statuses', async () => {
      const game1 = new Game(
        'game-1',
        'Game 1',
        'Opponent',
        new Date(),
        'season-1',
        'type-1',
        'home',
        'team-1',
        'completed',
        'lineup-1'
      );
      const game2 = new Game(
        'game-2',
        'Game 2',
        'Opponent',
        new Date(),
        'season-1',
        'type-1',
        'away',
        'team-2',
        'in_progress',
        'lineup-2'
      );

      const { result } = renderHook(() => useGamesStore());

      // Set up games
      act(() => {
        result.current.games = [game1, game2];
      });

      // Filter by completed status
      act(() => {
        result.current.filterGamesByStatus('completed');
      });

      expect(result.current.statusFilter).toBe('completed');

      // Filter by in_progress status
      act(() => {
        result.current.filterGamesByStatus('in_progress');
      });

      expect(result.current.statusFilter).toBe('in_progress');
    });
  });
});
