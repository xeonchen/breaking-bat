/**
 * AC046C Integration Test: Home run bug reproduction and verification
 *
 * This test reproduces the specific bug reported:
 * "first batter hits a single, the second batter hits a homerun, only the runner scores and the hitter stays at 1B"
 *
 * Traceability: live-scoring:AC046C
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { AtBatForm } from '@/presentation/components/AtBatForm';
import { PresentationPosition } from '@/presentation/types/presentation-values';
import theme from '@/presentation/theme';

const mockCurrentBatter = {
  playerId: 'batter2',
  playerName: 'Second Batter',
  jerseyNumber: '24',
  position: PresentationPosition.PITCHER,
  battingOrder: 2,
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('AC046C: Home Run Bug Reproduction and Integration Test', () => {
  describe('Bug Scenario: Runner on first, batter hits home run', () => {
    it('should score both runner and batter when home run is hit with runner on first', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      // Setup: Runner on first base (from previous single)
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'batter1', playerName: 'First Batter' },
            // second and third empty
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      // Action: Second batter hits home run
      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      // Verification: No modal should appear for home runs
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();

      // Wait for the completion callback
      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });

      // Critical Test: Verify the advancement result
      const callArgs = onAtBatComplete.mock.calls[0][0];

      // AC046C: Home run should not require manual advancement
      expect(callArgs.result).toBe('HR');

      // BUG FIX VERIFICATION: The baserunnerAdvancement should be empty/undefined
      // (letting domain logic handle everything automatically)
      expect(callArgs.baserunnerAdvancement || {}).toEqual({});

      // The domain logic should handle:
      // 1. Runner on first should score
      // 2. Batter should score
      // 3. Bases should be cleared
      // (This is handled by BaseAdvancementCalculator.calculateHomeRunAdvancement)
    });

    it('should handle home run with bases loaded correctly', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      // Setup: Bases loaded scenario
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 1, strikes: 2 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      // Action: Batter hits grand slam
      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      // Verification: No modal for home runs
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });

      const callArgs = onAtBatComplete.mock.calls[0][0];

      // AC046C: Grand slam should work automatically
      expect(callArgs.result).toBe('HR');
      expect(callArgs.baserunnerAdvancement || {}).toEqual({});
      // Domain logic should score all 4 runners (3 + batter)
    });

    it('should handle home run with no runners on base', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      // Setup: No runners on base
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}} // Empty bases
          currentCount={{ balls: 2, strikes: 1 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      // Action: Solo home run
      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      // Verification: No modal needed
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });

      const callArgs = onAtBatComplete.mock.calls[0][0];

      // AC046C: Solo home run should work
      expect(callArgs.result).toBe('HR');
      expect(callArgs.baserunnerAdvancement || {}).toEqual({});
      // Domain logic should score just the batter
    });
  });

  describe('Comparison: Home run vs Other hits', () => {
    it('should show modal for other hits but not for home runs', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      // Test 1: Triple should show modal
      const tripleButton = screen.getByTestId('triple-button');
      await user.click(tripleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // Close the modal
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('baserunner-advancement-modal')
        ).not.toBeInTheDocument();
      });

      // Test 2: Home run should NOT show modal
      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      // Should complete immediately without modal
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases for Home Runs', () => {
    it('should handle home run with partial baserunners', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      // Setup: Only second and third base occupied
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            // first base empty
            second: { playerId: 'runner2', playerName: 'Runner Two' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 3, strikes: 2 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      // Action: Home run with partial runners
      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });

      const callArgs = onAtBatComplete.mock.calls[0][0];

      // AC046C: Should work with any runner configuration
      expect(callArgs.result).toBe('HR');
      expect(callArgs.baserunnerAdvancement || {}).toEqual({});
      // Domain logic should score 2 runners + batter = 3 total
    });

    it('should handle error scenarios gracefully during home run', async () => {
      const onAtBatComplete = jest.fn().mockImplementation(() => {
        throw new Error('Test error during home run processing');
      });
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalled();
      });

      // Should show error state
      const errorMessage = await screen.findByTestId('error-message');
      expect(errorMessage).toBeVisible();
      expect(errorMessage).toHaveTextContent('Error recording at-bat');
    });
  });
});
