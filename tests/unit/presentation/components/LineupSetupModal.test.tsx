import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ChakraProvider } from '@chakra-ui/react';
import { LineupSetupModal } from '../../../../src/presentation/components/LineupSetupModal';
import { Game } from '../../../../src/domain/entities/Game';
import { Team } from '../../../../src/domain/entities/Team';
import { Player } from '../../../../src/domain/entities/Player';
import { Position } from '../../../../src/domain/values/Position';

/**
 * TDD Component Tests for LineupSetupModal
 *
 * These tests are written BEFORE implementation and will initially fail.
 * They define the expected behavior for the lineup setup modal component.
 */

// Mock components and services - LineupRepository doesn't exist yet
// jest.mock('../../../../src/infrastructure/LineupRepository', () => ({
//   LineupRepository: jest.fn().mockImplementation(() => ({
//     create: jest.fn(),
//     update: jest.fn(),
//     findByGameId: jest.fn(),
//   })),
// }));

const mockGame = new Game(
  'test-game-id',
  'Test Game',
  'Test Opponent',
  new Date('2025-01-15'),
  'test-team-id',
  'home'
);

const mockTeam = new Team('test-team-id', 'Test Team', [], []);

const mockPlayers = [
  new Player('player-1', 'Player One', 1, Position.pitcher(), 'test-team-id'),
  new Player('player-2', 'Player Two', 2, Position.catcher(), 'test-team-id'),
  new Player(
    'player-3',
    'Player Three',
    3,
    Position.firstBase(),
    'test-team-id'
  ),
  new Player(
    'player-4',
    'Player Four',
    4,
    Position.secondBase(),
    'test-team-id'
  ),
  new Player(
    'player-5',
    'Player Five',
    5,
    Position.thirdBase(),
    'test-team-id'
  ),
  new Player('player-6', 'Player Six', 6, Position.shortstop(), 'test-team-id'),
  new Player(
    'player-7',
    'Player Seven',
    7,
    Position.leftField(),
    'test-team-id'
  ),
  new Player(
    'player-8',
    'Player Eight',
    8,
    Position.centerField(),
    'test-team-id'
  ),
  new Player(
    'player-9',
    'Player Nine',
    9,
    Position.rightField(),
    'test-team-id'
  ),
  new Player(
    'player-10',
    'Player Ten',
    10,
    Position.leftField(),
    'test-team-id'
  ),
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe('LineupSetupModal - TDD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display and Structure', () => {
    test('should render modal when isOpen is true', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('lineup-setup-modal')).toBeInTheDocument();
      });
    });

    test('should not render modal when isOpen is false', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      expect(
        screen.queryByTestId('lineup-setup-modal')
      ).not.toBeInTheDocument();
    });

    test('should display game name in modal title', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Setup Lineup for Test Game'
      );
    });

    test('should have close button that calls onClose', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const closeButtons = screen.getAllByTestId('close-modal-button');
        const modalCloseButton = closeButtons[0]; // The X button in header
        fireEvent.click(modalCloseButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Player Selection Interface', () => {
    test('should display player select dropdown for each batting position', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Should have player selects for positions 1-9 minimum
      for (let i = 1; i <= 9; i++) {
        expect(
          screen.getByTestId(`batting-position-${i}-player`)
        ).toBeInTheDocument();
      }
    });

    test('should populate player select options with team players', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const playerSelect = screen.getByTestId('batting-position-1-player');

        // Should have empty option plus all players
        expect(playerSelect.children.length).toBe(mockPlayers.length + 1);
      });

      // Should include player names with jersey numbers (appears multiple times)
      expect(screen.getAllByText('#1 Player One').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#2 Player Two').length).toBeGreaterThan(0);
    });

    test('should allow selecting different players for different positions', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      const position1Select = screen.getByTestId(
        'batting-position-1-player'
      ) as HTMLSelectElement;
      const position2Select = screen.getByTestId(
        'batting-position-2-player'
      ) as HTMLSelectElement;

      fireEvent.change(position1Select, { target: { value: 'player-1' } });
      fireEvent.change(position2Select, { target: { value: 'player-2' } });

      expect(position1Select.value).toBe('player-1');
      expect(position2Select.value).toBe('player-2');
    });
  });

  describe('Defensive Position Assignment', () => {
    test('should display defensive position select for each batting position', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Should have defensive position selects for positions 1-9 minimum
      for (let i = 1; i <= 9; i++) {
        expect(
          screen.getByTestId(`batting-position-${i}-defensive-position`)
        ).toBeInTheDocument();
      }
    });

    test('should populate defensive position options', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        // Should have all defensive positions (appears multiple times)
        expect(screen.getAllByText('Pitcher').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Catcher').length).toBeGreaterThan(0);
        expect(screen.getAllByText('First Base').length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText('Second Base').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Third Base').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Shortstop').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Left Field').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Center Field').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Right Field').length).toBeGreaterThan(0);
    });

    test('should allow assigning defensive positions', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      const positionSelect = screen.getByTestId(
        'batting-position-1-defensive-position'
      ) as HTMLSelectElement;
      fireEvent.change(positionSelect, { target: { value: 'Pitcher' } });

      expect(positionSelect.value).toBe('Pitcher');
    });
  });

  describe('Lineup Validation', () => {
    test('should show validation error for incomplete lineup', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('lineup-setup-modal')).toBeInTheDocument();
      });

      // Add partial lineup (only 2 positions with defensive positions)
      const player1Select = screen.getByTestId('batting-position-1-player');
      const player2Select = screen.getByTestId('batting-position-2-player');
      const position1Select = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      const position2Select = screen.getByTestId(
        'batting-position-2-defensive-position'
      );

      fireEvent.change(player1Select, { target: { value: 'player-1' } });
      fireEvent.change(player2Select, { target: { value: 'player-2' } });
      fireEvent.change(position1Select, { target: { value: 'Pitcher' } });
      fireEvent.change(position2Select, { target: { value: 'Catcher' } });

      // Wait for the state to update
      await waitFor(() => {
        expect(
          screen.getByText(/Lineup Progress: 2\/9 minimum positions filled/)
        ).toBeInTheDocument();
      });

      // Try to save with incomplete lineup (only 2 out of 9 positions)
      const saveButton = screen.getByTestId('save-lineup-button');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      fireEvent.click(saveButton);

      // Validation error should appear
      await waitFor(() => {
        expect(
          screen.getByTestId('lineup-validation-error')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Lineup must have at least 9 batting positions/)
      ).toBeInTheDocument();
    });

    test('should show validation error for duplicate defensive positions', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Assign players to positions 1 and 2
      const player1Select = screen.getByTestId('batting-position-1-player');
      const player2Select = screen.getByTestId('batting-position-2-player');
      fireEvent.change(player1Select, { target: { value: 'player-1' } });
      fireEvent.change(player2Select, { target: { value: 'player-2' } });

      // Assign same defensive position to both
      const position1Select = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      const position2Select = screen.getByTestId(
        'batting-position-2-defensive-position'
      );
      fireEvent.change(position1Select, { target: { value: 'Pitcher' } });
      fireEvent.change(position2Select, { target: { value: 'Pitcher' } });

      // Position validation error should appear immediately
      expect(
        screen.getByTestId('position-validation-error')
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(
          /Each defensive position can only be assigned to one player/
        ).length
      ).toBeGreaterThan(0);
    });

    test('should enable save button when lineup is complete and valid', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Assign 9 players with unique defensive positions
      const positions = [
        'Pitcher',
        'Catcher',
        'First Base',
        'Second Base',
        'Third Base',
        'Shortstop',
        'Left Field',
        'Center Field',
        'Right Field',
      ];

      for (let i = 1; i <= 9; i++) {
        const playerSelect = screen.getByTestId(`batting-position-${i}-player`);
        const positionSelect = screen.getByTestId(
          `batting-position-${i}-defensive-position`
        );

        fireEvent.change(playerSelect, { target: { value: `player-${i}` } });
        fireEvent.change(positionSelect, {
          target: { value: positions[i - 1] },
        });
      }

      await waitFor(() => {
        const saveButton = screen.getByTestId('save-lineup-button');
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Save Functionality', () => {
    test('should call onSave with lineup data when save is clicked', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Set up complete lineup
      const positions = [
        'Pitcher',
        'Catcher',
        'First Base',
        'Second Base',
        'Third Base',
        'Shortstop',
        'Left Field',
        'Center Field',
        'Right Field',
      ];

      for (let i = 1; i <= 9; i++) {
        const playerSelect = screen.getByTestId(`batting-position-${i}-player`);
        const positionSelect = screen.getByTestId(
          `batting-position-${i}-defensive-position`
        );

        fireEvent.change(playerSelect, { target: { value: `player-${i}` } });
        fireEvent.change(positionSelect, {
          target: { value: positions[i - 1] },
        });
      }

      const saveButton = screen.getByTestId('save-lineup-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: mockGame.id,
            battingOrder: expect.any(Array),
          })
        );
      });
    });

    test('should not call onSave when lineup is invalid', async () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Try to save incomplete lineup
      const saveButton = screen.getByTestId('save-lineup-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Progress Preservation', () => {
    test('should preserve partial lineup when modal is closed and reopened', () => {
      const { rerender } = renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      // Make partial assignments
      const player1Select = screen.getByTestId('batting-position-1-player');
      const position1Select = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      fireEvent.change(player1Select, { target: { value: 'player-1' } });
      fireEvent.change(position1Select, { target: { value: 'Pitcher' } });

      // Close modal
      rerender(
        <ChakraProvider>
          <LineupSetupModal
            isOpen={false}
            onClose={mockOnClose}
            onSave={mockOnSave}
            game={mockGame}
            team={mockTeam}
            players={mockPlayers}
          />
        </ChakraProvider>
      );

      // Reopen modal
      rerender(
        <ChakraProvider>
          <LineupSetupModal
            isOpen={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            game={mockGame}
            team={mockTeam}
            players={mockPlayers}
          />
        </ChakraProvider>
      );

      // Previous assignments should be preserved
      const reopenedPlayer1Select = screen.getByTestId(
        'batting-position-1-player'
      ) as HTMLSelectElement;
      const reopenedPosition1Select = screen.getByTestId(
        'batting-position-1-defensive-position'
      ) as HTMLSelectElement;

      expect(reopenedPlayer1Select.value).toBe('player-1');
      expect(reopenedPosition1Select.value).toBe('Pitcher');
    });
  });

  describe('Error States', () => {
    test('should handle insufficient players gracefully', () => {
      const insufficientPlayers = mockPlayers.slice(0, 5); // Only 5 players

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={insufficientPlayers}
        />
      );

      // Should show warning about insufficient players
      expect(
        screen.getByText(/Selected team has only \d+ active players available/)
      ).toBeInTheDocument();

      // Save button should be disabled
      const saveButton = screen.getByTestId('disabled-save-lineup-button');
      expect(saveButton).toBeDisabled();
    });

    test('should handle empty player list', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={[]}
        />
      );

      // Should show no players available message
      expect(
        screen.getByText(/no active players available/)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByTestId('batting-position-1-player')).toHaveAttribute(
        'aria-label'
      );
      expect(
        screen.getByTestId('batting-position-1-defensive-position')
      ).toHaveAttribute('aria-label');
    });

    test('should be keyboard navigable', () => {
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers}
        />
      );

      const playerSelect = screen.getByTestId('batting-position-1-player');
      playerSelect.focus();
      expect(document.activeElement).toBe(playerSelect);
    });
  });
});
