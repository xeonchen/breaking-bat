import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SettingsPage from '@/presentation/pages/SettingsPage';
import theme from '@/presentation/theme';

// Mock the settings components
jest.mock('@/presentation/components/settings/SeasonsManagement', () => ({
  SeasonsManagement: () => (
    <div data-testid="seasons-management-mock">
      Seasons Management Component
    </div>
  ),
}));

jest.mock('@/presentation/components/settings/GameTypesManagement', () => ({
  GameTypesManagement: () => (
    <div data-testid="game-types-management-mock">
      Game Types Management Component
    </div>
  ),
}));

// Mock alert for export functionality
const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('SettingsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSettingsPage = () => {
    return render(
      <ChakraProvider theme={theme}>
        <SettingsPage />
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render settings page with main title', () => {
      renderSettingsPage();

      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Manage your application settings and game configuration.'
        )
      ).toBeInTheDocument();
    });

    it('should render tab navigation', () => {
      renderSettingsPage();

      expect(screen.getByTestId('general-tab')).toBeInTheDocument();
      expect(screen.getByTestId('game-config-tab')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Game Configuration')).toBeInTheDocument();
    });

    it('should render general tab content by default', () => {
      renderSettingsPage();

      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('Application Settings')).toBeInTheDocument();
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
    });
  });

  describe('General Tab', () => {
    it('should display data management section', () => {
      renderSettingsPage();

      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByTestId('export-data-button')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    it('should display application settings section', () => {
      renderSettingsPage();

      expect(screen.getByText('Application Settings')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Theme preferences, notifications, and other general settings/
        )
      ).toBeInTheDocument();
    });

    it('should handle export data button click', () => {
      renderSettingsPage();

      const exportButton = screen.getByTestId('export-data-button');
      fireEvent.click(exportButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Data export functionality will be implemented here'
      );
    });

    it('should display export button with download icon', () => {
      renderSettingsPage();

      const exportButton = screen.getByTestId('export-data-button');
      expect(exportButton).toHaveTextContent('Export Data');
      expect(exportButton).toHaveClass('chakra-button');
    });
  });

  describe('Game Configuration Tab', () => {
    it('should switch to game configuration tab', () => {
      renderSettingsPage();

      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      expect(screen.getByTestId('seasons-section')).toBeInTheDocument();
      expect(screen.getByTestId('game-types-section')).toBeInTheDocument();
    });

    it('should render seasons management component', () => {
      renderSettingsPage();

      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      expect(screen.getByTestId('seasons-management-mock')).toBeInTheDocument();
      expect(
        screen.getByText('Seasons Management Component')
      ).toBeInTheDocument();
    });

    it('should render game types management component', () => {
      renderSettingsPage();

      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      expect(
        screen.getByTestId('game-types-management-mock')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Game Types Management Component')
      ).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should show general tab as active by default', () => {
      renderSettingsPage();

      const generalTab = screen.getByTestId('general-tab');
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch between tabs correctly', () => {
      renderSettingsPage();

      // Start on general tab
      expect(screen.getByText('Data Management')).toBeInTheDocument();

      // Click game config tab
      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      expect(gameConfigTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('seasons-section')).toBeInTheDocument();

      // Click back to general tab
      const generalTab = screen.getByTestId('general-tab');
      fireEvent.click(generalTab);

      expect(generalTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Data Management')).toBeInTheDocument();
    });

    it('should hide content when switching tabs', () => {
      renderSettingsPage();

      // Initially on general tab
      expect(screen.getByText('Data Management')).toBeInTheDocument();

      // Switch to game config tab
      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      // Game config content should be visible
      expect(screen.getByTestId('seasons-section')).toBeInTheDocument();
      expect(screen.getByTestId('game-types-section')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should have proper page structure', () => {
      renderSettingsPage();

      const settingsPage = screen.getByTestId('settings-page');
      expect(settingsPage).toBeInTheDocument();
    });

    it('should use Chakra UI tabs component', () => {
      renderSettingsPage();

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const generalTab = screen.getByRole('tab', { name: 'General' });
      const gameConfigTab = screen.getByRole('tab', {
        name: 'Game Configuration',
      });

      expect(generalTab).toBeInTheDocument();
      expect(gameConfigTab).toBeInTheDocument();
    });
  });

  describe('Color Mode Support', () => {
    it('should integrate with Chakra UI color mode system', () => {
      renderSettingsPage();

      // Component should render without errors in default color mode
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderSettingsPage();

      const mainHeading = screen.getByRole('heading', { name: 'Settings' });
      const dataManagementHeading = screen.getByRole('heading', {
        name: 'Data Management',
      });
      const appSettingsHeading = screen.getByRole('heading', {
        name: 'Application Settings',
      });

      expect(mainHeading).toBeInTheDocument();
      expect(dataManagementHeading).toBeInTheDocument();
      expect(appSettingsHeading).toBeInTheDocument();
    });

    it('should have accessible tab navigation', () => {
      renderSettingsPage();

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should have accessible export button', () => {
      renderSettingsPage();

      const exportButton = screen.getByRole('button', { name: 'Export Data' });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    it('should log export action to console', () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      renderSettingsPage();

      const exportButton = screen.getByTestId('export-data-button');
      fireEvent.click(exportButton);

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Export data clicked');

      consoleSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate settings components', () => {
      renderSettingsPage();

      // Switch to game config tab to show the components
      const gameConfigTab = screen.getByTestId('game-config-tab');
      fireEvent.click(gameConfigTab);

      // Both components should be rendered in their respective sections
      const seasonsSection = screen.getByTestId('seasons-section');
      const gameTypesSection = screen.getByTestId('game-types-section');

      expect(seasonsSection).toContainElement(
        screen.getByTestId('seasons-management-mock')
      );
      expect(gameTypesSection).toContainElement(
        screen.getByTestId('game-types-management-mock')
      );
    });
  });
});
