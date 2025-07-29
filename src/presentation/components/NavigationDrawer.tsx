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

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps): JSX.Element {
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Teams', path: '/teams', icon: '👥' },
    { label: 'Games', path: '/games', icon: '⚾' },
    { label: 'Stats', path: '/stats', icon: '📊' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
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