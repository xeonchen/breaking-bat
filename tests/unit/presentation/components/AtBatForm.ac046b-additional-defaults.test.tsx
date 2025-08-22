/**
 * AC046B Additional Defaults Tests: Error, Fielders Choice, Sacrifice Fly advancement defaults
 *
 * Tests for the missing advancement default scenarios that were identified:
 * - Error (E) - conservative advancement defaults
 * - Fielders Choice (FC) - lead runner out defaults
 * - Sacrifice Fly (SF) - tag up and advance defaults
 *
 * Traceability: live-scoring:AC046B
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { AtBatForm } from '@/presentation/components/AtBatForm';
import { PresentationPosition } from '@/presentation/types/presentation-values';
import theme from '@/presentation/theme';

const mockCurrentBatter = {
  playerId: 'player1',
  playerName: 'John Smith',
  jerseyNumber: '12',
  position: PresentationPosition.PITCHER,
  battingOrder: 3,
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('AC046B: Additional Advancement Defaults - Error, FC, SF', () => {
  describe('Error (E) advancement defaults', () => {
    it('should pre-populate error advancement with conservative 1-base advancement', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      const errorButton = screen.getByTestId('error-button');
      await user.click(errorButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Error should default to conservative 1-base advancement
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      expect(firstRunnerSelect).toHaveValue('second'); // 1st → 2nd
      expect(secondRunnerSelect).toHaveValue('third'); // 2nd → 3rd
      expect(thirdRunnerSelect).toHaveValue('home'); // 3rd → home
    });

    it('should allow user to override error defaults for specific error types', async () => {
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

      await user.click(screen.getByTestId('error-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // Override default: error allows extra advancement
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      await user.selectOptions(firstRunnerSelect, 'third'); // Extra advancement on error

      await user.click(screen.getByTestId('confirm-advancement'));

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            first: 'third', // User override for aggressive advancement
          },
        })
      );
    });
  });

  describe('Fielders Choice (FC) advancement defaults', () => {
    it('should pre-populate FC with lead runner out by default', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      const fcButton = screen.getByTestId('fc-button');
      await user.click(fcButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: FC should default to lead runner (first) out, others stay
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );

      expect(firstRunnerSelect).toHaveValue('out'); // Lead runner forced out
      expect(secondRunnerSelect).toHaveValue('stay'); // Not forced, stays at second
    });

    it('should handle FC with bases loaded scenario', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('fc-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // FC with bases loaded: lead runner out, others stay unless forced
      expect(screen.getByTestId('runner-first-advancement')).toHaveValue('out');
      expect(screen.getByTestId('runner-second-advancement')).toHaveValue(
        'stay'
      );
      expect(screen.getByTestId('runner-third-advancement')).toHaveValue(
        'stay'
      );
    });

    it('should allow override for unusual FC scenarios', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('fc-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // Override: unusual FC where third base runner is thrown out instead
      await user.selectOptions(
        screen.getByTestId('runner-first-advancement'),
        'second'
      );
      await user.selectOptions(
        screen.getByTestId('runner-third-advancement'),
        'out'
      );

      await user.click(screen.getByTestId('confirm-advancement'));

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            first: 'second',
            third: 'out', // Unusual FC scenario
          },
        })
      );
    });
  });

  describe('Sacrifice Fly (SF) advancement defaults', () => {
    it('should pre-populate SF with tag up and advance defaults', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      const sfButton = screen.getByTestId('sf-button');
      await user.click(sfButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: SF should default to tag up and advance one base
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      expect(firstRunnerSelect).toHaveValue('second'); // Tag up, advance to 2nd
      expect(secondRunnerSelect).toHaveValue('third'); // Tag up, advance to 3rd
      expect(thirdRunnerSelect).toHaveValue('home'); // Standard sacrifice - runner scores
    });

    it('should handle SF with only runner on third (classic sacrifice)', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('sf-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // Classic sacrifice fly scenario
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');
      expect(thirdRunnerSelect).toHaveValue('home');

      // Confirm with default
      await user.click(screen.getByTestId('confirm-advancement'));

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            third: 'home', // Classic sacrifice fly
          },
        })
      );
    });

    it('should allow conservative override for shallow fly balls', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('sf-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // Override for shallow fly: runners can't advance
      await user.selectOptions(
        screen.getByTestId('runner-first-advancement'),
        'stay'
      );
      await user.selectOptions(
        screen.getByTestId('runner-third-advancement'),
        'stay'
      );

      await user.click(screen.getByTestId('confirm-advancement'));

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            first: 'stay', // Too shallow to advance
            third: 'stay', // Too shallow to score
          },
        })
      );
    });
  });

  describe('Comprehensive default validation', () => {
    it('should have defaults for all advancement-requiring results', async () => {
      const user = userEvent.setup();

      const testScenarios = [
        { button: 'single-button', result: '1B', name: 'Single' },
        { button: 'double-button', result: '2B', name: 'Double' },
        { button: 'triple-button', result: '3B', name: 'Triple' },
        { button: 'walk-button', result: 'BB', name: 'Walk' },
        { button: 'error-button', result: 'E', name: 'Error' },
        { button: 'fc-button', result: 'FC', name: 'Fielders Choice' },
        { button: 'sf-button', result: 'SF', name: 'Sacrifice Fly' },
      ];

      for (const scenario of testScenarios) {
        // Clean render for each scenario
        const { unmount } = renderWithChakra(
          <AtBatForm
            currentBatter={mockCurrentBatter}
            baserunners={{
              first: { playerId: 'runner1', playerName: 'Runner One' },
              third: { playerId: 'runner3', playerName: 'Runner Three' },
            }}
            currentCount={{ balls: 0, strikes: 0 }}
            onAtBatComplete={jest.fn()}
            showBaserunnerOptions={true}
          />
        );

        const button = screen.getByTestId(scenario.button);
        await user.click(button);

        await waitFor(() => {
          expect(
            screen.getByTestId('baserunner-advancement-modal')
          ).toBeVisible();
        });

        // AC046B: All advancement-requiring results should have defaults
        const firstRunnerSelect = screen.getByTestId(
          'runner-first-advancement'
        );
        const thirdRunnerSelect = screen.getByTestId(
          'runner-third-advancement'
        );

        // Should have pre-selected values (not empty)
        expect(firstRunnerSelect.value).not.toBe('');
        expect(thirdRunnerSelect.value).not.toBe('');

        // Should be able to confirm immediately with defaults
        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).not.toBeDisabled();

        // Close modal for next test
        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        await waitFor(() => {
          expect(
            screen.queryByTestId('baserunner-advancement-modal')
          ).not.toBeInTheDocument();
        });

        // Unmount for next scenario to clean up
        unmount();
      }
    });
  });
});
