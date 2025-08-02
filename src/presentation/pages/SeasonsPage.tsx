import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Spinner,
  Grid,
  Card,
  CardBody,
  Badge,
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
import { Season } from '@/domain';

export default function SeasonsPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Store hooks
  const {
    seasons,
    loading,
    loadSeasons,
    createSeason,
    updateSeason,
    deleteSeason,
  } = useGamesStore();

  // Load seasons on mount
  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
    });
    setFormErrors({});
    setIsEditMode(false);
    setEditingSeason(null);
  };

  const handleCreateSeason = () => {
    resetForm();
    onOpen();
  };

  const handleEditSeason = (season: Season) => {
    setFormData({
      name: season.name,
      year: season.year,
      startDate: season.startDate.toISOString().split('T')[0],
      endDate: season.endDate.toISOString().split('T')[0],
    });
    setIsEditMode(true);
    setEditingSeason(season);
    onOpen();
  };

  const handleSubmit = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Season name is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      errors.endDate = 'End date must be after start date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (isEditMode && editingSeason) {
        // Update existing season
        const updatedSeason = new Season(
          editingSeason.id,
          formData.name,
          formData.year,
          new Date(formData.startDate),
          new Date(formData.endDate),
          editingSeason.teamIds,
          editingSeason.createdAt,
          new Date()
        );
        await updateSeason(updatedSeason);

        toast({
          title: 'Season updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new season
        await createSeason({
          name: formData.name,
          year: formData.year,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        });

        toast({
          title: 'Season created successfully',
          status: 'success',
          duration: 3000,
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save season:', error);
      // Error handling is done in the store
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (!confirm('Are you sure you want to delete this season?')) {
      return;
    }

    try {
      await deleteSeason(seasonId);
      toast({
        title: 'Season deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to delete season:', error);
      // Error handling is done in the store
    }
  };

  const getStatusBadge = (season: Season) => {
    if (season.isActive()) {
      return <Badge colorScheme="green">Active</Badge>;
    } else if (season.hasEnded()) {
      return <Badge colorScheme="gray">Ended</Badge>;
    } else {
      return <Badge colorScheme="blue">Upcoming</Badge>;
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
    <Box
      p={6}
      data-testid="seasons-page"
      role="main"
      aria-label="Seasons Management Page"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading as="h1" size="lg">
            Seasons
          </Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={handleCreateSeason}
            aria-label="Create new season"
            data-testid="create-season-button"
          >
            Create Season
          </Button>
        </HStack>

        {/* Seasons Grid */}
        {seasons.length === 0 ? (
          <Box textAlign="center" py={10} data-testid="no-seasons-message">
            <Text fontSize="lg" color="gray.500" mb={2}>
              No seasons found
            </Text>
            <Text color="gray.400">
              Create your first season to get started
            </Text>
          </Box>
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
            gap={4}
            data-testid="seasons-grid"
          >
            {seasons.map((season) => (
              <Card
                key={season.id}
                data-testid={`season-${season.name.toLowerCase().replace(/\s+/g, '-')}`}
                role="article"
                aria-label={`Season: ${season.name}`}
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {season.name}
                      </Text>
                      {getStatusBadge(season)}
                    </HStack>

                    <Text fontSize="sm" color="gray.600">
                      {season.year}
                    </Text>

                    <Text fontSize="sm" color="gray.500">
                      {season.startDate.toLocaleDateString()} -{' '}
                      {season.endDate.toLocaleDateString()}
                    </Text>

                    <Text fontSize="sm" color="gray.500">
                      Duration: {season.getDurationInDays()} days
                    </Text>

                    <HStack spacing={2}>
                      <Tooltip label="Edit season">
                        <IconButton
                          aria-label={`Edit ${season.name}`}
                          icon={<EditIcon />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => handleEditSeason(season)}
                          data-testid={`edit-season-${season.id}`}
                        />
                      </Tooltip>
                      <Tooltip label="Delete season">
                        <IconButton
                          aria-label={`Delete ${season.name}`}
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => handleDeleteSeason(season.id)}
                          data-testid={`delete-season-${season.id}`}
                        />
                      </Tooltip>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        )}
      </VStack>

      {/* Create/Edit Season Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader as="h2">
            {isEditMode ? 'Edit Season' : 'Create New Season'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!formErrors.name}>
                <FormLabel>Season Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., 2024 Regular Season"
                  aria-label="Season name"
                  data-testid="season-name-input"
                />
                {formErrors.name && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.name}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Year</FormLabel>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year:
                        parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                  min="1900"
                  max="2100"
                  aria-label="Season year"
                  data-testid="season-year-input"
                />
              </FormControl>

              <FormControl isInvalid={!!formErrors.startDate}>
                <FormLabel>Start Date</FormLabel>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  aria-label="Start date"
                  data-testid="season-start-date"
                />
                {formErrors.startDate && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.startDate}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.endDate}>
                <FormLabel>End Date</FormLabel>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  aria-label="End date"
                  data-testid="season-end-date"
                />
                {formErrors.endDate && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.endDate}
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
              data-testid="confirm-create-season"
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
