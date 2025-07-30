import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { LineupDisplay } from '@/presentation/components/LineupDisplay';
import { Position } from '@/domain';
import theme from '@/presentation/theme';

// Mock lineup data for testing
const mockLineup = [
  {
    battingOrder: 1,
    playerId: 'player1',
    playerName: 'John Smith',
    jerseyNumber: '1',
    position: Position.pitcher(),
  },
  {
    battingOrder: 2,
    playerId: 'player2',
    playerName: 'Mike Johnson',
    jerseyNumber: '2',
    position: Position.catcher(),
  },
  {
    battingOrder: 3,
    playerId: 'player3',
    playerName: 'Sarah Wilson',
    jerseyNumber: '3',
    position: Position.firstBase(),
  },
  {
    battingOrder: 4,
    playerId: 'player4',
    playerName: 'David Brown',
    jerseyNumber: '4',
    position: Position.secondBase(),
  },
  {
    battingOrder: 5,
    playerId: 'player5',
    playerName: 'Lisa Davis',
    jerseyNumber: '5',
    position: Position.thirdBase(),
  },
  {
    battingOrder: 6,
    playerId: 'player6',
    playerName: 'Tom Miller',
    jerseyNumber: '6',
    position: Position.shortstop(),
  },
  {
    battingOrder: 7,
    playerId: 'player7',
    playerName: 'Amy Garcia',
    jerseyNumber: '7',
    position: Position.leftField(),
  },
  {
    battingOrder: 8,
    playerId: 'player8',
    playerName: 'Chris Rodriguez',
    jerseyNumber: '8',
    position: Position.centerField(),
  },
  {
    battingOrder: 9,
    playerId: 'player9',
    playerName: 'Jessica Martinez',
    jerseyNumber: '9',
    position: Position.rightField(),
  },
];

const mockSubstitutes = [
  {
    playerId: 'sub1',
    playerName: 'Sub Player 1',
    jerseyNumber: '10',
    position: Position.pitcher(),
  },
  {
    playerId: 'sub2',
    playerName: 'Sub Player 2',
    jerseyNumber: '11',
    position: Position.catcher(),
  },
];

const renderWithChakra = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('LineupDisplay Component', () => {
  describe('Basic Display', () => {
    it('should display all 9 lineup positions', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
        />
      );

      for (let i = 1; i <= 9; i++) {
        expect(screen.getByTestId(`batting-position-${i}`)).toBeInTheDocument();
      }
    });

    it('should display player information correctly', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
        />
      );

      // Check first player
      const firstPosition = screen.getByTestId('batting-position-1');
      expect(firstPosition).toHaveTextContent('John Smith');
      expect(firstPosition).toHaveTextContent('#1');
      expect(firstPosition).toHaveTextContent('P'); // Pitcher abbreviation
    });

    it('should highlight current batter', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={3}
          isEditable={false}
        />
      );

      const currentBatterElement = screen.getByTestId('batting-position-3');
      expect(currentBatterElement).toHaveClass('current-batter');

      // Other positions should not be highlighted
      expect(screen.getByTestId('batting-position-1')).not.toHaveClass(
        'current-batter'
      );
      expect(screen.getByTestId('batting-position-2')).not.toHaveClass(
        'current-batter'
      );
    });

    it('should show position abbreviations correctly', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
        />
      );

      expect(screen.getByTestId('batting-position-1')).toHaveTextContent('P'); // Pitcher
      expect(screen.getByTestId('batting-position-2')).toHaveTextContent('C'); // Catcher
      expect(screen.getByTestId('batting-position-3')).toHaveTextContent('1B'); // First Base
      expect(screen.getByTestId('batting-position-4')).toHaveTextContent('2B'); // Second Base
      expect(screen.getByTestId('batting-position-6')).toHaveTextContent('SS'); // Shortstop
    });
  });

  describe('Editable Mode', () => {
    it('should show drag handles when editable and drag drop enabled', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          enableDragDrop={true}
        />
      );

      // Should show drag handles for each position when drag drop is enabled
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByTestId(`drag-handle-${i}`)).toBeInTheDocument();
      }
    });

    it('should allow position changes when editable', async () => {
      const onLineupChange = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          onLineupChange={onLineupChange}
        />
      );

      const positionSelect = screen.getByTestId('position-select-1');
      await user.selectOptions(positionSelect, 'catcher');

      expect(onLineupChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            battingOrder: 1,
            playerId: 'player1',
            position: Position.catcher(),
          }),
        ])
      );
    });

    it('should validate no duplicate positions', async () => {
      const onValidationError = jest.fn();
      const onLineupChange = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          onValidationError={onValidationError}
          onLineupChange={onLineupChange}
          validateOnChange={true}
        />
      );

      // Try to assign pitcher position to two players
      const positionSelect = screen.getByTestId('position-select-2');
      await user.selectOptions(positionSelect, 'pitcher');

      expect(onValidationError).toHaveBeenCalledWith(
        'Position pitcher is already assigned to another player'
      );
    });

    it('should allow player removal when editable', async () => {
      const onLineupChange = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          onLineupChange={onLineupChange}
        />
      );

      const removeButton = screen.getByTestId('remove-player-1');
      await user.click(removeButton);

      expect(onLineupChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.not.objectContaining({
            playerId: 'player1',
          }),
        ])
      );
    });
  });

  describe('Drag and Drop', () => {
    it('should support drag and drop reordering', async () => {
      const onLineupChange = jest.fn();

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          onLineupChange={onLineupChange}
          enableDragDrop={true}
        />
      );

      const dragHandle1 = screen.getByTestId('drag-handle-1');
      const dropZone2 = screen.getByTestId('drop-zone-2');

      // Simulate drag and drop
      fireEvent.dragStart(dragHandle1);
      fireEvent.dragOver(dropZone2);
      fireEvent.drop(dropZone2);

      expect(onLineupChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            battingOrder: 2,
            playerId: 'player1', // Player moved to position 2
          }),
          expect.objectContaining({
            battingOrder: 1,
            playerId: 'player2', // Player moved to position 1
          }),
        ])
      );
    });

    it('should show drop zones during drag', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          enableDragDrop={true}
        />
      );

      const dragHandle = screen.getByTestId('drag-handle-1');
      fireEvent.dragStart(dragHandle);

      // Drop zones should be visible
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByTestId(`drop-zone-${i}`)).toHaveClass(
          'drop-zone-active'
        );
      }
    });
  });

  describe('Substitutes Display', () => {
    it('should display substitute players when provided', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          substitutes={mockSubstitutes}
        />
      );

      expect(screen.getByTestId('substitutes-section')).toBeInTheDocument();
      expect(screen.getByTestId('substitute-sub1')).toHaveTextContent(
        'Sub Player 1'
      );
      expect(screen.getByTestId('substitute-sub1')).toHaveTextContent('#10');
    });

    it('should allow substitution when editable', async () => {
      const onSubstitution = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
          substitutes={mockSubstitutes}
          onSubstitution={onSubstitution}
        />
      );

      const substituteButton = screen.getByTestId('substitute-btn-sub1');
      await user.click(substituteButton);

      // Should open substitution modal
      expect(screen.getByTestId('substitution-modal')).toBeInTheDocument();

      // Select player to substitute
      const playerSelect = screen.getByTestId('substitute-for-select');
      await user.selectOptions(playerSelect, 'player1');

      const confirmButton = screen.getByTestId('confirm-substitution');
      await user.click(confirmButton);

      expect(onSubstitution).toHaveBeenCalledWith({
        incomingPlayer: mockSubstitutes[0],
        outgoingPlayerId: 'player1',
        battingOrder: 1,
      });
    });

    it('should hide substitutes section when empty', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          substitutes={[]}
        />
      );

      expect(
        screen.queryByTestId('substitutes-section')
      ).not.toBeInTheDocument();
    });
  });

  describe('Statistics Integration', () => {
    it('should display player statistics when provided', () => {
      const mockStats = {
        player1: { avg: 0.35, hits: 7, atBats: 20, rbi: 5 },
        player2: { avg: 0.275, hits: 11, atBats: 40, rbi: 8 },
      };

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          playerStats={mockStats}
        />
      );

      const player1Element = screen.getByTestId('batting-position-1');
      expect(player1Element).toHaveTextContent('0.350'); // Batting average
      expect(player1Element).toHaveTextContent('7-20'); // Hits-AtBats
    });

    it('should handle missing statistics gracefully', () => {
      const mockStats = {
        player1: { avg: 0.35, hits: 7, atBats: 20, rbi: 5 },
        // player2 stats missing
      };

      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          playerStats={mockStats}
        />
      );

      const player2Element = screen.getByTestId('batting-position-2');
      expect(player2Element).toHaveTextContent('---'); // No stats available
    });
  });

  describe('Mobile Optimization', () => {
    it('should use compact layout on mobile', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          isMobile={true}
        />
      );

      const lineupContainer = screen.getByTestId('lineup-container');
      expect(lineupContainer).toHaveClass('mobile-layout');
    });

    it('should show abbreviated player info on mobile', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
          isMobile={true}
        />
      );

      // Should show just jersey and position on mobile
      const firstPosition = screen.getByTestId('batting-position-1');
      expect(firstPosition).toHaveTextContent('#1');
      expect(firstPosition).toHaveTextContent('P');

      // Full name might be hidden on mobile
      expect(firstPosition).toHaveClass('mobile-compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={false}
        />
      );

      expect(
        screen.getByRole('list', { name: /batting lineup/i })
      ).toBeInTheDocument();

      for (let i = 1; i <= 9; i++) {
        expect(screen.getByTestId(`batting-position-${i}`)).toHaveAttribute(
          'role',
          'listitem'
        );
      }
    });

    it('should announce current batter to screen readers', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={3}
          isEditable={false}
        />
      );

      const currentBatter = screen.getByTestId('batting-position-3');
      expect(currentBatter).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Current batter')
      );
    });

    it('should support keyboard navigation in editable mode', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={1}
          isEditable={true}
        />
      );

      const firstPositionSelect = screen.getByTestId('position-select-1');
      expect(firstPositionSelect).toHaveAttribute('tabIndex', '0');

      // Should be focusable
      firstPositionSelect.focus();
      expect(document.activeElement).toBe(firstPositionSelect);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty lineup gracefully', () => {
      renderWithChakra(
        <LineupDisplay lineup={[]} currentBatter={1} isEditable={false} />
      );

      expect(screen.getByTestId('empty-lineup-message')).toBeInTheDocument();
      expect(screen.getByText(/no players in lineup/i)).toBeInTheDocument();
    });

    it('should handle invalid current batter', () => {
      renderWithChakra(
        <LineupDisplay
          lineup={mockLineup}
          currentBatter={15} // Invalid - greater than lineup length
          isEditable={false}
        />
      );

      // Should not crash and no position should be highlighted
      expect(
        screen.queryByTestId('current-batter-indicator')
      ).not.toBeInTheDocument();
    });

    it('should validate complete lineup before saving', () => {
      const onValidationError = jest.fn();
      const incompleteLineup = mockLineup.slice(0, 7); // Only 7 players

      renderWithChakra(
        <LineupDisplay
          lineup={incompleteLineup}
          currentBatter={1}
          isEditable={true}
          onValidationError={onValidationError}
          validateOnChange={true}
        />
      );

      expect(onValidationError).toHaveBeenCalledWith(
        'Lineup must have exactly 9 players'
      );
    });
  });
});
