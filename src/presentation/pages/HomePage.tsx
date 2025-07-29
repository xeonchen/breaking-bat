import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function HomePage(): JSX.Element {
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <VStack spacing={8} align="stretch">
      {/* Welcome Section */}
      <Box textAlign="center" py={8}>
        <Heading size="xl" mb={4} color="brand.500">
          Welcome to Breaking-Bat
        </Heading>
        <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
          Your comprehensive slowpitch softball scoring and statistics tracking application.
          Record games, manage teams, and analyze performance - all offline-ready.
        </Text>
      </Box>

      {/* Quick Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Teams</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Registered</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Games</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Completed</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Players</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Active</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Season</StatLabel>
              <StatNumber>2025</StatNumber>
              <StatHelpText>Current</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions */}
      <VStack spacing={6}>
        <Heading size="lg" color="brand.500">
          Quick Actions
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
          <Button
            as={RouterLink}
            to="/teams"
            size="lg"
            colorScheme="brand"
            variant="outline"
            h="auto"
            py={6}
            flexDirection="column"
          >
            <Text fontSize="2xl" mb={2}>👥</Text>
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold">Manage Teams</Text>
              <Text fontSize="sm" color="gray.500">
                Add teams, players, and create lineups
              </Text>
            </VStack>
          </Button>
          
          <Button
            as={RouterLink}
            to="/games"
            size="lg"
            colorScheme="brand"
            h="auto"
            py={6}
            flexDirection="column"
          >
            <Text fontSize="2xl" mb={2}>⚾</Text>
            <VStack spacing={1}>
              <Text fontSize="lg" fontWeight="bold">Start New Game</Text>
              <Text fontSize="sm" color="white" opacity={0.8}>
                Begin recording a new softball game
              </Text>
            </VStack>
          </Button>
        </SimpleGrid>
      </VStack>

      {/* Recent Activity */}
      <Card bg={cardBg}>
        <CardBody>
          <Heading size="md" mb={4} color="brand.500">
            Recent Activity
          </Heading>
          <Text color="gray.500" textAlign="center" py={8}>
            No recent activity. Start by creating a team or recording a game!
          </Text>
        </CardBody>
      </Card>
    </VStack>
  );
}