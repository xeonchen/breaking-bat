import { useEffect, useState } from 'react';
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
import { Game, GameStatus } from '@/domain';

export default function GamePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    opponent: '',
    date: '',
    teamId: '',
    seasonId: '',
    gameTypeId: '',
    homeAway: 'home' as 'home' | 'away',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creationError, setCreationError] = useState<string | null>(null);

  // Store hooks
  const {
    games,
    seasons,
    gameTypes,
    teams,
    loading,
    error,
    loadGames,
    loadSeasons,
    loadGameTypes,
    loadTeams,
    createGame,
    searchGames,
    filterGamesByStatus,
    clearError,
  } = useGamesStore();

  // Load data on mount
  useEffect(() => {
    loadGames();
    loadSeasons();
    loadGameTypes();
    loadTeams();
  }, [loadGames, loadSeasons, loadGameTypes, loadTeams]);

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
    if (!formData.seasonId) errors.seasonId = 'Season is required';
    if (!formData.gameTypeId) errors.gameTypeId = 'Game type is required';

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
        seasonId: formData.seasonId,
        gameTypeId: formData.gameTypeId,
        homeAway: formData.homeAway,
      });

      toast({
        title: 'Game created successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form and close modal
      setFormData({
        name: '',
        opponent: '',
        date: '',
        teamId: '',
        seasonId: '',
        gameTypeId: '',
        homeAway: 'home',
      });
      setFormErrors({});
      setCreationError(null);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Creation failed';
      setCreationError(message);
    }
  };

  const handleGameAction = (game: Game) => {
    if (game.status === 'setup') {
      navigate('/scoring', { state: { gameId: game.id } });
    } else if (game.status === 'in_progress') {
      navigate('/scoring', { state: { gameId: game.id } });
    }
    // For completed games, could navigate to results page
  };

  const getStatusBadge = (status: GameStatus) => {
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

  const getActionButton = (game: Game) => {
    if (game.status === 'setup') {
      return (
        <Button
          size="sm"
          colorScheme="green"
          onClick={() => handleGameAction(game)}
        >
          Start Game
        </Button>
      );
    } else if (game.status === 'in_progress') {
      return (
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => handleGameAction(game)}
        >
          Continue Game
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
            const statuses: (GameStatus | 'all')[] = [
              'all',
              'setup',
              'in_progress',
              'completed',
            ];
            filterGamesByStatus(statuses[index]);
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
                      data-testid={`game-card-${game.id}`}
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

                          <Box>{getActionButton(game)}</Box>
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
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                    setFormData({ ...formData, opponent: e.target.value })
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
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, teamId: e.target.value })
                  }
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
                    setFormData({ ...formData, seasonId: e.target.value })
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
                    setFormData({ ...formData, gameTypeId: e.target.value })
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
                  value={formData.homeAway}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      homeAway: e.target.value as 'home' | 'away',
                    })
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
    </Box>
  );
}
