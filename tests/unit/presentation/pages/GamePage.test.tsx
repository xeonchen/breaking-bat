import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import GamePage from '@/presentation/pages/GamePage';
import { useGamesStore } from '@/presentation/stores/gamesStore';
import { useTeamsStore } from '@/presentation/stores/teamsStore';
import { Game, GameStatus, Team, Season, GameType } from '@/domain';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the stores
jest.mock('@/presentation/stores/gamesStore');
jest.mock('@/presentation/stores/teamsStore');

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseGamesStore = jest.mocked(useGamesStore);
const mockUseTeamsStore = jest.mocked(useTeamsStore);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </ChakraProvider>
);

// Test data
const mockTeam = new Team('team-1', 'Red Sox', ['player-1', 'player-2']);
const mockSeason = new Season(
  'season-1',
  'Season 2024',
  2024,
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  ['team-1']
);
const mockGameType = new GameType('gametype-1', 'Regular Season');

const mockGame = new Game(
  'game-1',
  'Game vs Yankees',
  'Yankees',
  new Date('2024-07-15'),
  'season-1',
  'gametype-1',
  'home',
  'team-1',
  'setup' as GameStatus
);

const mockActiveGame = new Game(
  'game-2',
  'Active Game vs Dodgers',
  'Dodgers',
  new Date('2024-07-16'),
  'season-1',
  'gametype-1',
  'away',
  'team-1',
  'in_progress' as GameStatus
);

const mockCompletedGame = new Game(
  'game-3',
  'Completed Game vs Mets',
  'Mets',
  new Date('2024-07-10'),
  'season-1',
  'gametype-1',
  'home',
  'team-1',
  'completed' as GameStatus,
  null,
  [],
  { homeScore: 8, awayScore: 6, inningScores: [] }
);

describe('GamePage', () => {
  const mockGamesStoreState = {
    games: [],
    teams: [],
    seasons: [],
    gameTypes: [],
    selectedGame: null,
    loading: false,
    error: null,
    loadGames: jest.fn(),
    loadTeams: jest.fn(),
    loadSeasons: jest.fn(),
    loadGameTypes: jest.fn(),
    createGame: jest.fn(),
    updateGame: jest.fn(),
    deleteGame: jest.fn(),
    selectGame: jest.fn(),
    clearError: jest.fn(),
    searchGames: jest.fn(),
    filterGamesByStatus: jest.fn(),
    filterGamesByTeam: jest.fn(),
  };

  const mockTeamsStoreState = {
    teams: [mockTeam],
    seasons: [mockSeason],
    gameTypes: [mockGameType],
    selectedTeam: null,
    loading: false,
    error: null,
    loadTeams: jest.fn(),
    loadSeasons: jest.fn(),
    loadGameTypes: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGamesStore.mockReturnValue(mockGamesStoreState);
    mockUseTeamsStore.mockReturnValue(mockTeamsStoreState);
  });

  describe('Initial Render and Layout', () => {
    it('should render the page title', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Games'
      );
    });

    it('should render create game button', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(
        screen.getByRole('button', { name: /create game/i })
      ).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/search games/i)).toBeInTheDocument();
    });

    it('should render filter tabs for game status', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /setup/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /in progress/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /completed/i })
      ).toBeInTheDocument();
    });

    it('should have accessible labels and ARIA attributes', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search games/i);
      expect(searchInput).toHaveAttribute('aria-label', 'Search games');

      const createButton = screen.getByRole('button', { name: /create game/i });
      expect(createButton).toHaveAttribute('aria-label', 'Create new game');
    });
  });

  describe('Data Loading', () => {
    it('should load games on mount', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(mockGamesStoreState.loadGames).toHaveBeenCalledTimes(1);
    });

    it('should load teams, seasons, and game types on mount', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(mockGamesStoreState.loadTeams).toHaveBeenCalledTimes(1);
      expect(mockGamesStoreState.loadSeasons).toHaveBeenCalledTimes(1);
      expect(mockGamesStoreState.loadGameTypes).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when data is loading', () => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        loading: true,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show error message when loading fails', () => {
      const errorMessage = 'Failed to load games';
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        error: errorMessage,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Game List Display', () => {
    beforeEach(() => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame, mockCompletedGame],
      });
    });

    it('should display all games by default', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByText('Game vs Yankees')).toBeInTheDocument();
      expect(screen.getByText('Active Game vs Dodgers')).toBeInTheDocument();
      expect(screen.getByText('Completed Game vs Mets')).toBeInTheDocument();
    });

    it('should display game information correctly', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const gameCard = screen.getByTestId('game-card-game-1');
      expect(within(gameCard).getByText('Game vs Yankees')).toBeInTheDocument();
      expect(within(gameCard).getByText('vs Yankees')).toBeInTheDocument();
      expect(within(gameCard).getByText('Setup')).toBeInTheDocument();
    });

    it('should show different status badges for different game states', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByText('Setup')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display scores for completed games', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const completedGameCard = screen.getByTestId('game-card-game-3');
      expect(within(completedGameCard).getByText('8 - 6')).toBeInTheDocument();
    });

    it('should show empty state when no games exist', () => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [],
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByText(/no games found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first game/i)).toBeInTheDocument();
    });
  });

  describe('Game Filtering', () => {
    beforeEach(() => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame, mockCompletedGame],
      });
    });

    it('should filter games by setup status', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('tab', { name: /setup/i }));

      await waitFor(() => {
        expect(mockGamesStoreState.filterGamesByStatus).toHaveBeenCalledWith(
          'setup'
        );
      });
    });

    it('should filter games by in progress status', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('tab', { name: /in progress/i }));

      await waitFor(() => {
        expect(mockGamesStoreState.filterGamesByStatus).toHaveBeenCalledWith(
          'in_progress'
        );
      });
    });

    it('should filter games by completed status', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('tab', { name: /completed/i }));

      await waitFor(() => {
        expect(mockGamesStoreState.filterGamesByStatus).toHaveBeenCalledWith(
          'completed'
        );
      });
    });

    it('should show all games when All tab is selected', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      // First click another tab
      fireEvent.click(screen.getByRole('tab', { name: /setup/i }));
      // Then click All tab
      fireEvent.click(screen.getByRole('tab', { name: /all/i }));

      await waitFor(() => {
        expect(mockGamesStoreState.loadGames).toHaveBeenCalled();
      });
    });
  });

  describe('Game Search', () => {
    beforeEach(() => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame, mockCompletedGame],
      });
    });

    it('should trigger search when typing in search input', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search games/i);
      fireEvent.change(searchInput, { target: { value: 'Yankees' } });

      await waitFor(
        () => {
          expect(mockGamesStoreState.searchGames).toHaveBeenCalledWith(
            'Yankees'
          );
        },
        { timeout: 600 }
      ); // Account for debounce
    });

    it('should clear search when input is empty', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search games/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(
        () => {
          expect(mockGamesStoreState.loadGames).toHaveBeenCalled();
        },
        { timeout: 600 }
      );
    });
  });

  describe('Create Game Modal', () => {
    it('should open create game modal when create button is clicked', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Game')).toBeInTheDocument();
    });

    it('should close modal when cancel button is clicked', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all required form fields in create modal', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      expect(screen.getByLabelText(/game name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opponent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/season/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/game type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/home\/away/i)).toBeInTheDocument();
    });

    it('should populate dropdowns with loaded data', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      // Check if team dropdown has options
      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.click(teamSelect);
      expect(screen.getByText('Red Sox')).toBeInTheDocument();

      // Check if season dropdown has options
      const seasonSelect = screen.getByLabelText(/season/i);
      fireEvent.click(seasonSelect);
      expect(screen.getByText('Season 2024')).toBeInTheDocument();

      // Check if game type dropdown has options
      const gameTypeSelect = screen.getByLabelText(/game type/i);
      fireEvent.click(gameTypeSelect);
      expect(screen.getByText('Regular Season')).toBeInTheDocument();
    });
  });

  describe('Game Creation', () => {
    it('should create game with valid data', async () => {
      const mockCreateGame = jest.fn().mockResolvedValue(mockGame);
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        createGame: mockCreateGame,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      // Fill form
      fireEvent.change(screen.getByLabelText(/game name/i), {
        target: { value: 'Test Game' },
      });
      fireEvent.change(screen.getByLabelText(/opponent/i), {
        target: { value: 'Test Opponent' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-12-25' },
      });

      // Select options
      fireEvent.change(screen.getByLabelText(/team/i), {
        target: { value: 'team-1' },
      });
      fireEvent.change(screen.getByLabelText(/season/i), {
        target: { value: 'season-1' },
      });
      fireEvent.change(screen.getByLabelText(/game type/i), {
        target: { value: 'gametype-1' },
      });
      fireEvent.change(screen.getByLabelText(/home\/away/i), {
        target: { value: 'home' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockCreateGame).toHaveBeenCalledWith({
          name: 'Test Game',
          opponent: 'Test Opponent',
          date: new Date('2024-12-25'),
          teamId: 'team-1',
          seasonId: 'season-1',
          gameTypeId: 'gametype-1',
          homeAway: 'home',
        });
      });
    });

    it('should show validation errors for invalid data', async () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/game name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/opponent is required/i)).toBeInTheDocument();
      });
    });

    it('should close modal after successful creation', async () => {
      const mockCreateGame = jest.fn().mockResolvedValue(mockGame);
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        createGame: mockCreateGame,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/game name/i), {
        target: { value: 'Test Game' },
      });
      fireEvent.change(screen.getByLabelText(/opponent/i), {
        target: { value: 'Test Opponent' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-12-25' },
      });
      fireEvent.change(screen.getByLabelText(/team/i), {
        target: { value: 'team-1' },
      });
      fireEvent.change(screen.getByLabelText(/season/i), {
        target: { value: 'season-1' },
      });
      fireEvent.change(screen.getByLabelText(/game type/i), {
        target: { value: 'gametype-1' },
      });
      fireEvent.change(screen.getByLabelText(/home\/away/i), {
        target: { value: 'home' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Game Actions', () => {
    beforeEach(() => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame, mockCompletedGame],
      });
    });

    it('should show Start Game button for setup games', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const setupGameCard = screen.getByTestId('game-card-game-1');
      expect(
        within(setupGameCard).getByRole('button', { name: /start game/i })
      ).toBeInTheDocument();
    });

    it('should show Continue Game button for in-progress games', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const activeGameCard = screen.getByTestId('game-card-game-2');
      expect(
        within(activeGameCard).getByRole('button', { name: /continue game/i })
      ).toBeInTheDocument();
    });

    it('should show View Results button for completed games', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const completedGameCard = screen.getByTestId('game-card-game-3');
      expect(
        within(completedGameCard).getByRole('button', { name: /view results/i })
      ).toBeInTheDocument();
    });

    it('should navigate to scoring page when Start Game is clicked', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const setupGameCard = screen.getByTestId('game-card-game-1');
      fireEvent.click(
        within(setupGameCard).getByRole('button', { name: /start game/i })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/scoring', {
        state: { gameId: 'game-1' },
      });
    });

    it('should navigate to scoring page when Continue Game is clicked', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const activeGameCard = screen.getByTestId('game-card-game-2');
      fireEvent.click(
        within(activeGameCard).getByRole('button', { name: /continue game/i })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/scoring', {
        state: { gameId: 'game-2' },
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should stack game cards vertically on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame],
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const gameGrid = screen.getByTestId('games-grid');
      expect(gameGrid).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
      });
    });

    it('should use responsive grid on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame, mockActiveGame],
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const gameGrid = screen.getByTestId('games-grid');
      expect(gameGrid).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Games');

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));
      const modalHeading = screen.getByRole('heading', { level: 2 });
      expect(modalHeading).toHaveTextContent('Create New Game');
    });

    it('should have keyboard navigation support', () => {
      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create game/i });
      createButton.focus();
      expect(document.activeElement).toBe(createButton);

      // Tab navigation should work
      fireEvent.keyDown(createButton, { key: 'Tab' });
      const searchInput = screen.getByPlaceholderText(/search games/i);
      expect(document.activeElement).toBe(searchInput);
    });

    it('should support screen readers with proper ARIA labels', () => {
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        games: [mockGame],
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      const gameCard = screen.getByTestId('game-card-game-1');
      expect(gameCard).toHaveAttribute('role', 'article');
      expect(gameCard).toHaveAttribute('aria-label', 'Game: Game vs Yankees');
    });
  });

  describe('Error Handling', () => {
    it('should display error message and allow retry', () => {
      const errorMessage = 'Network error';
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        error: errorMessage,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockGamesStoreState.clearError).toHaveBeenCalled();
      expect(mockGamesStoreState.loadGames).toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      const mockCreateGame = jest
        .fn()
        .mockRejectedValue(new Error('Creation failed'));
      mockUseGamesStore.mockReturnValue({
        ...mockGamesStoreState,
        createGame: mockCreateGame,
      });

      render(
        <TestWrapper>
          <GamePage />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /create game/i }));

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/game name/i), {
        target: { value: 'Test Game' },
      });
      fireEvent.change(screen.getByLabelText(/opponent/i), {
        target: { value: 'Test Opponent' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });
  });
});
