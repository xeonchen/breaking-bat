import {
  Box,
  Flex,
  Heading,
  IconButton,
  useColorModeValue,
  Show,
  Hide,
  HStack,
  Button,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/', testId: 'home-tab' },
    { label: 'Teams', path: '/teams', testId: 'teams-tab' },
    { label: 'Seasons', path: '/seasons', testId: 'seasons-tab' },
    { label: 'Game Types', path: '/game-types', testId: 'game-types-tab' },
    { label: 'Games', path: '/games', testId: 'games-tab' },
    { label: 'Stats', path: '/stats', testId: 'stats-tab' },
    { label: 'Settings', path: '/settings', testId: 'settings-tab' },
  ];

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 4, md: 6 }}
        py={3}
        maxW="container.xl"
        mx="auto"
      >
        {/* Mobile Menu Button */}
        <Show below="md">
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onMenuClick}
            mr={2}
          />
        </Show>

        {/* Logo/Title */}
        <Heading
          size={{ base: 'md', md: 'lg' }}
          color="brand.500"
          fontWeight="bold"
          as={RouterLink}
          to="/"
          _hover={{ textDecoration: 'none', color: 'brand.600' }}
        >
          ⚾ Breaking-Bat
        </Heading>

        {/* Desktop Navigation */}
        <Hide below="md">
          <HStack spacing={1}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                data-testid={item.testId}
                variant={location.pathname === item.path ? 'solid' : 'ghost'}
                colorScheme={location.pathname === item.path ? 'brand' : 'gray'}
                size="sm"
                fontWeight="medium"
              >
                {item.label}
              </Button>
            ))}
          </HStack>
        </Hide>

        {/* Spacer for mobile layout */}
        <Show below="md">
          <Box w={10} />
        </Show>
      </Flex>
    </Box>
  );
}
