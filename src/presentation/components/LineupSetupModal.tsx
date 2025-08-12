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
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { DragHandleIcon } from '@chakra-ui/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface DraggableLineupRowProps {
  position: LineupPosition;
  player: Player | null;
  players: Player[];
  isStartingPosition: boolean;
  isPositionDuplicated: boolean;
  availablePositions: Array<{ value: string; label: string }>;
  onPlayerChange: (playerId: string) => void;
  onPositionChange: (position: string) => void;
  cardBg: string;
  borderColor: string;
  dragHandleProps?: any;
}

interface DraggableBenchPlayerProps {
  player: Player;
  position?: LineupPosition;
  isDisplaced?: boolean;
  originalPosition?: number;
  cardBg: string;
  borderColor: string;
  onPositionChange?: (position: string) => void;
  availablePositions: Array<{ value: string; label: string }>;
}

const DraggableBenchPlayer: React.FC<DraggableBenchPlayerProps> = ({
  player,
  position,
  isDisplaced = false,
  originalPosition,
  cardBg,
  borderColor,
  onPositionChange,
  availablePositions,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `bench-${player.id}`,
  });

  const style = {
    transform: isDragging ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
      mb={2}
      data-testid={`bench-player-${player.id}`}
    >
      <Flex alignItems="center" gap={3} width="100%">
        {/* Drag handle */}
        <IconButton
          {...attributes}
          {...listeners}
          aria-label={`Drag bench player ${player.name}`}
          icon={<DragHandleIcon />}
          size="sm"
          variant="ghost"
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          data-testid={`bench-drag-handle-${player.id}`}
        />

        {/* Player info */}
        <Box flex="1">
          <Text fontWeight="bold">
            #{player.jerseyNumber} {player.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {isDisplaced && originalPosition
              ? `Previously in position ${originalPosition}`
              : position?.battingOrder
                ? `Position ${position.battingOrder}`
                : player.getPositionsDisplay()}
          </Text>
        </Box>

        {/* Position selector for bench players (AC033) */}
        {onPositionChange && (
          <FormControl maxW="200px">
            <Select
              data-testid={`bench-player-${player.id}-position`}
              placeholder="Select Position"
              value={position?.defensivePosition || ''}
              onChange={(e) => onPositionChange(e.target.value)}
              size="sm"
            >
              {availablePositions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Show current position if assigned */}
        {position?.defensivePosition && !onPositionChange && (
          <Text fontSize="sm" fontWeight="semibold">
            {position.defensivePosition}
          </Text>
        )}
      </Flex>
    </Box>
  );
};

interface DroppableBenchSectionProps {
  children: React.ReactNode;
}

const DroppableBenchSection: React.FC<DroppableBenchSectionProps> = ({
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'bench-section',
  });

  return (
    <Box
      ref={setNodeRef}
      minH="100px"
      p={3}
      borderRadius="md"
      border="2px dashed"
      borderColor={isOver ? 'blue.400' : 'gray.300'}
      bg={isOver ? 'blue.50' : 'transparent'}
      transition="all 0.2s"
    >
      {children}
    </Box>
  );
};

const DraggableLineupRow: React.FC<DraggableLineupRowProps> = ({
  position,
  player,
  players,
  isStartingPosition,
  isPositionDuplicated,
  availablePositions,
  onPlayerChange,
  onPositionChange,
  cardBg,
  borderColor,
  ...dragProps
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lineup-${position.battingOrder}`,
  });

  const style = {
    // Don't apply transform to the dragged item (handled by overlay)
    transform: isDragging ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1, // Reduced opacity for original item during drag
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      width="100%"
      {...dragProps}
    >
      <Flex alignItems="center" gap={4} width="100%">
        {/* AC011: Drag handle for visual feedback */}
        <IconButton
          {...attributes}
          {...listeners}
          aria-label={`Drag player in position ${position.battingOrder}`}
          icon={<DragHandleIcon />}
          size="sm"
          variant="ghost"
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          data-testid={`drag-handle-${position.battingOrder}`}
        />

        {/* Batting order badge */}
        <Badge colorScheme="blue" fontSize="md" textAlign="center" minW="50px">
          {position.battingOrder}
        </Badge>

        {/* Player selection */}
        <Box flex="1">
          <FormControl>
            <Select
              data-testid={`batting-position-${position.battingOrder}-player`}
              placeholder="Select Player"
              value={position.playerId || ''}
              onChange={(e) => onPlayerChange(e.target.value)}
              aria-label={`Player for batting position ${position.battingOrder}`}
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jerseyNumber} {p.name}
                </option>
              ))}
            </Select>
          </FormControl>
          {player && (
            <Text fontSize="sm" color="gray.600" mt={1}>
              {player.getPositionsDisplay()}
            </Text>
          )}
        </Box>

        {/* Defensive position select - only for starting lineup */}
        {isStartingPosition && (
          <FormControl maxW="200px" isInvalid={isPositionDuplicated}>
            <Select
              data-testid={`batting-position-${position.battingOrder}-defensive-position`}
              placeholder="Select Position"
              value={position.defensivePosition || ''}
              onChange={(e) => onPositionChange(e.target.value)}
              aria-label={`Defensive position for batting position ${position.battingOrder}`}
              borderColor={isPositionDuplicated ? 'red.300' : undefined}
              bg={isPositionDuplicated ? 'red.50' : undefined}
              className={
                isPositionDuplicated ? 'position-conflict-highlight' : undefined
              }
            >
              {availablePositions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
      </Flex>
    </Box>
  );
};

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

  // AC010: Drag and drop sensors for batting order reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // AC011: Handle drag start - set active item for overlay
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // AC012: Handle drag end - reorder batting positions and renumber, plus cross-section drag-and-drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null); // Clear active drag state

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle cross-section drag-and-drop (AC029-AC031)
    if (activeId.startsWith('bench-') && overId.startsWith('lineup-')) {
      // Dragging from bench to starting lineup
      const benchPlayerId = activeId.replace('bench-', '');
      const targetPosition = parseInt(overId.replace('lineup-', ''));

      setLineupPositions((prev) => {
        return prev.map((pos) => {
          if (pos.battingOrder === targetPosition) {
            // Find the bench player's current defensive position if any
            const benchPlayer = players.find((p) => p.id === benchPlayerId);
            const currentBenchPosition = prev.find(
              (p) => p.playerId === benchPlayerId
            );

            return {
              ...pos,
              playerId: benchPlayerId,
              defensivePosition:
                currentBenchPosition?.defensivePosition ||
                (benchPlayer ? getDefaultPositionForPlayer(benchPlayer) : null),
            };
          }
          // Clear the bench position if player was previously assigned
          if (pos.playerId === benchPlayerId) {
            return { ...pos, playerId: null, defensivePosition: null };
          }
          return pos;
        });
      });
      return;
    }

    if (activeId.startsWith('lineup-') && overId === 'bench-section') {
      // Dragging from starting lineup to bench (AC030)
      const activePosition = parseInt(activeId.replace('lineup-', ''));

      setLineupPositions((prev) => {
        return prev.map((pos) => {
          if (pos.battingOrder === activePosition) {
            // Find the first available bench position or create new one
            const benchPositions = prev.slice(startingPositionCount);
            const firstEmptyBench = benchPositions.find((p) => !p.playerId);

            if (firstEmptyBench) {
              // Move to existing empty bench position
              return pos; // Will be handled by the target position update below
            } else {
              // Create new bench position
              return pos; // Will be handled by adding new position
            }
          }
          return pos;
        });
      });

      // Handle the actual move
      setLineupPositions((prev) => {
        const activePositionData = prev.find(
          (p) => p.battingOrder === activePosition
        );
        if (!activePositionData || !activePositionData.playerId) return prev;

        // Find first empty bench position
        const benchPositions = prev.slice(startingPositionCount);
        const firstEmptyBench = benchPositions.find((p) => !p.playerId);

        if (firstEmptyBench) {
          // Move to existing bench position
          return prev.map((pos) => {
            if (pos.battingOrder === activePosition) {
              return { ...pos, playerId: null, defensivePosition: null };
            }
            if (pos.battingOrder === firstEmptyBench.battingOrder) {
              return {
                ...pos,
                playerId: activePositionData.playerId,
                defensivePosition: activePositionData.defensivePosition,
              };
            }
            return pos;
          });
        } else {
          // Add new bench position
          const newBenchPosition: LineupPosition = {
            battingOrder: prev.length + 1,
            playerId: activePositionData.playerId,
            defensivePosition: activePositionData.defensivePosition,
          };

          return [
            ...prev.map((pos) =>
              pos.battingOrder === activePosition
                ? { ...pos, playerId: null, defensivePosition: null }
                : pos
            ),
            newBenchPosition,
          ];
        }
      });
      return;
    }

    // Regular starting lineup reordering
    if (activeId.startsWith('lineup-') && overId.startsWith('lineup-')) {
      const activeIndex = parseInt(activeId.replace('lineup-', '')) - 1;
      const overIndex = parseInt(overId.replace('lineup-', '')) - 1;

      // Only allow reordering within starting lineup
      if (
        activeIndex < startingPositionCount &&
        overIndex < startingPositionCount
      ) {
        setLineupPositions((prev) => {
          const startingPositions = prev.slice(0, startingPositionCount);
          const benchPositions = prev.slice(startingPositionCount);

          const reorderedStarting = arrayMove(
            startingPositions,
            activeIndex,
            overIndex
          );

          // Renumber batting orders to maintain sequential order
          const renumberedStarting = reorderedStarting.map(
            (position, index) => ({
              ...position,
              battingOrder: index + 1,
            })
          );

          return [...renumberedStarting, ...benchPositions];
        });
      }
    }
  };

  // Helper function to get default position for a player
  const getDefaultPositionForPlayer = (player: Player): string | null => {
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
    return positionMap[defaultPos.value] || null;
  };

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

  // State for drag overlay
  const [activeId, setActiveId] = useState<string | null>(null);

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

  // Handle bench player position changes (AC033)
  const handleBenchPlayerPositionChange = (
    playerId: string,
    position: string
  ) => {
    setLineupPositions((prev) =>
      prev.map((pos) =>
        pos.playerId === playerId
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

            {/* Combined Drag-and-Drop Context for Starting Lineup and Bench */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={[
                  // Starting lineup items
                  ...lineupPositions
                    .slice(0, startingPositionCount)
                    .map((pos) => `lineup-${pos.battingOrder}`),
                  // Bench player items
                  ...players
                    .filter((player) => {
                      // Include players that are in bench positions or displaced
                      const inStarting = lineupPositions
                        .slice(0, startingPositionCount)
                        .some((pos) => pos.playerId === player.id);
                      return !inStarting;
                    })
                    .map((player) => `bench-${player.id}`),
                ]}
                strategy={verticalListSortingStrategy}
              >
                {/* Starting Lineup Section - AC009-AC012: Drag-and-Drop Interface */}
                <Box data-testid="starting-lineup-section">
                  <Text fontSize="lg" fontWeight="semibold" mb={3}>
                    Starting Lineup (Positions 1-{startingPositionCount})
                  </Text>

                  <VStack spacing={3}>
                    {lineupPositions
                      .slice(0, startingPositionCount)
                      .map((position) => {
                        const assignedPlayer = players.find(
                          (p) => p.id === position.playerId
                        );

                        return (
                          <DraggableLineupRow
                            key={position.battingOrder}
                            position={position}
                            player={assignedPlayer || null}
                            players={players}
                            isStartingPosition={true}
                            isPositionDuplicated={isPositionDuplicated(
                              position.defensivePosition,
                              position.battingOrder
                            )}
                            availablePositions={getSmartOrderedPositions(
                              position.playerId
                            )}
                            onPlayerChange={(playerId) =>
                              handlePlayerChange(
                                position.battingOrder,
                                playerId
                              )
                            }
                            onPositionChange={(positionValue) =>
                              handlePositionChange(
                                position.battingOrder,
                                positionValue
                              )
                            }
                            cardBg={cardBg}
                            borderColor={borderColor}
                          />
                        );
                      })}
                  </VStack>
                </Box>

                {/* Bench Section - AC029-AC033: Cross-Section Drag-and-Drop */}
                {(startingPositionCount < players.length ||
                  displacedPlayers.length > 0) && (
                  <Box data-testid="bench-players-section" mt={6}>
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                      Bench Players
                    </Text>

                    <DroppableBenchSection>
                      {/* Show displaced players from removed positions */}
                      {displacedPlayers.map((displaced) => (
                        <DraggableBenchPlayer
                          key={`displaced-${displaced.player.id}`}
                          player={displaced.player}
                          isDisplaced={true}
                          originalPosition={displaced.originalPosition}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          availablePositions={getSmartOrderedPositions(
                            displaced.player.id
                          )}
                          onPositionChange={(position) =>
                            handleBenchPlayerPositionChange(
                              displaced.player.id,
                              position
                            )
                          }
                        />
                      ))}

                      {/* Show players in positions beyond starting count (current bench) */}
                      {lineupPositions
                        .slice(startingPositionCount)
                        .filter((pos) => pos.playerId)
                        .map((position) => {
                          const assignedPlayer = players.find(
                            (p) => p.id === position.playerId
                          );

                          return assignedPlayer ? (
                            <DraggableBenchPlayer
                              key={`bench-${assignedPlayer.id}`}
                              player={assignedPlayer}
                              position={position}
                              cardBg={cardBg}
                              borderColor={borderColor}
                              availablePositions={getSmartOrderedPositions(
                                assignedPlayer.id
                              )}
                              onPositionChange={(positionValue) =>
                                handleBenchPlayerPositionChange(
                                  assignedPlayer.id,
                                  positionValue
                                )
                              }
                            />
                          ) : null;
                        })}

                      {/* Show any other unassigned players */}
                      {players
                        .filter((player) => {
                          const inStarting = lineupPositions
                            .slice(0, startingPositionCount)
                            .some((pos) => pos.playerId === player.id);
                          const inBench = lineupPositions
                            .slice(startingPositionCount)
                            .some((pos) => pos.playerId === player.id);
                          const isDisplaced = displacedPlayers.some(
                            (displaced) => displaced.player.id === player.id
                          );
                          return !inStarting && !inBench && !isDisplaced;
                        })
                        .map((player) => (
                          <DraggableBenchPlayer
                            key={`unassigned-${player.id}`}
                            player={player}
                            cardBg={cardBg}
                            borderColor={borderColor}
                            availablePositions={getSmartOrderedPositions(
                              player.id
                            )}
                            onPositionChange={(position) =>
                              handleBenchPlayerPositionChange(
                                player.id,
                                position
                              )
                            }
                          />
                        ))}

                      {/* Empty state message */}
                      {players.filter((player) => {
                        const inStarting = lineupPositions
                          .slice(0, startingPositionCount)
                          .some((pos) => pos.playerId === player.id);
                        return !inStarting;
                      }).length === 0 &&
                        displacedPlayers.length === 0 && (
                          <Text color="gray.500" textAlign="center" py={4}>
                            All players are in the starting lineup
                          </Text>
                        )}
                    </DroppableBenchSection>
                  </Box>
                )}
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <Box
                    bg={cardBg}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={4}
                    width="100%"
                    opacity={0.9}
                    transform="rotate(5deg)"
                    boxShadow="lg"
                  >
                    {(() => {
                      if (activeId.startsWith('lineup-')) {
                        const activeIndex =
                          parseInt(activeId.replace('lineup-', '')) - 1;
                        const activePosition = lineupPositions[activeIndex];
                        const activePlayer = activePosition
                          ? players.find(
                              (p) => p.id === activePosition.playerId
                            )
                          : null;

                        return (
                          <Flex alignItems="center" gap={4} width="100%">
                            <IconButton
                              aria-label="Dragging"
                              icon={<DragHandleIcon />}
                              size="sm"
                              variant="ghost"
                              cursor="grabbing"
                            />

                            <Badge
                              colorScheme="blue"
                              fontSize="md"
                              textAlign="center"
                              minW="50px"
                            >
                              {activePosition?.battingOrder}
                            </Badge>

                            <Box flex="1">
                              <Text fontWeight="bold">
                                {activePlayer
                                  ? `#${activePlayer.jerseyNumber} ${activePlayer.name}`
                                  : 'Select Player'}
                              </Text>
                              {activePlayer && (
                                <Text fontSize="sm" color="gray.600">
                                  {activePlayer.getPositionsDisplay()}
                                </Text>
                              )}
                            </Box>

                            {activePosition?.defensivePosition && (
                              <Text fontSize="sm" fontWeight="semibold">
                                {activePosition.defensivePosition}
                              </Text>
                            )}
                          </Flex>
                        );
                      } else if (activeId.startsWith('bench-')) {
                        const benchPlayerId = activeId.replace('bench-', '');
                        const benchPlayer = players.find(
                          (p) => p.id === benchPlayerId
                        );
                        const benchPosition = lineupPositions.find(
                          (p) => p.playerId === benchPlayerId
                        );

                        return (
                          <Flex alignItems="center" gap={3} width="100%">
                            <IconButton
                              aria-label="Dragging"
                              icon={<DragHandleIcon />}
                              size="sm"
                              variant="ghost"
                              cursor="grabbing"
                            />

                            <Box flex="1">
                              <Text fontWeight="bold">
                                {benchPlayer
                                  ? `#${benchPlayer.jerseyNumber} ${benchPlayer.name}`
                                  : 'Unknown Player'}
                              </Text>
                              {benchPlayer && (
                                <Text fontSize="sm" color="gray.600">
                                  {benchPlayer.getPositionsDisplay()}
                                </Text>
                              )}
                            </Box>

                            {benchPosition?.defensivePosition && (
                              <Text fontSize="sm" fontWeight="semibold">
                                {benchPosition.defensivePosition}
                              </Text>
                            )}
                          </Flex>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                ) : null}
              </DragOverlay>
            </DndContext>
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
