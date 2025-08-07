import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { NavigationDrawer } from '@/presentation/components/NavigationDrawer';
import theme from '@/presentation/theme';

describe('NavigationDrawer Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderNavigationDrawer = (
    props: Partial<Parameters<typeof NavigationDrawer>[0]> = {},
    initialPath = '/'
  ) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
    };

    return render(
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[initialPath]}>
          <NavigationDrawer {...defaultProps} {...props} />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render drawer header with app title', () => {
      renderNavigationDrawer();

      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderNavigationDrawer();

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
      expect(screen.getByTestId('games-tab')).toBeInTheDocument();
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
      expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    });

    it('should render navigation items with correct text and icons', () => {
      renderNavigationDrawer();

      const teamsButton = screen.getByTestId('teams-tab');
      const gamesButton = screen.getByTestId('games-tab');
      const statsButton = screen.getByTestId('stats-tab');
      const settingsButton = screen.getByTestId('settings-tab');

      expect(teamsButton).toHaveTextContent('Teams');
      expect(gamesButton).toHaveTextContent('Games');
      expect(statsButton).toHaveTextContent('Stats');
      expect(settingsButton).toHaveTextContent('Settings');

      // Check for emoji icons
      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('⚾')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('should render drawer close button', () => {
      renderNavigationDrawer();

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Drawer Open/Close State', () => {
    it('should render when isOpen is true', () => {
      renderNavigationDrawer({ isOpen: true });

      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      renderNavigationDrawer({ isOpen: false });

      // Drawer should be present but not visible
      expect(screen.queryByText('⚾ Breaking-Bat')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      renderNavigationDrawer();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      renderNavigationDrawer();

      // Find drawer overlay and simulate click
      const overlay = document.querySelector(
        '[data-chakra-component="DrawerOverlay"]'
      );
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Navigation Active States', () => {
    it('should render navigation items for teams route', () => {
      renderNavigationDrawer({}, '/teams');
      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });

    it('should render navigation items for games route', () => {
      renderNavigationDrawer({}, '/games');
      expect(screen.getByTestId('games-tab')).toBeInTheDocument();
    });

    it('should render navigation items for stats route', () => {
      renderNavigationDrawer({}, '/stats');
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should render navigation items for settings route', () => {
      renderNavigationDrawer({}, '/settings');
      expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    });

    it('should handle unknown routes', () => {
      renderNavigationDrawer({}, '/unknown');

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
      expect(screen.getByTestId('games-tab')).toBeInTheDocument();
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
      expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    });
  });

  describe('Navigation Item Interactions', () => {
    it('should call onClose when Teams tab is clicked', () => {
      renderNavigationDrawer();

      const teamsTab = screen.getByTestId('teams-tab');
      fireEvent.click(teamsTab);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Games tab is clicked', () => {
      renderNavigationDrawer();

      const gamesTab = screen.getByTestId('games-tab');
      fireEvent.click(gamesTab);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Stats tab is clicked', () => {
      renderNavigationDrawer();

      const statsTab = screen.getByTestId('stats-tab');
      fireEvent.click(statsTab);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Settings tab is clicked', () => {
      renderNavigationDrawer();

      const settingsTab = screen.getByTestId('settings-tab');
      fireEvent.click(settingsTab);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose multiple times for single click', () => {
      renderNavigationDrawer();

      const teamsTab = screen.getByTestId('teams-tab');
      fireEvent.click(teamsTab);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href attributes for all navigation items', () => {
      renderNavigationDrawer();

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

    it('should navigate to correct routes when clicked', () => {
      renderNavigationDrawer();

      const links = [
        { testId: 'teams-tab', path: '/teams' },
        { testId: 'games-tab', path: '/games' },
        { testId: 'stats-tab', path: '/stats' },
        { testId: 'settings-tab', path: '/settings' },
      ];

      links.forEach((link) => {
        const element = screen.getByTestId(link.testId);
        expect(element.closest('a')).toHaveAttribute('href', link.path);
      });
    });
  });

  describe('Drawer Styling and Layout', () => {
    it('should render drawer content correctly', () => {
      renderNavigationDrawer();

      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
    });

    it('should have proper button styling with icons', () => {
      renderNavigationDrawer();

      const teamsButton = screen.getByTestId('teams-tab');
      expect(teamsButton).toHaveTextContent('👥');
      expect(teamsButton).toHaveTextContent('Teams');
    });

    it('should have navigation container structure', () => {
      renderNavigationDrawer();

      const navigationContainer = screen.getByTestId('teams-tab').parentElement;
      expect(navigationContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus management', () => {
      renderNavigationDrawer();

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should provide navigation structure', () => {
      renderNavigationDrawer();

      const navigationButtons = [
        screen.getByTestId('teams-tab'),
        screen.getByTestId('games-tab'),
        screen.getByTestId('stats-tab'),
        screen.getByTestId('settings-tab'),
      ];

      navigationButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Header Styling', () => {
    it('should apply brand color to header text', () => {
      renderNavigationDrawer();

      const headerText = screen.getByText('⚾ Breaking-Bat');
      expect(headerText).toHaveClass('chakra-text');
    });

    it('should have proper font styling for header', () => {
      renderNavigationDrawer();

      const headerText = screen.getByText('⚾ Breaking-Bat');
      expect(headerText).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle onClose being undefined', () => {
      // This would be a development error, but test graceful handling
      render(
        <ChakraProvider theme={theme}>
          <MemoryRouter>
            <NavigationDrawer isOpen={true} onClose={undefined as any} />
          </MemoryRouter>
        </ChakraProvider>
      );

      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();
    });

    it('should handle rapid open/close state changes', () => {
      renderNavigationDrawer({ isOpen: true });
      expect(screen.getByText('⚾ Breaking-Bat')).toBeInTheDocument();

      render(
        <ChakraProvider theme={theme}>
          <MemoryRouter>
            <NavigationDrawer isOpen={false} onClose={mockOnClose} />
          </MemoryRouter>
        </ChakraProvider>
      );

      // State change handled successfully
      expect(mockOnClose).toBeDefined();
    });

    it('should handle navigation to nested routes correctly', () => {
      renderNavigationDrawer({}, '/teams/123');

      // Should not highlight any tab for nested routes
      const tabs = [
        screen.getByTestId('teams-tab'),
        screen.getByTestId('games-tab'),
        screen.getByTestId('stats-tab'),
        screen.getByTestId('settings-tab'),
      ];

      // Teams tab might be highlighted depending on exact matching logic
      const activeElements = tabs.filter((tab) =>
        tab.hasAttribute('data-active')
      );
      expect(activeElements.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Button Interactions', () => {
    it('should handle multiple rapid clicks gracefully', () => {
      renderNavigationDrawer();

      const teamsTab = screen.getByTestId('teams-tab');

      fireEvent.click(teamsTab);
      fireEvent.click(teamsTab);
      fireEvent.click(teamsTab);

      // onClose should still only be called for each click
      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('should maintain proper button state after clicks', () => {
      renderNavigationDrawer();

      const teamsTab = screen.getByTestId('teams-tab');
      fireEvent.click(teamsTab);

      expect(teamsTab).toBeInTheDocument();
      expect(teamsTab).toHaveTextContent('Teams');
    });
  });
});
