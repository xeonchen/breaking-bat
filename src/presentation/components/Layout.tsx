import { ReactNode } from 'react';
import {
  Box,
  Container,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { Header } from './Header';
import { NavigationDrawer } from './NavigationDrawer';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh" bg={bg}>
      {/* Header */}
      <Header onMenuClick={onOpen} />
      
      {/* Navigation Drawer (Mobile) */}
      <NavigationDrawer isOpen={isOpen} onClose={onClose} />
      
      {/* Main Content */}
      <Container
        maxW="container.xl"
        pt={{ base: 4, md: 6 }}
        pb={{ base: 20, md: 8 }} // Extra bottom padding for mobile navigation
        px={{ base: 4, md: 6 }}
      >
        {children}
      </Container>
      
      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />
    </Box>
  );
}