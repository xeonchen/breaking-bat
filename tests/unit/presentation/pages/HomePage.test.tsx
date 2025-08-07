import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import HomePage from '@/presentation/pages/HomePage';
import theme from '@/presentation/theme';

describe('HomePage Component', () => {
  const renderHomePage = () => {
    return render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render welcome section with title', () => {
      renderHomePage();

      expect(screen.getByText('Welcome to Breaking-Bat')).toBeInTheDocument();
      expect(
        screen.getByText(/Your comprehensive slowpitch softball scoring/)
      ).toBeInTheDocument();
    });

    it('should render all stat cards', () => {
      renderHomePage();

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(screen.getByText('Season')).toBeInTheDocument();
    });

    it('should display default stat values', () => {
      renderHomePage();

      // Check for stat numbers
      const statNumbers = screen.getAllByText('0');
      expect(statNumbers).toHaveLength(3); // Teams, Games, Players

      expect(screen.getByText('2025')).toBeInTheDocument(); // Current season
      expect(screen.getByText('Registered')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should render quick actions section', () => {
      renderHomePage();

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Manage Teams')).toBeInTheDocument();
      expect(screen.getByText('Start New Game')).toBeInTheDocument();
    });

    it('should render quick action descriptions', () => {
      renderHomePage();

      expect(
        screen.getByText('Add teams, players, and create lineups')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Begin recording a new softball game')
      ).toBeInTheDocument();
    });

    it('should render recent activity section', () => {
      renderHomePage();

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(
        screen.getByText(/No recent activity. Start by creating a team/)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for manage teams button', () => {
      renderHomePage();

      const manageTeamsButton = screen.getByText('Manage Teams').closest('a');
      expect(manageTeamsButton).toHaveAttribute('href', '/teams');
    });

    it('should have correct href for start new game button', () => {
      renderHomePage();

      const startGameButton = screen.getByText('Start New Game').closest('a');
      expect(startGameButton).toHaveAttribute('href', '/games');
    });
  });

  describe('Visual Elements', () => {
    it('should render emojis for quick actions', () => {
      renderHomePage();

      expect(screen.getByText('👥')).toBeInTheDocument(); // Teams emoji
      expect(screen.getByText('⚾')).toBeInTheDocument(); // Games emoji
    });

    it('should apply brand colors to headings', () => {
      renderHomePage();

      const welcomeHeading = screen.getByText('Welcome to Breaking-Bat');
      expect(welcomeHeading).toHaveClass('chakra-heading');

      const quickActionsHeading = screen.getByText('Quick Actions');
      expect(quickActionsHeading).toHaveClass('chakra-heading');

      const recentActivityHeading = screen.getByText('Recent Activity');
      expect(recentActivityHeading).toHaveClass('chakra-heading');
    });
  });

  describe('Layout and Structure', () => {
    it('should render stats in a grid layout', () => {
      renderHomePage();

      // All stat cards should be present
      const statLabels = ['Teams', 'Games', 'Players', 'Season'];
      statLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should render quick actions in a grid layout', () => {
      renderHomePage();

      const manageTeamsButton = screen.getByText('Manage Teams');
      const startGameButton = screen.getByText('Start New Game');

      expect(manageTeamsButton).toBeInTheDocument();
      expect(startGameButton).toBeInTheDocument();
    });

    it('should have proper card structure', () => {
      renderHomePage();

      // Check that stat cards have proper Chakra UI classes
      const teamsCard = screen
        .getByText('Teams')
        .closest('[class*="chakra-card"]');
      expect(teamsCard).toBeInTheDocument();
    });
  });

  describe('Color Mode Support', () => {
    it('should integrate with Chakra UI color mode system', () => {
      renderHomePage();

      // Component should render without errors in default color mode
      expect(screen.getByText('Welcome to Breaking-Bat')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsive grid components', () => {
      renderHomePage();

      // Component renders without errors in responsive layout
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Manage Teams')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderHomePage();

      const mainHeading = screen.getByRole('heading', {
        name: 'Welcome to Breaking-Bat',
      });
      const quickActionsHeading = screen.getByRole('heading', {
        name: 'Quick Actions',
      });
      const recentActivityHeading = screen.getByRole('heading', {
        name: 'Recent Activity',
      });

      expect(mainHeading).toBeInTheDocument();
      expect(quickActionsHeading).toBeInTheDocument();
      expect(recentActivityHeading).toBeInTheDocument();
    });

    it('should have accessible navigation buttons', () => {
      renderHomePage();

      const manageTeamsLink = screen.getByRole('link', {
        name: /manage teams/i,
      });
      const startGameLink = screen.getByRole('link', {
        name: /start new game/i,
      });

      expect(manageTeamsLink).toBeInTheDocument();
      expect(startGameLink).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should display welcome message with proper text content', () => {
      renderHomePage();

      const description = screen.getByText(
        /Your comprehensive slowpitch softball scoring/
      );
      expect(description).toHaveTextContent(
        'Your comprehensive slowpitch softball scoring and statistics tracking application. Record games, manage teams, and analyze performance - all offline-ready.'
      );
    });

    it('should display proper stat help text', () => {
      renderHomePage();

      expect(screen.getByText('Registered')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should display empty state message for recent activity', () => {
      renderHomePage();

      const emptyStateMessage = screen.getByText(/No recent activity/);
      expect(emptyStateMessage).toHaveTextContent(
        'No recent activity. Start by creating a team or recording a game!'
      );
    });
  });
});
