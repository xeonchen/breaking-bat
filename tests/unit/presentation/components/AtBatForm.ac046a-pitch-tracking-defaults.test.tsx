/**
 * AC046A Component Tests: Pitch tracking defaults to collapsed
 *
 * Following CLAUDE.md Test Level Decision Framework:
 * - Primary: Component tests - UI state and localStorage behavior
 * - Secondary: E2E scenario covered in live-scoring.feature
 *
 * Traceability: live-scoring:AC046A
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { AtBatForm } from '@/presentation/components/AtBatForm';
import { Position } from '@/domain';
import theme from '@/presentation/theme';

const mockCurrentBatter = {
  playerId: 'player1',
  playerName: 'John Smith',
  jerseyNumber: '12',
  position: Position.pitcher(),
  battingOrder: 3,
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('AC046A: Pitch tracking defaults to collapsed for streamlined scoring experience', () => {
  // Mock localStorage for consistent testing
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('Default collapsed state', () => {
    it('should have pitch tracking collapsed by default on first load', () => {
      // Simulate first load - no localStorage value
      mockLocalStorage.getItem.mockReturnValue(null);

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC046A: Pitch tracking should be collapsed by default
      const pitchTrackingSection = screen.getByTestId('pitch-tracking-section');
      expect(pitchTrackingSection).toBeInTheDocument();

      // Check that pitch tracking controls are not visible (collapsed)
      const ballButton = screen.queryByTestId('ball-button');
      expect(ballButton).not.toBeVisible();

      // Verify localStorage was checked for preference
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'pitch-tracking-collapsed'
      );
    });

    it('should respect localStorage value when set to true (collapsed)', () => {
      // User has previously collapsed pitch tracking
      mockLocalStorage.getItem.mockReturnValue('true');

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC046A: Should remain collapsed based on user preference
      const ballButton = screen.queryByTestId('ball-button');
      expect(ballButton).not.toBeVisible();
    });

    it('should respect localStorage value when set to false (expanded)', () => {
      // User has previously expanded pitch tracking
      mockLocalStorage.getItem.mockReturnValue('false');

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // Should be expanded based on user preference
      const ballButton = screen.getByTestId('ball-button');
      expect(ballButton).toBeVisible();
    });
  });

  describe('Toggle functionality and persistence', () => {
    it('should expand pitch tracking when toggle is clicked from collapsed state', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue('true'); // Start collapsed

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // Initially collapsed
      expect(screen.queryByTestId('ball-button')).not.toBeVisible();

      // Click toggle to expand
      const toggleButton = screen.getByTestId('pitch-tracking-toggle');
      await user.click(toggleButton);

      // Should now be expanded
      await waitFor(() => {
        expect(screen.getByTestId('ball-button')).toBeVisible();
      });

      // Should persist the expanded state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitch-tracking-collapsed',
        'false'
      );
    });

    it('should collapse pitch tracking when toggle is clicked from expanded state', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue('false'); // Start expanded

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // Initially expanded
      expect(screen.getByTestId('ball-button')).toBeVisible();

      // Click toggle to collapse
      const toggleButton = screen.getByTestId('pitch-tracking-toggle');
      await user.click(toggleButton);

      // Should now be collapsed
      await waitFor(() => {
        expect(screen.queryByTestId('ball-button')).not.toBeVisible();
      });

      // Should persist the collapsed state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitch-tracking-collapsed',
        'true'
      );
    });

    it('should maintain functionality when pitch tracking is collapsed', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue('true'); // Collapsed

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      // AC046A: At-bat outcome buttons should remain fully functional when pitch tracking is collapsed
      const singleButton = screen.getByTestId('single-button');
      expect(singleButton).toBeVisible();
      expect(singleButton).not.toBeDisabled();

      await user.click(singleButton);

      // Should complete at-bat normally
      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          batterId: 'player1',
          result: expect.objectContaining({ value: '1B' }),
        })
      );
    });
  });

  describe('Streamlined scoring experience', () => {
    it('should show at-bat outcome buttons prominently when pitch tracking is collapsed', () => {
      mockLocalStorage.getItem.mockReturnValue('true'); // Collapsed by default

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC046A: At-bat outcome buttons should be prominent for streamlined scoring
      const outcomeButtonsSection = screen.getByTestId('outcome-buttons');
      expect(outcomeButtonsSection).toBeVisible();

      // All primary outcome buttons should be visible
      expect(screen.getByTestId('single-button')).toBeVisible();
      expect(screen.getByTestId('double-button')).toBeVisible();
      expect(screen.getByTestId('triple-button')).toBeVisible();
      expect(screen.getByTestId('home-run-button')).toBeVisible();

      // Pitch tracking should be hidden for streamlined experience
      expect(screen.queryByTestId('ball-button')).not.toBeVisible();
      expect(screen.queryByTestId('strike-button')).not.toBeVisible();
    });

    it('should handle page refresh correctly with default collapsed state', () => {
      // Simulate first time user - no localStorage
      mockLocalStorage.getItem.mockReturnValue(null);

      // First render
      const { unmount } = renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.queryByTestId('ball-button')).not.toBeVisible();
      unmount();

      // Simulate page refresh - should still default to collapsed
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC046A: Should remain collapsed for streamlined experience
      expect(screen.queryByTestId('ball-button')).not.toBeVisible();
    });
  });

  describe('Edge cases', () => {
    it('should handle localStorage errors gracefully', () => {
      // Simulate localStorage error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Should not crash and default to collapsed
      expect(() => {
        renderWithChakra(
          <AtBatForm
            currentBatter={mockCurrentBatter}
            baserunners={{}}
            currentCount={{ balls: 0, strikes: 0 }}
            onAtBatComplete={jest.fn()}
          />
        );
      }).not.toThrow();

      // Should default to collapsed state
      expect(screen.queryByTestId('ball-button')).not.toBeVisible();
    });

    it('should handle invalid localStorage values gracefully', () => {
      // Invalid localStorage value
      mockLocalStorage.getItem.mockReturnValue('invalid-value');

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // Invalid value should be treated as not 'true', so defaults to collapsed (true)
      expect(screen.queryByTestId('ball-button')).not.toBeVisible();
    });
  });
});
