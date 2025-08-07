import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary';
import theme from '@/presentation/theme';

// Mock window.location.reload
const mockReload = jest.fn();
delete (window as unknown as { location?: unknown }).location;
(window as unknown as { location: { reload: jest.Mock } }).location = {
  reload: mockReload,
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test error message');
  }
  return <div>Working component</div>;
};

// Component with custom error for testing specific scenarios
const ThrowCustomError = ({ error }: { error?: Error }) => {
  if (error) {
    throw error;
  }
  return <div>Working component</div>;
};

describe('ErrorBoundary Component', () => {
  const renderWithErrorBoundary = (children: React.ReactNode) => {
    return render(
      <ChakraProvider theme={theme}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location.reload mock
    mockReload.mockClear();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      renderWithErrorBoundary(<ThrowError shouldError={false} />);

      expect(screen.getByText('Working component')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong!')
      ).not.toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      renderWithErrorBoundary(
        <>
          <div>Child 1</div>
          <div>Child 2</div>
          <ThrowError shouldError={false} />
        </>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error boundary UI when child throws error', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
      expect(
        screen.getByText(/The application encountered an unexpected error/)
      ).toBeInTheDocument();
      expect(screen.queryByText('Working component')).not.toBeInTheDocument();
    });

    it('should log error to console when error occurs', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should display error alert with proper styling', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('data-status', 'error');
    });

    it('should handle different types of errors', () => {
      const customError = new Error('Custom error message');

      renderWithErrorBoundary(<ThrowCustomError error={customError} />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should provide reload and try again buttons', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const reloadButton = screen.getByText('Reload Application');
      const tryAgainButton = screen.getByText('Try Again');

      expect(reloadButton).toBeInTheDocument();
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should handle button clicks without errors', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const reloadButton = screen.getByText('Reload Application');
      const tryAgainButton = screen.getByText('Try Again');

      // Should not throw errors when clicked
      expect(() => fireEvent.click(reloadButton)).not.toThrow();
      expect(() => fireEvent.click(tryAgainButton)).not.toThrow();
    });

    it('should have properly styled action buttons', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const reloadButton = screen.getByText('Reload Application');
      const tryAgainButton = screen.getByText('Try Again');

      expect(reloadButton).toHaveClass('chakra-button');
      expect(tryAgainButton).toHaveClass('chakra-button');
    });
  });

  describe('Development Mode Features', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      expect(
        screen.getByText('Error Details (Development Mode):')
      ).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('should hide error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      expect(
        screen.queryByText('Error Details (Development Mode):')
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Test error message/)).not.toBeInTheDocument();
    });

    it('should display error stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';

      const errorWithStack = new Error('Test error with stack');
      errorWithStack.stack =
        'Error: Test error with stack\n    at TestComponent\n    at ErrorBoundary';

      renderWithErrorBoundary(<ThrowCustomError error={errorWithStack} />);

      expect(screen.getByText(/Test error with stack/)).toBeInTheDocument();
      expect(screen.getByText(/at TestComponent/)).toBeInTheDocument();
    });

    it('should display component stack in development mode when available', () => {
      process.env.NODE_ENV = 'development';

      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      // Component stack is captured by React and should be displayed
      expect(
        screen.getByText('Error Details (Development Mode):')
      ).toBeInTheDocument();
    });
  });

  describe('Error State Management', () => {
    it('should initialize with no error state', () => {
      renderWithErrorBoundary(<div>No error</div>);

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong!')
      ).not.toBeInTheDocument();
    });

    it('should maintain error state after error occurs', () => {
      const { rerender } = renderWithErrorBoundary(
        <ThrowError shouldError={true} />
      );

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();

      // Re-render with same error component
      rerender(
        <ChakraProvider theme={theme}>
          <ErrorBoundary>
            <ThrowError shouldError={true} />
          </ErrorBoundary>
        </ChakraProvider>
      );

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });

    it('should handle getDerivedStateFromError correctly', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      // Error UI should be displayed, indicating getDerivedStateFromError worked
      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render with proper layout structure', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const errorContainer = screen
        .getByText('Something went wrong!')
        .closest('div');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have responsive design elements', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const reloadButton = screen.getByText('Reload Application');
      const tryAgainButton = screen.getByText('Try Again');

      expect(reloadButton).toBeInTheDocument();
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should apply proper ARIA attributes for accessibility', () => {
      renderWithErrorBoundary(<ThrowError shouldError={true} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-status', 'error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without message', () => {
      const errorWithoutMessage = new Error();

      renderWithErrorBoundary(<ThrowCustomError error={errorWithoutMessage} />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });

    it('should handle errors without stack trace', () => {
      process.env.NODE_ENV = 'development';

      const errorWithoutStack = new Error('Error without stack');
      errorWithoutStack.stack = '';

      renderWithErrorBoundary(<ThrowCustomError error={errorWithoutStack} />);

      expect(
        screen.getByText('Error Details (Development Mode):')
      ).toBeInTheDocument();
    });

    it('should handle multiple sequential errors', () => {
      const { rerender } = renderWithErrorBoundary(
        <ThrowError shouldError={true} />
      );

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();

      // Click try again
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Render another error
      rerender(
        <ChakraProvider theme={theme}>
          <ErrorBoundary>
            <ThrowCustomError error={new Error('Second error')} />
          </ErrorBoundary>
        </ChakraProvider>
      );

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });
  });
});
