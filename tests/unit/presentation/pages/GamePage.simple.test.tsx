import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import GamePage from '@/presentation/pages/GamePage';

// Mock the stores
jest.mock('@/presentation/stores/gamesStore', () => ({
  useGamesStore: () => ({
    games: [],
    seasons: [],
    gameTypes: [],
    teams: [],
    loading: false,
    error: null,
    loadGames: jest.fn(),
    loadSeasons: jest.fn(),
    loadGameTypes: jest.fn(),
    loadTeams: jest.fn(),
    createGame: jest.fn(),
    clearError: jest.fn(),
    searchGames: jest.fn(),
    filterGamesByStatus: jest.fn(),
  }),
}));

jest.mock('@/presentation/stores/teamsStore', () => ({
  useTeamsStore: () => ({
    teams: [],
    seasons: [],
    gameTypes: [],
    loading: false,
    error: null,
    loadTeams: jest.fn(),
    loadSeasons: jest.fn(),
    loadGameTypes: jest.fn(),
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('GamePage - Basic Functionality', () => {
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
      screen.getByRole('button', { name: /create new game/i })
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
    expect(screen.getByRole('tab', { name: /completed/i })).toBeInTheDocument();
  });

  it('should show empty state when no games exist', () => {
    render(
      <TestWrapper>
        <GamePage />
      </TestWrapper>
    );

    expect(screen.getByText(/no games found/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first game/i)).toBeInTheDocument();
  });
});
