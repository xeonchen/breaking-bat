import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  AddIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { TeamManagement } from '@/presentation/components/TeamManagement';
import { useTeamsStore } from '@/presentation/stores/teamsStore';
import { PresentationTeam } from '@/presentation/types/TeamWithPlayers';

export default function TeamsPage() {
  const {
    teams,
    selectedTeam,
    loading,
    error,
    playerStats,
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addPlayer,
    updatePlayer,
    removePlayer,
    getPlayerStats,
    selectTeam,
    clearSelection,
    clearError,
  } = useTeamsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [validationError, setValidationError] = useState('');
  const [teamForm, setTeamForm] = useState({
    name: '',
  });
  const [editingTeam, setEditingTeam] = useState<PresentationTeam | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<PresentationTeam | null>(null);

  // Modal states
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Load data on mount
  useEffect(() => {
    getTeams();
    getPlayerStats();
  }, [getTeams, getPlayerStats]);

  // Filter and sort teams
  const filteredAndSortedTeams = useMemo(() => {
    const filtered = teams.filter((team) => {
      const matchesSearch =
        searchTerm === '' ||
        team.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterBy === 'all' ||
        (filterBy === 'single-player' && team.players.length === 1) ||
        (filterBy === 'multiple-players' && team.players.length > 1) ||
        (filterBy === 'no-players' && team.players.length === 0);

      return matchesSearch && matchesFilter;
    });

    // Sort teams
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'player-count':
          return a.players.length - b.players.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [teams, searchTerm, filterBy, sortBy]);

  const validateTeamForm = useCallback((): boolean => {
    setValidationError('');

    if (!teamForm.name.trim()) {
      setValidationError('Team name is required');
      return false;
    }

    return true;
  }, [teamForm]);

  const handleCreateTeam = useCallback(async () => {
    if (!validateTeamForm()) return;

    try {
      await createTeam({
        name: teamForm.name.trim(),
        seasonIds: [],
        playerIds: [],
      });
      setTeamForm({ name: '' });
      onCreateClose();
    } catch {
      // Error handled by store
    }
  }, [teamForm, validateTeamForm, createTeam, onCreateClose]);

  const handleEditTeam = useCallback(async () => {
    if (!editingTeam || !validateTeamForm()) return;

    try {
      await updateTeam(editingTeam.id, {
        id: editingTeam.id,
        name: teamForm.name.trim(),
        seasonIds: [], // Empty for now until seasons are implemented
        playerIds: editingTeam.players.map(player => player.id),
      });
      setEditingTeam(null);
      setTeamForm({ name: '' });
      onEditClose();
    } catch {
      // Error handled by store
    }
  }, [editingTeam, teamForm, validateTeamForm, updateTeam, onEditClose]);

  const handleDeleteTeam = useCallback(async () => {
    if (!deletingTeam) return;

    try {
      await deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
      onDeleteClose();
    } catch {
      // Error handled by store
    }
  }, [deletingTeam, deleteTeam, onDeleteClose]);

  const openCreateModal = useCallback(() => {
    setTeamForm({ name: '' });
    setValidationError('');
    onCreateOpen();
  }, [onCreateOpen]);

  const openEditModal = useCallback(
    (team: PresentationTeam) => {
      setEditingTeam(team);
      setTeamForm({ name: team.name });
      setValidationError('');
      onEditOpen();
    },
    [onEditOpen]
  );

  const openDeleteModal = useCallback(
    (team: PresentationTeam) => {
      setDeletingTeam(team);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  const openTeamDetails = useCallback(
    (team: PresentationTeam) => {
      selectTeam(team);
      onDetailsOpen();
    },
    [selectTeam, onDetailsOpen]
  );

  const closeTeamDetails = useCallback(() => {
    clearSelection();
    onDetailsClose();
  }, [clearSelection, onDetailsClose]);

  const totalPlayers = teams.reduce(
    (sum, team) => sum + team.players.length,
    0
  );

  return (
    <Box
      data-testid="teams-page"
      role="main"
      aria-label="Teams Management Page"
      className={isMobile ? 'mobile-layout' : ''}
      p={{ base: 4, md: 6 }}
      maxW="7xl"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Page Header */}
        <Box data-testid="page-header">
          <Heading size="xl" mb={2}>
            Teams Management
          </Heading>
          <Text data-testid="page-description" color="gray.600" fontSize="lg">
            Manage your teams, players, and roster configurations
          </Text>
        </Box>

        {/* Teams Overview */}
        <Box data-testid="teams-overview">
          <HStack data-testid="teams-stats" spacing={6} mb={4}>
            <Badge colorScheme="blue" fontSize="md" p={2}>
              {teams.length} Teams
            </Badge>
            <Badge colorScheme="green" fontSize="md" p={2}>
              {totalPlayers} Total Players
            </Badge>
          </HStack>
        </Box>

        {/* Controls */}
        <HStack justify="space-between" wrap="wrap" spacing={4}>
          {/* Search */}
          <HStack>
            <SearchIcon color="gray.500" />
            <Input
              data-testid="teams-search-input"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxW="300px"
            />
          </HStack>

          {/* Filter and Sort */}
          <HStack spacing={4}>
            <Select
              data-testid="teams-filter-select"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              size="sm"
              maxW="200px"
            >
              <option value="all">All Teams</option>
              <option value="no-players">No Players</option>
              <option value="single-player">Single Player</option>
              <option value="multiple-players">Multiple Players</option>
            </Select>

            <Select
              data-testid="teams-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="sm"
              maxW="200px"
            >
              <option value="name">Sort by Name</option>
              <option value="player-count">Sort by Player Count</option>
            </Select>
          </HStack>

          {/* Create Team */}
          <Button
            data-testid="create-team-button"
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={openCreateModal}
            tabIndex={0}
          >
            Create Team
          </Button>
        </HStack>

        {/* Error Display */}
        {error && (
          <Alert status="error" data-testid="error-message">
            <AlertIcon />
            {error}
            <Button size="sm" ml={4} onClick={clearError}>
              Dismiss
            </Button>
            <Button
              data-testid="retry-button"
              size="sm"
              ml={2}
              onClick={() => {
                clearError();
                getTeams();
              }}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Status Message */}
        <Text
          data-testid="status-message"
          aria-live="polite"
          color="green.500"
          fontSize="sm"
        >
          {/* Status messages will be displayed here */}
        </Text>

        {/* Loading State */}
        {loading && (
          <Box textAlign="center" py={8}>
            <Spinner data-testid="loading-spinner" size="lg" />
            <Text mt={4}>Loading teams...</Text>
          </Box>
        )}

        {/* Teams List */}
        {!loading && (
          <>
            {filteredAndSortedTeams.length === 0 ? (
              <Box data-testid="empty-teams-message" textAlign="center" py={8}>
                <Text color="gray.500" fontSize="lg">
                  No teams created yet
                </Text>
                <Button
                  mt={4}
                  colorScheme="blue"
                  variant="outline"
                  onClick={openCreateModal}
                >
                  Create Your First Team
                </Button>
              </Box>
            ) : (
              <Grid
                data-testid="teams-list"
                role="list"
                aria-label="Teams List"
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
                gap={6}
              >
                {/* Virtual List for large datasets */}
                {filteredAndSortedTeams.length > 50 && (
                  <Box data-testid="virtual-list" />
                )}

                {filteredAndSortedTeams.map((team) => (
                  <GridItem key={team.id}>
                    <TeamCard
                      team={team}
                      isMobile={isMobile}
                      onView={() => openTeamDetails(team)}
                      onEdit={() => openEditModal(team)}
                      onDelete={() => openDeleteModal(team)}
                    />
                  </GridItem>
                ))}
              </Grid>
            )}
          </>
        )}
      </VStack>

      {/* Create Team Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent data-testid="create-team-modal">
          <ModalHeader>Create New Team</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={validationError.includes('name')}>
              <FormLabel>Team Name</FormLabel>
              <Input
                data-testid="team-name-input"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ name: e.target.value })}
                placeholder="Enter team name"
              />
            </FormControl>
            {validationError && (
              <Alert status="error" data-testid="validation-error" mt={4}>
                <AlertIcon />
                {validationError}
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-create-team"
              colorScheme="blue"
              onClick={handleCreateTeam}
              isLoading={loading}
            >
              Create Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent data-testid="edit-team-modal">
          <ModalHeader>Edit Team</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={validationError.includes('name')}>
              <FormLabel>Team Name</FormLabel>
              <Input
                data-testid="team-name-input"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ name: e.target.value })}
                placeholder="Enter team name"
              />
            </FormControl>
            {validationError && (
              <Alert status="error" data-testid="validation-error" mt={4}>
                <AlertIcon />
                {validationError}
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              data-testid="save-team-button"
              colorScheme="blue"
              onClick={handleEditTeam}
              isLoading={loading}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Team Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent data-testid="delete-team-modal">
          <ModalHeader>Delete Team</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {deletingTeam && (
              <Text>
                Are you sure you want to delete {deletingTeam.name}? This action
                cannot be undone.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-delete-button"
              colorScheme="red"
              onClick={handleDeleteTeam}
              isLoading={loading}
            >
              Delete Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Team Details Modal with TeamManagement */}
      <Modal isOpen={isDetailsOpen} onClose={closeTeamDetails} size="6xl">
        <ModalOverlay />
        <ModalContent data-testid="team-details-modal">
          <ModalHeader>{selectedTeam?.name} - Team Management</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTeam && (
              <TeamManagement
                team={selectedTeam}
                playerStats={playerStats}
                onPlayerAdd={(playerData) =>
                  addPlayer(selectedTeam.id, playerData)
                }
                onPlayerEdit={(playerId, playerData) =>
                  updatePlayer(playerId, playerData)
                }
                onPlayerRemove={(playerId) =>
                  removePlayer(selectedTeam.id, playerId)
                }
                onTeamEdit={(teamData) =>
                  updateTeam(selectedTeam.id, {
                    id: teamData.id,
                    name: teamData.name,
                    seasonIds: [], // Empty for now until seasons are implemented
                    playerIds: teamData.players.map(player => player.id),
                  })
                }
                isEditable={true}
                isMobile={isMobile}
                showStats={true}
                enableSearch={true}
                enableFilters={true}
                enableSorting={true}
                enableBulkOperations={true}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

interface TeamCardProps {
  team: PresentationTeam;
  isMobile?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TeamCard({
  team,
  isMobile,
  onView,
  onEdit,
  onDelete,
}: TeamCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Card
      data-testid={`team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
      role="listitem"
      className={isMobile ? 'mobile-compact' : ''}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: 'blue.300', transform: 'translateY(-2px)' }}
    >
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Heading size="md">{team.name}</Heading>
            <Badge colorScheme="blue">
              {team.players.length}{' '}
              {team.players.length === 1 ? 'Player' : 'Players'}
            </Badge>
          </HStack>

          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Button
                data-testid={`view-team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                leftIcon={<ViewIcon />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={onView}
                tabIndex={0}
              >
                View Details
              </Button>

              <HStack spacing={2}>
                <Tooltip label="Edit Team">
                  <IconButton
                    data-testid={`edit-team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label="Edit team"
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={onEdit}
                  />
                </Tooltip>
                <Tooltip label="Delete Team">
                  <IconButton
                    data-testid={`delete-team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label="Delete team"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={onDelete}
                  />
                </Tooltip>
              </HStack>
            </HStack>

            <Button
              data-testid="manage-roster-button"
              leftIcon={<AddIcon />}
              size="sm"
              colorScheme="green"
              variant="solid"
              onClick={onView}
              tabIndex={0}
            >
              Manage Roster
            </Button>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
}
