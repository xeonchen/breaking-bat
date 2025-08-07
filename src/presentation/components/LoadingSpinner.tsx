import {
  Spinner,
  VStack,
  Text,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'lg',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.600', 'gray.300');

  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size={size}
      />
      <Text color={color} fontSize="sm" fontWeight="medium">
        {message}
      </Text>
    </VStack>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={bg}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="200px"
      w="full"
    >
      {content}
    </Box>
  );
}
