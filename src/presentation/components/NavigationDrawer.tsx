import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Button,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({
  isOpen,
  onClose,
}: NavigationDrawerProps): JSX.Element {
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/', icon: '🏠', testId: 'home-tab' },
    { label: 'Teams', path: '/teams', icon: '👥', testId: 'teams-tab' },
    { label: 'Seasons', path: '/seasons', icon: '📅', testId: 'seasons-tab' },
    {
      label: 'Game Types',
      path: '/game-types',
      icon: '🎯',
      testId: 'game-types-tab',
    },
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
    <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="bold" color="brand.500">
            ⚾ Breaking-Bat
          </Text>
        </DrawerHeader>

        <DrawerBody p={0}>
          <VStack spacing={0} align="stretch">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                data-testid={item.testId}
                onClick={onClose}
                variant={location.pathname === item.path ? 'solid' : 'ghost'}
                colorScheme={location.pathname === item.path ? 'brand' : 'gray'}
                justifyContent="flex-start"
                leftIcon={<span>{item.icon}</span>}
                borderRadius={0}
                size="lg"
                fontWeight="medium"
              >
                {item.label}
              </Button>
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
