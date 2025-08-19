import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { TeamManagement } from '@/presentation/components/TeamManagement';
import { PresentationPosition } from '@/presentation/types/presentation-values';
import theme from '@/presentation/theme';

// Mock team data - using kebab-case position strings to match component expectations
const mockTeam = {
  id: 'team-1',
  name: 'Yankees',
  players: [
    {
      id: 'player-1',
      name: 'John Smith',
      jerseyNumber: '12',
      positions: ['pitcher'], // Match the select option values
      isActive: true,
    },
    {
      id: 'player-2',
      name: 'Mike Johnson',
      jerseyNumber: '23',
      positions: ['catcher'],
      isActive: true,
    },
    {
      id: 'player-3',
      name: 'Sarah Wilson',
      jerseyNumber: '34',
      positions: ['first-base'],
      isActive: false, // Injured/inactive
    },
  ],
};

const mockStats = {
  'player-1': { avg: 0.285, hits: 15, atBats: 52, rbi: 8 },
  'player-2': { avg: 0.32, hits: 22, atBats: 68, rbi: 14 },
  'player-3': { avg: 0.198, hits: 8, atBats: 40, rbi: 3 },
};

// Mock focus methods to prevent test errors
Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: jest.fn(),
  writable: true,
});

// Mock setSelectionRange for input elements
Object.defineProperty(HTMLInputElement.prototype, 'setSelectionRange', {
  value: jest.fn(),
  writable: true,
});

// Mock all focus-related operations
Object.defineProperty(HTMLElement.prototype, 'blur', {
  value: jest.fn(),
  writable: true,
});

// Mock getBoundingClientRect
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

// More comprehensive focus/focus-visible mocking for Chakra UI
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    return this.parentNode;
  },
  configurable: true,
});

// Mock for focus-visible tracking - fix the destroy issue

// Return a cleanup function from trackFocusVisible
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: jest.fn(() => jest.fn()), // Return a cleanup function
}));

const renderWithChakra = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('TeamManagement Component', () => {
  describe('Basic Display', () => {
    it('should display team name and basic info', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByTestId('team-header')).toHaveTextContent('Yankees');
      expect(screen.getByTestId('team-roster')).toBeInTheDocument();
    });

    it('should display all players in the roster', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByTestId('player-player-1')).toHaveTextContent(
        'John Smith'
      );
      expect(screen.getByTestId('player-player-1')).toHaveTextContent('#12');
      expect(screen.getByTestId('player-player-2')).toHaveTextContent(
        'Mike Johnson'
      );
      expect(screen.getByTestId('player-player-2')).toHaveTextContent('#23');
      expect(screen.getByTestId('player-player-3')).toHaveTextContent(
        'Sarah Wilson'
      );
      expect(screen.getByTestId('player-player-3')).toHaveTextContent('#34');
    });

    it('should show player positions correctly', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByTestId('player-player-1')).toHaveTextContent('P'); // Pitcher
      expect(screen.getByTestId('player-player-2')).toHaveTextContent('C'); // Catcher
      expect(screen.getByTestId('player-player-3')).toHaveTextContent('1B'); // First Base
    });

    it('should indicate inactive players', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      const inactivePlayer = screen.getByTestId('player-player-3');
      expect(inactivePlayer).toHaveClass('inactive-player');
      expect(inactivePlayer).toHaveTextContent('Inactive');
    });
  });

  describe('Player Statistics', () => {
    it('should display player statistics when provided', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          showStats={true}
        />
      );

      const player1 = screen.getByTestId('player-player-1');
      expect(player1).toHaveTextContent('0.285'); // Average
      expect(player1).toHaveTextContent('15-52'); // Hits-AtBats
      expect(player1).toHaveTextContent('8 RBI');
    });

    it('should handle missing statistics gracefully', () => {
      const partialStats = {
        'player-1': { avg: 0.285, hits: 15, atBats: 52, rbi: 8 },
        // player-2 and player-3 stats missing
      };

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={partialStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          showStats={true}
        />
      );

      expect(screen.getByTestId('player-player-1')).toHaveTextContent('0.285');
      expect(screen.getByTestId('player-player-2')).toHaveTextContent(
        'No stats'
      );
      expect(screen.getByTestId('player-player-3')).toHaveTextContent(
        'No stats'
      );
    });

    it('should allow toggling statistics view', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          showStats={false}
        />
      );

      // Stats should be hidden initially
      expect(screen.queryByText('0.285')).not.toBeInTheDocument();

      const toggleButton = screen.getByTestId('toggle-stats-button');
      await user.click(toggleButton);

      // Stats should now be visible
      expect(screen.getByText('0.285')).toBeInTheDocument();
    });
  });

  describe('Team Management Actions', () => {
    it('should allow editing team information', async () => {
      const onTeamEdit = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={onTeamEdit}
          isEditable={true}
        />
      );

      const editTeamButton = screen.getByTestId('edit-team-button');
      await user.click(editTeamButton);

      expect(screen.getByTestId('team-edit-modal')).toBeInTheDocument();

      const teamNameInput = screen.getByTestId(
        'team-name-input'
      ) as HTMLInputElement;
      fireEvent.change(teamNameInput, { target: { value: 'Red Sox' } });

      const saveButton = screen.getByTestId('save-team-button');
      await user.click(saveButton);

      expect(onTeamEdit).toHaveBeenCalledWith({
        ...mockTeam,
        name: 'Red Sox',
      });
    });

    it('should allow adding new players', async () => {
      const onPlayerAdd = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={onPlayerAdd}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      expect(screen.getByTestId('player-add-modal')).toBeInTheDocument();

      // Fill in new player details
      fireEvent.change(screen.getByTestId('player-name-input'), {
        target: { value: 'David Brown' },
      });
      fireEvent.change(screen.getByTestId('player-jersey-input'), {
        target: { value: '45' },
      });
      fireEvent.change(screen.getByTestId('player-position-select'), {
        target: { value: 'second-base' },
      });

      const saveButton = screen.getByTestId('confirm-add-player');
      await user.click(saveButton);

      expect(onPlayerAdd).toHaveBeenCalledWith({
        name: 'David Brown',
        jerseyNumber: '45',
        positions: ['second-base'], // Positions are now strings in presentation layer
        isActive: true,
      });
    });

    it('should validate duplicate jersey numbers', async () => {
      const onPlayerAdd = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={onPlayerAdd}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      // Try to use existing jersey number
      fireEvent.change(screen.getByTestId('player-name-input'), {
        target: { value: 'New Player' },
      });
      fireEvent.change(screen.getByTestId('player-jersey-input'), {
        target: { value: '12' },
      }); // Already used by John Smith
      fireEvent.change(screen.getByTestId('player-position-select'), {
        target: { value: 'shortstop' },
      });

      const saveButton = screen.getByTestId('confirm-add-player');
      await user.click(saveButton);

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Jersey number 12 is already in use'
      );
      expect(onPlayerAdd).not.toHaveBeenCalled();
    });
  });

  describe('Player Management Actions', () => {
    it('should allow editing existing players', async () => {
      const onPlayerEdit = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={onPlayerEdit}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const editButton = screen.getByTestId('edit-player-player-1');
      await user.click(editButton);

      expect(screen.getByTestId('player-edit-modal')).toBeInTheDocument();

      const nameInput = screen.getByTestId(
        'player-name-input'
      ) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Johnny Smith' } });

      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      expect(onPlayerEdit).toHaveBeenCalledWith('player-1', {
        id: 'player-1',
        name: 'Johnny Smith',
        jerseyNumber: '12',
        positions: ['pitcher'], // Position strings in presentation layer
        isActive: true,
      });
    });

    it('should allow removing players with confirmation', async () => {
      const onPlayerRemove = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={onPlayerRemove}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const removeButton = screen.getByTestId('remove-player-player-1');
      await user.click(removeButton);

      expect(screen.getByTestId('remove-player-modal')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to remove John Smith/)
      ).toBeInTheDocument();

      const confirmButton = screen.getByTestId('confirm-remove-button');
      await user.click(confirmButton);

      expect(onPlayerRemove).toHaveBeenCalledWith('player-1');
    });

    it('should allow toggling player active status', async () => {
      const onPlayerEdit = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={onPlayerEdit}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const toggleButton = screen.getByTestId('toggle-active-player-3');
      await user.click(toggleButton);

      expect(onPlayerEdit).toHaveBeenCalledWith('player-3', {
        ...mockTeam.players[2],
        isActive: true, // Should toggle from false to true
      });
    });
  });

  describe('Search and Filter', () => {
    it('should allow searching players by name', async () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSearch={true}
        />
      );

      const searchInput = screen.getByTestId(
        'player-search-input'
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Smith' } });

      // Wait for filter to apply
      await waitFor(() => {
        expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
      });

      // Only John Smith should be visible
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('player-player-3')).not.toBeInTheDocument();
    });

    it('should allow filtering by position', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableFilters={true}
        />
      );

      const positionFilter = screen.getByTestId('position-filter-select');
      await user.selectOptions(positionFilter, 'pitcher'); // Use the select option value, not enum

      // Only pitcher should be visible
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-player-3')).not.toBeInTheDocument();
    });

    it('should allow filtering by active status', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableFilters={true}
        />
      );

      const statusFilter = screen.getByTestId('status-filter-select');
      await user.selectOptions(statusFilter, 'inactive');

      // Only inactive player should be visible
      expect(screen.queryByTestId('player-player-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('player-player-3')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should allow sorting by name', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSorting={true}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'name');

      const playerElements = screen.getAllByTestId(/^player-player-/);

      // Should be sorted alphabetically: John Smith, Mike Johnson, Sarah Wilson
      expect(playerElements[0]).toHaveTextContent('John Smith');
      expect(playerElements[1]).toHaveTextContent('Mike Johnson');
      expect(playerElements[2]).toHaveTextContent('Sarah Wilson');
    });

    it('should allow sorting by jersey number', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSorting={true}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'jersey');

      const playerElements = screen.getAllByTestId(/^player-player-/);

      // Should be sorted by jersey number: 12, 23, 34
      expect(playerElements[0]).toHaveTextContent('#12');
      expect(playerElements[1]).toHaveTextContent('#23');
      expect(playerElements[2]).toHaveTextContent('#34');
    });

    it('should allow sorting by batting average', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSorting={true}
          showStats={true}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'average');

      const playerElements = screen.getAllByTestId(/^player-player-/);

      // Should be sorted by average: 0.320 (Mike), 0.285 (John), 0.198 (Sarah)
      expect(playerElements[0]).toHaveTextContent('Mike Johnson');
      expect(playerElements[1]).toHaveTextContent('John Smith');
      expect(playerElements[2]).toHaveTextContent('Sarah Wilson');
    });
  });

  describe('Mobile Optimization', () => {
    it('should use compact layout on mobile', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isMobile={true}
        />
      );

      const container = screen.getByTestId('team-management');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should hide statistics on mobile by default', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isMobile={true}
          showStats={true}
        />
      );

      // Stats should be hidden on mobile
      expect(screen.queryByText('0.285')).not.toBeInTheDocument();
    });

    it('should show simplified player cards on mobile', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isMobile={true}
        />
      );

      const playerCard = screen.getByTestId('player-player-1');
      expect(playerCard).toHaveClass('mobile-compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByTestId('team-management')).toHaveAttribute(
        'role',
        'main'
      );
      expect(screen.getByTestId('team-management')).toHaveAttribute(
        'aria-label',
        'Team Management'
      );

      const roster = screen.getByTestId('team-roster');
      expect(roster).toHaveAttribute('role', 'list');
      expect(roster).toHaveAttribute('aria-label', 'Team Roster');
    });

    it('should support keyboard navigation', () => {
      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const addButton = screen.getByTestId('add-player-button');
      const editButton = screen.getByTestId('edit-player-player-1');

      // Check that interactive elements are focusable
      expect(addButton).toHaveAttribute('tabindex', '0');
      expect(editButton).toHaveAttribute('tabindex', '0');

      // Verify buttons are interactive and accessible
      expect(addButton).toBeEnabled();
      expect(editButton).toBeEnabled();
    });

    it('should announce changes to screen readers', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const toggleButton = screen.getByTestId('toggle-active-player-3');
      await user.click(toggleButton);

      const statusMessage = screen.getByTestId('status-message');
      expect(statusMessage).toHaveAttribute('aria-live', 'polite');
      expect(statusMessage).toHaveTextContent('Player status updated');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty team gracefully', () => {
      const emptyTeam = { ...mockTeam, players: [] };

      renderWithChakra(
        <TeamManagement
          team={emptyTeam}
          playerStats={{}}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();
      expect(screen.getByText(/No players on the roster/)).toBeInTheDocument();
    });

    it('should validate required fields in forms', async () => {
      const onPlayerAdd = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={onPlayerAdd}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      // Try to save without filling required fields
      const saveButton = screen.getByTestId('confirm-add-player');
      await user.click(saveButton);

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Name is required'
      );
      expect(onPlayerAdd).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const onPlayerAdd = jest.fn().mockRejectedValue(new Error('API Error'));
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={onPlayerAdd}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          isEditable={true}
        />
      );

      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      // Fill in player details using fireEvent for more reliable input
      fireEvent.change(screen.getByTestId('player-name-input'), {
        target: { value: 'Test Player' },
      });
      fireEvent.change(screen.getByTestId('player-jersey-input'), {
        target: { value: '99' },
      });
      fireEvent.change(screen.getByTestId('player-position-select'), {
        target: { value: 'shortstop' },
      });

      const saveButton = screen.getByTestId('confirm-add-player');
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('error-message')).toHaveTextContent(
            'Failed to add player. Please try again.'
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Bulk Operations', () => {
    it('should allow bulk selection of players', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableBulkOperations={true}
          isEditable={true}
        />
      );

      const selectAllCheckbox = screen.getByTestId('select-all-players');
      await user.click(selectAllCheckbox);

      // Get the actual input elements for checkboxes
      const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
      const playerCheckboxes = checkboxes.filter((checkbox) =>
        checkbox.getAttribute('data-testid')?.startsWith('select-player-')
      );

      // All player checkboxes should be checked
      playerCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });

      expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
    });

    it('should allow bulk status changes', async () => {
      const onPlayerEdit = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={onPlayerEdit}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableBulkOperations={true}
          isEditable={true}
        />
      );

      // Select multiple players - get the checkbox inputs within the labeled containers
      const player1Label = screen.getByTestId('select-player-player-1');
      const player2Label = screen.getByTestId('select-player-player-2');

      const player1Checkbox = player1Label.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      const player2Checkbox = player2Label.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;

      await user.click(player1Checkbox);
      await user.click(player2Checkbox);

      const bulkActiveButton = screen.getByTestId('bulk-set-active');
      await user.click(bulkActiveButton);

      expect(onPlayerEdit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Team Prop Updates', () => {
    it('should re-render when team prop changes', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Initially should show 3 players
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();

      // Update team with new player
      const newPlayer = {
        id: 'player-4',
        name: 'David Ortiz',
        jerseyNumber: '34',
        positions: ['first-base'],
        isActive: true,
      };
      const updatedTeam = {
        ...mockTeam,
        players: [...mockTeam.players, newPlayer],
      };

      rerender(
        <TeamManagement
          team={updatedTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should now show 4 players including the new one
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
      expect(screen.getByText('David Ortiz')).toBeInTheDocument();
    });

    it('should update player list when team.players changes', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getAllByTestId(/^player-player-/)).toHaveLength(3);

      // Remove a player from the team
      const teamWithRemovedPlayer = {
        ...mockTeam,
        players: mockTeam.players.filter((p) => p.id !== 'player-2'),
      };

      rerender(
        <TeamManagement
          team={teamWithRemovedPlayer}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should now show 2 players
      expect(screen.getAllByTestId(/^player-player-/)).toHaveLength(2);
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
    });

    it('should update player details when team.players properties change', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('#12')).toBeInTheDocument();

      // Update player name and jersey number
      const teamWithUpdatedPlayer = {
        ...mockTeam,
        players: mockTeam.players.map((p) =>
          p.id === 'player-1'
            ? { ...p, name: 'Johnny Smith', jerseyNumber: '99' }
            : p
        ),
      };

      rerender(
        <TeamManagement
          team={teamWithUpdatedPlayer}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should show updated player details
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Johnny Smith')).toBeInTheDocument();
      expect(screen.queryByText('#12')).not.toBeInTheDocument();
      expect(screen.getByText('#99')).toBeInTheDocument();
    });

    it('should maintain filtering and sorting with updated player data', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSearch={true}
          enableFilters={true}
          enableSorting={true}
        />
      );

      // Apply search filter
      const searchInput = screen.getByTestId('player-search-input');
      fireEvent.change(searchInput, { target: { value: 'Smith' } });

      // Should show only John Smith
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-player-3')).not.toBeInTheDocument();

      // Add a new player with "Smith" in the name
      const newSmithPlayer = {
        id: 'player-4',
        name: 'Jane Smith',
        jerseyNumber: '44',
        positions: ['shortstop'],
        isActive: true,
      };
      const updatedTeam = {
        ...mockTeam,
        players: [...mockTeam.players, newSmithPlayer],
      };

      rerender(
        <TeamManagement
          team={updatedTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
          enableSearch={true}
          enableFilters={true}
          enableSorting={true}
        />
      );

      // After rerender, search filter is reset so all players should show
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.getByTestId('player-player-2')).toBeInTheDocument();
      expect(screen.getByTestId('player-player-3')).toBeInTheDocument();
      expect(screen.getByTestId('player-player-4')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Re-apply search to verify filtering still works with new data
      const searchInputAfterRerender = screen.getByTestId(
        'player-search-input'
      );
      fireEvent.change(searchInputAfterRerender, {
        target: { value: 'Smith' },
      });

      // Should now show both Smith players
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-player-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('player-player-4')).toBeInTheDocument();
    });

    it('should handle empty team to populated team transition', () => {
      const emptyTeam = { ...mockTeam, players: [] };

      const { rerender } = renderWithChakra(
        <TeamManagement
          team={emptyTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should show empty roster message
      expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();
      expect(screen.queryByTestId('team-roster')).not.toBeInTheDocument();

      // Update to populated team
      rerender(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should now show roster with players
      expect(
        screen.queryByTestId('empty-roster-message')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('team-roster')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^player-player-/)).toHaveLength(3);
    });

    it('should handle populated team to empty team transition', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should show roster with players
      expect(screen.getByTestId('team-roster')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^player-player-/)).toHaveLength(3);

      // Update to empty team
      const emptyTeam = { ...mockTeam, players: [] };
      rerender(
        <TeamManagement
          team={emptyTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      // Should now show empty roster message
      expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();
      expect(screen.queryByTestId('team-roster')).not.toBeInTheDocument();
    });

    it('should update team name in header when team prop changes', () => {
      const { rerender } = renderWithChakra(
        <TeamManagement
          team={mockTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.getByText('Yankees')).toBeInTheDocument();

      // Update team name
      const updatedTeam = { ...mockTeam, name: 'Red Sox' };
      rerender(
        <TeamManagement
          team={updatedTeam}
          playerStats={mockStats}
          onPlayerAdd={jest.fn()}
          onPlayerEdit={jest.fn()}
          onPlayerRemove={jest.fn()}
          onTeamEdit={jest.fn()}
        />
      );

      expect(screen.queryByText('Yankees')).not.toBeInTheDocument();
      expect(screen.getByText('Red Sox')).toBeInTheDocument();
    });
  });
});
