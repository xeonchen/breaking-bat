import {
  Box,
  Flex,
  IconButton,
  Text,
  VStack,
  useColorModeValue,
  Show,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

export function BottomNavigation() {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const location = useLocation();

  const navigationItems = [
    { label: 'Teams', path: '/teams', icon: '👥', testId: 'teams-tab' },
    { label: 'Games', path: '/games', icon: '⚾', testId: 'games-tab' },
    { label: 'Stats', path: '/stats', icon: '📊', testId: 'stats-tab' },
    {
      label: 'Settings',
      path: '/settings',
      icon: '⚙️',
      testId: 'settings-tab',
    },
  ];

  return (
    <Show below="md">
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={bg}
        borderTop="1px"
        borderColor={borderColor}
        zIndex={10}
        boxShadow="lg"
        pb="env(safe-area-inset-bottom)"
      >
        <Flex justify="space-around" py={2}>
          {navigationItems.map((item) => (
            <IconButton
              key={item.path}
              as={RouterLink}
              to={item.path}
              data-testid={item.testId}
              aria-label={item.label}
              variant="ghost"
              colorScheme={
                location.pathname === item.path ||
                (item.path === '/games' && location.pathname === '/')
                  ? 'brand'
                  : 'gray'
              }
              color={
                location.pathname === item.path ||
                (item.path === '/games' && location.pathname === '/')
                  ? 'brand.500'
                  : 'gray.500'
              }
              size="lg"
              h="auto"
              flexDirection="column"
              _hover={{
                bg: 'transparent',
                color: 'brand.500',
              }}
            >
              <VStack spacing={1}>
                <Text fontSize="xl">{item.icon}</Text>
                <Text fontSize="xs" fontWeight="medium">
                  {item.label}
                </Text>
              </VStack>
            </IconButton>
          ))}
        </Flex>
      </Box>
    </Show>
  );
}
