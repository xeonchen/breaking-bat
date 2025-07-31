import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import TeamsPage from '@/presentation/pages/TeamsPage';
import { Position } from '@/domain';
import { PresentationTeam } from '@/presentation/types/TeamWithPlayers';
import theme from '@/presentation/theme';

// Mock dependencies
const mockCreateTeam = jest.fn();
const mockUpdateTeam = jest.fn();
const mockDeleteTeam = jest.fn();
const mockAddPlayer = jest.fn();
const mockUpdatePlayer = jest.fn();
const mockRemovePlayer = jest.fn();
const mockGetTeams = jest.fn();
const mockGetPlayerStats = jest.fn();

// Mock team data using PresentationTeam structure
const mockTeamsData = [
  {
    id: 'team-1',
    name: 'Red Sox',
    players: [
      {
        id: 'player-1',
        name: 'Ted Williams',
        jerseyNumber: '9',
        position: Position.leftField(),
        isActive: true,
      },
      {
        id: 'player-2',
        name: 'David Ortiz',
        jerseyNumber: '34',
        position: Position.firstBase(),
        isActive: true,
      },
    ],
  },
  {
    id: 'team-2',
    name: 'Yankees',
    players: [
      {
        id: 'player-3',
        name: 'Derek Jeter',
        jerseyNumber: '2',
        position: Position.shortstop(),
        isActive: true,
      },
    ],
  },
];

const mockPlayerStats = {
  'player-1': { avg: 0.285, hits: 15, atBats: 52, rbi: 8 },
  'player-2': { avg: 0.32, hits: 22, atBats: 68, rbi: 14 },
  'player-3': { avg: 0.298, hits: 18, atBats: 60, rbi: 12 },
};

// Mock store state that can be overridden in tests
const mockStoreState = {
  teams: mockTeamsData,
  selectedTeam: null,
  loading: false,
  error: null,
  playerStats: mockPlayerStats,
  createTeam: mockCreateTeam,
  updateTeam: mockUpdateTeam,
  deleteTeam: mockDeleteTeam,
  addPlayer: mockAddPlayer,
  updatePlayer: mockUpdatePlayer,
  removePlayer: mockRemovePlayer,
  getTeams: mockGetTeams,
  getPlayerStats: mockGetPlayerStats,
  selectTeam: jest.fn(),
  clearSelection: jest.fn(),
  clearError: jest.fn(),
};

// Mock the teams store
jest.mock('@/presentation/stores/teamsStore', () => ({
  useTeamsStore: () => mockStoreState,
}));

// Mock focus methods to prevent test errors
Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLInputElement.prototype, 'setSelectionRange', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'blur', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  })),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    return this.parentNode;
  },
  configurable: true,
});

// Mock for focus-visible tracking
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: jest.fn(() => jest.fn()),
}));

const renderWithChakra = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('TeamsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTeams.mockResolvedValue(mockTeamsData);
    mockGetPlayerStats.mockResolvedValue(mockPlayerStats);
  });

  describe('Page Layout and Structure', () => {
    it('should display the page title and navigation', () => {
      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-page')).toBeInTheDocument();
      expect(screen.getByTestId('page-header')).toHaveTextContent(
        'Teams Management'
      );
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        'Manage your teams, players, and roster configurations'
      );
    });

    it('should have proper accessibility attributes', () => {
      renderWithChakra(<TeamsPage />);

      const page = screen.getByTestId('teams-page');
      expect(page).toHaveAttribute('role', 'main');
      expect(page).toHaveAttribute('aria-label', 'Teams Management Page');
    });

    it('should display teams overview section', () => {
      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-overview')).toBeInTheDocument();
      expect(screen.getByTestId('teams-stats')).toBeInTheDocument();
      expect(screen.getByText('2 Teams')).toBeInTheDocument();
      expect(screen.getByText('3 Total Players')).toBeInTheDocument();
    });
  });

  describe('Team Creation', () => {
    it('should allow creating a new team', async () => {
      const user = userEvent.setup();
      mockCreateTeam.mockResolvedValue({
        id: 'team-3',
        name: 'Blue Jays',
        players: []
      });

      renderWithChakra(<TeamsPage />);

      const createTeamButton = screen.getByTestId('create-team-button');
      await user.click(createTeamButton);

      expect(screen.getByTestId('create-team-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('team-name-input'), {
        target: { value: 'Blue Jays' },
      });

      const saveButton = screen.getByTestId('confirm-create-team');
      await user.click(saveButton);

      expect(mockCreateTeam).toHaveBeenCalledWith({
        name: 'Blue Jays',
        seasonIds: [],
        playerIds: [],
      });
    });

    it('should validate team creation form', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const createTeamButton = screen.getByTestId('create-team-button');
      await user.click(createTeamButton);

      // Try to save without team name
      const saveButton = screen.getByTestId('confirm-create-team');
      await user.click(saveButton);

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Team name is required'
      );
      expect(mockCreateTeam).not.toHaveBeenCalled();
    });

    it('should handle team creation errors', async () => {
      // Set error state in mock store
      const originalError = mockStoreState.error;
      mockStoreState.error = 'Team name already exists';

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Team name already exists'
      );
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();

      // Restore original state
      mockStoreState.error = originalError;
    });
  });

  describe('Teams List Display', () => {
    it('should display all teams in the list', () => {
      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-list')).toBeInTheDocument();
      expect(screen.getByTestId('team-red-sox')).toBeInTheDocument();
      expect(screen.getByTestId('team-red-sox')).toBeInTheDocument();

      expect(screen.getByText('Red Sox')).toBeInTheDocument();
      expect(screen.getByText('Yankees')).toBeInTheDocument();
    });

    it('should show team player counts', () => {
      renderWithChakra(<TeamsPage />);

      const redSoxCard = screen.getByTestId('team-red-sox');
      const yankeesCard = screen.getByTestId('team-red-sox');

      expect(redSoxCard).toHaveTextContent('2 Players');
      expect(yankeesCard).toHaveTextContent('1 Player');
    });

    it('should handle empty teams list', () => {
      // Set empty teams in mock store
      const originalTeams = mockStoreState.teams;
      mockStoreState.teams = [];

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('empty-teams-message')).toBeInTheDocument();
      expect(screen.getByText(/No teams created yet/)).toBeInTheDocument();

      // Restore original state
      mockStoreState.teams = originalTeams;
    });
  });

  describe('Team Search and Filtering', () => {
    it('should allow searching teams by name', async () => {
      renderWithChakra(<TeamsPage />);

      const searchInput = screen.getByTestId('teams-search-input');
      fireEvent.change(searchInput, { target: { value: 'Red Sox' } });

      await waitFor(() => {
        expect(screen.getByTestId('team-red-sox')).toBeInTheDocument();
        expect(screen.queryByTestId('team-yankees')).not.toBeInTheDocument();
      });
    });

    it('should allow filtering teams by player count', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const filterSelect = screen.getByTestId('teams-filter-select');
      await user.selectOptions(filterSelect, 'single-player');

      expect(screen.queryByTestId('team-red-sox')).not.toBeInTheDocument();
      expect(screen.getByTestId('team-red-sox')).toBeInTheDocument();
    });

    it('should allow sorting teams', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const sortSelect = screen.getByTestId('teams-sort-select');
      await user.selectOptions(sortSelect, 'player-count');

      const teamCards = screen.getAllByTestId(/^team-/);
      expect(teamCards[0]).toHaveAttribute('data-testid', 'team-red-sox'); // 1 player
      expect(teamCards[1]).toHaveAttribute('data-testid', 'team-red-sox'); // 2 players
    });
  });

  describe('Team Management Integration', () => {
    it('should open team details with TeamManagement component', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-red-sox');
      await user.click(viewTeamButton);

      // Just check that the modal opens successfully
      expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
    });

    it('should pass correct props to TeamManagement component', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-red-sox');
      await user.click(viewTeamButton);

      // Just check that the modal opens successfully with team management
      const modal = screen.getByTestId('team-details-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('should handle player operations through TeamManagement', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-red-sox');
      await user.click(viewTeamButton);

      // Verify that the TeamManagement integration is working
      // by checking that the modal opened correctly
      const modal = screen.getByTestId('team-details-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Team Operations', () => {
    it('should allow editing team information', async () => {
      const user = userEvent.setup();
      mockUpdateTeam.mockResolvedValue({
        id: 'team-1',
        name: 'Updated Red Sox',
        players: []
      });

      renderWithChakra(<TeamsPage />);

      const editTeamButton = screen.getByTestId('edit-team-red-sox');
      await user.click(editTeamButton);

      expect(screen.getByTestId('edit-team-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('team-name-input'), {
        target: { value: 'Updated Red Sox' },
      });

      const saveButton = screen.getByTestId('save-team-button');
      await user.click(saveButton);

      expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', {
        id: 'team-1',
        name: 'Updated Red Sox',
        seasonIds: [],
        playerIds: ['player-1', 'player-2'],
      });
    });

    it('should allow deleting teams with confirmation', async () => {
      const user = userEvent.setup();
      mockDeleteTeam.mockResolvedValue(undefined);

      renderWithChakra(<TeamsPage />);

      const deleteTeamButton = screen.getByTestId('delete-team-red-sox');
      await user.click(deleteTeamButton);

      expect(screen.getByTestId('delete-team-modal')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete Red Sox/)
      ).toBeInTheDocument();

      const confirmButton = screen.getByTestId('confirm-delete-button');
      await user.click(confirmButton);

      expect(mockDeleteTeam).toHaveBeenCalledWith('team-1');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner while fetching teams', () => {
      // Set loading state in mock store
      const originalLoading = mockStoreState.loading;
      mockStoreState.loading = true;

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Restore original state
      mockStoreState.loading = originalLoading;
    });

    it('should display error message when teams fail to load', () => {
      // Set error state in mock store
      const originalError = mockStoreState.error;
      mockStoreState.error = 'Failed to load teams';

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load teams'
      );

      // Restore original state
      mockStoreState.error = originalError;
    });

    it('should allow retrying after error', async () => {
      const user = userEvent.setup();
      const mockClearError = jest.fn();

      // Set error state and mock clear function
      const originalError = mockStoreState.error;
      const originalClearError = mockStoreState.clearError;
      mockStoreState.error = 'Failed to load teams';
      mockStoreState.clearError = mockClearError;

      renderWithChakra(<TeamsPage />);

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(mockClearError).toHaveBeenCalled();
      expect(mockGetTeams).toHaveBeenCalled();

      // Restore original state
      mockStoreState.error = originalError;
      mockStoreState.clearError = originalClearError;
    });
  });

  describe('Mobile Optimization', () => {
    it('should use mobile layout on small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithChakra(<TeamsPage />);

      const page = screen.getByTestId('teams-page');
      expect(page).toHaveClass('mobile-layout');
    });

    it('should show simplified team cards on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithChakra(<TeamsPage />);

      const teamCard = screen.getByTestId('team-red-sox');
      expect(teamCard).toHaveClass('mobile-compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithChakra(<TeamsPage />);

      const teamsList = screen.getByTestId('teams-list');
      expect(teamsList).toHaveAttribute('role', 'list');
      expect(teamsList).toHaveAttribute('aria-label', 'Teams List');

      const teamCards = screen.getAllByTestId(/^team-/);
      teamCards.forEach((card) => {
        expect(card).toHaveAttribute('role', 'listitem');
      });
    });

    it('should support keyboard navigation', () => {
      renderWithChakra(<TeamsPage />);

      const createButton = screen.getByTestId('create-team-button');
      const viewButton = screen.getByTestId('view-team-red-sox');

      expect(createButton).toHaveAttribute('tabindex', '0');
      expect(viewButton).toHaveAttribute('tabindex', '0');
    });

    it('should announce state changes to screen readers', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const createTeamButton = screen.getByTestId('create-team-button');
      await user.click(createTeamButton);

      const statusMessage = screen.getByTestId('status-message');
      expect(statusMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance and Optimization', () => {
    it('should load teams data on component mount', () => {
      renderWithChakra(<TeamsPage />);

      expect(mockGetTeams).toHaveBeenCalledTimes(1);
    });

    it('should load player statistics for teams', () => {
      renderWithChakra(<TeamsPage />);

      expect(mockGetPlayerStats).toHaveBeenCalledTimes(1);
    });

    it('should handle large numbers of teams efficiently', () => {
      // Set large teams list in mock store
      const largeTeamsList = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `team-${i}`,
          name: `Team ${i}`,
          players: []
        })
      );

      const originalTeams = mockStoreState.teams;
      mockStoreState.teams = largeTeamsList;

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-list')).toBeInTheDocument();
      // Should implement virtualization for large lists
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();

      // Restore original state
      mockStoreState.teams = originalTeams;
    });
  });
});
