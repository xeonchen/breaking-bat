import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { AtBatForm } from '@/presentation/components/AtBatForm';
import { Position, BattingResult } from '@/domain';
import theme from '@/presentation/theme';

// Mock current batter data
const mockCurrentBatter = {
  playerId: 'player1',
  playerName: 'John Smith',
  jerseyNumber: '12',
  position: Position.pitcher(),
  battingOrder: 3,
};

// Mock baserunner state
const mockBaserunners = {
  first: { playerId: 'runner1', playerName: 'Runner One' },
  second: null,
  third: { playerId: 'runner3', playerName: 'Runner Three' },
};

const renderWithChakra = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('AtBatForm Component', () => {
  describe('Basic Display', () => {
    it('should display current batter information', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('current-batter')).toHaveTextContent(
        'John Smith'
      );
      expect(screen.getByTestId('current-batter')).toHaveTextContent('#12');
      expect(screen.getByTestId('current-batter')).toHaveTextContent('3rd');
    });

    it('should display current count', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 2, strikes: 1 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('count-display')).toHaveTextContent('2-1');
      expect(screen.getByTestId('balls-count')).toHaveTextContent('2');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('1');
    });

    it('should display baserunner status', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('baserunner-first')).toHaveTextContent(
        'Runner One'
      );
      expect(screen.getByTestId('baserunner-second')).toHaveTextContent(
        'Empty'
      );
      expect(screen.getByTestId('baserunner-third')).toHaveTextContent(
        'Runner Three'
      );
    });

    it('should show pitch tracking section', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('pitch-tracking-section')).toBeInTheDocument();
      expect(screen.getByTestId('ball-button')).toBeInTheDocument();
      expect(screen.getByTestId('strike-button')).toBeInTheDocument();
      expect(screen.getByTestId('foul-button')).toBeInTheDocument();
    });

    it('should show at-bat outcome buttons', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('outcome-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('single-button')).toBeInTheDocument();
      expect(screen.getByTestId('double-button')).toBeInTheDocument();
      expect(screen.getByTestId('triple-button')).toBeInTheDocument();
      expect(screen.getByTestId('home-run-button')).toBeInTheDocument();
      expect(screen.getByTestId('walk-button')).toBeInTheDocument();
      expect(screen.getByTestId('strikeout-button')).toBeInTheDocument();
    });
  });

  describe('Pitch Tracking', () => {
    it('should update count when ball is recorded', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 2 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const ballButton = screen.getByTestId('ball-button');
      await user.click(ballButton);

      expect(screen.getByTestId('balls-count')).toHaveTextContent('2');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('2');
    });

    it('should update count when strike is recorded', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const strikeButton = screen.getByTestId('strike-button');
      await user.click(strikeButton);

      expect(screen.getByTestId('balls-count')).toHaveTextContent('1');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('2');
    });

    it('should handle foul ball correctly (no strike on 2 strikes)', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 2, strikes: 2 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const foulButton = screen.getByTestId('foul-button');
      await user.click(foulButton);

      // Count should stay the same when fouling with 2 strikes
      expect(screen.getByTestId('balls-count')).toHaveTextContent('2');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('2');
    });

    it('should increment strikes on foul with less than 2 strikes', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const foulButton = screen.getByTestId('foul-button');
      await user.click(foulButton);

      expect(screen.getByTestId('balls-count')).toHaveTextContent('1');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('2');
    });

    it('should auto-complete at-bat on 4 balls (walk)', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 3, strikes: 1 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const ballButton = screen.getByTestId('ball-button');
      await user.click(ballButton);

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            result: 'BB',
            finalCount: { balls: 4, strikes: 1 },
          })
        );
      });
    });

    it('should auto-complete at-bat on 3 strikes (strikeout)', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 2, strikes: 2 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const strikeButton = screen.getByTestId('strike-button');
      await user.click(strikeButton);

      await waitFor(() => {
        expect(onAtBatComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            result: 'SO',
            finalCount: { balls: 2, strikes: 3 },
          })
        );
      });
    });
  });

  describe('At-Bat Outcomes', () => {
    it('should handle single outcome selection', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 2 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          result: '1B',
          finalCount: { balls: 1, strikes: 2 },
        })
      );
    });

    it('should handle home run outcome selection', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 2, strikes: 1 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const homeRunButton = screen.getByTestId('home-run-button');
      await user.click(homeRunButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'HR',
          finalCount: { balls: 2, strikes: 1 },
        })
      );
    });

    it('should show baserunner advancement options for hits', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      const doubleButton = screen.getByTestId('double-button');
      await user.click(doubleButton);

      // Should show baserunner advancement modal
      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('runner-first-advancement')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('runner-third-advancement')
      ).toBeInTheDocument();
    });
  });

  describe('Baserunner Management', () => {
    it('should display baserunner advancement options', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
          showBaserunnerOptions={true}
        />
      );

      const tripleButton = screen.getByTestId('triple-button');
      await user.click(tripleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeInTheDocument();
      });

      // Should show options for each existing runner in modal
      expect(screen.getByText(/Runner on 1st: Runner One/)).toBeInTheDocument();
      expect(
        screen.getByText(/Runner on 3rd: Runner Three/)
      ).toBeInTheDocument();
    });

    it('should allow setting baserunner advancement', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeInTheDocument();
      });

      // Select advancement for runner on first
      const firstRunnerSelect = screen.getByTestId('runner-first-advancement');
      await user.selectOptions(firstRunnerSelect, 'third');

      const confirmButton = screen.getByTestId('confirm-advancement');
      await user.click(confirmButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          result: '1B',
          baserunnerAdvancement: expect.objectContaining({
            first: 'third',
          }),
        })
      );
    });

    it('should handle baserunner errors and outs', async () => {
      const onAtBatComplete = jest.fn();
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={onAtBatComplete}
          showBaserunnerOptions={true}
        />
      );

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('baserunner-advancement-modal')
        ).toBeInTheDocument();
      });

      // Select 'out' for runner on third
      const thirdRunnerSelect = screen.getByTestId('runner-third-advancement');
      await user.selectOptions(thirdRunnerSelect, 'out');

      const confirmButton = screen.getByTestId('confirm-advancement');
      await user.click(confirmButton);

      expect(onAtBatComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          baserunnerAdvancement: expect.objectContaining({
            third: 'out',
          }),
        })
      );
    });
  });

  describe('Pitch History', () => {
    it('should display pitch history', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          showPitchHistory={true}
        />
      );

      // Add some pitches
      const ballButton = screen.getByTestId('ball-button');
      const strikeButton = screen.getByTestId('strike-button');

      await user.click(ballButton);
      await user.click(strikeButton);
      await user.click(ballButton);

      const pitchHistory = screen.getByTestId('pitch-history');
      expect(pitchHistory).toBeInTheDocument();
      expect(pitchHistory).toHaveTextContent('B-S-B');
    });

    it('should allow clearing pitch history', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
          showPitchHistory={true}
        />
      );

      const clearButton = screen.getByTestId('clear-count-button');
      await user.click(clearButton);

      expect(screen.getByTestId('balls-count')).toHaveTextContent('0');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('0');
      expect(screen.getByTestId('pitch-history')).toHaveTextContent('');
    });
  });

  describe('Mobile Optimization', () => {
    it('should use compact layout on mobile', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          isMobile={true}
        />
      );

      const container = screen.getByTestId('at-bat-form');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should show simplified pitch buttons on mobile', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          isMobile={true}
        />
      );

      const pitchTracking = screen.getByTestId('pitch-tracking-section');
      expect(pitchTracking).toHaveClass('mobile-compact');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 2, strikes: 1 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('at-bat-form')).toHaveAttribute(
        'role',
        'region'
      );
      expect(screen.getByTestId('at-bat-form')).toHaveAttribute(
        'aria-label',
        'At-Bat Recording Form'
      );

      const countDisplay = screen.getByTestId('count-display');
      expect(countDisplay).toHaveAttribute('aria-live', 'polite');
      expect(countDisplay).toHaveAttribute(
        'aria-label',
        'Current count: 2 balls, 1 strike'
      );
    });

    it('should support keyboard navigation', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const ballButton = screen.getByTestId('ball-button');
      const strikeButton = screen.getByTestId('strike-button');

      expect(ballButton).toHaveAttribute('tabIndex', '0');
      expect(strikeButton).toHaveAttribute('tabIndex', '0');

      ballButton.focus();
      expect(document.activeElement).toBe(ballButton);
    });

    it('should announce count changes to screen readers', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
        />
      );

      const ballButton = screen.getByTestId('ball-button');
      await user.click(ballButton);

      const countDisplay = screen.getByTestId('count-display');
      expect(countDisplay).toHaveAttribute(
        'aria-label',
        'Current count: 2 balls, 1 strike'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing batter information gracefully', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={null}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
        />
      );

      expect(screen.getByTestId('no-batter-message')).toBeInTheDocument();
      expect(screen.getByText(/No batter selected/i)).toBeInTheDocument();
    });

    it('should validate count boundaries', async () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 4, strikes: 3 }} // Invalid count
          onAtBatComplete={jest.fn()}
        />
      );

      // Should show error state
      expect(screen.getByTestId('invalid-count-warning')).toBeInTheDocument();
    });

    it('should handle callback errors gracefully', async () => {
      const onAtBatComplete = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={onAtBatComplete}
        />
      );

      const singleButton = screen.getByTestId('single-button');
      await user.click(singleButton);

      // Should not crash and show error state
      expect(screen.queryByTestId('error-message')).toBeInTheDocument();
    });
  });

  describe('Advanced Features', () => {
    it('should support pitch type selection', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 0, strikes: 0 }}
          onAtBatComplete={jest.fn()}
          enablePitchTypes={true}
          showPitchHistory={true}
        />
      );

      expect(screen.getByTestId('pitch-type-selector')).toBeInTheDocument();

      const pitchTypeSelect = screen.getByTestId('pitch-type-select');
      await user.selectOptions(pitchTypeSelect, 'fastball');

      const strikeButton = screen.getByTestId('strike-button');
      await user.click(strikeButton);

      // Pitch type should be recorded with the pitch
      const pitchHistory = screen.getByTestId('pitch-history');
      expect(pitchHistory).toHaveTextContent('S (FB)'); // Strike (Fastball)
    });

    it('should support undo last pitch', async () => {
      const user = userEvent.setup();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
          enableUndo={true}
        />
      );

      const undoButton = screen.getByTestId('undo-pitch-button');
      expect(undoButton).toBeDisabled(); // No pitches to undo initially

      const ballButton = screen.getByTestId('ball-button');
      await user.click(ballButton);

      expect(undoButton).not.toBeDisabled();
      await user.click(undoButton);

      // Should revert to original count
      expect(screen.getByTestId('balls-count')).toHaveTextContent('1');
      expect(screen.getByTestId('strikes-count')).toHaveTextContent('1');
    });
  });

  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', async () => {
      const user = userEvent.setup();
      const mockOnAtBatComplete = jest.fn();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={mockOnAtBatComplete}
          disabled={true}
        />
      );

      // Check that all buttons are disabled
      expect(screen.getByTestId('ball-button')).toBeDisabled();
      expect(screen.getByTestId('strike-button')).toBeDisabled();
      expect(screen.getByTestId('foul-button')).toBeDisabled();
      expect(screen.getByTestId('single-button')).toBeDisabled();
      expect(screen.getByTestId('double-button')).toBeDisabled();
      expect(screen.getByTestId('triple-button')).toBeDisabled();
      expect(screen.getByTestId('home-run-button')).toBeDisabled();
      expect(screen.getByTestId('walk-button')).toBeDisabled();
      expect(screen.getByTestId('strikeout-button')).toBeDisabled();
      expect(screen.getByTestId('ground-out-button')).toBeDisabled();
      expect(screen.getByTestId('clear-count-button')).toBeDisabled();

      // Try clicking a disabled button and ensure no callback is triggered
      await user.click(screen.getByTestId('single-button'));
      expect(mockOnAtBatComplete).not.toHaveBeenCalled();
    });

    it('should apply visual disabled styling when disabled', () => {
      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={jest.fn()}
          disabled={true}
        />
      );

      const form = screen.getByTestId('at-bat-form');
      expect(form).toHaveStyle('opacity: 0.6');
    });

    it('should remain enabled when disabled prop is false or not provided', async () => {
      const user = userEvent.setup();
      const mockOnAtBatComplete = jest.fn();

      renderWithChakra(
        <AtBatForm
          currentBatter={mockCurrentBatter}
          baserunners={mockBaserunners}
          currentCount={{ balls: 1, strikes: 1 }}
          onAtBatComplete={mockOnAtBatComplete}
          disabled={false}
        />
      );

      // Check that buttons are enabled
      expect(screen.getByTestId('single-button')).toBeEnabled();
      expect(screen.getByTestId('double-button')).toBeEnabled();
      expect(screen.getByTestId('ball-button')).toBeEnabled();

      // Try clicking an enabled button and ensure callback is triggered
      await user.click(screen.getByTestId('single-button'));
      expect(mockOnAtBatComplete).toHaveBeenCalledTimes(1);
    });
  });
});
