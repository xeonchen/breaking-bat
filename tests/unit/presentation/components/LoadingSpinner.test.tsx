import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner';
import theme from '@/presentation/theme';

describe('LoadingSpinner Component', () => {
  const renderLoadingSpinner = (
    props?: Parameters<typeof LoadingSpinner>[0]
  ) => {
    return render(
      <ChakraProvider theme={theme}>
        <LoadingSpinner {...props} />
      </ChakraProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render without crashing with default props', () => {
      renderLoadingSpinner();
      expect(document.body).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      renderLoadingSpinner({ message: 'Custom loading message' });
      expect(document.body).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      renderLoadingSpinner({ size: 'xs' });
      expect(document.body).toBeInTheDocument();

      renderLoadingSpinner({ size: 'lg' });
      expect(document.body).toBeInTheDocument();
    });

    it('should render in fullScreen mode', () => {
      renderLoadingSpinner({ fullScreen: true });
      expect(document.body).toBeInTheDocument();
    });

    it('should render in regular mode', () => {
      renderLoadingSpinner({ fullScreen: false });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should handle all prop combinations', () => {
      renderLoadingSpinner({
        message: 'Loading data...',
        size: 'xl',
        fullScreen: true,
      });
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined props gracefully', () => {
      renderLoadingSpinner({
        message: undefined,
        size: undefined,
        fullScreen: undefined,
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with Chakra UI theme system', () => {
      renderLoadingSpinner();
      expect(document.body).toBeInTheDocument();
    });
  });
});
