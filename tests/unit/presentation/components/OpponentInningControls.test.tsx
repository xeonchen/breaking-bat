/**
 * Unit Tests for Opponent Half-Inning Management Controls
 *
 * Tests AC043-AC046 for opponent inning workflow management
 * These tests will FAIL until proper implementation is completed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ScoringPage from '@/presentation/pages/ScoringPage';
import { useGameStore } from '@/presentation/stores/gameStore';

// Mock the game store
jest.mock('@/presentation/stores/gameStore');
const mockUseGameStore = useGameStore as jest.MockedFunction<
  typeof useGameStore
>;

const mockGameStoreState = {
  currentGame: {
    id: 'test-game',
    name: 'Test Game',
    opponent: 'Test Opponent',
    teamId: 'team-1',
    isHomeGame: () => true,
    isAwayGame: false, // Property, not method (DTO structure)
    getVenueText: () => 'vs',
    getSummary: () => 'Test Game vs Test Opponent',
    status: 'in_progress',
  },
  teams: [
    { id: 'team-1', name: 'Home Team' },
    { id: 'team-2', name: 'Away Team' },
  ],
  currentBatter: null,
  currentInning: 3,
  isTopInning: true, // Opponent's turn when home game
  baserunners: {},
  currentCount: { balls: 0, strikes: 0 },
  currentOuts: 1,
  loading: false,
  error: null,
  getCurrentGame: jest.fn(),
  loadGame: jest.fn(),
  startGame: jest.fn(),
  recordAtBat: jest.fn(),
  advanceInning: jest.fn(),
  getTeams: jest.fn().mockResolvedValue([]),
  getLineup: jest.fn().mockResolvedValue([]),
  // ... other required store properties
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ChakraProvider>{component}</ChakraProvider>
    </MemoryRouter>
  );
};

describe('Opponent Half-Inning Management Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockReturnValue(mockGameStoreState);
  });

  describe("AC043 - Display controls when it's opponent's turn to bat", () => {
    it("MUST show opponent controls when it's opponent's turn", () => {
      renderWithChakra(<ScoringPage />);

      // ASSERT: Opponent alert should be visible
      expect(screen.getByTestId('opponent-batting-alert')).toBeVisible();
      expect(screen.getByText("Opponent's Turn to Bat")).toBeInTheDocument();

      // ASSERT: Skip button should be present
      expect(screen.getByTestId('skip-opponent-inning-button')).toBeVisible();

      // ASSERT: Record button should be present but disabled for now
      const recordButton = screen.getByTestId('record-opponent-score-button');
      expect(recordButton).toBeVisible();
      expect(recordButton).toBeDisabled();

      // ASSERT: At-bat interface should not be present during opponent's turn
      expect(screen.queryByTestId('at-bat-form')).not.toBeInTheDocument();
    });

    it('MUST show appropriate messaging for home vs away games', () => {
      renderWithChakra(<ScoringPage />);

      const alertText = screen.getByTestId('opponent-batting-alert');
      expect(alertText).toHaveTextContent(
        'Your team will bat in the bottom of this inning'
      );
    });
  });

  describe("AC044 - Skip opponent turn advances to our team's half-inning", () => {
    it('MUST advance inning when Skip to Our Turn is clicked', async () => {
      const user = userEvent.setup();
      const mockAdvanceInning = jest.fn().mockResolvedValue(undefined);
      mockUseGameStore.mockReturnValue({
        ...mockGameStoreState,
        advanceInning: mockAdvanceInning,
      });

      renderWithChakra(<ScoringPage />);

      const skipButton = screen.getByTestId('skip-opponent-inning-button');
      await user.click(skipButton);

      // ASSERT: advanceInning should be called
      expect(mockAdvanceInning).toHaveBeenCalledTimes(1);

      // ASSERT: Success message should appear
      await waitFor(() => {
        expect(screen.getByText('Inning advanced')).toBeVisible();
      });
    });

    it('MUST handle errors when inning advancement fails', async () => {
      const user = userEvent.setup();
      const mockAdvanceInning = jest
        .fn()
        .mockRejectedValue(new Error('Advancement failed'));
      mockUseGameStore.mockReturnValue({
        ...mockGameStoreState,
        advanceInning: mockAdvanceInning,
      });

      renderWithChakra(<ScoringPage />);

      const skipButton = screen.getByTestId('skip-opponent-inning-button');
      await user.click(skipButton);

      // ASSERT: Error message should appear
      await waitFor(() => {
        expect(screen.getByText('Error advancing inning')).toBeVisible();
      });

      // ASSERT: Opponent controls should still be visible
      expect(screen.getByTestId('opponent-batting-alert')).toBeVisible();
    });
  });

  describe('AC045 - Record opponent scoring (DISABLED FOR NOW)', () => {
    it('MUST show record button as disabled', () => {
      renderWithChakra(<ScoringPage />);

      const recordButton = screen.getByTestId('record-opponent-score-button');

      // ASSERT: Button should be disabled
      expect(recordButton).toBeDisabled();
      expect(recordButton).toHaveTextContent(
        'Record Opponent Score (Coming Soon)'
      );
    });
  });

  describe("AC046 - After opponent workflow, advance to our team's turn", () => {
    it('MUST preserve game state when advancing inning', async () => {
      const user = userEvent.setup();
      const mockAdvanceInning = jest.fn().mockResolvedValue(undefined);

      // Set up game state with specific values to verify preservation
      const gameStateWithSpecificValues = {
        ...mockGameStoreState,
        currentInning: 5,
        currentOuts: 2,
        advanceInning: mockAdvanceInning,
      };

      mockUseGameStore.mockReturnValue(gameStateWithSpecificValues);

      renderWithChakra(<ScoringPage />);

      const skipButton = screen.getByTestId('skip-opponent-inning-button');
      await user.click(skipButton);

      // ASSERT: Game state preservation
      expect(mockAdvanceInning).toHaveBeenCalledWith(); // No parameters should modify state

      await waitFor(() => {
        expect(screen.getByText('Inning advanced')).toBeVisible();
      });
    });
  });

  describe('Integration - Complete opponent workflow', () => {
    it('MUST handle complete opponent half-inning workflow', async () => {
      const user = userEvent.setup();

      // Mock store returning to our turn after advancement
      const mockAdvanceInning = jest.fn().mockImplementation(() => {
        // Simulate state change to our turn
        mockUseGameStore.mockReturnValue({
          ...mockGameStoreState,
          isTopInning: false, // Now bottom of inning (our turn for home game)
          currentOuts: 0, // Outs reset
        });
        return Promise.resolve();
      });

      mockUseGameStore.mockReturnValue({
        ...mockGameStoreState,
        advanceInning: mockAdvanceInning,
      });

      renderWithChakra(<ScoringPage />);

      // Step 1: Verify opponent controls are shown
      expect(screen.getByTestId('opponent-batting-alert')).toBeVisible();

      // Step 2: Click skip to our turn
      const skipButton = screen.getByTestId('skip-opponent-inning-button');
      await user.click(skipButton);

      // Step 3: Verify advancement and state changes
      expect(mockAdvanceInning).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('Inning advanced')).toBeVisible();
      });
    });
  });
});
