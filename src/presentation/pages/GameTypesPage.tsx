import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

export default function GameTypesPage(): JSX.Element {
  console.log('🎯 GameTypesPage rendered');

  return (
    <Box p={6} data-testid="game-types-page" role="main" aria-label="Game Types Management Page">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading data-testid="page-header" size="lg" mb={2}>
            Game Types Management
          </Heading>
          <Text data-testid="page-description" color="gray.600">
            Define different types of games (Regular Season, Playoffs, etc.)
          </Text>
        </Box>

        <Button
          data-testid="create-game-type-button"
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="md"
          onClick={() => console.log('Create game type clicked')}
        >
          Create Game Type
        </Button>

        <Box data-testid="game-types-list" role="list" aria-label="Game Types List">
          <Text color="gray.500">No game types created yet. Click "Create Game Type" to get started.</Text>
        </Box>
      </VStack>
    </Box>
  );
}