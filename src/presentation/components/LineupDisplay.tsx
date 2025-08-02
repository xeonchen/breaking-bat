import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  IconButton,
  Badge,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Divider,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { DragHandleIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { Position } from '@/domain';
import { useState, useEffect } from 'react';

interface LineupPlayer {
  battingOrder: number;
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  position: Position;
}

interface SubstitutePlayer {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  position: Position;
}

interface PlayerStats {
  avg: number;
  hits: number;
  atBats: number;
  rbi: number;
}

interface SubstitutionInfo {
  incomingPlayer: SubstitutePlayer;
  outgoingPlayerId: string;
  battingOrder: number;
}

interface LineupDisplayProps {
  lineup: LineupPlayer[];
  currentBatter: number;
  isEditable: boolean;
  substitutes?: SubstitutePlayer[];
  playerStats?: Record<string, PlayerStats>;
  isMobile?: boolean;
  enableDragDrop?: boolean;
  validateOnChange?: boolean;
  onLineupChange?: (newLineup: LineupPlayer[]) => void;
  onSubstitution?: (substitution: SubstitutionInfo) => void;
  onValidationError?: (error: string) => void;
}

// Position abbreviations for display
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

// Available positions for select options
const AVAILABLE_POSITIONS = [
  'pitcher',
  'catcher',
  'first-base',
  'second-base',
  'third-base',
  'shortstop',
  'left-field',
  'center-field',
  'right-field',
];

export function LineupDisplay({
  lineup,
  currentBatter,
  isEditable,
  substitutes = [],
  playerStats = {},
  isMobile = false,
  enableDragDrop = false,
  validateOnChange = false,
  onLineupChange,
  onSubstitution,
  onValidationError,
}: LineupDisplayProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedSubstitute, setSelectedSubstitute] =
    useState<SubstitutePlayer | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const currentBatterBg = useColorModeValue('brand.50', 'brand.900');
  const currentBatterBorder = useColorModeValue('brand.500', 'brand.300');

  // Validate lineup when it changes
  useEffect(() => {
    if (validateOnChange && onValidationError) {
      if (lineup.length !== 9) {
        onValidationError('Lineup must have exactly 9 players');
        return;
      }

      // Check for duplicate positions
      const positions = lineup.map((p) => p.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        const duplicatePosition = positions.find(
          (pos, index) => positions.indexOf(pos) !== index
        );
        if (duplicatePosition) {
          onValidationError(
            `Position ${duplicatePosition} is already assigned to another player`
          );
        }
      }
    }
  }, [lineup, validateOnChange, onValidationError]);

  const handlePositionChange = (
    battingOrder: number,
    newPositionValue: string
  ): void => {
    if (!onLineupChange) return;

    const newPosition = Position.fromValue(newPositionValue);

    // Check if position is already taken
    const existingPlayer = lineup.find(
      (p) =>
        p.position.value === newPosition.value &&
        p.battingOrder !== battingOrder
    );
    if (existingPlayer && onValidationError) {
      onValidationError(
        `Position ${newPosition.value} is already assigned to another player`
      );
      return;
    }

    const updatedLineup = lineup.map((player) =>
      player.battingOrder === battingOrder
        ? { ...player, position: newPosition }
        : player
    );
    onLineupChange(updatedLineup);
  };

  const handlePlayerRemoval = (battingOrder: number): void => {
    if (!onLineupChange) return;

    const updatedLineup = lineup
      .filter((player) => player.battingOrder !== battingOrder)
      .map((player, index) => ({ ...player, battingOrder: index + 1 }));

    onLineupChange(updatedLineup);
  };

  const handleDragStart = (index: number): void => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number): void => {
    if (draggedIndex === null || !onLineupChange) return;

    const newLineup = [...lineup];
    const draggedPlayer = newLineup[draggedIndex];
    const targetPlayer = newLineup[dropIndex];

    // Swap players
    newLineup[draggedIndex] = {
      ...targetPlayer,
      battingOrder: draggedIndex + 1,
    };
    newLineup[dropIndex] = { ...draggedPlayer, battingOrder: dropIndex + 1 };

    onLineupChange(newLineup);
    setDraggedIndex(null);
  };

  const handleSubstitutionClick = (substitute: SubstitutePlayer): void => {
    setSelectedSubstitute(substitute);
    onOpen();
  };

  const handleConfirmSubstitution = (outgoingPlayerId: string): void => {
    if (!selectedSubstitute || !onSubstitution) return;

    const outgoingPlayer = lineup.find((p) => p.playerId === outgoingPlayerId);
    if (!outgoingPlayer) return;

    onSubstitution({
      incomingPlayer: selectedSubstitute,
      outgoingPlayerId,
      battingOrder: outgoingPlayer.battingOrder,
    });

    onClose();
    setSelectedSubstitute(null);
  };

  // Handle empty lineup
  if (lineup.length === 0) {
    return (
      <Box
        data-testid="empty-lineup-message"
        textAlign="center"
        p={8}
        color="gray.500"
      >
        <Text>No players in lineup</Text>
      </Box>
    );
  }

  return (
    <Box
      data-testid="lineup-container"
      className={isMobile ? 'mobile-layout' : ''}
    >
      <VStack spacing={4} align="stretch">
        {/* Lineup List */}
        <Box role="list" aria-label="Batting Lineup">
          <VStack spacing={2}>
            {lineup.map((player, index) => {
              const isCurrentBatter = currentBatter === player.battingOrder;
              const stats = playerStats[player.playerId];

              return (
                <Box
                  key={player.playerId}
                  data-testid={`batting-position-${player.battingOrder}`}
                  role="listitem"
                  aria-label={
                    isCurrentBatter
                      ? `Current batter: ${player.playerName}`
                      : player.playerName
                  }
                  className={`${isCurrentBatter ? 'current-batter' : ''} ${isMobile ? 'mobile-compact' : ''}`}
                  bg={isCurrentBatter ? currentBatterBg : cardBg}
                  border="1px"
                  borderColor={
                    isCurrentBatter ? currentBatterBorder : borderColor
                  }
                  borderRadius="md"
                  p={4}
                  position="relative"
                  onDragOver={enableDragDrop ? handleDragOver : undefined}
                  onDrop={enableDragDrop ? () => handleDrop(index) : undefined}
                >
                  {enableDragDrop && (
                    <Box
                      data-testid={`drop-zone-${player.battingOrder}`}
                      className={
                        draggedIndex !== null ? 'drop-zone-active' : ''
                      }
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      zIndex={1}
                    />
                  )}

                  <Flex align="center" gap={4}>
                    {/* Batting Order */}
                    <Badge
                      colorScheme={isCurrentBatter ? 'brand' : 'gray'}
                      fontSize="md"
                      px={3}
                      py={1}
                    >
                      {player.battingOrder}
                    </Badge>

                    {/* Drag Handle */}
                    {isEditable && enableDragDrop && (
                      <IconButton
                        data-testid={`drag-handle-${player.battingOrder}`}
                        aria-label="Drag to reorder"
                        icon={<DragHandleIcon />}
                        size="sm"
                        variant="ghost"
                        cursor="grab"
                        draggable
                        onDragStart={() => handleDragStart(index)}
                      />
                    )}

                    {/* Player Info */}
                    <Box flex={1}>
                      <HStack spacing={2} align="center">
                        <Text
                          fontWeight="bold"
                          fontSize={isMobile ? 'sm' : 'md'}
                        >
                          #{player.jerseyNumber} {player.playerName}
                        </Text>
                        <Badge variant="outline" colorScheme="blue">
                          {POSITION_ABBREVIATIONS[player.position.value]}
                        </Badge>
                      </HStack>

                      {/* Statistics */}
                      {stats && !isMobile && (
                        <HStack
                          spacing={4}
                          mt={1}
                          fontSize="sm"
                          color="gray.600"
                        >
                          <Text>AVG: {stats.avg.toFixed(3)}</Text>
                          <Text>
                            {stats.hits}-{stats.atBats}
                          </Text>
                          <Text>RBI: {stats.rbi}</Text>
                        </HStack>
                      )}

                      {!stats && !isMobile && (
                        <Text fontSize="sm" color="gray.400" mt={1}>
                          ---
                        </Text>
                      )}
                    </Box>

                    {/* Position Selector */}
                    {isEditable && (
                      <Select
                        data-testid={`position-select-${player.battingOrder}`}
                        value={player.position.value}
                        onChange={(e) =>
                          handlePositionChange(
                            player.battingOrder,
                            e.target.value
                          )
                        }
                        size="sm"
                        width="120px"
                        tabIndex={0}
                      >
                        {AVAILABLE_POSITIONS.map((positionValue) => (
                          <option key={positionValue} value={positionValue}>
                            {POSITION_ABBREVIATIONS[positionValue]}
                          </option>
                        ))}
                      </Select>
                    )}

                    {/* Remove Button */}
                    {isEditable && (
                      <IconButton
                        data-testid={`remove-player-${player.battingOrder}`}
                        aria-label="Remove player"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handlePlayerRemoval(player.battingOrder)}
                      />
                    )}
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        </Box>

        {/* Substitutes Section */}
        {substitutes.length > 0 && (
          <Box data-testid="substitutes-section">
            <Divider my={4} />
            <Text fontSize="lg" fontWeight="semibold" mb={3}>
              Available Substitutes
            </Text>
            <VStack spacing={2}>
              {substitutes.map((substitute) => (
                <Box
                  key={substitute.playerId}
                  data-testid={`substitute-${substitute.playerId}`}
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  p={3}
                  w="full"
                >
                  <Flex align="center" justify="space-between">
                    <HStack>
                      <Text fontWeight="medium">
                        #{substitute.jerseyNumber} {substitute.playerName}
                      </Text>
                      <Badge variant="outline">
                        {POSITION_ABBREVIATIONS[substitute.position.value]}
                      </Badge>
                    </HStack>

                    {isEditable && (
                      <Tooltip label="Make substitution">
                        <IconButton
                          data-testid={`substitute-btn-${substitute.playerId}`}
                          aria-label="Make substitution"
                          icon={<RepeatIcon />}
                          size="sm"
                          colorScheme="green"
                          variant="ghost"
                          onClick={() => handleSubstitutionClick(substitute)}
                        />
                      </Tooltip>
                    )}
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Substitution Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent data-testid="substitution-modal">
          <ModalHeader>Make Substitution</ModalHeader>
          <ModalBody>
            {selectedSubstitute && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Substitute <strong>{selectedSubstitute.playerName}</strong>{' '}
                  for:
                </Text>
                <Select
                  data-testid="substitute-for-select"
                  placeholder="Select player to substitute"
                >
                  {lineup.map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      #{player.jerseyNumber} {player.playerName} (
                      {POSITION_ABBREVIATIONS[player.position.value]})
                    </option>
                  ))}
                </Select>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-substitution"
              colorScheme="green"
              onClick={() => {
                const select = document.querySelector(
                  '[data-testid="substitute-for-select"]'
                ) as HTMLSelectElement;
                if (select?.value) {
                  handleConfirmSubstitution(select.value);
                }
              }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
