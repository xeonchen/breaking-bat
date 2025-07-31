import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Select,
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
  Badge,
  Checkbox,
  useColorModeValue,
  Grid,
  GridItem,
  Tooltip,
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  ViewOffIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { useState, useMemo, useCallback } from 'react';
import { Position } from '@/domain';

interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  positions: Position[];
  isActive: boolean;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface PlayerStats {
  avg: number;
  hits: number;
  atBats: number;
  rbi: number;
}

interface TeamManagementProps {
  team: Team;
  playerStats: Record<string, PlayerStats>;
  onPlayerAdd: (player: Omit<Player, 'id'>) => void;
  onPlayerEdit: (playerId: string, player: Player) => void;
  onPlayerRemove: (playerId: string) => void;
  onTeamEdit: (team: Team) => void;
  isEditable?: boolean;
  isMobile?: boolean;
  showStats?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableSorting?: boolean;
  enableBulkOperations?: boolean;
}

const POSITION_OPTIONS = [
  { value: 'pitcher', label: 'Pitcher (P)' },
  { value: 'catcher', label: 'Catcher (C)' },
  { value: 'first-base', label: 'First Base (1B)' },
  { value: 'second-base', label: 'Second Base (2B)' },
  { value: 'third-base', label: 'Third Base (3B)' },
  { value: 'shortstop', label: 'Shortstop (SS)' },
  { value: 'left-field', label: 'Left Field (LF)' },
  { value: 'center-field', label: 'Center Field (CF)' },
  { value: 'right-field', label: 'Right Field (RF)' },
];

const POSITION_ABBREVIATIONS: Record<string, string> = {
  pitcher: 'P',
  catcher: 'C',
  'first-base': '1B',
  'second-base': '2B',
  'third-base': '3B',
  shortstop: 'SS',
  'left-field': 'LF',
  'center-field': 'CF',
  'right-field': 'RF',
};

export function TeamManagement({
  team,
  playerStats,
  onPlayerAdd,
  onPlayerEdit,
  onPlayerRemove,
  onTeamEdit,
  isEditable = false,
  isMobile = false,
  showStats: initialShowStats = false,
  enableSearch = false,
  enableFilters = false,
  enableSorting = false,
  enableBulkOperations = false,
}: TeamManagementProps): JSX.Element {
  const [showStats, setShowStats] = useState(initialShowStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set()
  );
  const [validationError, setValidationError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Modal states
  const {
    isOpen: isTeamEditOpen,
    onOpen: onTeamEditOpen,
    onClose: onTeamEditClose,
  } = useDisclosure();
  const {
    isOpen: isPlayerAddOpen,
    onOpen: onPlayerAddOpen,
    onClose: onPlayerAddClose,
  } = useDisclosure();
  const {
    isOpen: isPlayerEditOpen,
    onOpen: onPlayerEditOpen,
    onClose: onPlayerEditClose,
  } = useDisclosure();
  const {
    isOpen: isRemoveModalOpen,
    onOpen: onRemoveModalOpen,
    onClose: onRemoveModalClose,
  } = useDisclosure();

  // Form states
  const [teamName, setTeamName] = useState(team.name);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    jerseyNumber: '',
    position: 'pitcher', // Keep as single for form simplicity
    isActive: true,
  });
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = team.players.filter((player) => {
      const matchesSearch =
        searchTerm === '' ||
        player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition =
        positionFilter === 'all' ||
        player.positions.some((p) => p.value === positionFilter);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && player.isActive) ||
        (statusFilter === 'inactive' && !player.isActive);

      return matchesSearch && matchesPosition && matchesStatus;
    });

    // Sort players
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          return a.name.localeCompare(b.name);
        }
        case 'jersey': {
          return parseInt(a.jerseyNumber) - parseInt(b.jerseyNumber);
        }
        case 'average': {
          const avgA = playerStats[a.id]?.avg || 0;
          const avgB = playerStats[b.id]?.avg || 0;
          return avgB - avgA; // Descending order
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    team.players,
    searchTerm,
    positionFilter,
    statusFilter,
    sortBy,
    playerStats,
  ]);

  const validatePlayerForm = useCallback((): boolean => {
    setValidationError('');

    if (!playerForm.name.trim()) {
      setValidationError('Name is required');
      return false;
    }

    if (!playerForm.jerseyNumber.trim()) {
      setValidationError('Jersey number is required');
      return false;
    }

    // Check for duplicate jersey numbers
    const existingPlayer = team.players.find(
      (p) =>
        p.jerseyNumber === playerForm.jerseyNumber && p.id !== editingPlayerId
    );
    if (existingPlayer) {
      setValidationError(
        `Jersey number ${playerForm.jerseyNumber} is already in use`
      );
      return false;
    }

    return true;
  }, [playerForm, team.players, editingPlayerId]);

  const handleTeamEdit = useCallback(async () => {
    try {
      const updatedTeam = { ...team, name: teamName };
      await onTeamEdit(updatedTeam);
      onTeamEditClose();
    } catch {
      setErrorMessage('Failed to update team. Please try again.');
    }
  }, [team, teamName, onTeamEdit, onTeamEditClose]);

  const handlePlayerAdd = useCallback(async () => {
    if (!validatePlayerForm()) return;

    try {
      const newPlayer = {
        name: playerForm.name,
        jerseyNumber: playerForm.jerseyNumber,
        positions: playerForm.position
          ? [Position.fromValue(playerForm.position)]
          : [Position.extraPlayer()],
        isActive: playerForm.isActive,
      };

      await onPlayerAdd(newPlayer);
      setPlayerForm({
        name: '',
        jerseyNumber: '',
        position: 'pitcher',
        isActive: true,
      });
      onPlayerAddClose();
    } catch {
      setErrorMessage('Failed to add player. Please try again.');
    }
  }, [playerForm, validatePlayerForm, onPlayerAdd, onPlayerAddClose]);

  const handlePlayerEdit = useCallback(async () => {
    if (!editingPlayerId || !validatePlayerForm()) return;

    try {
      const updatedPlayer = {
        id: editingPlayerId,
        name: playerForm.name,
        jerseyNumber: playerForm.jerseyNumber,
        positions: playerForm.position
          ? [Position.fromValue(playerForm.position)]
          : [Position.extraPlayer()],
        isActive: playerForm.isActive,
      };

      await onPlayerEdit(editingPlayerId, updatedPlayer);
      setEditingPlayerId(null);
      setPlayerForm({
        name: '',
        jerseyNumber: '',
        position: 'pitcher',
        isActive: true,
      });
      onPlayerEditClose();
    } catch {
      setErrorMessage('Failed to update player. Please try again.');
    }
  }, [
    editingPlayerId,
    playerForm,
    validatePlayerForm,
    onPlayerEdit,
    onPlayerEditClose,
  ]);

  const handlePlayerRemove = useCallback(async () => {
    if (!removingPlayerId) return;

    try {
      await onPlayerRemove(removingPlayerId);
      setRemovingPlayerId(null);
      onRemoveModalClose();
    } catch {
      setErrorMessage('Failed to remove player. Please try again.');
    }
  }, [removingPlayerId, onPlayerRemove, onRemoveModalClose]);

  const handleTogglePlayerStatus = useCallback(
    async (playerId: string) => {
      const player = team.players.find((p) => p.id === playerId);
      if (!player) return;

      try {
        const updatedPlayer = { ...player, isActive: !player.isActive };
        await onPlayerEdit(playerId, updatedPlayer);
        setStatusMessage('Player status updated');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch {
        setErrorMessage('Failed to update player status. Please try again.');
      }
    },
    [team.players, onPlayerEdit]
  );

  const openEditModal = useCallback(
    (player: Player) => {
      setEditingPlayerId(player.id);
      setPlayerForm({
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        position: player.positions[0]?.value || 'extra-player', // Use first position for form
        isActive: player.isActive,
      });
      onPlayerEditOpen();
    },
    [onPlayerEditOpen]
  );

  const openRemoveModal = useCallback(
    (playerId: string) => {
      setRemovingPlayerId(playerId);
      onRemoveModalOpen();
    },
    [onRemoveModalOpen]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedPlayers.size === filteredAndSortedPlayers.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(filteredAndSortedPlayers.map((p) => p.id)));
    }
  }, [selectedPlayers.size, filteredAndSortedPlayers]);

  const handleBulkSetActive = useCallback(async () => {
    try {
      const promises = Array.from(selectedPlayers).map((playerId) => {
        const player = team.players.find((p) => p.id === playerId);
        if (player) {
          return onPlayerEdit(playerId, { ...player, isActive: true });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      setSelectedPlayers(new Set());
    } catch {
      setErrorMessage('Failed to update players. Please try again.');
    }
  }, [selectedPlayers, team.players, onPlayerEdit]);

  const removingPlayer = team.players.find((p) => p.id === removingPlayerId);

  return (
    <Box
      data-testid="team-management"
      role="main"
      aria-label="Team Management"
      className={isMobile ? 'mobile-layout' : ''}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <VStack spacing={6} align="stretch">
        {/* Team Header */}
        <HStack justify="space-between" data-testid="team-header">
          <Text fontSize="2xl" fontWeight="bold">
            {team.name}
          </Text>
          {isEditable && (
            <Button
              data-testid="edit-team-button"
              leftIcon={<EditIcon />}
              variant="outline"
              size="sm"
              onClick={onTeamEditOpen}
            >
              Edit Team
            </Button>
          )}
        </HStack>

        {/* Controls */}
        <HStack justify="space-between" wrap="wrap" spacing={4}>
          {/* Search */}
          {enableSearch && (
            <Input
              data-testid="player-search-input"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxW="300px"
            />
          )}

          {/* Filters */}
          {enableFilters && (
            <HStack spacing={2}>
              <Select
                data-testid="position-filter-select"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                size="sm"
                maxW="150px"
              >
                <option value="all">All Positions</option>
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                data-testid="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
                maxW="120px"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </HStack>
          )}

          {/* Sorting */}
          {enableSorting && (
            <Select
              data-testid="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="sm"
              maxW="150px"
            >
              <option value="name">Sort by Name</option>
              <option value="jersey">Sort by Jersey</option>
              {showStats && <option value="average">Sort by Average</option>}
            </Select>
          )}

          {/* Stats Toggle */}
          <HStack>
            <Text fontSize="sm">Stats:</Text>
            <Button
              data-testid="toggle-stats-button"
              size="sm"
              variant="ghost"
              leftIcon={showStats ? <ViewOffIcon /> : <ViewIcon />}
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Hide' : 'Show'}
            </Button>
          </HStack>

          {/* Add Player */}
          {isEditable && (
            <Button
              data-testid="add-player-button"
              leftIcon={<AddIcon />}
              colorScheme="blue"
              size="sm"
              onClick={onPlayerAddOpen}
              tabIndex={0}
            >
              Add Player
            </Button>
          )}
        </HStack>

        {/* Bulk Operations */}
        {enableBulkOperations && isEditable && (
          <HStack spacing={4}>
            <Checkbox
              data-testid="select-all-players"
              isChecked={
                selectedPlayers.size === filteredAndSortedPlayers.length &&
                filteredAndSortedPlayers.length > 0
              }
              isIndeterminate={
                selectedPlayers.size > 0 &&
                selectedPlayers.size < filteredAndSortedPlayers.length
              }
              onChange={handleSelectAll}
            >
              Select All
            </Checkbox>
            {selectedPlayers.size > 0 && (
              <HStack data-testid="bulk-actions-bar" spacing={2}>
                <Button
                  data-testid="bulk-set-active"
                  size="sm"
                  colorScheme="green"
                  onClick={handleBulkSetActive}
                >
                  Set Active ({selectedPlayers.size})
                </Button>
              </HStack>
            )}
          </HStack>
        )}

        {/* Error Messages */}
        {errorMessage && (
          <Alert status="error" data-testid="error-message">
            <AlertIcon />
            {errorMessage}
          </Alert>
        )}

        {/* Status Messages */}
        {statusMessage && (
          <Text
            data-testid="status-message"
            aria-live="polite"
            color="green.500"
            fontSize="sm"
          >
            {statusMessage}
          </Text>
        )}

        {/* Team Roster */}
        {team.players.length === 0 ? (
          <Box data-testid="empty-roster-message" textAlign="center" py={8}>
            <Text color={mutedColor}>No players on the roster</Text>
          </Box>
        ) : (
          <VStack
            data-testid="team-roster"
            role="list"
            aria-label="Team Roster"
            spacing={3}
            align="stretch"
          >
            {filteredAndSortedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                stats={playerStats[player.id]}
                showStats={showStats && !isMobile}
                isEditable={isEditable}
                isMobile={isMobile}
                isSelected={selectedPlayers.has(player.id)}
                onEdit={() => openEditModal(player)}
                onRemove={() => openRemoveModal(player.id)}
                onToggleStatus={() => handleTogglePlayerStatus(player.id)}
                onSelect={(selected) => {
                  const newSelected = new Set(selectedPlayers);
                  if (selected) {
                    newSelected.add(player.id);
                  } else {
                    newSelected.delete(player.id);
                  }
                  setSelectedPlayers(newSelected);
                }}
                enableBulkOperations={enableBulkOperations && isEditable}
              />
            ))}
          </VStack>
        )}
      </VStack>

      {/* Team Edit Modal */}
      <Modal isOpen={isTeamEditOpen} onClose={onTeamEditClose}>
        <ModalOverlay />
        <ModalContent data-testid="team-edit-modal">
          <ModalHeader>Edit Team</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Team Name</FormLabel>
              <Input
                data-testid="team-name-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onTeamEditClose}>
              Cancel
            </Button>
            <Button
              data-testid="save-team-button"
              colorScheme="blue"
              onClick={handleTeamEdit}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Player Add Modal */}
      <Modal isOpen={isPlayerAddOpen} onClose={onPlayerAddClose}>
        <ModalOverlay />
        <ModalContent data-testid="player-add-modal">
          <ModalHeader>Add Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={validationError.includes('Name')}>
                <FormLabel>Name</FormLabel>
                <Input
                  data-testid="player-name-input"
                  value={playerForm.name}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, name: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isInvalid={validationError.includes('Jersey')}>
                <FormLabel>Jersey Number</FormLabel>
                <Input
                  data-testid="player-jersey-input"
                  value={playerForm.jerseyNumber}
                  onChange={(e) =>
                    setPlayerForm({
                      ...playerForm,
                      jerseyNumber: e.target.value,
                    })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Position</FormLabel>
                <Select
                  data-testid="player-position-select"
                  value={playerForm.position}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, position: e.target.value })
                  }
                >
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {validationError && (
                <Alert status="error" data-testid="validation-error">
                  <AlertIcon />
                  {validationError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onPlayerAddClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-add-player"
              colorScheme="blue"
              onClick={handlePlayerAdd}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Player Edit Modal */}
      <Modal isOpen={isPlayerEditOpen} onClose={onPlayerEditClose}>
        <ModalOverlay />
        <ModalContent data-testid="player-edit-modal">
          <ModalHeader>Edit Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={validationError.includes('Name')}>
                <FormLabel>Name</FormLabel>
                <Input
                  data-testid="player-name-input"
                  value={playerForm.name}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, name: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isInvalid={validationError.includes('Jersey')}>
                <FormLabel>Jersey Number</FormLabel>
                <Input
                  data-testid="player-jersey-input"
                  value={playerForm.jerseyNumber}
                  onChange={(e) =>
                    setPlayerForm({
                      ...playerForm,
                      jerseyNumber: e.target.value,
                    })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Position</FormLabel>
                <Select
                  data-testid="player-position-select"
                  value={playerForm.position}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, position: e.target.value })
                  }
                >
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {validationError && (
                <Alert status="error" data-testid="validation-error">
                  <AlertIcon />
                  {validationError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onPlayerEditClose}>
              Cancel
            </Button>
            <Button
              data-testid="save-player-button"
              colorScheme="blue"
              onClick={handlePlayerEdit}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Player Modal */}
      <Modal isOpen={isRemoveModalOpen} onClose={onRemoveModalClose}>
        <ModalOverlay />
        <ModalContent data-testid="remove-player-modal">
          <ModalHeader>Remove Player</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {removingPlayer && (
              <Text>
                Are you sure you want to remove {removingPlayer.name} from the
                team?
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onRemoveModalClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-remove-button"
              colorScheme="red"
              onClick={handlePlayerRemove}
            >
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

interface PlayerCardProps {
  player: Player;
  stats?: PlayerStats;
  showStats: boolean;
  isEditable: boolean;
  isMobile: boolean;
  isSelected: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleStatus: () => void;
  onSelect: (selected: boolean) => void;
  enableBulkOperations: boolean;
}

function PlayerCard({
  player,
  stats,
  showStats,
  isEditable,
  isMobile,
  isSelected,
  onEdit,
  onRemove,
  onToggleStatus,
  onSelect,
  enableBulkOperations,
}: PlayerCardProps): JSX.Element {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const gridColumns = enableBulkOperations
    ? isMobile
      ? 'auto 1fr auto'
      : 'auto auto 1fr auto auto auto'
    : isMobile
      ? '1fr auto'
      : 'auto 1fr auto auto auto';

  return (
    <Box
      data-testid={`player-${player.id}`}
      role="listitem"
      className={`${!player.isActive ? 'inactive-player' : ''} ${isMobile ? 'mobile-compact' : ''}`}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      opacity={player.isActive ? 1 : 0.7}
    >
      <Grid templateColumns={gridColumns} gap={4} alignItems="center">
        {/* Bulk Selection */}
        {enableBulkOperations && (
          <GridItem>
            <Checkbox
              data-testid={`select-player-${player.id}`}
              isChecked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
            />
          </GridItem>
        )}

        {/* Player Info */}
        <GridItem>
          <VStack align="start" spacing={1}>
            <HStack>
              <Text fontWeight="bold">{player.name}</Text>
              <Text color="gray.500">#{player.jerseyNumber}</Text>
              {player.positions.map((pos) => (
                <Badge key={pos.value} mr={1}>
                  {POSITION_ABBREVIATIONS[pos.value]}
                </Badge>
              ))}
              {!player.isActive && (
                <Badge colorScheme="red" variant="outline">
                  Inactive
                </Badge>
              )}
            </HStack>
            {showStats && stats ? (
              <HStack spacing={4} fontSize="sm">
                <Text>{stats.avg.toFixed(3)}</Text>
                <Text>
                  {stats.hits}-{stats.atBats}
                </Text>
                <Text>{stats.rbi} RBI</Text>
              </HStack>
            ) : showStats ? (
              <Text fontSize="sm" color="gray.500">
                No stats
              </Text>
            ) : null}
          </VStack>
        </GridItem>

        {/* Actions */}
        {isEditable && (
          <>
            <GridItem>
              <Tooltip label="Edit Player">
                <IconButton
                  data-testid={`edit-player-${player.id}`}
                  aria-label="Edit player"
                  icon={<EditIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  tabIndex={0}
                />
              </Tooltip>
            </GridItem>
            <GridItem>
              <Tooltip label="Remove Player">
                <IconButton
                  data-testid={`remove-player-${player.id}`}
                  aria-label="Remove player"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={onRemove}
                />
              </Tooltip>
            </GridItem>
            <GridItem>
              <Tooltip label={player.isActive ? 'Set Inactive' : 'Set Active'}>
                <IconButton
                  data-testid={`toggle-active-${player.id}`}
                  aria-label="Toggle player status"
                  icon={player.isActive ? <CloseIcon /> : <CheckIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme={player.isActive ? 'red' : 'green'}
                  onClick={onToggleStatus}
                />
              </Tooltip>
            </GridItem>
          </>
        )}
      </Grid>
    </Box>
  );
}
