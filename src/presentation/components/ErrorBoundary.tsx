import { Component, ErrorInfo, ReactNode } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  VStack,
  Text,
  Code,
  useColorModeValue,
} from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          bg={useColorModeValue('gray.50', 'gray.900')}
        >
          <VStack spacing={6} maxW="lg" w="full">
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="lg"
              p={6}
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Something went wrong!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                The application encountered an unexpected error. This has been logged
                and our team has been notified.
              </AlertDescription>
            </Alert>

            <VStack spacing={3} w="full">
              <Button
                colorScheme="brand"
                size="lg"
                onClick={this.handleReload}
                w="full"
              >
                Reload Application
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={this.handleReset}
                w="full"
              >
                Try Again
              </Button>
            </VStack>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                w="full"
                bg={useColorModeValue('red.50', 'red.900')}
                p={4}
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="red.400"
              >
                <Text fontSize="sm" fontWeight="bold" mb={2} color="red.600">
                  Error Details (Development Mode):
                </Text>
                <Code
                  display="block"
                  whiteSpace="pre-wrap"
                  fontSize="xs"
                  p={2}
                  bg={useColorModeValue('white', 'gray.800')}
                  borderRadius="sm"
                  overflow="auto"
                  maxH="200px"
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </Code>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}