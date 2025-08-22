import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
  Select,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useGamesStore } from '@/presentation/stores/gamesStore';
import {
  PresentationGame,
  PresentationGameStatus,
  PresentationPlayer,
} from '@/presentation/interfaces/IPresentationServices';
import { GameMapper } from '@/presentation/mappers/GameMapper';
import { LineupSetupModal } from '../components/LineupSetupModal';

export default function GamePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLineupModalOpen,
    onOpen: onLineupModalOpen,
    onClose: onLineupModalClose,
  } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameForLineup, setSelectedGameForLineup] =
    useState<PresentationGame | null>(null);
  const [playersForLineup, setPlayersForLineup] = useState<
    PresentationPlayer[]
  >([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    opponent: '',
    date: new Date().toISOString().split('T')[0], // Set today's date as default
    teamId: '',
    seasonId: '',
    gameTypeId: '',
    homeAway: 'home' as 'home' | 'away',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creationError, setCreationError] = useState<string | null>(null);
  const [gameNameManuallyModified, setGameNameManuallyModified] =
    useState(false);

  // Store hooks
  const {
    games: gamesRaw,
    seasons,
    gameTypes,
    teams,
    loading,
    error,
    loadGames,
    loadSeasons,
    loadGameTypes,
    loadTeams,
    loadPlayersForTeam,
    createGame,
    saveLineup,
    searchGames,
    filterGamesByStatus,
    clearError,
  } = useGamesStore();

  // Transform GameDto[] to PresentationGame[] for UI compatibility
  const games: PresentationGame[] = GameMapper.dtoArrayToPresentation(gamesRaw);

  // Helper functions for smart defaults
  const getSmartDefaults = useCallback(() => {
    // Get most recent selections from localStorage
    const lastSelections = {
      teamId:
        localStorage.getItem('lastSelectedTeamId') ||
        (teams.length > 0 ? teams[0].id : ''),
      seasonId:
        localStorage.getItem('lastSelectedSeasonId') ||
        (seasons.length > 0 ? seasons[0].id : ''),
      gameTypeId:
        localStorage.getItem('lastSelectedGameTypeId') ||
        (gameTypes.length > 0 ? gameTypes[0].id : ''),
    };

    return lastSelections;
  }, [teams, seasons, gameTypes]);

  const generateGameName = useCallback(
    (seasonId: string, date: string, gameTypeId?: string) => {
      const season = seasons.find((s) => s.id === seasonId);
      const gameType = gameTypeId
        ? gameTypes.find((gt) => gt.id === gameTypeId)
        : null;

      if (!season) return '';

      const seasonName = season.name;
      const gameTypePrefix = gameType ? `${gameType.name} - ` : '';

      return `${gameTypePrefix}${seasonName} - ${date}`;
    },
    [seasons, gameTypes]
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await loadGames();
      await loadSeasons();
      await loadGameTypes();
      await loadTeams();
    };
    loadData();
  }, [loadGames, loadSeasons, loadGameTypes, loadTeams]);

  // Apply smart defaults when data loads
  useEffect(() => {
    if (teams.length > 0 && seasons.length > 0 && gameTypes.length > 0) {
      const defaults = getSmartDefaults();
      const currentDate = formData.date;

      setFormData((prev) => ({
        ...prev,
        teamId: prev.teamId || defaults.teamId,
        seasonId: prev.seasonId || defaults.seasonId,
        gameTypeId: prev.gameTypeId || defaults.gameTypeId,
        name: gameNameManuallyModified
          ? prev.name
          : generateGameName(
              defaults.seasonId,
              currentDate,
              defaults.gameTypeId
            ),
      }));
    }
  }, [
    teams,
    seasons,
    gameTypes,
    gameNameManuallyModified,
    formData.date,
    getSmartDefaults,
    generateGameName,
  ]);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchGames(searchQuery);
      } else {
        loadGames();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchGames, loadGames]);

  // Handler for form field changes with smart name generation
  const handleFieldChange = (field: string, value: string) => {
    // Save selections to localStorage for next time
    if (field === 'teamId' && value)
      localStorage.setItem('lastSelectedTeamId', value);
    if (field === 'seasonId' && value)
      localStorage.setItem('lastSelectedSeasonId', value);
    if (field === 'gameTypeId' && value)
      localStorage.setItem('lastSelectedGameTypeId', value);

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-update game name if not manually modified and we have the necessary data
      if (
        !gameNameManuallyModified &&
        (field === 'seasonId' || field === 'gameTypeId' || field === 'date')
      ) {
        const seasonId = field === 'seasonId' ? value : prev.seasonId;
        const gameTypeId = field === 'gameTypeId' ? value : prev.gameTypeId;
        const date = field === 'date' ? value : prev.date;

        if (seasonId && date) {
          newData.name = generateGameName(seasonId, date, gameTypeId);
        }
      }

      return newData;
    });
  };

  const handleGameNameChange = (value: string) => {
    setGameNameManuallyModified(true);
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const handleCreateGame = async () => {
    // Clear previous errors
    setFormErrors({});
    setCreationError(null);

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Game name is required';
    if (!formData.opponent.trim()) errors.opponent = 'Opponent is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.teamId) errors.teamId = 'Team is required';
    // Season and Game Type are now optional

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createGame({
        name: formData.name,
        opponent: formData.opponent,
        date: new Date(formData.date),
        teamId: formData.teamId,
        seasonId: formData.seasonId || undefined,
        gameTypeId: formData.gameTypeId || undefined,
        isHomeGame: formData.homeAway === 'home',
      });

      toast({
        title: 'Game created successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form and close modal with smart defaults
      const defaults = getSmartDefaults();
      const currentDate = new Date().toISOString().split('T')[0];

      setFormData({
        name: generateGameName(
          defaults.seasonId,
          currentDate,
          defaults.gameTypeId
        ),
        opponent: '',
        date: currentDate,
        teamId: defaults.teamId,
        seasonId: defaults.seasonId,
        gameTypeId: defaults.gameTypeId,
        homeAway: 'home',
      });
      setFormErrors({});
      setCreationError(null);
      setGameNameManuallyModified(false); // Reset manual modification flag
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Creation failed';
      setCreationError(message);
    }
  };

  const handleGameAction = (game: PresentationGame) => {
    if (game.status === 'setup') {
      // Check if game has a lineup before starting
      if (!game.lineupId) {
        toast({
          title: 'Lineup Required',
          description: 'Please set up a lineup before starting the game.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Navigate to scoring page - the ScoringPage will handle starting the game
      navigate(`/scoring/${game.id}`, { state: { shouldStart: true } });
    } else if (game.status === 'in_progress') {
      navigate(`/scoring/${game.id}`);
    } else if (game.status === 'suspended') {
      navigate(`/scoring/${game.id}`, { state: { shouldResume: true } });
    } else if (game.status === 'completed') {
      // Navigate to results/stats page when implemented
      navigate('/stats', { state: { gameId: game.id } });
    }
  };

  const handleSetupLineup = async (game: PresentationGame) => {
    setSelectedGameForLineup(game);

    // Load players for the team
    try {
      const players = await loadPlayersForTeam(game.teamId);
      setPlayersForLineup(players as PresentationPlayer[]);
    } catch (error) {
      console.error('Failed to load players for team:', error);
      setPlayersForLineup([]);
    }

    onLineupModalOpen();
  };

  const handleLineupSave = async (lineupData: {
    gameId: string;
    battingOrder: Array<{
      battingOrder: number;
      playerId: string;
      defensivePosition: string;
    }>;
  }) => {
    try {
      console.log('Saving lineup:', lineupData);

      // Find the current game
      const currentGame = games.find((g) => g.id === lineupData.gameId);
      if (!currentGame) {
        throw new Error('Game not found');
      }

      // Create a lineup ID (for now, we'll use the game ID with a suffix)
      const lineupId = `lineup-${lineupData.gameId}-${Date.now()}`;

      // Extract player IDs and defensive positions from lineup data
      const playerIds = lineupData.battingOrder.map((item) => item.playerId);
      const defensivePositions = lineupData.battingOrder.map(
        (item) => item.defensivePosition
      );

      // Save lineup data to the repository first
      await saveLineup(
        lineupData.gameId,
        lineupId,
        playerIds,
        defensivePositions
      );

      // Save the lineup to the game using the store's saveLineup method
      await saveLineup(currentGame.id, lineupId, playerIds, defensivePositions);

      toast({
        title: 'Lineup saved successfully',
        description: 'Game is now ready to start!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reload games to reflect lineup changes
      loadGames();
      onLineupModalClose();
      setSelectedGameForLineup(null);
    } catch (error) {
      toast({
        title: 'Failed to save lineup',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleLineupModalClose = () => {
    onLineupModalClose();
    setSelectedGameForLineup(null);
    setPlayersForLineup([]);
  };

  const getStatusBadge = (status: PresentationGameStatus) => {
    const statusConfig = {
      setup: { colorScheme: 'yellow', label: 'Setup' },
      in_progress: { colorScheme: 'green', label: 'In Progress' },
      completed: { colorScheme: 'blue', label: 'Completed' },
      suspended: { colorScheme: 'red', label: 'Suspended' },
    };

    const config = statusConfig[status];
    return (
      <Badge colorScheme={config.colorScheme} fontSize="xs">
        {config.label}
      </Badge>
    );
  };

  const getActionButtons = (game: PresentationGame) => {
    if (game.status === 'setup') {
      return (
        <VStack spacing={2} align="stretch">
          {!game.lineupId ? (
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              leftIcon={<AddIcon />}
              onClick={() => handleSetupLineup(game)}
              data-testid="setup-lineup-button"
            >
              Setup Lineup
            </Button>
          ) : (
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => handleSetupLineup(game)}
              data-testid="view-edit-lineup-button"
            >
              View/Edit Lineup
            </Button>
          )}
          <Button
            size="sm"
            colorScheme="green"
            onClick={() => handleGameAction(game)}
            isDisabled={!game.lineupId}
            data-testid="start-game-button"
          >
            Start Game
          </Button>
        </VStack>
      );
    } else if (game.status === 'in_progress') {
      return (
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => handleGameAction(game)}
          data-testid="continue-game-button"
        >
          Continue Game
        </Button>
      );
    } else if (game.status === 'suspended') {
      return (
        <Button
          size="sm"
          colorScheme="orange"
          onClick={() => handleGameAction(game)}
          data-testid="resume-game-button"
        >
          Resume Game
        </Button>
      );
    } else if (game.status === 'completed') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleGameAction(game)}
        >
          View Results
        </Button>
      );
    }
    return null;
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
    <Box p={6} role="main" aria-label="Games Management Page">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading as="h1" size="lg">
            Games
          </Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onOpen}
            aria-label="Create new game"
            data-testid="create-game-button"
          >
            Create Game
          </Button>
        </HStack>

        {/* Error Alert */}
        {error && (
          <Alert status="error" role="alert">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                data-testid="retry-button"
                onClick={() => {
                  clearError();
                  loadGames();
                }}
              >
                Retry
              </Button>
              <CloseButton onClick={clearError} />
            </HStack>
          </Alert>
        )}

        {/* Search and Filters */}
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search games"
            />
          </InputGroup>
        </HStack>

        {/* Status Filter Tabs */}
        <Tabs
          onChange={(index) => {
            const statuses: (PresentationGameStatus | 'all')[] = [
              'all',
              'setup',
              'in_progress',
              'completed',
            ];
            const selectedStatus = statuses[index];
            if (selectedStatus === 'all') {
              filterGamesByStatus('all');
            } else {
              filterGamesByStatus(
                GameMapper.statusFromPresentation(selectedStatus)
              );
            }
          }}
        >
          <TabList>
            <Tab>All</Tab>
            <Tab>Setup</Tab>
            <Tab>In Progress</Tab>
            <Tab>Completed</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {/* Games Grid */}
              {games.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500" mb={2}>
                    No games found
                  </Text>
                  <Text color="gray.400">
                    Create your first game to get started
                  </Text>
                </Box>
              ) : (
                <Grid
                  templateColumns={{
                    base: '1fr',
                    md: 'repeat(auto-fill, minmax(300px, 1fr))',
                  }}
                  gap={4}
                  data-testid="games-grid"
                >
                  {games.map((game) => (
                    <Card
                      key={game.id}
                      data-testid={`game-${game.name.toLowerCase().replace(/\s+/g, '-')}`}
                      role="article"
                      aria-label={`Game: ${game.name}`}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="md">
                              {game.name}
                            </Text>
                            {getStatusBadge(game.status)}
                          </HStack>

                          <Text fontSize="sm" color="gray.600">
                            {game.getVenueText()} {game.opponent}
                          </Text>

                          <Text fontSize="sm" color="gray.500">
                            {game.date.toLocaleDateString()}
                          </Text>

                          {game.finalScore && (
                            <Text fontSize="sm" fontWeight="medium">
                              {game.finalScore.homeScore} -{' '}
                              {game.finalScore.awayScore}
                            </Text>
                          )}

                          <Box>{getActionButtons(game)}</Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              )}
            </TabPanel>
            {/* Other tab panels would filter by status */}
            <TabPanel px={0}>Content for Setup games</TabPanel>
            <TabPanel px={0}>Content for In Progress games</TabPanel>
            <TabPanel px={0}>Content for Completed games</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Create Game Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        data-testid="create-game-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader as="h2">Create New Game</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Creation Error Alert */}
              {creationError && (
                <Alert status="error" role="alert">
                  <AlertIcon />
                  <AlertDescription>{creationError}</AlertDescription>
                </Alert>
              )}
              <FormControl isInvalid={!!formErrors.name}>
                <FormLabel>Game Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleGameNameChange(e.target.value)}
                  aria-label="Game name"
                  data-testid="game-name-input"
                />
                {formErrors.name && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.name}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.opponent}>
                <FormLabel>Opponent</FormLabel>
                <Input
                  value={formData.opponent}
                  onChange={(e) =>
                    handleFieldChange('opponent', e.target.value)
                  }
                  aria-label="Opponent"
                  data-testid="opponent-input"
                />
                {formErrors.opponent && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.opponent}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.date}>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  aria-label="Date"
                  data-testid="game-date-input"
                />
                {formErrors.date && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.date}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.teamId}>
                <FormLabel>Team</FormLabel>
                <Select
                  value={formData.teamId}
                  onChange={(e) => handleFieldChange('teamId', e.target.value)}
                  aria-label="Team"
                  data-testid="team-select"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
                {formErrors.teamId && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.teamId}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.seasonId}>
                <FormLabel>Season</FormLabel>
                <Select
                  value={formData.seasonId}
                  onChange={(e) =>
                    handleFieldChange('seasonId', e.target.value)
                  }
                  aria-label="Season"
                  data-testid="season-select"
                >
                  <option value="">Select a season</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </Select>
                {formErrors.seasonId && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.seasonId}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.gameTypeId}>
                <FormLabel>Game Type</FormLabel>
                <Select
                  value={formData.gameTypeId}
                  onChange={(e) =>
                    handleFieldChange('gameTypeId', e.target.value)
                  }
                  aria-label="Game type"
                  data-testid="game-type-select"
                >
                  <option value="">Select a game type</option>
                  {gameTypes.map((gameType) => (
                    <option key={gameType.id} value={gameType.id}>
                      {gameType.name}
                    </option>
                  ))}
                </Select>
                {formErrors.gameTypeId && (
                  <Text color="red.500" fontSize="sm">
                    {formErrors.gameTypeId}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Home/Away</FormLabel>
                <Select
                  data-testid="home-away-select"
                  value={formData.homeAway}
                  onChange={(e) =>
                    handleFieldChange('homeAway', e.target.value)
                  }
                  aria-label="Home/away"
                >
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateGame}
              isLoading={loading}
              data-testid="confirm-create-game"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lineup Setup Modal */}
      {selectedGameForLineup && (
        <LineupSetupModal
          isOpen={isLineupModalOpen}
          onClose={handleLineupModalClose}
          onSave={handleLineupSave}
          game={selectedGameForLineup as any} // TODO: Refactor LineupSetupModal to use PresentationGame instead of Game
          team={
            (teams.find((t) => t.id === selectedGameForLineup.teamId) ||
              teams[0] || {
                id: '',
                name: 'Unknown Team',
                seasonIds: [],
                playerIds: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              }) as any // TODO: Refactor LineupSetupModal to use TeamDto instead of Team
          }
          players={playersForLineup as any} // TODO: Refactor LineupSetupModal to use PresentationPlayer[] instead of Player[]
        />
      )}
    </Box>
  );
}
