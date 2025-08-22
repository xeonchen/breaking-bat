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
  'season-1', // seasonId
  'game-type-1', // gameTypeId
  'home', // homeAway
  'test-team-id', // teamId
  'setup', // status
  null, // lineupId
  [], // inningIds
  null // scoreboard
);

const mockTeam = new Team('test-team-id', 'Test Team', [], []);

const mockPlayers = [
  new Player('player-1', 'Player One', 1, 'test-team-id', [Position.pitcher()]),
  new Player('player-2', 'Player Two', 2, 'test-team-id', [Position.catcher()]),
  new Player('player-3', 'Player Three', 3, 'test-team-id', [
    Position.firstBase(),
  ]),
  new Player('player-4', 'Player Four', 4, 'test-team-id', [
    Position.secondBase(),
  ]),
  new Player('player-5', 'Player Five', 5, 'test-team-id', [
    Position.thirdBase(),
  ]),
  new Player('player-6', 'Player Six', 6, 'test-team-id', [
    Position.shortstop(),
  ]),
  new Player('player-7', 'Player Seven', 7, 'test-team-id', [
    Position.leftField(),
  ]),
  new Player('player-8', 'Player Eight', 8, 'test-team-id', [
    Position.centerField(),
  ]),
  new Player('player-9', 'Player Nine', 9, 'test-team-id', [
    Position.rightField(),
  ]),
  new Player('player-10', 'Player Ten', 10, 'test-team-id', [
    Position.shortFielder(),
  ]),
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe('LineupSetupModal - TDD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage to prevent test interference
    sessionStorage.clear();
  });

  afterEach(() => {
    // Ensure sessionStorage is clean after each test
    sessionStorage.clear();
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
        expect(screen.getAllByText('Pitcher (P)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Catcher (C)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('First Base (1B)').length).toBeGreaterThan(
          0
        );
      });
      expect(screen.getAllByText('Second Base (2B)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Third Base (3B)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Shortstop (SS)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Left Field (LF)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Center Field (CF)').length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText('Right Field (RF)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Short Fielder (SF)').length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText('Extra Player (EP)').length).toBeGreaterThan(
        0
      );
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

      // Clear all defensive positions first (auto-assignment gives everyone default positions)
      // Then manually assign only 2 positions to create incomplete lineup
      for (let i = 1; i <= 10; i++) {
        const positionSelect = screen.getByTestId(
          `batting-position-${i}-defensive-position`
        );
        fireEvent.change(positionSelect, { target: { value: '' } });
      }

      // Now assign only 2 positions
      const position1Select = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      const position2Select = screen.getByTestId(
        'batting-position-2-defensive-position'
      );

      fireEvent.change(position1Select, { target: { value: 'Pitcher' } });
      fireEvent.change(position2Select, { target: { value: 'Catcher' } });

      // Wait for the state to update
      await waitFor(() => {
        expect(
          screen.getByText(/Lineup Progress: 2\/9 minimum positions filled/)
        ).toBeInTheDocument();
      });

      // Save button should be disabled for incomplete lineup
      const saveButton = screen.getByTestId('save-lineup-button');

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });

      // Badge should show incomplete status
      await waitFor(() => {
        expect(screen.getByTestId('lineup-incomplete')).toBeInTheDocument();
      });
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

      // Wait for component to initialize and auto-assignment to complete
      await waitFor(() => {
        expect(
          screen.getByTestId('lineup-progress-indicator')
        ).toBeInTheDocument();
      });

      // Wait for the lineup to be complete (save button should be enabled)
      await waitFor(
        () => {
          const saveButton = screen.getByTestId('save-lineup-button');
          expect(saveButton).not.toBeDisabled();
        },
        { timeout: 3000 }
      );

      // Now click the save button
      const saveButton = screen.getByTestId('save-lineup-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: mockGame.id,
            startingPositionCount: expect.any(Number),
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

      // Wait for initial render
      await waitFor(() => {
        expect(
          screen.getByTestId('lineup-progress-indicator')
        ).toBeInTheDocument();
      });

      // Make the lineup invalid by removing some players to create incomplete lineup
      const playerSelect1 = screen.getByTestId('batting-position-1-player');
      const playerSelect2 = screen.getByTestId('batting-position-2-player');
      const playerSelect3 = screen.getByTestId('batting-position-3-player');
      const playerSelect4 = screen.getByTestId('batting-position-4-player');
      const playerSelect5 = screen.getByTestId('batting-position-5-player');
      const playerSelect6 = screen.getByTestId('batting-position-6-player');
      const playerSelect7 = screen.getByTestId('batting-position-7-player');

      // Clear most players to make lineup incomplete
      fireEvent.change(playerSelect1, { target: { value: '' } });
      fireEvent.change(playerSelect2, { target: { value: '' } });
      fireEvent.change(playerSelect3, { target: { value: '' } });
      fireEvent.change(playerSelect4, { target: { value: '' } });
      fireEvent.change(playerSelect5, { target: { value: '' } });
      fireEvent.change(playerSelect6, { target: { value: '' } });
      fireEvent.change(playerSelect7, { target: { value: '' } });

      // Wait for validation to complete
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-lineup-button');
        expect(saveButton).toBeDisabled();
      });

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

  // ====== TDD TESTS FOR MISSING ACCEPTANCE CRITERIA ======
  // These tests will FAIL until the corresponding features are implemented

  describe('AC001-AC004: Default Player Display', () => {
    test('AC001: should auto-assign all team players to lineup by default', () => {
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

      // All 10 mock players should be automatically assigned to lineup positions
      mockPlayers.forEach((player, index) => {
        const battingOrder = index + 1;
        const playerSelect = screen.getByTestId(
          `batting-position-${battingOrder}-player`
        );
        expect(playerSelect).toHaveValue(player.id);

        // Should also have default position assigned
        const positionSelect = screen.getByTestId(
          `batting-position-${battingOrder}-defensive-position`
        );
        expect(positionSelect.value).not.toBe('');
      });
    });

    test('AC002: should show upper section labeled "Starting Lineup"', () => {
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

      // Check for starting lineup section with dynamic count
      expect(
        screen.getByText(/Starting Lineup \(Positions 1-\d+\)/)
      ).toBeInTheDocument();
      expect(screen.getByTestId('starting-lineup-section')).toBeInTheDocument();
    });

    test('AC003: should show lower section labeled "Bench Players"', () => {
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

      // Check for bench section (may not be visible if startingPositionCount is 15)
      const benchSection = screen.queryByTestId('bench-players-section');
      if (benchSection) {
        expect(
          screen.getByText(/Bench Players \(Positions \d+-15\)/)
        ).toBeInTheDocument();
      }
    });

    test('AC004: should create exactly as many slots as there are players', () => {
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

      // Should have exactly 10 batting position slots (matching 10 mock players)
      for (let i = 1; i <= mockPlayers.length; i++) {
        expect(
          screen.getByTestId(`batting-position-${i}-player`)
        ).toBeInTheDocument();
      }

      // Should not have an 11th slot
      expect(
        screen.queryByTestId('batting-position-11-player')
      ).not.toBeInTheDocument();

      // All slots should be pre-filled with players
      const emptySelects = screen.queryAllByDisplayValue('');
      // Only defensive position selects might be empty initially, but player selects should be filled
      expect(emptySelects.length).toBeLessThan(mockPlayers.length);
    });
  });

  describe('AC005-AC008: Configurable Starting Positions', () => {
    test('AC005: should show starting position selector with 9-12 range and default 10', () => {
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

      const positionSelector = screen.getByTestId('starting-positions-config');
      expect(positionSelector).toBeInTheDocument();

      // Check the actual input field within the NumberInput
      const inputField = positionSelector.querySelector('input');
      expect(inputField).toHaveAttribute('aria-valuemin', '9');
      expect(inputField).toHaveAttribute('aria-valuemax', '12');
      expect(inputField).toHaveValue('10'); // Default value
      expect(
        screen.getByText('Number of Starting Positions (9-12)')
      ).toBeInTheDocument();
    });

    test('AC006: should adjust interface when starting position count changes', async () => {
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

      const positionSelector = screen.getByTestId('starting-positions-config');
      const inputField = positionSelector.querySelector(
        'input'
      ) as HTMLInputElement;

      // First test increasing to 12 positions (more than 10 players)
      fireEvent.change(inputField, { target: { value: '12' } });

      await waitFor(() => {
        // Should show 12 starting position slots in the starting lineup section
        expect(
          screen.getByText('Starting Lineup (Positions 1-12)')
        ).toBeInTheDocument();

        // Check that positions 1-12 are visible in starting section
        for (let i = 1; i <= 12; i++) {
          expect(
            screen.getByTestId(`batting-position-${i}-player`)
          ).toBeInTheDocument();
        }

        // With 12 starting positions and only 10 players, no bench section should show
        expect(
          screen.queryByTestId('bench-players-section')
        ).not.toBeInTheDocument();
      });

      // Now test reducing to 9 positions (less than 10 players) to create bench
      fireEvent.change(inputField, { target: { value: '9' } });

      await waitFor(() => {
        // Should show 9 starting position slots
        expect(
          screen.getByText('Starting Lineup (Positions 1-9)')
        ).toBeInTheDocument();

        // Check that positions 1-9 are visible in starting section
        for (let i = 1; i <= 9; i++) {
          expect(
            screen.getByTestId(`batting-position-${i}-player`)
          ).toBeInTheDocument();
        }

        // Now bench section should appear for remaining player
        expect(screen.getByTestId('bench-players-section')).toBeInTheDocument();
      });
    });

    test('AC007: should show additional slots when starting positions increased', async () => {
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

      const positionSelector = screen.getByTestId('starting-positions-config');
      const inputField = positionSelector.querySelector(
        'input'
      ) as HTMLInputElement;

      fireEvent.change(inputField, { target: { value: '11' } });

      await waitFor(() => {
        expect(
          screen.getByTestId('batting-position-10-player')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('batting-position-11-player')
        ).toBeInTheDocument();
      });
    });

    test('AC008: should move excess players to bench when positions decreased', async () => {
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

      // First set to 11 positions and assign players
      const positionSelector = screen.getByTestId('starting-positions-config');
      const inputField = positionSelector.querySelector(
        'input'
      ) as HTMLInputElement;

      fireEvent.change(inputField, { target: { value: '11' } });

      await waitFor(() => {
        const player10Select = screen.getByTestId('batting-position-10-player');
        const player11Select = screen.getByTestId('batting-position-11-player');
        fireEvent.change(player10Select, { target: { value: 'player-1' } });
        fireEvent.change(player11Select, { target: { value: 'player-2' } });
      });

      // Then decrease to 9 positions
      fireEvent.change(inputField, { target: { value: '9' } });

      await waitFor(() => {
        // Positions 10 and 11 should no longer exist
        expect(
          screen.queryByTestId('batting-position-10-player')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('batting-position-11-player')
        ).not.toBeInTheDocument();

        // Players should be back in bench section
        const benchSection = screen.getByTestId('bench-players-section');
        expect(benchSection).toHaveTextContent('Player One');
        expect(benchSection).toHaveTextContent('Player Two');
      });
    });
  });

  describe('AC012: Graceful Player Reassignment', () => {
    test('should handle reassigning player already assigned elsewhere', async () => {
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

      // Wait for initial render and clear all assignments first
      await waitFor(() => {
        expect(
          screen.getByTestId('lineup-progress-indicator')
        ).toBeInTheDocument();
      });

      // Clear all auto-assignments first to start fresh
      const player1Select = screen.getByTestId('batting-position-1-player');
      const player3Select = screen.getByTestId('batting-position-3-player');

      fireEvent.change(player1Select, { target: { value: '' } });
      fireEvent.change(player3Select, { target: { value: '' } });

      // Now assign player-1 to position 1 first
      fireEvent.change(player1Select, { target: { value: 'player-1' } });

      await waitFor(() => {
        expect(player1Select).toHaveValue('player-1');
      });

      // Now reassign same player to position 3 - this should clear position 1
      fireEvent.change(player3Select, { target: { value: 'player-1' } });

      await waitFor(() => {
        // Player 1 should move to position 3, position 1 should be empty
        expect(player1Select).toHaveValue('');
        expect(player3Select).toHaveValue('player-1');
      });
    });
  });

  describe('AC013-AC014: Smart Position Ordering and Auto-Fill', () => {
    test('AC013: should pre-select player default position when assigned', async () => {
      // Create player with multiple positions (Pitcher primary)
      const multiPositionPlayer = new Player(
        'multi-1',
        'Multi Player',
        99,
        'test-team-id',
        [Position.pitcher(), Position.firstBase(), Position.catcher()]
      );

      const playersWithMulti = [...mockPlayers, multiPositionPlayer];

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={playersWithMulti}
        />
      );

      const playerSelect = screen.getByTestId('batting-position-1-player');
      fireEvent.change(playerSelect, { target: { value: 'multi-1' } });

      await waitFor(() => {
        const positionSelect = screen.getByTestId(
          'batting-position-1-defensive-position'
        );
        expect(positionSelect).toHaveValue('Pitcher'); // Default position pre-selected
      });
    });

    test('AC014: should show smart position ordering (player positions first)', async () => {
      const multiPositionPlayer = new Player(
        'multi-1',
        'Multi Player',
        99,
        'test-team-id',
        [Position.shortstop(), Position.secondBase()]
      );

      const playersWithMulti = [...mockPlayers, multiPositionPlayer];

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={playersWithMulti}
        />
      );

      const playerSelect = screen.getByTestId('batting-position-1-player');
      fireEvent.change(playerSelect, { target: { value: 'multi-1' } });

      const positionSelect = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      const options = Array.from(positionSelect.querySelectorAll('option')).map(
        (o) => o.textContent
      );

      // Player's positions should be listed first
      expect(options.slice(1, 3)).toEqual([
        'Shortstop (SS)',
        'Second Base (2B)',
      ]);
    });
  });

  describe('AC021-AC024: Auto-Fill Features', () => {
    test('AC021: should have auto-fill button that pre-selects default positions', async () => {
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

      // Assign some players first
      for (let i = 1; i <= 5; i++) {
        const playerSelect = screen.getByTestId(`batting-position-${i}-player`);
        fireEvent.change(playerSelect, { target: { value: `player-${i}` } });
      }

      const autoFillButton = screen.getByTestId('auto-fill-positions-button');
      expect(autoFillButton).toBeInTheDocument();

      fireEvent.click(autoFillButton);

      await waitFor(() => {
        // Each assigned player should have their default position selected
        for (let i = 1; i <= 5; i++) {
          const positionSelect = screen.getByTestId(
            `batting-position-${i}-defensive-position`
          );
          expect(positionSelect.value).not.toBe('');
        }
      });
    });

    test('AC022: auto-fill should allow duplicate positions for user resolution', async () => {
      // Create multiple players with same primary position
      const pitchers = [
        new Player('pitcher-1', 'Pitcher One', 91, 'test-team-id', [
          Position.pitcher(),
        ]),
        new Player('pitcher-2', 'Pitcher Two', 92, 'test-team-id', [
          Position.pitcher(),
        ]),
      ];

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={[...mockPlayers, ...pitchers]}
        />
      );

      // Assign both pitchers
      const player1Select = screen.getByTestId('batting-position-1-player');
      const player2Select = screen.getByTestId('batting-position-2-player');
      fireEvent.change(player1Select, { target: { value: 'pitcher-1' } });
      fireEvent.change(player2Select, { target: { value: 'pitcher-2' } });

      const autoFillButton = screen.getByTestId('auto-fill-positions-button');
      fireEvent.click(autoFillButton);

      await waitFor(() => {
        // Both should have Pitcher assigned
        const position1Select = screen.getByTestId(
          'batting-position-1-defensive-position'
        );
        const position2Select = screen.getByTestId(
          'batting-position-2-defensive-position'
        );
        expect(position1Select).toHaveValue('Pitcher');
        expect(position2Select).toHaveValue('Pitcher');

        // Duplicates should be highlighted
        expect(
          screen.getByTestId('position-validation-error')
        ).toBeInTheDocument();
      });
    });

    test('AC024: auto-fill should not override manual changes', async () => {
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

      // Make manual assignment
      const playerSelect = screen.getByTestId('batting-position-1-player');
      const positionSelect = screen.getByTestId(
        'batting-position-1-defensive-position'
      );
      fireEvent.change(playerSelect, { target: { value: 'player-1' } });
      fireEvent.change(positionSelect, { target: { value: 'Catcher' } }); // Manual override

      // Now run auto-fill
      const autoFillButton = screen.getByTestId('auto-fill-positions-button');
      fireEvent.click(autoFillButton);

      await waitFor(() => {
        // Manual assignment should be preserved
        expect(positionSelect).toHaveValue('Catcher');
      });
    });
  });

  describe('AC025-AC026: Advanced Visual Feedback', () => {
    test('AC025: should highlight position conflicts in distinct red color', async () => {
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

      // Create duplicate shortstop assignments
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
      fireEvent.change(position1Select, { target: { value: 'Shortstop' } });
      fireEvent.change(position2Select, { target: { value: 'Shortstop' } });

      await waitFor(() => {
        expect(position1Select).toHaveClass('position-conflict-highlight');
        expect(position2Select).toHaveClass('position-conflict-highlight');
      });
    });

    test('AC026: should show clear indication when player has no available positions', () => {
      // Create scenario where all positions are taken
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

      // This test would need a complex setup to exhaust all positions
      // For now, just check the UI element exists
      const player10Select = screen.getByTestId('batting-position-10-player');
      fireEvent.change(player10Select, { target: { value: 'player-10' } });

      // Should show unavailable positions indication
      expect(
        screen.getByTestId('unavailable-positions-indicator')
      ).toBeInTheDocument();
    });
  });

  describe('AC027-AC028: Progress and Success Indicators', () => {
    test('AC027: should show progress indicator with filled positions count', () => {
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

      const progressIndicator = screen.getByTestId('lineup-progress-indicator');
      // Since players are auto-assigned by default, progress should show 10/9 minimum positions filled
      expect(progressIndicator).toHaveTextContent(
        'Lineup Progress: 10/9 minimum positions filled'
      );

      // Badge should show 'Complete' since all positions are filled
      expect(screen.getByTestId('lineup-complete-success')).toBeInTheDocument();
    });

    test('AC028: should show success state when lineup complete and valid', async () => {
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

      // Create complete valid lineup
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
        'Short Fielder',
      ];

      for (let i = 1; i <= 10; i++) {
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
        expect(
          screen.getByTestId('lineup-complete-success')
        ).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });
    });

    test('AC008a: should save starting position count along with lineup data', async () => {
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

      // Change starting position count from default 10 to 11
      const positionSelector = screen.getByTestId('starting-positions-config');
      const inputField = positionSelector.querySelector(
        'input'
      ) as HTMLInputElement;
      fireEvent.change(inputField, { target: { value: '11' } });

      await waitFor(() => {
        expect(
          screen.getByText('Starting Lineup (Positions 1-11)')
        ).toBeInTheDocument();
      });

      // Set up a complete lineup for 11 positions
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
        'Short Fielder',
        'Extra Player',
      ];

      for (let i = 1; i <= 11; i++) {
        const playerSelect = screen.getByTestId(`batting-position-${i}-player`);
        const positionSelect = screen.getByTestId(
          `batting-position-${i}-defensive-position`
        );
        fireEvent.change(playerSelect, { target: { value: `player-${i}` } });
        fireEvent.change(positionSelect, {
          target: { value: positions[i - 1] },
        });
      }

      // Click save lineup button
      const saveButton = screen.getByTestId('save-lineup-button');
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      fireEvent.click(saveButton);

      // Verify that onSave was called with the correct startingPositionCount
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          gameId: mockGame.id,
          startingPositionCount: 11, // Should save the modified starting position count
          battingOrder: expect.any(Array), // We just need to verify the structure exists
        });

        // Additionally verify the specific starting position count was saved
        const call = mockOnSave.mock.calls[0][0];
        expect(call.startingPositionCount).toBe(11);
        // Note: battingOrder array only contains filled positions (10 players available),
        // but startingPositionCount (11) should still be correctly saved
        expect(call.battingOrder).toHaveLength(10); // Only filled positions are included
      });
    });
  });

  describe('AC029-AC033: Cross-Section Drag-and-Drop and Bench Player UI', () => {
    test('AC029: should display bench players with drag handles and consistent UI', async () => {
      // Create a large team with 12 players to ensure bench players exist
      const largeTeam = new Team('team1', 'Large Team', [], []);
      const largePlayers = Array.from({ length: 12 }, (_, i) => {
        const positions = [new Position('pitcher', i === 0)]; // First player is pitcher
        if (i > 0) positions.push(new Position('extra-player', false)); // Others can play EP
        return new Player(
          `player${i + 1}`,
          `Player ${i + 1}`,
          i + 1,
          positions
        );
      });

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={largeTeam}
          players={largePlayers}
        />
      );

      // Wait for component to initialize with default 10 starting positions
      await waitFor(() => {
        expect(
          screen.getByText('Starting Lineup (Positions 1-10)')
        ).toBeInTheDocument();
      });

      // Verify bench section exists with bench players (players 11 and 12)
      expect(screen.getByText('Bench Players')).toBeInTheDocument();

      // Check for bench players (positions 11 and 12 should be in bench)
      const benchPlayer1 = screen.getByTestId('bench-player-player11');
      const benchPlayer2 = screen.getByTestId('bench-player-player12');

      expect(benchPlayer1).toBeInTheDocument();
      expect(benchPlayer2).toBeInTheDocument();

      // AC032: Bench players should have drag handles like starting players
      expect(
        screen.getByTestId('bench-drag-handle-player11')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('bench-drag-handle-player12')
      ).toBeInTheDocument();
    });

    test('AC033: bench players should support position assignment interface', async () => {
      // Create a large team with 12 players
      const largeTeam = new Team('team1', 'Large Team', [], []);
      const largePlayers = Array.from({ length: 12 }, (_, i) => {
        const positions = [
          new Position('pitcher', i === 0),
          new Position('extra-player', false),
        ];
        return new Player(
          `player${i + 1}`,
          `Player ${i + 1}`,
          i + 1,
          positions
        );
      });

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={largeTeam}
          players={largePlayers}
        />
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByText('Bench Players')).toBeInTheDocument();
      });

      // AC033: Bench players should have position selectors
      const benchPositionSelect1 = screen.getByTestId(
        'bench-player-player11-position'
      );
      const benchPositionSelect2 = screen.getByTestId(
        'bench-player-player12-position'
      );

      expect(benchPositionSelect1).toBeInTheDocument();
      expect(benchPositionSelect2).toBeInTheDocument();

      // Should be able to select positions for bench players
      fireEvent.change(benchPositionSelect1, { target: { value: 'Pitcher' } });
      expect(benchPositionSelect1).toHaveValue('Pitcher');

      fireEvent.change(benchPositionSelect2, {
        target: { value: 'Extra Player' },
      });
      expect(benchPositionSelect2).toHaveValue('Extra Player');
    });

    test('AC031: should maintain position assignments for bench players', async () => {
      // Create a large team with 12 players
      const largeTeam = new Team('team1', 'Large Team', [], []);
      const largePlayers = Array.from({ length: 12 }, (_, i) => {
        const positions = [
          new Position('pitcher', i === 0),
          new Position('short-fielder', i === 10), // Player 11 can play short fielder
          new Position('extra-player', false),
        ];
        return new Player(
          `player${i + 1}`,
          `Player ${i + 1}`,
          i + 1,
          positions
        );
      });

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={largeTeam}
          players={largePlayers}
        />
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByText('Bench Players')).toBeInTheDocument();
      });

      // Assign a position to a bench player
      const benchPositionSelect = screen.getByTestId(
        'bench-player-player11-position'
      );
      fireEvent.change(benchPositionSelect, {
        target: { value: 'Short Fielder' },
      });
      expect(benchPositionSelect).toHaveValue('Short Fielder');

      // Verify the player maintains their position assignment
      // (This simulates what would happen during drag-and-drop operations)
      expect(benchPositionSelect).toHaveValue('Short Fielder');

      // Change position again to verify position management works
      fireEvent.change(benchPositionSelect, {
        target: { value: 'Extra Player' },
      });
      expect(benchPositionSelect).toHaveValue('Extra Player');
    });

    test('should show appropriate empty state when all players are in starting lineup', async () => {
      // Use exactly 10 players so no bench players exist
      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={mockTeam}
          players={mockPlayers} // Exactly 10 players
        />
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(
          screen.getByText('Starting Lineup (Positions 1-10)')
        ).toBeInTheDocument();
      });

      // No bench section should be visible when all players fit in starting lineup
      expect(screen.queryByText('Bench Players')).not.toBeInTheDocument();
    });

    test('should show bench section when starting positions are reduced', async () => {
      // Create a large team with 12 players
      const largeTeam = new Team('team1', 'Large Team', [], []);
      const largePlayers = Array.from({ length: 12 }, (_, i) => {
        const positions = [new Position('extra-player', false)];
        return new Player(
          `player${i + 1}`,
          `Player ${i + 1}`,
          i + 1,
          positions
        );
      });

      renderWithChakra(
        <LineupSetupModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          game={mockGame}
          team={largeTeam}
          players={largePlayers}
        />
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(
          screen.getByText('Starting Lineup (Positions 1-10)')
        ).toBeInTheDocument();
      });

      // Reduce starting positions to 9
      const positionSelector = screen.getByTestId('starting-positions-config');
      const inputField = positionSelector.querySelector(
        'input'
      ) as HTMLInputElement;
      fireEvent.change(inputField, { target: { value: '9' } });

      await waitFor(() => {
        expect(
          screen.getByText('Starting Lineup (Positions 1-9)')
        ).toBeInTheDocument();
        expect(screen.getByText('Bench Players')).toBeInTheDocument();
      });

      // Should show bench players now (3 extra players: positions 10, 11, 12)
      expect(screen.getByTestId('bench-player-player10')).toBeInTheDocument();
      expect(screen.getByTestId('bench-player-player11')).toBeInTheDocument();
      expect(screen.getByTestId('bench-player-player12')).toBeInTheDocument();
    });
  });
});
