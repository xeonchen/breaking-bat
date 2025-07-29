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

export function Header({ onMenuClick }: HeaderProps): JSX.Element {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Teams', path: '/teams' },
    { label: 'Games', path: '/games' },
    { label: 'Stats', path: '/stats' },
    { label: 'Settings', path: '/settings' },
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