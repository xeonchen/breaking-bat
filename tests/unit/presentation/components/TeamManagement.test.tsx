import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { TeamManagement } from '@/presentation/components/TeamManagement';
import { Position } from '@/domain';
import theme from '@/presentation/theme';

// Mock team data
const mockTeam = {
  id: 'team-1',
  name: 'Yankees',
  players: [
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
    {
      id: 'player-3',
      name: 'Sarah Wilson',
      jerseyNumber: '34',
      position: Position.firstBase(),
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

      const teamNameInput = screen.getByTestId('team-name-input');
      await user.clear(teamNameInput);
      await user.type(teamNameInput, 'Red Sox');

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
      await user.type(screen.getByTestId('player-name-input'), 'David Brown');
      await user.type(screen.getByTestId('player-jersey-input'), '45');
      await user.selectOptions(
        screen.getByTestId('player-position-select'),
        'second-base'
      );

      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      expect(onPlayerAdd).toHaveBeenCalledWith({
        name: 'David Brown',
        jerseyNumber: '45',
        position: expect.objectContaining({ value: 'second-base' }),
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
      await user.type(screen.getByTestId('player-name-input'), 'New Player');
      await user.type(screen.getByTestId('player-jersey-input'), '12'); // Already used by John Smith
      await user.selectOptions(
        screen.getByTestId('player-position-select'),
        'shortstop'
      );

      const saveButton = screen.getByTestId('save-player-button');
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

      const nameInput = screen.getByTestId('player-name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Johnny Smith');

      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      expect(onPlayerEdit).toHaveBeenCalledWith('player-1', {
        id: 'player-1',
        name: 'Johnny Smith',
        jerseyNumber: '12',
        position: expect.objectContaining({ value: 'pitcher' }),
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
      const user = userEvent.setup();

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

      const searchInput = screen.getByTestId('player-search-input');
      await user.type(searchInput, 'Smith');

      // Only John Smith should be visible
      expect(screen.getByTestId('player-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('player-player-2')).not.toBeInTheDocument();
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
      await user.selectOptions(positionFilter, 'pitcher');

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

      expect(addButton).toHaveAttribute('tabindex', '0');
      expect(editButton).toHaveAttribute('tabindex', '0');

      addButton.focus();
      expect(document.activeElement).toBe(addButton);
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
      const saveButton = screen.getByTestId('save-player-button');
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

      await user.type(screen.getByTestId('player-name-input'), 'Test Player');
      await user.type(screen.getByTestId('player-jersey-input'), '99');
      await user.selectOptions(
        screen.getByTestId('player-position-select'),
        'shortstop'
      );

      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Failed to add player. Please try again.'
        );
      });
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

      // All player checkboxes should be checked
      expect(screen.getByTestId('select-player-player-1')).toBeChecked();
      expect(screen.getByTestId('select-player-player-2')).toBeChecked();
      expect(screen.getByTestId('select-player-player-3')).toBeChecked();

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

      // Select multiple players
      await user.click(screen.getByTestId('select-player-player-1'));
      await user.click(screen.getByTestId('select-player-player-2'));

      const bulkActiveButton = screen.getByTestId('bulk-set-active');
      await user.click(bulkActiveButton);

      expect(onPlayerEdit).toHaveBeenCalledTimes(2);
    });
  });
});
