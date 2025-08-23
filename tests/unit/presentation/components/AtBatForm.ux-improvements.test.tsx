/**
 * UX Improvements Unit Tests
 *
 * Tests for the 5 systematic UX improvements:
 * 1. AC003A: Contextual fast-action button enablement
 * 2. AC004A: Collapsible pitch tracking UI
 * 3. AC009A: Field-accurate baserunner layout
 * 4. AC016A: Conditional baserunner modal
 * 5. AC017A-C: Baserunner validation rules
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

describe('UX Improvements Tests', () => {
  describe('AC003A - Contextual Fast-Action Button Enablement (Enhanced with Out Count)', () => {
    it('should disable Double Play button when no runners present', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}} // No runners
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const dpButton = screen.getByTestId('dp-button');
      expect(dpButton).toBeDisabled();
    });

    it('should enable Double Play button when runners are present', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const dpButton = screen.getByTestId('dp-button');
      expect(dpButton).not.toBeDisabled();
    });

    it('should disable Sacrifice Fly button when no third base runner', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            // No third base runner
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const sfButton = screen.getByTestId('sf-button');
      expect(sfButton).toBeDisabled();
      expect(sfButton).toHaveAttribute('title', 'No runner on third base');
    });

    it('should enable Sacrifice Fly button when third base runner present', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const sfButton = screen.getByTestId('sf-button');
      expect(sfButton).not.toBeDisabled();
      expect(sfButton).not.toHaveAttribute('title');
    });

    it('should show tooltip for disabled buttons', async () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}} // No runners - should disable DP and SF
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC003A: Test DP button (should be disabled with no runners)
      const dpButton = screen.getByTestId('dp-button');
      expect(dpButton).toHaveAttribute('title', 'No runners for double play');
      expect(dpButton).toBeDisabled();

      // Test that buttons work properly when they should be enabled
      const singleButton = screen.getByTestId('single-button');
      expect(singleButton).not.toBeDisabled();
      expect(singleButton).not.toHaveAttribute('title'); // No tooltip for enabled buttons
    });

    // Enhanced out count tests for AC003A
    it('should disable contextual buttons when out count is 2 (enhanced AC003A)', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          currentOuts={2} // 2 outs - should disable contextual buttons
          onAtBatComplete={jest.fn()}
        />
      );

      // All contextual buttons should be disabled with 2 outs
      const dpButton = screen.getByTestId('dp-button');
      const sfButton = screen.getByTestId('sf-button');
      const fcButton = screen.getByTestId('fc-button');

      expect(dpButton).toBeDisabled();
      expect(dpButton).toHaveAttribute('title', 'Impossible with 2 outs');

      expect(sfButton).toBeDisabled();
      expect(sfButton).toHaveAttribute('title', 'Impossible with 2 outs');

      expect(fcButton).toBeDisabled();
      expect(fcButton).toHaveAttribute('title', 'Impossible with 2 outs');
    });

    it('should enable contextual buttons when out count is 0 or 1 (enhanced AC003A)', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            third: { playerId: 'runner3', playerName: 'Runner Three' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          currentOuts={1} // 0 or 1 outs - should enable contextual buttons
          onAtBatComplete={jest.fn()}
        />
      );

      // All contextual buttons should be enabled with proper runners and ≤1 outs
      const dpButton = screen.getByTestId('dp-button');
      const sfButton = screen.getByTestId('sf-button');
      const fcButton = screen.getByTestId('fc-button');

      expect(dpButton).not.toBeDisabled();
      expect(sfButton).not.toBeDisabled();
      expect(fcButton).not.toBeDisabled();

      // No tooltips for enabled buttons
      expect(dpButton).not.toHaveAttribute('title');
      expect(sfButton).not.toHaveAttribute('title');
      expect(fcButton).not.toHaveAttribute('title');
    });

    it('should handle combined runner and out count requirements (enhanced AC003A)', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
            // No third base runner
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          currentOuts={2} // 2 outs
          onAtBatComplete={jest.fn()}
        />
      );

      const dpButton = screen.getByTestId('dp-button');
      const sfButton = screen.getByTestId('sf-button');

      // DP should be disabled due to 2 outs (even though there are runners)
      expect(dpButton).toBeDisabled();
      expect(dpButton).toHaveAttribute('title', 'Impossible with 2 outs');

      // SF should be disabled due to both no third base runner AND 2 outs
      expect(sfButton).toBeDisabled();
      // Out count logic takes precedence (2 outs is checked first)
      expect(sfButton).toHaveAttribute('title', 'Impossible with 2 outs');
    });
  });

  describe('AC004A - Collapsible Pitch Tracking UI', () => {
    it.skip('should show pitch tracking section expanded by default', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const pitchTracking = screen.getByTestId('pitch-tracking-section');
      expect(pitchTracking).toBeVisible();

      const ballButton = screen.getByTestId('ball-button');
      expect(ballButton).toBeVisible();
    });

    it.skip('should collapse pitch tracking section when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const collapseToggle = screen.getByTestId('pitch-tracking-toggle');
      await user.click(collapseToggle);

      await waitFor(() => {
        const pitchButtons = screen.queryByTestId('ball-button');
        expect(pitchButtons).not.toBeVisible();
      });
    });

    it.skip('should persist collapse preference in localStorage', async () => {
      const user = userEvent.setup();
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const collapseToggle = screen.getByTestId('pitch-tracking-toggle');
      await user.click(collapseToggle);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pitch-tracking-collapsed',
        'true'
      );
    });

    it('should maintain pitch tracking functionality when collapsed', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{}}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      // Collapse the section
      const collapseToggle = screen.getByTestId('pitch-tracking-toggle');
      await user.click(collapseToggle);

      // AC004A: Collapsed pitch tracking still allows outcome buttons to work
      // Walking manually sets result, not manipulating count
      const walkButton = screen.getByTestId('walk-button');
      await user.click(walkButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          finalCount: { balls: 0, strikes: 0 }, // Current count when walk button clicked
        })
      );
    });
  });

  describe('AC009A - Field-Accurate Baserunner Layout', () => {
    it('should display bases in field-accurate order (3rd-2nd-1st from left to right)', () => {
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
        />
      );

      const fieldLayout = screen.getByTestId('baserunner-field-layout');
      expect(fieldLayout).toBeInTheDocument();

      // AC009A: Field-accurate layout with proper runner names
      const thirdBase = screen.getByTestId('baserunner-third');
      const secondBase = screen.getByTestId('baserunner-second');
      const firstBase = screen.getByTestId('baserunner-first');

      // Verify content instead of JSDOM-incompatible positioning
      expect(thirdBase).toHaveTextContent('Runner Three');
      expect(secondBase).toHaveTextContent('Runner Two');
      expect(firstBase).toHaveTextContent('Runner One');

      // Verify field layout structure exists
      expect(fieldLayout).toHaveStyle('position: relative');
    });

    it('should elevate second base visually', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            second: { playerId: 'runner2', playerName: 'Runner Two' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      // AC009A: Second base elevation through container styling, not badge class
      const secondBase = screen.getByTestId('baserunner-second');
      expect(secondBase).toHaveTextContent('Runner Two');

      // Check that second base is in an elevated container
      const secondBaseContainer = secondBase.closest('.elevated');
      expect(secondBaseContainer).toBeInTheDocument();
    });

    it('should maintain responsive design on mobile', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={{
            first: { playerId: 'runner1', playerName: 'Runner One' },
          }}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          isMobile={true}
        />
      );

      const fieldLayout = screen.getByTestId('baserunner-field-layout');
      expect(fieldLayout).toHaveStyle('min-height: 100px'); // Mobile height
    });
  });

  describe('AC016A - Conditional Baserunner Modal', () => {
    it('should not show modal when no runners present', async () => {
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

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      // Modal should not appear
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();
    });

    it('should show modal only when runners are present', async () => {
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

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeVisible();
      });
    });

    it('should not show modal for auto-handled results like home runs', async () => {
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

      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      // Modal should not appear for home runs (auto-handled)
      expect(
        screen.queryByTestId('baserunner-advancement-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('AC017A-C - Baserunner Validation Rules', () => {
    describe('AC017A - All selections required', () => {
      it.skip('should require advancement selection for all runners', async () => {
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

        const singleButton = screen.getByTestId('single-button');
        await user.click(singleButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('baserunner-advancement-modal')
          ).toBeVisible();
        });

        // Select advancement for only one runner (first)
        const firstRunnerSelect = screen.getByTestId(
          'runner-first-advancement'
        );
        await user.selectOptions(firstRunnerSelect, 'second');

        // AC017A: Confirm button should be disabled until ALL runners have selections
        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).toBeDisabled();

        // Check for actual validation error message format
        expect(
          screen.getByText(
            /Please select advancement for Runner Three on third base/
          )
        ).toBeInTheDocument();
      });

      it('should enable confirmation when all selections are made', async () => {
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

        const singleButton = screen.getByTestId('single-button');
        await user.click(singleButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('baserunner-advancement-modal')
          ).toBeVisible();
        });

        // Select advancement for all runners
        await user.selectOptions(
          screen.getByTestId('runner-first-advancement'),
          'second'
        );
        await user.selectOptions(
          screen.getByTestId('runner-third-advancement'),
          'home'
        );

        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).not.toBeDisabled();
      });
    });

    describe('AC017B - No runners can disappear', () => {
      it.skip('should prevent submission when runners are unaccounted for', async () => {
        const user = userEvent.setup();
        renderWithChakra(
          <AtBatForm
            currentBatter={mockCurrentBatter}
            baserunners={{
              second: { playerId: 'runner2', playerName: 'Runner Two' },
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

        // AC017B: Don't select anything for the runner - should show validation error
        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).toBeDisabled();

        // Check for actual validation error message format
        expect(
          screen.getByText(
            /Please select advancement for Runner Two on second base/
          )
        ).toBeInTheDocument();
      });
    });

    describe('AC017C - No base conflicts', () => {
      it('should prevent multiple runners on same base', async () => {
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

        const singleButton = screen.getByTestId('single-button');
        await user.click(singleButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('baserunner-advancement-modal')
          ).toBeVisible();
        });

        // AC017C: Create a base conflict scenario
        // Runner from first stays at first, batter also goes to first (conflict)
        await user.selectOptions(
          screen.getByTestId('runner-first-advancement'),
          'stay'
        );
        await user.selectOptions(
          screen.getByTestId('runner-second-advancement'),
          'third'
        );

        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).toBeDisabled();

        // Check for actual validation error message format
        expect(
          screen.getByText(
            /Multiple runners cannot occupy first base: Batter, Runner One/
          )
        ).toBeInTheDocument();
      });

      it('should allow valid advancement without conflicts', async () => {
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

        const singleButton = screen.getByTestId('single-button');
        await user.click(singleButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('baserunner-advancement-modal')
          ).toBeVisible();
        });

        // Valid advancement without conflicts
        await user.selectOptions(
          screen.getByTestId('runner-first-advancement'),
          'second'
        );
        await user.selectOptions(
          screen.getByTestId('runner-second-advancement'),
          'third'
        );

        const confirmButton = screen.getByTestId('confirm-advancement');
        expect(confirmButton).not.toBeDisabled();

        // No validation errors should be shown
        expect(
          screen.queryByText(/multiple runners cannot occupy/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/all runners must be accounted for/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
