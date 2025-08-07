import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Spinner,
  Grid,
  Card,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  useToast,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useGamesStore } from '@/presentation/stores/gamesStore';
import { GameType } from '@/domain';

export function GameTypesManagement() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGameType, setEditingGameType] = useState<GameType | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Store hooks
  const {
    gameTypes,
    loading,
    loadGameTypes,
    createGameType,
    updateGameType,
    deleteGameType,
  } = useGamesStore();

  // Load game types on mount
  useEffect(() => {
    loadGameTypes();
  }, [loadGameTypes]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setFormErrors({});
    setIsEditMode(false);
    setEditingGameType(null);
  };

  const handleCreateGameType = () => {
    resetForm();
    onOpen();
  };

  const handleEditGameType = (gameType: GameType) => {
    setFormData({
      name: gameType.name,
      description: gameType.description,
    });
    setIsEditMode(true);
    setEditingGameType(gameType);
    onOpen();
  };

  const handleSubmit = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Game type name is required';
    if (formData.name.length > 100)
      errors.name = 'Game type name cannot exceed 100 characters';
    if (formData.description.length > 500)
      errors.description = 'Description cannot exceed 500 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (isEditMode && editingGameType) {
        // Update existing game type
        const updatedGameType = editingGameType.update(
          formData.name,
          formData.description
        );
        await updateGameType(updatedGameType);

        toast({
          title: 'Game type updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new game type
        await createGameType({
          name: formData.name,
          description: formData.description,
        });

        toast({
          title: 'Game type created successfully',
          status: 'success',
          duration: 3000,
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save game type:', error);
      // Error handling is done in the store
    }
  };

  const handleDeleteGameType = async (gameTypeId: string) => {
    if (!confirm('Are you sure you want to delete this game type?')) {
      return;
    }

    try {
      await deleteGameType(gameTypeId);
      toast({
        title: 'Game type deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to delete game type:', error);
      // Error handling is done in the store
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
      >
        <Spinner size="lg" data-testid="loading-spinner" />
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Heading as="h2" size="md">
          Game Types
        </Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreateGameType}
          aria-label="Create new game type"
          data-testid="create-game-type-button"
        >
          Create Game Type
        </Button>
      </HStack>

      {/* Game Types Grid */}
      {gameTypes.length === 0 ? (
        <Box textAlign="center" py={10} data-testid="no-game-types-message">
          <Text fontSize="lg" color="gray.500" mb={2}>
            No game types found
          </Text>
          <Text color="gray.400">
            Create your first game type to get started
          </Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(auto-fill, minmax(300px, 1fr))',
          }}
          gap={4}
          data-testid="game-types-grid"
        >
          {gameTypes.map((gameType) => (
            <Card
              key={gameType.id}
              data-testid={`game-type-${gameType.name.toLowerCase().replace(/\s+/g, '-')}`}
              role="article"
              aria-label={`Game Type: ${gameType.name}`}
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" fontSize="md">
                    {gameType.name}
                  </Text>

                  {gameType.hasDescription() && (
                    <Text fontSize="sm" color="gray.600">
                      {gameType.description}
                    </Text>
                  )}

                  <HStack spacing={2}>
                    <Tooltip label="Edit game type">
                      <IconButton
                        aria-label={`Edit ${gameType.name}`}
                        icon={<EditIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => handleEditGameType(gameType)}
                        data-testid={`edit-game-type-${gameType.id}`}
                      />
                    </Tooltip>
                    <Tooltip label="Delete game type">
                      <IconButton
                        aria-label={`Delete ${gameType.name}`}
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => handleDeleteGameType(gameType.id)}
                        data-testid={`delete-game-type-${gameType.id}`}
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}

      {/* Create/Edit Game Type Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader as="h2">
            {isEditMode ? 'Edit Game Type' : 'Create New Game Type'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!formErrors.name}>
                <FormLabel>Game Type Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Regular Season, Playoffs, Tournament"
                  aria-label="Game type name"
                  data-testid="game-type-name-input"
                />
                {formErrors.name && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.name}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.description}>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this game type..."
                  aria-label="Game type description"
                  data-testid="game-type-description-input"
                  resize="vertical"
                  minH="100px"
                />
                {formErrors.description && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.description}
                  </Text>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              data-testid="confirm-create-game-type"
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
