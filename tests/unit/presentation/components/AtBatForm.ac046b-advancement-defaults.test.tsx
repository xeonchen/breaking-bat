/**
 * AC046B Component Tests: Baserunner advancement modal pre-populates with standard defaults
 *
 * Following CLAUDE.md Test Level Decision Framework:
 * - Primary: Component tests - Modal pre-population logic
 * - Secondary: Unit tests - Business rule calculations
 * - Tertiary: Integration tests - Data flow verification
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
  position: 'pitcher' as PresentationPosition,
  battingOrder: 3,
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('AC046B: Baserunner advancement modal pre-populates with standard defaults', () => {
  describe('Double advancement defaults', () => {
    it('should pre-populate double advancement with 2-base advancement for all runners', async () => {
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

      const doubleButton = screen.getByTestId('double-button');
      await user.click(doubleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Double should default all runners to advance 2 bases
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );

      // First base runner should default to third (2 bases)
      expect(firstRunnerSelect).toHaveValue('third');

      // Second base runner should default to home/score (2 bases)
      expect(secondRunnerSelect).toHaveValue('home');
    });

    it('should allow confirmation with default double advancement selections', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('double-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Should be able to confirm with pre-populated defaults
      const confirmButton = screen.getByTestId('confirm-advancement');
      expect(confirmButton).not.toBeDisabled();

      await user.click(confirmButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            first: 'third',
            second: 'home',
          },
        })
      );
    });
  });

  describe('Single advancement defaults', () => {
    it('should pre-populate single advancement with 1-base advancement', async () => {
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

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Single should default runners to advance 1 base
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      expect(firstRunnerSelect).toHaveValue('second'); // 1st → 2nd
      expect(secondRunnerSelect).toHaveValue('home'); // 2nd → home (scores)
      expect(thirdRunnerSelect).toHaveValue('home'); // 3rd → home (scores)
    });

    it('should handle single with partial baserunners correctly', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            // second empty
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('single-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Each runner advances 1 base by default
      expect(screen.getByTestId('runner-first-advancement')).toHaveValue(
        'second'
      );
      expect(screen.getByTestId('runner-third-advancement')).toHaveValue(
        'home'
      );

      // Second base selector should not exist (no runner there)
      expect(
        screen.queryByTestId('runner-second-advancement')
      ).not.toBeInTheDocument();
    });
  });

  describe('Walk advancement defaults (forced runners only)', () => {
    it('should pre-populate walk with forced advancement only', async () => {
      const user = userEvent.setup();

      renderWithChakra(
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

      const walkButton = screen.getByTestId('walk-button');
      await user.click(walkButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Walk should force first base runner to second, third stays
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      expect(firstRunnerSelect).toHaveValue('second'); // Forced to advance
      expect(thirdRunnerSelect).toHaveValue('stay'); // Not forced, stays at third
    });

    it('should handle bases loaded walk scenario correctly', async () => {
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

      await user.click(screen.getByTestId('walk-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: All runners forced to advance with bases loaded
      expect(screen.getByTestId('runner-first-advancement')).toHaveValue(
        'second'
      );
      expect(screen.getByTestId('runner-second-advancement')).toHaveValue(
        'third'
      );
      expect(screen.getByTestId('runner-third-advancement')).toHaveValue(
        'home'
      ); // Forced to score
    });
  });

  describe('Triple advancement defaults', () => {
    it('should pre-populate triple advancement with all runners scoring', async () => {
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

      const tripleButton = screen.getByTestId('triple-button');
      await user.click(tripleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Triple should default all existing runners to score
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      expect(firstRunnerSelect).toHaveValue('home'); // 3 bases from 1st
      expect(secondRunnerSelect).toHaveValue('home'); // 3 bases from 2nd
      expect(thirdRunnerSelect).toHaveValue('home'); // 3 bases from 3rd
    });
  });

  describe('User override capability', () => {
    it('should allow user to override default advancement selections', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            second: { playerId: 'runner2', playerName: 'Runner Two' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      await user.click(screen.getByTestId('double-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: User should be able to override defaults
      // Change first runner from default 'third' to 'second'
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      await user.selectOptions(firstRunnerSelect, 'second');

      // Keep second runner at default 'home'
      await user.click(screen.getByTestId('confirm-advancement'));

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: {
            first: 'second', // User override
            second: 'home', // Default kept
          },
        })
      );
    });

    it('should validate overridden selections properly', async () => {
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

      await user.click(screen.getByTestId('single-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Create a base conflict by overriding defaults
      // Create conflict: batter goes to first, runner stays at first
      await user.selectOptions(
        screen.getByTestId('runner-first-advancement'),
        'stay'
      ); // Stays at first
      await user.selectOptions(
        screen.getByTestId('runner-second-advancement'),
        'third'
      ); // Goes to third

      // This creates conflict: batter goes to first, but runner is staying at first
      const confirmButton = screen.getByTestId('confirm-advancement');
      expect(confirmButton).toBeDisabled();

      // Should show validation error
      expect(
        screen.getByText(/Multiple runners cannot occupy first base/)
      ).toBeInTheDocument();
    });
  });

  describe('No modal scenarios', () => {
    it('should not show modal for results that do not require advancement', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      // AC046B: Results that don't require advancement should not show modal
      const strikeoutButton = screen.getByTestId('strikeout-button');
      await user.click(strikeoutButton);

      // Modal should not appear
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();
    });

    it('should not show modal when no runners are present', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}} // No runners
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      // AC046B: No modal needed when no runners present
      const doubleButton = screen.getByTestId('double-button');
      await user.click(doubleButton);

      // Modal should not appear
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('Default selection validation', () => {
    it('should ensure default selections are always valid and complete', async () => {
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

      const doubleButton = screen.getByTestId('double-button');
      await user.click(doubleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });

      // AC046B: Default selections should be valid - confirm button enabled
      const confirmButton = screen.getByTestId('confirm-advancement');
      expect(confirmButton).not.toBeDisabled();

      // Should have no validation errors with defaults
      expect(screen.queryByText(/validation error/i)).not.toBeInTheDocument();

      // Check that selects have default values instead of placeholder text
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      const secondRunnerSelect = screen.getByTestId(
        'runner-second-advancement'
      );
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');

      // AC046B: Defaults should be pre-selected, not showing placeholder
      expect(firstRunnerSelect).toHaveValue('third'); // Double defaults
      expect(secondRunnerSelect).toHaveValue('home'); // Double defaults
      expect(thirdRunnerSelect).toHaveValue('home'); // Double defaults
    });
  });
});
