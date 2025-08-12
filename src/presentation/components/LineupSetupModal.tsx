import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Box,
  useColorModeValue,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { Game, Team, Player } from '../../domain/entities';
import { LineupValidator } from '../../domain/services/LineupValidator';

interface LineupSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lineupData: {
    gameId: string;
    startingPositionCount: number;
    battingOrder: Array<{
      battingOrder: number;
      playerId: string;
      defensivePosition: string;
    }>;
  }) => void;
  game: Game;
  team: Team;
  players: Player[];
}

interface LineupPosition {
  battingOrder: number;
  playerId: string | null;
  defensivePosition: string | null;
}

const DEFENSIVE_POSITIONS = [
  { value: 'Pitcher', label: 'Pitcher (P)' },
  { value: 'Catcher', label: 'Catcher (C)' },
  { value: 'First Base', label: 'First Base (1B)' },
  { value: 'Second Base', label: 'Second Base (2B)' },
  { value: 'Third Base', label: 'Third Base (3B)' },
  { value: 'Shortstop', label: 'Shortstop (SS)' },
  { value: 'Left Field', label: 'Left Field (LF)' },
  { value: 'Center Field', label: 'Center Field (CF)' },
  { value: 'Right Field', label: 'Right Field (RF)' },
  { value: 'Short Fielder', label: 'Short Fielder (SF)' },
  { value: 'Extra Player', label: 'Extra Player (EP)' },
];

export const LineupSetupModal: React.FC<LineupSetupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  game,
  players,
}) => {
  const [lineupPositions, setLineupPositions] = useState<LineupPosition[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [startingPositionCount, setStartingPositionCount] =
    useState<number>(10);

  // Create a unique key for this game's draft lineup
  const draftKey = `lineup-draft-${game.id}`;

  const validator = useMemo(() => new LineupValidator(), []);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Helper function to get smart-ordered positions for a player
  const getSmartOrderedPositions = (playerId: string | null) => {
    if (!playerId) return DEFENSIVE_POSITIONS;

    const player = players.find((p) => p.id === playerId);
    if (!player) return DEFENSIVE_POSITIONS;

    // Get player's available positions and preserve their order
    const playerPosOptions: Array<{ value: string; label: string }> = [];
    const otherPosOptions: Array<{ value: string; label: string }> = [];

    // First, add player positions in the order they appear in the player's positions array
    player.positions.forEach((pos) => {
      const posFullName = pos.getFullName();
      const matchingDefPos = DEFENSIVE_POSITIONS.find(
        (defPos) => defPos.value === posFullName
      );
      if (matchingDefPos) {
        playerPosOptions.push(matchingDefPos);
      }
    });

    // Then, add all other positions that the player doesn't have
    const playerPositionValues = player.positions.map((pos) =>
      pos.getFullName()
    );
    DEFENSIVE_POSITIONS.forEach((pos) => {
      if (!playerPositionValues.includes(pos.value)) {
        otherPosOptions.push(pos);
      }
    });

    // Return player positions first (in their original order), then others
    return [...playerPosOptions, ...otherPosOptions];
  };

  // Initialize lineup positions when modal opens
  useEffect(() => {
    if (isOpen && players.length > 0 && lineupPositions.length === 0) {
      // Try to load draft from sessionStorage first
      const savedDraft = sessionStorage.getItem(draftKey);

      let initialPositions: LineupPosition[];

      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Validate that saved draft matches current player count
          if (parsed.length === players.length) {
            initialPositions = parsed;
          } else {
            // Player count changed, recreate with auto-assignment
            initialPositions = createDefaultPositions();
          }
        } catch {
          // If parsing fails, create default positions
          initialPositions = createDefaultPositions();
        }
      } else {
        initialPositions = createDefaultPositions();
      }

      setLineupPositions(initialPositions);
    }
  }, [isOpen, players.length, lineupPositions.length, draftKey]);

  // Helper function to create default positions with all players auto-assigned
  const createDefaultPositions = (): LineupPosition[] => {
    const positions: LineupPosition[] = [];
    const playerCount = players.length;

    // Create slots equal to the number of players
    for (let i = 1; i <= playerCount; i++) {
      const player = players[i - 1]; // Get player for this position
      // Map position value to display format expected by DEFENSIVE_POSITIONS
      let defaultPosition = null;
      if (player) {
        const positionValue = player.getDefaultPosition().value;
        const positionMap: Record<string, string> = {
          pitcher: 'Pitcher',
          catcher: 'Catcher',
          'first-base': 'First Base',
          'second-base': 'Second Base',
          'third-base': 'Third Base',
          shortstop: 'Shortstop',
          'left-field': 'Left Field',
          'center-field': 'Center Field',
          'right-field': 'Right Field',
          'short-fielder': 'Short Fielder',
          'extra-player': 'Extra Player',
        };
        defaultPosition = positionMap[positionValue] || null;
      }

      positions.push({
        battingOrder: i,
        playerId: player ? player.id : null,
        defensivePosition: defaultPosition,
      });
    }
    return positions;
  };

  // State to track displaced players when positions are reduced
  const [displacedPlayers, setDisplacedPlayers] = useState<
    Array<{
      player: Player;
      originalPosition: number;
    }>
  >([]);

  // State to track manually assigned positions (AC024: don't override manual changes)
  const [manualPositionAssignments, setManualPositionAssignments] = useState<
    Set<number>
  >(new Set());

  // Handle starting position count changes - adjust lineup positions array size
  useEffect(() => {
    if (lineupPositions.length > 0) {
      const currentMaxPositions = Math.max(
        startingPositionCount,
        players.length
      );

      if (lineupPositions.length !== currentMaxPositions) {
        const newPositions = [...lineupPositions];

        if (currentMaxPositions > lineupPositions.length) {
          // Add empty positions if we need more slots
          for (
            let i = lineupPositions.length + 1;
            i <= currentMaxPositions;
            i++
          ) {
            newPositions.push({
              battingOrder: i,
              playerId: null,
              defensivePosition: null,
            });
          }
        } else if (currentMaxPositions < lineupPositions.length) {
          // Before removing positions, save displaced players
          const displaced = lineupPositions
            .slice(currentMaxPositions)
            .filter((pos) => pos.playerId)
            .map((pos) => {
              const player = players.find((p) => p.id === pos.playerId);
              return player
                ? {
                    player,
                    originalPosition: pos.battingOrder,
                  }
                : null;
            })
            .filter(Boolean) as Array<{
            player: Player;
            originalPosition: number;
          }>;

          setDisplacedPlayers(displaced);

          // Remove excess positions
          newPositions.splice(currentMaxPositions);
        }

        setLineupPositions(newPositions);
      }
    }
  }, [startingPositionCount, players.length, lineupPositions.length, players]);

  // Save draft to sessionStorage whenever positions change
  useEffect(() => {
    if (lineupPositions.length > 0) {
      sessionStorage.setItem(draftKey, JSON.stringify(lineupPositions));
    }
  }, [lineupPositions, draftKey]);

  // Validate lineup in real-time
  useEffect(() => {
    if (lineupPositions.length === 0) return;

    // Only validate starting lineup positions for duplicates
    const startingPositions = lineupPositions.slice(0, startingPositionCount);
    const filledStartingPositions = startingPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    );

    if (filledStartingPositions.length === 0) {
      setValidationErrors([]);
      return;
    }

    setIsValidating(true);

    // Use partial validation for real-time feedback - only on starting lineup
    const result = validator.validatePartial(startingPositions, players);
    setValidationErrors(result.errors);
    setIsValidating(false);
  }, [lineupPositions, players, validator, startingPositionCount]);

  const handlePlayerChange = (battingOrder: number, playerId: string) => {
    // When player changes, clear manual position assignment and position for that slot
    // This allows auto-fill to work on reassigned players
    setManualPositionAssignments((prev) => {
      const newSet = new Set(prev);
      newSet.delete(battingOrder);
      return newSet;
    });

    // AC013: Pre-select player's default position when assigned
    let defaultPosition = null;
    if (playerId) {
      const player = players.find((p) => p.id === playerId);
      if (player) {
        const defaultPos = player.getDefaultPosition();
        const positionMap: Record<string, string> = {
          pitcher: 'Pitcher',
          catcher: 'Catcher',
          'first-base': 'First Base',
          'second-base': 'Second Base',
          'third-base': 'Third Base',
          shortstop: 'Shortstop',
          'left-field': 'Left Field',
          'center-field': 'Center Field',
          'right-field': 'Right Field',
          'short-fielder': 'Short Fielder',
          'extra-player': 'Extra Player',
        };
        defaultPosition = positionMap[defaultPos.value] || null;
      }
    }

    setLineupPositions((prev) =>
      prev.map((pos) => {
        // AC012: Graceful reassignment - if this player is already assigned elsewhere, clear that position
        if (
          playerId &&
          pos.playerId === playerId &&
          pos.battingOrder !== battingOrder
        ) {
          // Clear the previous assignment and manual position tracking
          setManualPositionAssignments((prevManual) => {
            const newSet = new Set(prevManual);
            newSet.delete(pos.battingOrder);
            return newSet;
          });
          return { ...pos, playerId: null, defensivePosition: null };
        }
        // Update the target position
        if (pos.battingOrder === battingOrder) {
          return {
            ...pos,
            playerId: playerId || null,
            defensivePosition: defaultPosition,
          };
        }
        return pos;
      })
    );
  };

  const handlePositionChange = (battingOrder: number, position: string) => {
    // Track manual position assignments
    if (position) {
      setManualPositionAssignments((prev) => new Set(prev).add(battingOrder));
    } else {
      setManualPositionAssignments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(battingOrder);
        return newSet;
      });
    }

    setLineupPositions((prev) =>
      prev.map((pos) =>
        pos.battingOrder === battingOrder
          ? { ...pos, defensivePosition: position || null }
          : pos
      )
    );
  };

  const handleSave = () => {
    const filledPositions = lineupPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    );

    // Validate complete lineup before saving
    if (filledPositions.length < Math.min(startingPositionCount, 9)) {
      setValidationErrors(['LINEUP_INCOMPLETE']);
      return;
    }

    // Create lineup data for save
    const battingOrder = filledPositions.map((pos) => ({
      battingOrder: pos.battingOrder,
      playerId: pos.playerId!,
      defensivePosition: pos.defensivePosition!,
    }));

    onSave({
      gameId: game.id,
      startingPositionCount,
      battingOrder,
    });

    // Clear the draft after successful save
    sessionStorage.removeItem(draftKey);

    onClose();
  };

  // AC021-AC024: Auto-fill functionality
  const handleAutoFillPositions = () => {
    setLineupPositions((prev) =>
      prev.map((pos) => {
        // Skip positions that were manually assigned (AC024)
        if (manualPositionAssignments.has(pos.battingOrder)) {
          return pos;
        }

        // Auto-fill default position for assigned players without positions
        if (pos.playerId && !pos.defensivePosition) {
          const player = players.find((p) => p.id === pos.playerId);
          if (player) {
            // Get default position in display format
            const defaultPos = player.getDefaultPosition();
            const positionMap: Record<string, string> = {
              pitcher: 'Pitcher',
              catcher: 'Catcher',
              'first-base': 'First Base',
              'second-base': 'Second Base',
              'third-base': 'Third Base',
              shortstop: 'Shortstop',
              'left-field': 'Left Field',
              'center-field': 'Center Field',
              'right-field': 'Right Field',
              'short-fielder': 'Short Fielder',
              'extra-player': 'Extra Player',
            };
            const displayPosition = positionMap[defaultPos.value] || null;
            return { ...pos, defensivePosition: displayPosition };
          }
        }
        return pos;
      })
    );
  };

  const getFilledPositionCount = () => {
    return lineupPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    ).length;
  };

  const isLineupComplete = () => {
    return (
      getFilledPositionCount() >= Math.min(startingPositionCount, 9) &&
      validationErrors.length === 0
    );
  };

  const getErrorMessage = (errorCode: string) => {
    const messages: Record<string, string> = {
      LINEUP_INCOMPLETE:
        'Lineup must have at least 9 batting positions and all defensive positions assigned',
      POSITION_DUPLICATE:
        'Each defensive position can only be assigned to one player',
      PLAYER_NOT_ON_TEAM: 'Selected player is not on the chosen team',
      NO_PLAYERS_AVAILABLE:
        'Selected team has no active players available for lineup',
      INSUFFICIENT_PLAYERS:
        'Team needs at least 9 active players to create a complete lineup',
    };
    return messages[errorCode] || 'Unknown validation error occurred';
  };

  // Get positions that have duplicates for highlighting
  const getDuplicatePositions = () => {
    // Only check starting lineup positions (not bench) for duplicates
    const startingPositions = lineupPositions
      .slice(0, startingPositionCount)
      .filter((pos) => pos.playerId && pos.defensivePosition);

    const positionCounts: Record<string, number> = {};
    startingPositions.forEach((pos) => {
      if (pos.defensivePosition) {
        positionCounts[pos.defensivePosition] =
          (positionCounts[pos.defensivePosition] || 0) + 1;
      }
    });

    // Extra Player (EP) can have duplicates, so exclude it from duplicate checking
    return Object.keys(positionCounts).filter(
      (position) => positionCounts[position] > 1 && position !== 'Extra Player'
    );
  };

  // Check if a specific position is duplicated (only for starting lineup)
  const isPositionDuplicated = (
    position: string | null,
    battingOrder: number
  ) => {
    if (!position) return false;
    // Only highlight duplicates in starting lineup, not bench
    if (battingOrder > startingPositionCount) return false;
    return getDuplicatePositions().includes(position);
  };

  // Handle insufficient players
  if (players.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent data-testid="lineup-setup-modal">
          <ModalHeader data-testid="modal-title">
            Setup Lineup for {game.name}
          </ModalHeader>
          <ModalCloseButton data-testid="close-modal-button" />
          <ModalBody>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>No players available!</AlertTitle>
                <AlertDescription>
                  Selected team has no active players available for lineup
                </AlertDescription>
              </Box>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  if (players.length < 9) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent data-testid="lineup-setup-modal">
          <ModalHeader data-testid="modal-title">
            Setup Lineup for {game.name}
          </ModalHeader>
          <ModalCloseButton data-testid="close-modal-button" />
          <ModalBody>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>Insufficient players!</AlertTitle>
                <AlertDescription>
                  Selected team has only {players.length} active players
                  available. A minimum of 9 players is required for a complete
                  lineup.
                </AlertDescription>
              </Box>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button
              data-testid="disabled-save-lineup-button"
              isDisabled
              onClick={onClose}
            >
              Save Lineup
            </Button>
            <Button onClick={onClose} ml={3}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent data-testid="lineup-setup-modal" maxW="4xl">
        <ModalHeader data-testid="modal-title">
          Setup Lineup for {game.name}
        </ModalHeader>
        <ModalCloseButton data-testid="close-modal-button" />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Starting Position Configuration */}
            <Box data-testid="starting-positions-config-container">
              <FormControl>
                <FormLabel htmlFor="starting-positions-config">
                  Number of Starting Positions (9-12)
                </FormLabel>
                <NumberInput
                  id="starting-positions-config"
                  data-testid="starting-positions-config"
                  value={startingPositionCount}
                  onChange={(_, valueAsNumber) => {
                    if (
                      !isNaN(valueAsNumber) &&
                      valueAsNumber >= 9 &&
                      valueAsNumber <= 12
                    ) {
                      setStartingPositionCount(valueAsNumber);
                    }
                  }}
                  min={9}
                  max={12}
                  defaultValue={10}
                  size="sm"
                  width="150px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Box>

            {/* Progress indicator */}
            <Box data-testid="lineup-progress-indicator">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  Lineup Progress: {getFilledPositionCount()}/9 minimum
                  positions filled
                </Text>
                <Badge
                  colorScheme={isLineupComplete() ? 'green' : 'yellow'}
                  variant="solid"
                  data-testid={
                    isLineupComplete()
                      ? 'lineup-complete-success'
                      : 'lineup-incomplete'
                  }
                >
                  {isLineupComplete() ? 'Complete' : 'Incomplete'}
                </Badge>
              </HStack>
            </Box>

            {/* AC021: Auto-fill positions button */}
            <Box>
              <Button
                data-testid="auto-fill-positions-button"
                onClick={handleAutoFillPositions}
                colorScheme="blue"
                variant="outline"
                size="sm"
                leftIcon={<span>⚡</span>}
              >
                Auto-Fill Default Positions
              </Button>
            </Box>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <Alert status="error" data-testid="lineup-validation-error">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  {validationErrors.map((error, index) => (
                    <Text key={index} fontSize="sm">
                      {getErrorMessage(error)}
                    </Text>
                  ))}
                </VStack>
              </Alert>
            )}

            {/* Position-specific errors */}
            {validationErrors.includes('POSITION_DUPLICATE') && (
              <Alert status="warning" data-testid="position-validation-error">
                <AlertIcon />
                <Text fontSize="sm">
                  Each defensive position can only be assigned to one player
                </Text>
              </Alert>
            )}

            {/* AC026: Unavailable positions indicator */}
            <Alert status="info" data-testid="unavailable-positions-indicator">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">
                  Position Guidelines:
                </Text>
                <Text fontSize="sm">
                  • Each player's preferred positions are shown first in
                  dropdown menus
                </Text>
                <Text fontSize="sm">
                  • Extra Player (EP) can be assigned to multiple positions
                </Text>
                <Text fontSize="sm">
                  • All other positions must be unique across the starting
                  lineup
                </Text>
              </VStack>
            </Alert>

            {/* Players are now auto-assigned by default, no need for separate display */}

            {/* Starting Lineup Section */}
            <Box data-testid="starting-lineup-section">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Starting Lineup (Positions 1-{startingPositionCount})
              </Text>
              <Grid templateColumns="repeat(1, 1fr)" gap={3}>
                {lineupPositions
                  .slice(0, startingPositionCount)
                  .map((position) => (
                    <GridItem key={position.battingOrder}>
                      <Box
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={4}
                      >
                        <Grid
                          templateColumns="60px 1fr 1fr"
                          gap={4}
                          alignItems="center"
                        >
                          {/* Batting order */}
                          <Badge
                            colorScheme="blue"
                            fontSize="md"
                            textAlign="center"
                          >
                            {position.battingOrder}
                          </Badge>

                          {/* Player select */}
                          <FormControl>
                            <Select
                              data-testid={`batting-position-${position.battingOrder}-player`}
                              placeholder="Select Player"
                              value={position.playerId || ''}
                              onChange={(e) =>
                                handlePlayerChange(
                                  position.battingOrder,
                                  e.target.value
                                )
                              }
                              aria-label={`Player for batting position ${position.battingOrder}`}
                            >
                              {players.map((player) => (
                                <option key={player.id} value={player.id}>
                                  #{player.jerseyNumber} {player.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Defensive position select */}
                          <FormControl
                            isInvalid={isPositionDuplicated(
                              position.defensivePosition,
                              position.battingOrder
                            )}
                          >
                            <Select
                              data-testid={`batting-position-${position.battingOrder}-defensive-position`}
                              placeholder="Select Position"
                              value={position.defensivePosition || ''}
                              onChange={(e) =>
                                handlePositionChange(
                                  position.battingOrder,
                                  e.target.value
                                )
                              }
                              aria-label={`Defensive position for batting position ${position.battingOrder}`}
                              borderColor={
                                isPositionDuplicated(
                                  position.defensivePosition,
                                  position.battingOrder
                                )
                                  ? 'red.300'
                                  : undefined
                              }
                              bg={
                                isPositionDuplicated(
                                  position.defensivePosition,
                                  position.battingOrder
                                )
                                  ? 'red.50'
                                  : undefined
                              }
                              className={
                                isPositionDuplicated(
                                  position.defensivePosition,
                                  position.battingOrder
                                )
                                  ? 'position-conflict-highlight'
                                  : undefined
                              }
                            >
                              {getSmartOrderedPositions(position.playerId).map(
                                (pos) => (
                                  <option key={pos.value} value={pos.value}>
                                    {pos.label}
                                  </option>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Box>
                    </GridItem>
                  ))}
              </Grid>
            </Box>

            {/* Bench Section - show unassigned players when positions are reduced */}
            {(startingPositionCount < players.length ||
              displacedPlayers.length > 0) && (
              <Box data-testid="bench-players-section">
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Bench Players
                </Text>

                {/* Show displaced players from removed positions */}
                {displacedPlayers.map((displaced) => (
                  <Box
                    key={`displaced-${displaced.player.id}`}
                    bg={cardBg}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={3}
                    mb={2}
                    data-testid={`bench-player-${displaced.player.id}`}
                  >
                    <Text>
                      #{displaced.player.jerseyNumber} {displaced.player.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Previously in position {displaced.originalPosition}
                    </Text>
                  </Box>
                ))}

                {/* Show players in positions beyond starting count (current bench) */}
                {lineupPositions
                  .slice(startingPositionCount) // All positions beyond starting count
                  .filter((pos) => pos.playerId) // Only show positions that have players assigned
                  .map((position) => {
                    const assignedPlayer = players.find(
                      (p) => p.id === position.playerId
                    );

                    return assignedPlayer ? (
                      <Box
                        key={`bench-${assignedPlayer.id}`}
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={3}
                        mb={2}
                        data-testid={`bench-player-${assignedPlayer.id}`}
                      >
                        <Text>
                          #{assignedPlayer.jerseyNumber} {assignedPlayer.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Position {position.battingOrder}
                        </Text>
                      </Box>
                    ) : null;
                  })}

                {/* Show any other unassigned players */}
                {players
                  .filter(
                    (player) =>
                      !lineupPositions
                        .slice(0, startingPositionCount)
                        .some((pos) => pos.playerId === player.id) &&
                      !displacedPlayers.some(
                        (displaced) => displaced.player.id === player.id
                      ) &&
                      !lineupPositions
                        .slice(startingPositionCount)
                        .some((pos) => pos.playerId === player.id)
                  )
                  .map((player) => (
                    <Box
                      key={`unassigned-${player.id}`}
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      p={3}
                      mb={2}
                      data-testid={`bench-player-${player.id}`}
                    >
                      <Text>
                        #{player.jerseyNumber} {player.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Unassigned
                      </Text>
                    </Box>
                  ))}
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            data-testid="cancel-lineup-button"
          >
            Cancel
          </Button>
          <Button
            colorScheme={isLineupComplete() ? 'green' : 'blue'}
            onClick={handleSave}
            isDisabled={
              getFilledPositionCount() === 0 ||
              isValidating ||
              !isLineupComplete()
            }
            data-testid="save-lineup-button"
          >
            Save Lineup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
