import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

export default function SeasonsPage(): JSX.Element {
  console.log('🏟️ SeasonsPage rendered');

  return (
    <Box p={6} data-testid="seasons-page" role="main" aria-label="Seasons Management Page">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading data-testid="page-header" size="lg" mb={2}>
            Seasons Management
          </Heading>
          <Text data-testid="page-description" color="gray.600">
            Manage your league seasons and time periods
          </Text>
        </Box>

        <Button
          data-testid="create-season-button"
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="md"
          onClick={() => console.log('Create season clicked')}
        >
          Create Season
        </Button>

        <Box data-testid="seasons-list" role="list" aria-label="Seasons List">
          <Text color="gray.500">No seasons created yet. Click "Create Season" to get started.</Text>
        </Box>
      </VStack>
    </Box>
  );
}