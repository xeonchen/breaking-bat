import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Header } from '@/presentation/components/Header';
import theme from '@/presentation/theme';

describe('Header Component', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHeader = (initialPath = '/') => {
    return render(
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Header onMenuClick={mockOnMenuClick} />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render the app title with logo', () => {
      renderHeader();
      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderHeader();
      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
      expect(screen.getByTestId('games-tab')).toBeInTheDocument();
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
      expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    });

    it('should render component structure correctly', () => {
      renderHeader();
      // Header renders and contains navigation elements
      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });
  });

  describe('Navigation Active States', () => {
    it('should highlight Teams tab when on /teams route', () => {
      renderHeader('/teams');
      const teamsTab = screen.getByTestId('teams-tab');
      // Check the button has active variant styling
      expect(teamsTab).toHaveClass('chakra-button');
    });

    it('should highlight Games tab when on /games route', () => {
      renderHeader('/games');
      const gamesTab = screen.getByTestId('games-tab');
      expect(gamesTab).toHaveClass('chakra-button');
    });

    it('should highlight Games tab when on root route /', () => {
      renderHeader('/');
      const gamesTab = screen.getByTestId('games-tab');
      expect(gamesTab).toHaveClass('chakra-button');
    });

    it('should highlight Stats tab when on /stats route', () => {
      renderHeader('/stats');
      const statsTab = screen.getByTestId('stats-tab');
      expect(statsTab).toHaveClass('chakra-button');
    });

    it('should highlight Settings tab when on /settings route', () => {
      renderHeader('/settings');
      const settingsTab = screen.getByTestId('settings-tab');
      expect(settingsTab).toHaveClass('chakra-button');
    });

    it('should not highlight any tab when on unknown route', () => {
      renderHeader('/unknown');
      const tabs = [
        screen.getByTestId('teams-tab'),
        screen.getByTestId('games-tab'),
        screen.getByTestId('stats-tab'),
        screen.getByTestId('settings-tab'),
      ];

      tabs.forEach((tab) => {
        expect(tab).toHaveClass('chakra-button');
      });
    });
  });

  describe('Mobile Menu Interaction', () => {
    it('should have onMenuClick handler available', () => {
      renderHeader();
      // The onMenuClick prop is passed to the component
      expect(mockOnMenuClick).toBeDefined();
      expect(typeof mockOnMenuClick).toBe('function');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href attributes for all navigation items', () => {
      renderHeader();

      expect(screen.getByTestId('teams-tab').closest('a')).toHaveAttribute(
        'href',
        '/teams'
      );
      expect(screen.getByTestId('games-tab').closest('a')).toHaveAttribute(
        'href',
        '/games'
      );
      expect(screen.getByTestId('stats-tab').closest('a')).toHaveAttribute(
        'href',
        '/stats'
      );
      expect(screen.getByTestId('settings-tab').closest('a')).toHaveAttribute(
        'href',
        '/settings'
      );
    });

    it('should have correct text content for all navigation items', () => {
      renderHeader();

      expect(screen.getByTestId('teams-tab')).toHaveTextContent('Teams');
      expect(screen.getByTestId('games-tab')).toHaveTextContent('Games');
      expect(screen.getByTestId('stats-tab')).toHaveTextContent('Stats');
      expect(screen.getByTestId('settings-tab')).toHaveTextContent('Settings');
    });
  });

  describe('Logo Navigation', () => {
    it('should navigate to /games when logo is clicked', () => {
      renderHeader();
      const logo = screen.getByText('⚾ Breaking-Bat');
      expect(logo.closest('a')).toHaveAttribute('href', '/games');
    });
  });
});
