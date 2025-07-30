import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import TeamsPage from '@/presentation/pages/TeamsPage';
import { Team, Position } from '@/domain';
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

// Mock the teams store
jest.mock('@/presentation/stores/teamsStore', () => ({
  useTeamsStore: () => ({
    teams: mockTeamsData,
    loading: false,
    error: null,
    createTeam: mockCreateTeam,
    updateTeam: mockUpdateTeam,
    deleteTeam: mockDeleteTeam,
    addPlayer: mockAddPlayer,
    updatePlayer: mockUpdatePlayer,
    removePlayer: mockRemovePlayer,
    getTeams: mockGetTeams,
    getPlayerStats: mockGetPlayerStats,
  }),
}));

// Mock team data
const mockTeamsData = [
  new Team(
    'team-1',
    'Yankees',
    [],
    [
      {
        id: 'player-1',
        name: 'John Smith',
        jerseyNumber: '12',
        position: Position.pitcher(),
        isActive: true,
      },
      {
        id: 'player-2',
        name: 'Mike Johnson',
        jerseyNumber: '23',
        position: Position.catcher(),
        isActive: true,
      },
    ]
  ),
  new Team(
    'team-2',
    'Red Sox',
    [],
    [
      {
        id: 'player-3',
        name: 'Tom Wilson',
        jerseyNumber: '34',
        position: Position.firstBase(),
        isActive: true,
      },
    ]
  ),
];

const mockPlayerStats = {
  'player-1': { avg: 0.285, hits: 15, atBats: 52, rbi: 8 },
  'player-2': { avg: 0.32, hits: 22, atBats: 68, rbi: 14 },
  'player-3': { avg: 0.298, hits: 18, atBats: 60, rbi: 12 },
};

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
      mockCreateTeam.mockResolvedValue(new Team('team-3', 'Blue Jays', [], []));

      renderWithChakra(<TeamsPage />);

      const createTeamButton = screen.getByTestId('create-team-button');
      await user.click(createTeamButton);

      expect(screen.getByTestId('create-team-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('team-name-input'), {
        target: { value: 'Blue Jays' },
      });

      const saveButton = screen.getByTestId('save-team-button');
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
      const saveButton = screen.getByTestId('save-team-button');
      await user.click(saveButton);

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Team name is required'
      );
      expect(mockCreateTeam).not.toHaveBeenCalled();
    });

    it('should handle team creation errors', async () => {
      const user = userEvent.setup();
      mockCreateTeam.mockRejectedValue(new Error('Team name already exists'));

      renderWithChakra(<TeamsPage />);

      const createTeamButton = screen.getByTestId('create-team-button');
      await user.click(createTeamButton);

      fireEvent.change(screen.getByTestId('team-name-input'), {
        target: { value: 'Yankees' },
      });

      const saveButton = screen.getByTestId('save-team-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Failed to create team. Please try again.'
        );
      });
    });
  });

  describe('Teams List Display', () => {
    it('should display all teams in the list', () => {
      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-list')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-1')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-2')).toBeInTheDocument();

      expect(screen.getByText('Yankees')).toBeInTheDocument();
      expect(screen.getByText('Red Sox')).toBeInTheDocument();
    });

    it('should show team player counts', () => {
      renderWithChakra(<TeamsPage />);

      const yankeesCard = screen.getByTestId('team-card-team-1');
      const redSoxCard = screen.getByTestId('team-card-team-2');

      expect(yankeesCard).toHaveTextContent('2 Players');
      expect(redSoxCard).toHaveTextContent('1 Player');
    });

    it('should handle empty teams list', () => {
      mockGetTeams.mockResolvedValue([]);

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('empty-teams-message')).toBeInTheDocument();
      expect(screen.getByText(/No teams created yet/)).toBeInTheDocument();
    });
  });

  describe('Team Search and Filtering', () => {
    it('should allow searching teams by name', async () => {
      renderWithChakra(<TeamsPage />);

      const searchInput = screen.getByTestId('teams-search-input');
      fireEvent.change(searchInput, { target: { value: 'Yankees' } });

      await waitFor(() => {
        expect(screen.getByTestId('team-card-team-1')).toBeInTheDocument();
        expect(
          screen.queryByTestId('team-card-team-2')
        ).not.toBeInTheDocument();
      });
    });

    it('should allow filtering teams by player count', async () => {
      renderWithChakra(<TeamsPage />);

      const filterSelect = screen.getByTestId('teams-filter-select');
      await user.selectOptions(filterSelect, 'single-player');

      expect(screen.queryByTestId('team-card-team-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-2')).toBeInTheDocument();
    });

    it('should allow sorting teams', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const sortSelect = screen.getByTestId('teams-sort-select');
      await user.selectOptions(sortSelect, 'player-count');

      const teamCards = screen.getAllByTestId(/^team-card-/);
      expect(teamCards[0]).toHaveAttribute('data-testid', 'team-card-team-2'); // 1 player
      expect(teamCards[1]).toHaveAttribute('data-testid', 'team-card-team-1'); // 2 players
    });
  });

  describe('Team Management Integration', () => {
    it('should open team details with TeamManagement component', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-team-1');
      await user.click(viewTeamButton);

      expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
      expect(screen.getByTestId('team-management')).toBeInTheDocument();
      expect(screen.getByText('Yankees')).toBeInTheDocument();
    });

    it('should pass correct props to TeamManagement component', async () => {
      const user = userEvent.setup();

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-team-1');
      await user.click(viewTeamButton);

      const teamManagement = screen.getByTestId('team-management');
      expect(teamManagement).toBeInTheDocument();

      // Check that team data is properly passed
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
    });

    it('should handle player operations through TeamManagement', async () => {
      const user = userEvent.setup();
      mockAddPlayer.mockResolvedValue(mockTeamsData[0]);

      renderWithChakra(<TeamsPage />);

      const viewTeamButton = screen.getByTestId('view-team-team-1');
      await user.click(viewTeamButton);

      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      fireEvent.change(screen.getByTestId('player-name-input'), {
        target: { value: 'New Player' },
      });
      fireEvent.change(screen.getByTestId('player-jersey-input'), {
        target: { value: '45' },
      });
      fireEvent.change(screen.getByTestId('player-position-select'), {
        target: { value: 'shortstop' },
      });

      const savePlayerButton = screen.getByTestId('save-player-button');
      await user.click(savePlayerButton);

      expect(mockAddPlayer).toHaveBeenCalledWith('team-1', {
        name: 'New Player',
        jerseyNumber: '45',
        position: expect.objectContaining({ value: 'shortstop' }),
        isActive: true,
      });
    });
  });

  describe('Team Operations', () => {
    it('should allow editing team information', async () => {
      const user = userEvent.setup();
      mockUpdateTeam.mockResolvedValue(
        new Team('team-1', 'Updated Yankees', [], [])
      );

      renderWithChakra(<TeamsPage />);

      const editTeamButton = screen.getByTestId('edit-team-team-1');
      await user.click(editTeamButton);

      expect(screen.getByTestId('edit-team-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('team-name-input'), {
        target: { value: 'Updated Yankees' },
      });

      const saveButton = screen.getByTestId('save-team-button');
      await user.click(saveButton);

      expect(mockUpdateTeam).toHaveBeenCalledWith('team-1', {
        id: 'team-1',
        name: 'Updated Yankees',
        seasonIds: [],
        playerIds: expect.any(Array),
      });
    });

    it('should allow deleting teams with confirmation', async () => {
      const user = userEvent.setup();
      mockDeleteTeam.mockResolvedValue(undefined);

      renderWithChakra(<TeamsPage />);

      const deleteTeamButton = screen.getByTestId('delete-team-team-1');
      await user.click(deleteTeamButton);

      expect(screen.getByTestId('delete-team-modal')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete Yankees/)
      ).toBeInTheDocument();

      const confirmButton = screen.getByTestId('confirm-delete-button');
      await user.click(confirmButton);

      expect(mockDeleteTeam).toHaveBeenCalledWith('team-1');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner while fetching teams', () => {
      jest.doMock('@/presentation/stores/teamsStore', () => ({
        useTeamsStore: () => ({
          teams: [],
          loading: true,
          error: null,
          getTeams: mockGetTeams,
        }),
      }));

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display error message when teams fail to load', () => {
      jest.doMock('@/presentation/stores/teamsStore', () => ({
        useTeamsStore: () => ({
          teams: [],
          loading: false,
          error: 'Failed to load teams',
          getTeams: mockGetTeams,
        }),
      }));

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load teams'
      );
    });

    it('should allow retrying after error', async () => {
      const user = userEvent.setup();

      jest.doMock('@/presentation/stores/teamsStore', () => ({
        useTeamsStore: () => ({
          teams: [],
          loading: false,
          error: 'Failed to load teams',
          getTeams: mockGetTeams,
        }),
      }));

      renderWithChakra(<TeamsPage />);

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(mockGetTeams).toHaveBeenCalled();
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

      const teamCard = screen.getByTestId('team-card-team-1');
      expect(teamCard).toHaveClass('mobile-compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithChakra(<TeamsPage />);

      const teamsList = screen.getByTestId('teams-list');
      expect(teamsList).toHaveAttribute('role', 'list');
      expect(teamsList).toHaveAttribute('aria-label', 'Teams List');

      const teamCards = screen.getAllByTestId(/^team-card-/);
      teamCards.forEach((card) => {
        expect(card).toHaveAttribute('role', 'listitem');
      });
    });

    it('should support keyboard navigation', () => {
      renderWithChakra(<TeamsPage />);

      const createButton = screen.getByTestId('create-team-button');
      const viewButton = screen.getByTestId('view-team-team-1');

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
      const largeTeamsList = Array.from(
        { length: 100 },
        (_, i) => new Team(`team-${i}`, `Team ${i}`, [], [])
      );
      mockGetTeams.mockResolvedValue(largeTeamsList);

      renderWithChakra(<TeamsPage />);

      expect(screen.getByTestId('teams-list')).toBeInTheDocument();
      // Should implement virtualization for large lists
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });
});
