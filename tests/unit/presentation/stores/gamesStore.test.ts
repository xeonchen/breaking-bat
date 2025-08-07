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
});
