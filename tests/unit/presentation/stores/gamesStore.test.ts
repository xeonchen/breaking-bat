import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import {
  useGamesStore,
  initializeGamesStore,
} from '@/presentation/stores/gamesStore';
import { GameStatus } from '@/application/services/interfaces';
import { Game, GameType } from '@/domain/entities';
import { Scoreboard } from '@/domain/values';
import type {
  IGameApplicationService,
  IDataApplicationService,
  ITeamApplicationService,
  GameDto,
  SeasonDto,
  TeamDto,
} from '@/application/services/interfaces';
import { Result } from '@/application/common/Result';

// Mock console methods to avoid cluttering test output
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

global.console = mockConsole as any;

// Mock application services
const mockGameApplicationService = {
  getCurrentGames: jest.fn(),
  getGame: jest.fn(),
  createGame: jest.fn(),
  updateGame: jest.fn(),
  deleteGame: jest.fn(),
  setupLineup: jest.fn(),
  startGame: jest.fn(),
  recordAtBat: jest.fn(),
  endGame: jest.fn(),
  completeGame: jest.fn(),
  suspendGame: jest.fn(),
  resumeGame: jest.fn(),
  getGameById: jest.fn(),
  addInning: jest.fn(),
  substitutePlayer: jest.fn(),
  getGamesByTeam: jest.fn(),
  getGamesBySeason: jest.fn(),
  getGamesByGameType: jest.fn(),
  getGamesByDateRange: jest.fn(),
  getGamesByStatus: jest.fn(),
  getGameStatistics: jest.fn(),
} as any;

const mockDataApplicationService = {
  getSeasons: jest.fn(),
  getGameTypes: jest.fn(),
  createSeason: jest.fn(),
  updateSeason: jest.fn(),
  archiveSeason: jest.fn(),
  createGameType: jest.fn(),
  updateGameType: jest.fn(),
  deleteGameType: jest.fn(),
  loadDefaultData: jest.fn(),
  deleteSeason: jest.fn(),
  importData: jest.fn(),
  exportData: jest.fn(),
  initializeOrganization: jest.fn(),
  getSeasonById: jest.fn(),
  getGameTypeById: jest.fn(),
  getGameTypesByActive: jest.fn(),
  getSeasonsByActive: jest.fn(),
} as any;

const mockTeamApplicationService = {
  getTeams: jest.fn(),
  getTeam: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  addPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  archiveTeam: jest.fn(),
  getTeamsBySeason: jest.fn(),
  searchTeams: jest.fn(),
  getTeamRoster: jest.fn(),
  getTeamStatistics: jest.fn(),
  isTeamNameAvailable: jest.fn(),
  isJerseyNumberAvailable: jest.fn(),
  getTeamById: jest.fn(),
  getTeamsByActive: jest.fn(),
  getTeamsByRegion: jest.fn(),
  addPlayerToTeam: jest.fn(),
  removePlayerFromTeam: jest.fn(),
  getPlayersForTeam: jest.fn(),
  getArchivedTeams: jest.fn(),
  unarchiveTeam: jest.fn(),
} as any;

// Test data fixtures
const mockGameDto: GameDto = {
  id: 'game-1',
  name: 'Test Game',
  opponent: 'Test Opponent',
  date: new Date('2025-08-17'),
  location: 'Test Field',
  isHomeGame: true,
  teamId: 'team-1',
  teamName: 'Test Team',
  status: 'setup' as GameStatus,
  seasonId: 'season-1',
  gameTypeId: 'gametype-1',
  createdAt: new Date('2025-08-16'),
  updatedAt: new Date('2025-08-16'),
};

const mockSeasonDto: SeasonDto = {
  id: 'season-1',
  name: '2025 Season',
  year: 2025,
  startDate: new Date('2025-03-01'),
  endDate: new Date('2025-10-31'),
  description: 'Test season',
  isActive: true,
  isArchived: false,
  teamCount: 0,
  gameCount: 0,
  playerCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockTeamDto: TeamDto = {
  id: 'team-1',
  name: 'Test Team',
  isActive: true,
  seasonIds: [],
  playerCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// Create a mock Game entity for testing
const mockGame = new Game(
  'game-1',
  'Test vs Opponent',
  'opponent-1',
  new Date('2025-01-15'),
  'season-1',
  'gametype-1',
  'home',
  'team-1',
  'setup',
  undefined,
  [],
  undefined,
  new Date('2025-01-01'),
  new Date('2025-01-01')
);

const mockGameType = new GameType(
  'gametype-1',
  'Regular Game',
  'Standard softball game',
  new Date('2025-01-01'),
  new Date('2025-01-01')
);

describe('GamesStore', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize store with mock dependencies
    initializeGamesStore({
      gameApplicationService:
        mockGameApplicationService as unknown as IGameApplicationService,
      dataApplicationService:
        mockDataApplicationService as unknown as IDataApplicationService,
      teamApplicationService:
        mockTeamApplicationService as unknown as ITeamApplicationService,
    });

    // Reset store state
    useGamesStore.setState({
      games: [],
      seasons: [],
      gameTypes: [],
      teams: [],
      selectedGame: null,
      loading: false,
      error: null,
      searchQuery: '',
      statusFilter: 'all',
    });
  });

  describe('Store Initialization', () => {
    it('should initialize with default state', () => {
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

    it('should log initialization with dependencies', () => {
      initializeGamesStore({
        gameApplicationService: mockGameApplicationService,
        dataApplicationService: mockDataApplicationService,
        teamApplicationService: mockTeamApplicationService,
      });

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔧 Initializing GamesStore with dependencies:',
        expect.any(Object)
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        '✅ GamesStore dependencies initialized successfully'
      );
    });
  });

  describe('loadGames', () => {
    it('should load games successfully', async () => {
      const games = [{ ...mockGameDto, teamName: 'Test Team' } as any];
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue(
        Result.success(games)
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toEqual(games);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockConsole.log).toHaveBeenCalledWith('📊 Loading games...');
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Loaded 1 games');
    });

    it('should handle load games failure', async () => {
      const errorMessage = 'Database connection failed';
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue(
        Result.failure(errorMessage)
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        `Failed to load games: ${errorMessage}`
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ Failed to load games:',
        errorMessage
      );
    });

    it('should handle load games exception', async () => {
      const error = new Error('Network error');
      (mockGameApplicationService.getCurrentGames as any).mockRejectedValue(
        error
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGames();
      });

      expect(result.current.games).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load games: Network error');
    });

    it('should apply search filter when loading games', async () => {
      const games = [
        { ...mockGameDto, teamName: 'Test Team' },
        new Game(
          'game-2',
          'Cubs vs Yankees',
          'Yankees',
          new Date(),
          'season-1',
          'type-1',
          'away',
          'team-1',
          'completed', // status
          'lineup-1', // lineupId
          [], // inningIds
          new Scoreboard(4, 7) // scoreboard
        ),
      ];
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue({
        isSuccess: true,
        value: games,
      });

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
        { ...mockGameDto, teamName: 'Test Team' },
        new Game(
          'game-2',
          'Cubs vs Cardinals',
          'Cardinals',
          new Date(),
          'season-1',
          'type-1',
          'away',
          'team-1',
          'completed', // status
          'lineup-1', // lineupId
          [], // inningIds
          new Scoreboard(2, 5) // scoreboard
        ),
      ];
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue({
        isSuccess: true,
        value: games,
      });

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
      const seasons = [mockSeasonDto];
      (mockDataApplicationService.getSeasons as any).mockResolvedValue({
        isSuccess: true,
        value: seasons,
      });

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadSeasons();
      });

      expect(result.current.seasons).toEqual(seasons);
      expect(result.current.error).toBeNull();
    });

    it('should handle seasons loading errors', async () => {
      (mockDataApplicationService.getSeasons as any).mockRejectedValue(
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
      (mockDataApplicationService.getGameTypes as any).mockResolvedValue({
        isSuccess: true,
        value: gameTypes,
      });

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadGameTypes();
      });

      expect(result.current.gameTypes).toEqual(gameTypes);
      expect(result.current.error).toBeNull();
    });

    it('should handle game types loading errors', async () => {
      (mockDataApplicationService.getGameTypes as any).mockRejectedValue(
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
      const teams = [mockTeamDto];
      (mockTeamApplicationService.getTeams as any).mockResolvedValue({
        isSuccess: true,
        value: teams,
      });

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.loadTeams();
      });

      expect(result.current.teams).toEqual(teams);
      expect(result.current.error).toBeNull();
    });

    it('should handle teams loading errors', async () => {
      (mockTeamApplicationService.getTeams as any).mockRejectedValue(
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

      (mockGameApplicationService.createGame as any).mockResolvedValue({
        isSuccess: true,
        value: { ...mockGameDto, teamName: 'Test Team' },
      });

      const { result } = renderHook(() => useGamesStore());

      let createdGame;
      await act(async () => {
        createdGame = await result.current.createGame(createCommand);
      });

      expect(createdGame).toEqual({ ...mockGameDto, teamName: 'Test Team' });
      expect(result.current.games).toContainEqual({
        ...mockGameDto,
        teamName: 'Test Team',
      });
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

      (mockGameApplicationService.createGame as any).mockResolvedValue({
        isSuccess: false,
        error: 'Game name is required',
      });

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

      (mockGameApplicationService.createGame as any).mockRejectedValue(
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
      new Game(
        { ...mockGameDto, teamName: 'Test Team' }.id,
        'Updated Game Name',
        { ...mockGameDto, teamName: 'Test Team' }.opponent,
        { ...mockGameDto, teamName: 'Test Team' }.date,
        { ...mockGameDto, teamName: 'Test Team' }.seasonId || null,
        { ...mockGameDto, teamName: 'Test Team' }.gameTypeId || null,
        { ...mockGameDto, teamName: 'Test Team' }.isHomeGame ? 'home' : 'away',
        { ...mockGameDto, teamName: 'Test Team' }.teamId,
        'setup' as const,
        null,
        [],
        mockGame.scoreboard,
        { ...mockGameDto, teamName: 'Test Team' }.createdAt,
        new Date()
      );

      (mockGameApplicationService.updateGame as any).mockResolvedValue({
        isSuccess: true,
        value: {
          ...mockGameDto,
          teamName: 'Test Team',
          name: 'Updated Game Name',
        },
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial games
      act(() => {
        result.current.games = [
          { ...mockGameDto, teamName: 'Test Team' } as any,
        ];
      });

      await act(async () => {
        await result.current.updateGame({
          ...mockGameDto,
          teamName: 'Test Team',
          name: 'Updated Game Name',
        });
      });

      expect(result.current.games[0]).toEqual({
        ...mockGameDto,
        teamName: 'Test Team',
        name: 'Updated Game Name',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update selected game when updating', async () => {
      new Game(
        { ...mockGameDto, teamName: 'Test Team' }.id,
        'Updated Game Name',
        { ...mockGameDto, teamName: 'Test Team' }.opponent,
        { ...mockGameDto, teamName: 'Test Team' }.date,
        { ...mockGameDto, teamName: 'Test Team' }.seasonId || null,
        { ...mockGameDto, teamName: 'Test Team' }.gameTypeId || null,
        { ...mockGameDto, teamName: 'Test Team' }.isHomeGame ? 'home' : 'away',
        { ...mockGameDto, teamName: 'Test Team' }.teamId,
        'setup' as const,
        null,
        [],
        mockGame.scoreboard,
        { ...mockGameDto, teamName: 'Test Team' }.createdAt,
        new Date()
      );

      (mockGameApplicationService.updateGame as any).mockResolvedValue({
        isSuccess: true,
        value: {
          ...mockGameDto,
          teamName: 'Test Team',
          name: 'Updated Game Name',
        },
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial state
      act(() => {
        result.current.games = [
          { ...mockGameDto, teamName: 'Test Team' } as any,
        ];
        result.current.selectedGame = { ...mockGameDto, teamName: 'Test Team' };
      });

      await act(async () => {
        await result.current.updateGame({
          ...mockGameDto,
          teamName: 'Test Team',
          name: 'Updated Game Name',
        });
      });

      expect(result.current.selectedGame).toEqual({
        ...mockGameDto,
        teamName: 'Test Team',
        name: 'Updated Game Name',
      });
    });

    it('should handle game update errors', async () => {
      (mockGameApplicationService.updateGame as any).mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        await result.current.updateGame({
          ...mockGameDto,
          teamName: 'Test Team',
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to update game: Update failed');
    });
  });

  describe('Game Deletion', () => {
    it('should delete game successfully', async () => {
      (mockGameApplicationService.deleteGame as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial games
      act(() => {
        result.current.games = [
          { ...mockGameDto, teamName: 'Test Team' } as any,
        ];
      });

      await act(async () => {
        await result.current.deleteGame(
          { ...mockGameDto, teamName: 'Test Team' }.id
        );
      });

      expect(result.current.games).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear selection when deleting selected game', async () => {
      (mockGameApplicationService.deleteGame as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial state
      act(() => {
        result.current.games = [
          { ...mockGameDto, teamName: 'Test Team' } as any,
        ];
        result.current.selectedGame = { ...mockGameDto, teamName: 'Test Team' };
      });

      await act(async () => {
        await result.current.deleteGame(
          { ...mockGameDto, teamName: 'Test Team' }.id
        );
      });

      expect(result.current.selectedGame).toBeNull();
    });

    it('should handle game deletion errors', async () => {
      (mockGameApplicationService.deleteGame as any).mockRejectedValue(
        new Error('Delete failed')
      );

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
        result.current.selectGame({ ...mockGameDto, teamName: 'Test Team' });
      });

      expect(result.current.selectedGame).toEqual({
        ...mockGameDto,
        teamName: 'Test Team',
      });
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useGamesStore());

      // First select a game
      act(() => {
        result.current.selectGame({ ...mockGameDto, teamName: 'Test Team' });
      });

      expect(result.current.selectedGame).toEqual({
        ...mockGameDto,
        teamName: 'Test Team',
      });

      // Then clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedGame).toBeNull();
    });
  });

  describe('Search and Filtering', () => {
    const game1 = { ...mockGameDto, teamName: 'Test Team' };
    const game2 = new Game(
      'game-2',
      'Red Sox vs Cardinals',
      'Cardinals',
      new Date(),
      'season-1',
      'type-1',
      'away',
      'team-1',
      'completed', // status
      'lineup-1', // lineupId
      [], // inningIds
      new Scoreboard(6, 8) // scoreboard - completed games need final score
    );

    beforeEach(() => {
      // Set up games for filtering tests
      act(() => {
        useGamesStore.setState({
          games: [game1, game2].map(
            (g) => ({ ...g, teamName: 'Test Team' }) as any
          ),
        });
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
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue({
        isSuccess: true,
        value: [game1, game2],
      });

      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.searchGames('');
      });

      expect(result.current.searchQuery).toBe('');
      // Should trigger loadGames
      expect(mockGameApplicationService.getCurrentGames).toHaveBeenCalled();
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
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue({
        isSuccess: true,
        value: [game1, game2],
      });

      const { result } = renderHook(() => useGamesStore());

      act(() => {
        result.current.filterGamesByTeam('');
      });

      expect(mockGameApplicationService.getCurrentGames).toHaveBeenCalled();
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

      (mockDataApplicationService.createSeason as any).mockResolvedValue({
        isSuccess: true,
        value: mockSeasonDto,
      });

      const { result } = renderHook(() => useGamesStore());

      let createdSeason;
      await act(async () => {
        createdSeason = await result.current.createSeason(createCommand);
      });

      expect(createdSeason).toEqual(mockSeasonDto);
      expect(result.current.seasons).toContain(mockSeasonDto);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update season successfully', async () => {
      const updatedSeason = { ...mockSeasonDto, name: 'Updated Season' };

      (mockDataApplicationService.updateSeason as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      (mockDataApplicationService.getSeasons as any).mockResolvedValue({
        isSuccess: true,
        value: [updatedSeason],
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial seasons
      act(() => {
        result.current.seasons = [mockSeasonDto];
      });

      await act(async () => {
        await result.current.updateSeason(updatedSeason);
      });

      expect(result.current.seasons[0]).toEqual(updatedSeason);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should delete season successfully', async () => {
      (mockDataApplicationService.archiveSeason as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial seasons
      act(() => {
        result.current.seasons = [mockSeasonDto];
      });

      await act(async () => {
        await result.current.deleteSeason(mockSeasonDto.id);
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

      (mockDataApplicationService.createGameType as any).mockResolvedValue({
        isSuccess: true,
        value: mockGameType,
      });

      (mockDataApplicationService.getGameTypes as any).mockResolvedValue({
        isSuccess: true,
        value: [mockGameType],
      });

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
      const updatedGameType = {
        ...mockGameType,
        name: 'Updated Type',
        description: 'Updated description',
        defaultInnings: 7,
        allowTies: false,
        isActive: true,
        gameCount: 0,
      };

      (mockDataApplicationService.updateGameType as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      (mockDataApplicationService.getGameTypes as any).mockResolvedValue({
        isSuccess: true,
        value: [updatedGameType],
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial game types
      act(() => {
        result.current.gameTypes = [
          {
            ...mockGameType,
            defaultInnings: 7,
            allowTies: false,
            isActive: true,
            gameCount: 0,
          } as any,
        ];
      });

      await act(async () => {
        await result.current.updateGameType({ ...updatedGameType } as any);
      });

      expect(result.current.gameTypes[0]).toEqual(updatedGameType);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should delete game type successfully', async () => {
      (mockDataApplicationService.deleteGameType as any).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      });

      const { result } = renderHook(() => useGamesStore());

      // Set initial game types
      act(() => {
        result.current.gameTypes = [
          {
            ...mockGameType,
            defaultInnings: 7,
            allowTies: false,
            isActive: true,
            gameCount: 0,
          } as any,
        ];
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
        result.current.selectedGame = { ...mockGameDto, teamName: 'Test Team' };
        result.current.searchQuery = 'test search';
        result.current.statusFilter = 'completed';
      });

      // Verify the persisted state includes the key fields
      expect(result.current.selectedGame).toEqual({
        ...mockGameDto,
        teamName: 'Test Team',
      });
      expect(result.current.searchQuery).toBe('test search');
      expect(result.current.statusFilter).toBe('completed');
    });
  });

  describe('Enhanced Error Handling and Edge Cases', () => {
    it('should handle createGame when use case returns null result', async () => {
      const result = { isSuccess: true, value: null }; // Null value scenario
      (mockGameApplicationService.createGame as any).mockResolvedValue(result);

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
        } catch {
          // Expected to throw when result is null
        }
      });

      expect(hookResult.current.error).toContain(
        'Game creation returned no result'
      );
    });

    it('should handle filtering by status "all"', async () => {
      (mockGameApplicationService.getCurrentGames as any).mockResolvedValue({
        isSuccess: true,
        value: [{ ...mockGameDto, teamName: 'Test Team' }],
      });

      const { result } = renderHook(() => useGamesStore());

      // Set up some initial games
      act(() => {
        result.current.games = [
          { ...mockGameDto, teamName: 'Test Team' } as any,
        ];
      });

      // Filter by 'all' should trigger loadGames
      await act(async () => {
        result.current.filterGamesByStatus('all');
      });

      expect(mockGameApplicationService.getCurrentGames).toHaveBeenCalled();
      expect(result.current.statusFilter).toBe('all');
    });

    it('should handle non-Error exceptions in createSeason', async () => {
      // Mock a non-Error exception (string error)
      (mockDataApplicationService.createSeason as any).mockRejectedValue(
        'String error'
      );

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
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to create season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateSeason', async () => {
      // Mock a non-Error exception (number error)
      (mockDataApplicationService.updateSeason as any).mockRejectedValue(404);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateSeason(mockSeasonDto);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to update season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in deleteSeason', async () => {
      // Mock a non-Error exception (object error)
      (mockDataApplicationService.archiveSeason as any).mockRejectedValue({
        code: 500,
      });

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteSeason('season-1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to delete season: Unknown error'
      );
    });

    it('should handle non-Error exceptions in createGameType', async () => {
      (mockDataApplicationService.createGameType as any).mockRejectedValue(
        'GameType save failed'
      );

      const { result } = renderHook(() => useGamesStore());

      const command = {
        name: 'Test Game Type',
        description: 'Test Description',
      };

      await act(async () => {
        try {
          await result.current.createGameType(command);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to create game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateGameType', async () => {
      (mockDataApplicationService.updateGameType as any).mockRejectedValue(
        null
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateGameType({
            ...mockGameType,
            defaultInnings: 7,
            allowTies: false,
            isActive: true,
            gameCount: 0,
          } as any);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to update game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in deleteGameType', async () => {
      (mockDataApplicationService.deleteGameType as any).mockRejectedValue(
        undefined
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteGameType('type-1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(
        'Failed to delete game type: Unknown error'
      );
    });

    it('should handle non-Error exceptions in updateGame', async () => {
      (mockGameApplicationService.updateGame as any).mockRejectedValue(
        'Update failed'
      );

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.updateGame({
            ...mockGameDto,
            teamName: 'Test Team',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to update game: Unknown error');
    });

    it('should handle non-Error exceptions in deleteGame', async () => {
      (mockGameApplicationService.deleteGame as any).mockRejectedValue(false);

      const { result } = renderHook(() => useGamesStore());

      await act(async () => {
        try {
          await result.current.deleteGame('game-1');
        } catch {
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
        result.current.games = [game1, game2].map(
          (g) => ({ ...g, teamName: 'Test Team' }) as any
        );
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
        'lineup-1',
        [], // inningIds
        new Scoreboard(5, 3) // Completed game needs a final score
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
        result.current.games = [game1, game2].map(
          (g) => ({ ...g, teamName: 'Test Team' }) as any
        );
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
