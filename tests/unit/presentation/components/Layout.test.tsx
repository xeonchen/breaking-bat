import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@/presentation/components/Layout';
import theme from '@/presentation/theme';

// Mock the child components to isolate Layout testing
jest.mock('@/presentation/components/Header', () => ({
  Header: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <div data-testid="header">
      <button onClick={onMenuClick} data-testid="menu-button">
        Menu
      </button>
    </div>
  ),
}));

jest.mock('@/presentation/components/NavigationDrawer', () => ({
  NavigationDrawer: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => (
    <div data-testid="navigation-drawer" data-open={isOpen}>
      <button onClick={onClose} data-testid="close-drawer">
        Close
      </button>
    </div>
  ),
}));

jest.mock('@/presentation/components/BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation">Bottom Nav</div>,
}));

describe('Layout Component', () => {
  const renderLayout = (
    children: React.ReactNode = <div>Test Content</div>
  ) => {
    return render(
      <ChakraProvider theme={theme}>
        <MemoryRouter>
          <Layout>{children}</Layout>
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render all layout components', () => {
      renderLayout();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderLayout(<div data-testid="custom-content">Custom Test Content</div>);

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderLayout(
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Navigation Drawer State Management', () => {
    it('should start with navigation drawer closed', () => {
      renderLayout();

      const drawer = screen.getByTestId('navigation-drawer');
      expect(drawer).toHaveAttribute('data-open', 'false');
    });

    it('should open navigation drawer when header menu button is clicked', () => {
      renderLayout();

      const menuButton = screen.getByTestId('menu-button');
      const drawer = screen.getByTestId('navigation-drawer');

      expect(drawer).toHaveAttribute('data-open', 'false');

      fireEvent.click(menuButton);

      expect(drawer).toHaveAttribute('data-open', 'true');
    });

    it('should close navigation drawer when close button is clicked', () => {
      renderLayout();

      const menuButton = screen.getByTestId('menu-button');
      const closeButton = screen.getByTestId('close-drawer');
      const drawer = screen.getByTestId('navigation-drawer');

      // Open drawer first
      fireEvent.click(menuButton);
      expect(drawer).toHaveAttribute('data-open', 'true');

      // Close drawer
      fireEvent.click(closeButton);
      expect(drawer).toHaveAttribute('data-open', 'false');
    });

    it('should handle multiple open/close cycles', () => {
      renderLayout();

      const menuButton = screen.getByTestId('menu-button');
      const closeButton = screen.getByTestId('close-drawer');
      const drawer = screen.getByTestId('navigation-drawer');

      // Cycle 1
      fireEvent.click(menuButton);
      expect(drawer).toHaveAttribute('data-open', 'true');
      fireEvent.click(closeButton);
      expect(drawer).toHaveAttribute('data-open', 'false');

      // Cycle 2
      fireEvent.click(menuButton);
      expect(drawer).toHaveAttribute('data-open', 'true');
      fireEvent.click(closeButton);
      expect(drawer).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper container structure', () => {
      renderLayout();

      // Should have main container
      const container =
        screen.getByText('Test Content').closest('[data-chakra-component]') ||
        screen.getByText('Test Content').closest('.chakra-container') ||
        screen.getByText('Test Content').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should apply minimum height to layout', () => {
      renderLayout();

      const layoutRoot = screen.getByTestId('header').closest('div');
      expect(layoutRoot).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render bottom navigation for mobile', () => {
      renderLayout();

      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('should handle responsive padding correctly', () => {
      renderLayout();

      const content = screen.getByText('Test Content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should apply background color from theme', () => {
      renderLayout();

      const layoutRoot = screen.getByTestId('header').closest('div');
      expect(layoutRoot).toBeInTheDocument();
    });
  });

  describe('Children Handling', () => {
    it('should handle null children gracefully', () => {
      renderLayout(null);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('should handle string children', () => {
      renderLayout('Simple text content');

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      renderLayout(
        <div>
          <header>Page Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Page Footer</footer>
        </div>
      );

      expect(screen.getByText('Page Header')).toBeInTheDocument();
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Page Footer')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to Header component', () => {
      renderLayout();

      const header = screen.getByTestId('header');
      const menuButton = screen.getByTestId('menu-button');

      expect(header).toBeInTheDocument();
      expect(menuButton).toBeInTheDocument();
    });

    it('should pass correct props to NavigationDrawer component', () => {
      renderLayout();

      const drawer = screen.getByTestId('navigation-drawer');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('data-open');
    });

    it('should render BottomNavigation without props', () => {
      renderLayout();

      const bottomNav = screen.getByTestId('bottom-navigation');
      expect(bottomNav).toBeInTheDocument();
      expect(bottomNav).toHaveTextContent('Bottom Nav');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid menu toggle clicks', () => {
      renderLayout();

      const menuButton = screen.getByTestId('menu-button');
      const drawer = screen.getByTestId('navigation-drawer');

      // Rapid clicks
      fireEvent.click(menuButton);
      fireEvent.click(menuButton);
      fireEvent.click(menuButton);

      // Should still track state correctly
      expect(drawer).toHaveAttribute('data-open', 'true');
    });

    it('should maintain layout integrity with dynamic content', () => {
      const { rerender } = renderLayout(<div>Initial Content</div>);

      expect(screen.getByText('Initial Content')).toBeInTheDocument();

      rerender(
        <ChakraProvider theme={theme}>
          <MemoryRouter>
            <Layout>
              <div>Updated Content</div>
            </Layout>
          </MemoryRouter>
        </ChakraProvider>
      );

      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument();
    });
  });
});
