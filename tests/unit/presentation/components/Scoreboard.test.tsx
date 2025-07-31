import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { Scoreboard } from '@/presentation/components/Scoreboard';
import theme from '@/presentation/theme';

// Mock game data for testing
const mockGameData = {
  homeTeam: 'Red Sox',
  awayTeam: 'Yankees',
  homeScore: 5,
  awayScore: 3,
  currentInning: 7,
  isTopInning: false,
  isGameComplete: false,
  inningScores: [
    { inning: 1, home: 1, away: 0 },
    { inning: 2, home: 0, away: 2 },
    { inning: 3, home: 2, away: 0 },
    { inning: 4, home: 1, away: 1 },
    { inning: 5, home: 0, away: 0 },
    { inning: 6, home: 1, away: 0 },
    { inning: 7, home: 0, away: 0 },
  ],
};

const renderWithChakra = (
  component: React.ReactElement
): ReturnType<typeof render> => {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
};

describe('Scoreboard Component', () => {
  describe('Basic Display', () => {
    it('should display team names correctly', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      expect(screen.getByText('Yankees')).toBeInTheDocument();
      expect(screen.getByText('Red Sox')).toBeInTheDocument();
    });

    it('should display current scores correctly', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      expect(screen.getByTestId('home-score')).toHaveTextContent('5');
      expect(screen.getByTestId('away-score')).toHaveTextContent('3');
    });

    it('should display current inning information', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      expect(screen.getByTestId('current-inning')).toHaveTextContent('7');
      expect(screen.getByTestId('inning-half')).toHaveTextContent('Bottom');
    });

    it('should show top of inning correctly', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={true}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      expect(screen.getByTestId('inning-half')).toHaveTextContent('Top');
    });
  });

  describe('Game State Indicators', () => {
    it('should highlight the winning team', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      const homeTeamElement = screen.getByTestId('home-team-display');
      const awayTeamElement = screen.getByTestId('away-team-display');

      // Home team is winning (5 > 3), so should be highlighted
      expect(homeTeamElement).toHaveClass('winning-team');
      expect(awayTeamElement).not.toHaveClass('winning-team');
    });

    it('should show game complete status', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={true}
        />
      );

      expect(screen.getByTestId('game-status')).toHaveTextContent('Final');
    });

    it('should show current batter indicator when game is active', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={false}
          isGameComplete={false}
        />
      );

      // Bottom of inning means home team is batting
      expect(screen.getByTestId('batting-indicator')).toHaveTextContent(
        'Red Sox Batting'
      );
    });

    it('should show away team batting in top of inning', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={true}
          isGameComplete={false}
        />
      );

      expect(screen.getByTestId('batting-indicator')).toHaveTextContent(
        'Red Sox Batting'
      );
    });
  });

  describe('Inning-by-Inning Scores', () => {
    it('should display inning scores when provided', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
          inningScores={mockGameData.inningScores}
        />
      );

      // Check that inning headers are present
      const table = screen.getByTestId('inning-scores-table');
      expect(table).toBeInTheDocument();

      // Check for column headers by looking within table headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.some((header) => header.textContent === '1')).toBe(true);
      expect(headers.some((header) => header.textContent === '2')).toBe(true);
      expect(headers.some((header) => header.textContent === '7')).toBe(true);

      // Check specific inning scores
      expect(screen.getByTestId('away-inning-1')).toHaveTextContent('0');
      expect(screen.getByTestId('home-inning-1')).toHaveTextContent('1');
      expect(screen.getByTestId('away-inning-2')).toHaveTextContent('2');
      expect(screen.getByTestId('home-inning-2')).toHaveTextContent('0');
    });

    it('should show total runs, hits, errors columns', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
          inningScores={mockGameData.inningScores}
          awayHits={8}
          homeHits={10}
          awayErrors={1}
          homeErrors={0}
        />
      );

      expect(screen.getByTestId('away-total-runs')).toHaveTextContent('3');
      expect(screen.getByTestId('home-total-runs')).toHaveTextContent('5');
      expect(screen.getByTestId('away-hits')).toHaveTextContent('8');
      expect(screen.getByTestId('home-hits')).toHaveTextContent('10');
      expect(screen.getByTestId('away-errors')).toHaveTextContent('1');
      expect(screen.getByTestId('home-errors')).toHaveTextContent('0');
    });
  });

  describe('Responsive Design', () => {
    it('should be accessible with proper ARIA labels', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      expect(
        screen.getByRole('region', { name: /scoreboard/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId('scoreboard')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });

    it('should handle missing optional props gracefully', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
        />
      );

      // Should render without inning scores
      expect(screen.getByTestId('scoreboard')).toBeInTheDocument();
      expect(
        screen.queryByTestId('inning-scores-table')
      ).not.toBeInTheDocument();
    });

    it('should handle zero scores correctly', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam="Team A"
          awayTeam="Team B"
          homeScore={0}
          awayScore={0}
          currentInning={1}
          isTopInning={true}
          isGameComplete={false}
        />
      );

      expect(screen.getByTestId('home-score')).toHaveTextContent('0');
      expect(screen.getByTestId('away-score')).toHaveTextContent('0');
      expect(screen.queryByTestId('home-team-display')).not.toHaveClass(
        'winning-team'
      );
      expect(screen.queryByTestId('away-team-display')).not.toHaveClass(
        'winning-team'
      );
    });
  });

  describe('Mobile Optimization', () => {
    it('should apply mobile-specific styling', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
          isMobile={true}
        />
      );

      const scoreboard = screen.getByTestId('scoreboard');
      expect(scoreboard).toHaveClass('mobile-layout');
    });

    it('should show compact view on mobile when inning scores present', () => {
      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
          inningScores={mockGameData.inningScores}
          isMobile={true}
        />
      );

      // On mobile, should show expandable inning scores
      expect(screen.getByTestId('expand-inning-scores')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update when props change', () => {
      const { rerender } = renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={5}
          awayScore={3}
          currentInning={7}
          isTopInning={false}
          isGameComplete={false}
        />
      );

      expect(screen.getByTestId('home-score')).toHaveTextContent('5');

      // Update score
      rerender(
        <ChakraProvider theme={theme}>
          <Scoreboard
            homeTeam={mockGameData.homeTeam}
            awayTeam={mockGameData.awayTeam}
            homeScore={6}
            awayScore={3}
            currentInning={7}
            isTopInning={false}
            isGameComplete={false}
          />
        </ChakraProvider>
      );

      expect(screen.getByTestId('home-score')).toHaveTextContent('6');
    });

    it('should animate score changes', () => {
      const onScoreChange = jest.fn();

      renderWithChakra(
        <Scoreboard
          homeTeam={mockGameData.homeTeam}
          awayTeam={mockGameData.awayTeam}
          homeScore={mockGameData.homeScore}
          awayScore={mockGameData.awayScore}
          currentInning={mockGameData.currentInning}
          isTopInning={mockGameData.isTopInning}
          isGameComplete={mockGameData.isGameComplete}
          onScoreChange={onScoreChange}
          animateChanges={true}
        />
      );

      const homeScore = screen.getByTestId('home-score');
      expect(homeScore).toHaveClass('animate-score');
    });
  });
});
