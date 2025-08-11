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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Box,
  Divider,
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

  // Create a unique key for this game's draft lineup
  const draftKey = `lineup-draft-${game.id}`;

  const validator = useMemo(() => new LineupValidator(), []);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize lineup positions when modal opens
  useEffect(() => {
    if (isOpen && lineupPositions.length === 0) {
      // Try to load draft from sessionStorage first
      const savedDraft = sessionStorage.getItem(draftKey);

      let initialPositions: LineupPosition[];

      if (savedDraft) {
        try {
          initialPositions = JSON.parse(savedDraft);
        } catch {
          // If parsing fails, create default positions
          initialPositions = createDefaultPositions();
        }
      } else {
        initialPositions = createDefaultPositions();
      }

      setLineupPositions(initialPositions);
    }
  }, [isOpen, lineupPositions.length, draftKey]);

  // Helper function to create default positions
  const createDefaultPositions = (): LineupPosition[] => {
    const positions: LineupPosition[] = [];
    for (let i = 1; i <= 15; i++) {
      positions.push({
        battingOrder: i,
        playerId: null,
        defensivePosition: null,
      });
    }
    return positions;
  };

  // Save draft to sessionStorage whenever positions change
  useEffect(() => {
    if (lineupPositions.length > 0) {
      sessionStorage.setItem(draftKey, JSON.stringify(lineupPositions));
    }
  }, [lineupPositions, draftKey]);

  // Validate lineup in real-time
  useEffect(() => {
    if (lineupPositions.length === 0) return;

    const filledPositions = lineupPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    );

    if (filledPositions.length === 0) {
      setValidationErrors([]);
      return;
    }

    setIsValidating(true);

    // Use partial validation for real-time feedback
    const result = validator.validatePartial(lineupPositions, players);
    setValidationErrors(result.errors);
    setIsValidating(false);
  }, [lineupPositions, players, validator]);

  const handlePlayerChange = (battingOrder: number, playerId: string) => {
    setLineupPositions((prev) =>
      prev.map((pos) =>
        pos.battingOrder === battingOrder
          ? { ...pos, playerId: playerId || null }
          : pos
      )
    );
  };

  const handlePositionChange = (battingOrder: number, position: string) => {
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
    if (filledPositions.length < 9) {
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
      battingOrder,
    });

    // Clear the draft after successful save
    sessionStorage.removeItem(draftKey);

    onClose();
  };

  const getFilledPositionCount = () => {
    return lineupPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    ).length;
  };

  const isLineupComplete = () => {
    return getFilledPositionCount() >= 9 && validationErrors.length === 0;
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
    const filledPositions = lineupPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    );

    const positionCounts: Record<string, number> = {};
    filledPositions.forEach((pos) => {
      if (pos.defensivePosition) {
        positionCounts[pos.defensivePosition] =
          (positionCounts[pos.defensivePosition] || 0) + 1;
      }
    });

    return Object.keys(positionCounts).filter(
      (position) => positionCounts[position] > 1
    );
  };

  // Check if a specific position is duplicated
  const isPositionDuplicated = (position: string | null) => {
    if (!position) return false;
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
            {/* Progress indicator */}
            <Box>
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  Lineup Progress: {getFilledPositionCount()}/9 minimum
                  positions filled
                </Text>
                <Badge
                  colorScheme={isLineupComplete() ? 'green' : 'yellow'}
                  variant="solid"
                >
                  {isLineupComplete() ? 'Complete' : 'Incomplete'}
                </Badge>
              </HStack>
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

            <Divider />

            {/* Lineup grid - show first 9 positions prominently */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Starting Lineup (Positions 1-9)
              </Text>
              <Grid templateColumns="repeat(1, 1fr)" gap={3}>
                {lineupPositions.slice(0, 9).map((position) => (
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
                            position.defensivePosition
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
                              isPositionDuplicated(position.defensivePosition)
                                ? 'red.300'
                                : undefined
                            }
                            bg={
                              isPositionDuplicated(position.defensivePosition)
                                ? 'red.50'
                                : undefined
                            }
                          >
                            {DEFENSIVE_POSITIONS.map((pos) => (
                              <option key={pos.value} value={pos.value}>
                                {pos.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            </Box>

            {/* Additional positions (10-15) */}
            {getFilledPositionCount() >= 9 && (
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Additional Players (Positions 10-15)
                </Text>
                <Grid templateColumns="repeat(1, 1fr)" gap={3}>
                  {lineupPositions.slice(9, 15).map((position) => (
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
                          <Badge
                            colorScheme="gray"
                            fontSize="md"
                            textAlign="center"
                          >
                            {position.battingOrder}
                          </Badge>

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
                            >
                              {players.map((player) => (
                                <option key={player.id} value={player.id}>
                                  #{player.jerseyNumber} {player.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl
                            isInvalid={isPositionDuplicated(
                              position.defensivePosition
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
                              borderColor={
                                isPositionDuplicated(position.defensivePosition)
                                  ? 'red.300'
                                  : undefined
                              }
                              bg={
                                isPositionDuplicated(position.defensivePosition)
                                  ? 'red.50'
                                  : undefined
                              }
                            >
                              {DEFENSIVE_POSITIONS.map((pos) => (
                                <option key={pos.value} value={pos.value}>
                                  {pos.label}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
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
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={getFilledPositionCount() === 0 || isValidating}
            data-testid="save-lineup-button"
          >
            Save Lineup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
