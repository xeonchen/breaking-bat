import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Select,
  IconButton,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { RepeatIcon, DeleteIcon } from '@chakra-ui/icons';
import { Position, BattingResult } from '@/domain';
import { useState, useEffect, useCallback } from 'react';

interface CurrentBatter {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  position: Position;
  battingOrder: number;
}

interface Baserunners {
  first?: { playerId: string; playerName: string } | null;
  second?: { playerId: string; playerName: string } | null;
  third?: { playerId: string; playerName: string } | null;
}

interface Count {
  balls: number;
  strikes: number;
}

interface BaserunnerAdvancement {
  first?: 'second' | 'third' | 'home' | 'out' | 'stay';
  second?: 'third' | 'home' | 'out' | 'stay';
  third?: 'home' | 'out' | 'stay';
}

interface AtBatFormProps {
  currentBatter: CurrentBatter | null;
  baserunners: Baserunners;
  currentCount: Count;
  onAtBatComplete: (result: {
    batterId: string;
    result: BattingResult;
    finalCount: { balls: number; strikes: number };
    pitchSequence?: string[];
    baserunnerAdvancement?: Record<string, string>;
  }) => void;
  showBaserunnerOptions?: boolean;
  showPitchHistory?: boolean;
  enablePitchTypes?: boolean;
  enableUndo?: boolean;
  isMobile?: boolean;
}

type PitchType =
  | 'fastball'
  | 'curveball'
  | 'slider'
  | 'changeup'
  | 'knuckleball';

interface Pitch {
  type: 'ball' | 'strike' | 'foul';
  pitchType?: PitchType;
  countBefore: Count;
  countAfter: Count;
}

export function AtBatForm({
  currentBatter,
  baserunners,
  currentCount: initialCount,
  onAtBatComplete,
  showBaserunnerOptions = false,
  showPitchHistory = false,
  enablePitchTypes = false,
  enableUndo = false,
  isMobile = false,
}: AtBatFormProps) {
  const [count, setCount] = useState<Count>(initialCount);
  const [pitchHistory, setPitchHistory] = useState<Pitch[]>([]);
  const [selectedPitchType, setSelectedPitchType] =
    useState<PitchType>('fastball');
  const [baserunnerAdvancement, setBaserunnerAdvancement] =
    useState<BaserunnerAdvancement>({});
  const [hasError, setHasError] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingResult, setPendingResult] = useState<BattingResult | null>(
    null
  );

  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Update count from props
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // Validate count boundaries
  const isValidCount = count.balls < 4 && count.strikes < 3;

  const handleAtBatComplete = useCallback(
    (result: BattingResult, finalCount?: Count) => {
      if (!currentBatter) return;

      const atBatResult = {
        batterId: currentBatter.playerId,
        result,
        finalCount: finalCount || count,
        pitchSequence: pitchHistory.map((p) => {
          const typeAbbrev = p.type.charAt(0).toUpperCase();
          let pitchTypeAbbrev = '';
          if (p.pitchType) {
            const pitchAbbreviations: Record<PitchType, string> = {
              fastball: 'FB',
              curveball: 'CB',
              slider: 'SL',
              changeup: 'CH',
              knuckleball: 'KB',
            };
            pitchTypeAbbrev = ` (${pitchAbbreviations[p.pitchType]})`;
          }
          return `${typeAbbrev}${pitchTypeAbbrev}`;
        }),
        baserunnerAdvancement: baserunnerAdvancement as Record<string, string>,
      };

      // Show baserunner options for hits if enabled
      if (
        showBaserunnerOptions &&
        (result.value === '1B' ||
          result.value === '2B' ||
          result.value === '3B')
      ) {
        setPendingResult(result);
        onOpen();
        return;
      }

      try {
        onAtBatComplete(atBatResult);
        setHasError(false);
      } catch {
        setHasError(true);
        toast({
          title: 'Error recording at-bat',
          description: 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [
      currentBatter,
      count,
      pitchHistory,
      baserunnerAdvancement,
      showBaserunnerOptions,
      onAtBatComplete,
      onOpen,
      toast,
    ]
  );

  const handlePitch = useCallback(
    (pitchType: 'ball' | 'strike' | 'foul') => {
      const newCount = { ...count };

      switch (pitchType) {
        case 'ball':
          newCount.balls += 1;
          break;
        case 'strike':
          newCount.strikes += 1;
          break;
        case 'foul':
          // Foul ball only adds a strike if less than 2 strikes
          if (count.strikes < 2) {
            newCount.strikes += 1;
          }
          break;
      }

      const newPitch: Pitch = {
        type: pitchType,
        pitchType: enablePitchTypes ? selectedPitchType : undefined,
        countBefore: count,
        countAfter: newCount,
      };

      setPitchHistory((prev) => [...prev, newPitch]);
      setCount(newCount);

      // Auto-complete at-bat on walk or strikeout
      if (newCount.balls === 4) {
        handleAtBatComplete(BattingResult.walk(), newCount);
      } else if (newCount.strikes === 3) {
        handleAtBatComplete(BattingResult.strikeout(), newCount);
      }
    },
    [count, enablePitchTypes, selectedPitchType, handleAtBatComplete]
  );

  const handleUndoPitch = useCallback(() => {
    if (pitchHistory.length === 0) return;

    const lastPitch = pitchHistory[pitchHistory.length - 1];
    setPitchHistory((prev) => prev.slice(0, -1));

    // Restore the count to what it was before the last pitch
    setCount(lastPitch.countBefore);
  }, [pitchHistory]);

  const handleClearCount = useCallback(() => {
    setCount({ balls: 0, strikes: 0 });
    setPitchHistory([]);
    setBaserunnerAdvancement({});
  }, []);

  const handleBaserunnerAdvancementChange = (
    base: keyof BaserunnerAdvancement,
    advancement: string
  ): void => {
    setBaserunnerAdvancement((prev) => ({
      ...prev,
      [base]: advancement,
    }));
  };

  const handleConfirmAdvancement = (): void => {
    if (!pendingResult || !currentBatter) return;

    const atBatResult = {
      batterId: currentBatter.playerId,
      result: pendingResult,
      finalCount: count,
      pitchSequence: pitchHistory.map((p) => {
        const typeAbbrev = p.type.charAt(0).toUpperCase();
        let pitchTypeAbbrev = '';
        if (p.pitchType) {
          const pitchAbbreviations: Record<PitchType, string> = {
            fastball: 'FB',
            curveball: 'CB',
            slider: 'SL',
            changeup: 'CH',
            knuckleball: 'KB',
          };
          pitchTypeAbbrev = ` (${pitchAbbreviations[p.pitchType]})`;
        }
        return `${typeAbbrev}${pitchTypeAbbrev}`;
      }),
      baserunnerAdvancement: baserunnerAdvancement as Record<string, string>,
    };

    try {
      onAtBatComplete(atBatResult);
      setHasError(false);
    } catch {
      setHasError(true);
      toast({
        title: 'Error recording at-bat',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }

    setPendingResult(null);
    onClose();
  };

  // Handle missing batter
  if (!currentBatter) {
    return (
      <Box
        data-testid="no-batter-message"
        textAlign="center"
        p={8}
        color={mutedColor}
      >
        <Text>No batter selected</Text>
      </Box>
    );
  }

  return (
    <Box
      data-testid="at-bat-form"
      role="region"
      aria-label="At-Bat Recording Form"
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
      className={isMobile ? 'mobile-layout' : ''}
    >
      <VStack spacing={6}>
        {/* Current Batter Info */}
        <Box data-testid="current-batter-info" textAlign="center" w="full">
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
            #{currentBatter.jerseyNumber} {currentBatter.playerName}
          </Text>
          <Text color={mutedColor} fontSize="sm">
            {currentBatter.battingOrder}rd Batter
          </Text>
        </Box>

        {/* Count Display */}
        <Box textAlign="center">
          <Text
            data-testid="count-display"
            aria-live="polite"
            aria-label={`Current count: ${count.balls} balls, ${count.strikes} ${count.strikes === 1 ? 'strike' : 'strikes'}`}
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color={textColor}
          >
            <Text as="span" data-testid="balls-count">
              {count.balls}
            </Text>
            -
            <Text as="span" data-testid="strikes-count">
              {count.strikes}
            </Text>
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            Balls - Strikes
          </Text>
        </Box>

        {/* Invalid Count Warning */}
        {!isValidCount && (
          <Alert data-testid="invalid-count-warning" status="warning" size="sm">
            <AlertIcon />
            Invalid count detected
          </Alert>
        )}

        {/* Error Message */}
        {hasError && (
          <Alert data-testid="error-message" status="error" size="sm">
            <AlertIcon />
            Error recording at-bat
          </Alert>
        )}

        {/* Baserunner Status */}
        <Box w="full">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Baserunners
          </Text>
          <HStack spacing={4} justify="center">
            <Box textAlign="center">
              <Text fontSize="xs" color={mutedColor}>
                1st
              </Text>
              <Badge
                data-testid="baserunner-first"
                variant={baserunners.first ? 'solid' : 'outline'}
                colorScheme={baserunners.first ? 'blue' : 'gray'}
                fontSize="xs"
              >
                {baserunners.first ? baserunners.first.playerName : 'Empty'}
              </Badge>
            </Box>
            <Box textAlign="center">
              <Text fontSize="xs" color={mutedColor}>
                2nd
              </Text>
              <Badge
                data-testid="baserunner-second"
                variant={baserunners.second ? 'solid' : 'outline'}
                colorScheme={baserunners.second ? 'blue' : 'gray'}
                fontSize="xs"
              >
                {baserunners.second ? baserunners.second.playerName : 'Empty'}
              </Badge>
            </Box>
            <Box textAlign="center">
              <Text fontSize="xs" color={mutedColor}>
                3rd
              </Text>
              <Badge
                data-testid="baserunner-third"
                variant={baserunners.third ? 'solid' : 'outline'}
                colorScheme={baserunners.third ? 'blue' : 'gray'}
                fontSize="xs"
              >
                {baserunners.third ? baserunners.third.playerName : 'Empty'}
              </Badge>
            </Box>
          </HStack>
        </Box>

        {/* Pitch Type Selector */}
        {enablePitchTypes && (
          <Box data-testid="pitch-type-selector" w="full">
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Pitch Type
            </Text>
            <Select
              data-testid="pitch-type-select"
              value={selectedPitchType}
              onChange={(e) =>
                setSelectedPitchType(e.target.value as PitchType)
              }
              size="sm"
            >
              <option value="fastball">Fastball</option>
              <option value="curveball">Curveball</option>
              <option value="slider">Slider</option>
              <option value="changeup">Changeup</option>
              <option value="knuckleball">Knuckleball</option>
            </Select>
          </Box>
        )}

        {/* Pitch Tracking */}
        <Box
          data-testid="pitch-tracking"
          w="full"
          className={isMobile ? 'mobile-compact' : ''}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            Pitch Tracking
          </Text>
          <HStack spacing={2} justify="center" wrap="wrap">
            <Button
              data-testid="ball-button"
              colorScheme="blue"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={() => handlePitch('ball')}
              tabIndex={0}
            >
              Ball
            </Button>
            <Button
              data-testid="strike-button"
              colorScheme="red"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={() => handlePitch('strike')}
              tabIndex={0}
            >
              Strike
            </Button>
            <Button
              data-testid="foul-button"
              colorScheme="orange"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={() => handlePitch('foul')}
              tabIndex={0}
            >
              Foul
            </Button>
          </HStack>

          {/* Pitch History and Controls */}
          <HStack mt={3} justify="space-between" align="center">
            {showPitchHistory && (
              <Box flex={1}>
                <Text fontSize="xs" color={mutedColor} mb={1}>
                  Pitch History:
                </Text>
                <Text
                  data-testid="pitch-history"
                  fontSize="sm"
                  fontFamily="mono"
                  minH="20px"
                >
                  {pitchHistory
                    .map((p) => {
                      const typeAbbrev = p.type.charAt(0).toUpperCase();
                      let pitchTypeAbbrev = '';
                      if (p.pitchType) {
                        const pitchAbbreviations: Record<PitchType, string> = {
                          fastball: 'FB',
                          curveball: 'CB',
                          slider: 'SL',
                          changeup: 'CH',
                          knuckleball: 'KB',
                        };
                        pitchTypeAbbrev = ` (${pitchAbbreviations[p.pitchType]})`;
                      }
                      return `${typeAbbrev}${pitchTypeAbbrev}`;
                    })
                    .join('-')}
                </Text>
              </Box>
            )}

            <HStack spacing={2}>
              {enableUndo && (
                <IconButton
                  data-testid="undo-pitch-button"
                  aria-label="Undo last pitch"
                  icon={<RepeatIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={handleUndoPitch}
                  isDisabled={pitchHistory.length === 0}
                />
              )}
              <IconButton
                data-testid="clear-count-button"
                aria-label="Clear count"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                onClick={handleClearCount}
              />
            </HStack>
          </HStack>
        </Box>

        <Divider />

        {/* At-Bat Outcome Buttons */}
        <Box data-testid="outcome-buttons" w="full">
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            At-Bat Outcome
          </Text>
          <VStack spacing={3}>
            <HStack spacing={2} justify="center" wrap="wrap">
              <Button
                data-testid="single-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.single())}
              >
                Single
              </Button>
              <Button
                data-testid="double-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.double())}
              >
                Double
              </Button>
              <Button
                data-testid="triple-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.triple())}
              >
                Triple
              </Button>
              <Button
                data-testid="home-run-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.homeRun())}
              >
                Home Run
              </Button>
            </HStack>
            <HStack spacing={2} justify="center" wrap="wrap">
              <Button
                data-testid="walk-button"
                colorScheme="blue"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.walk())}
              >
                Walk
              </Button>
              <Button
                data-testid="strikeout-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.strikeout())}
              >
                Strikeout
              </Button>
              <Button
                data-testid="ground-out-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => handleAtBatComplete(BattingResult.groundOut())}
              >
                Ground Out
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      {/* Baserunner Advancement Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent data-testid="baserunner-advancement-modal">
          <ModalHeader>Baserunner Advancement</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {baserunners.first && (
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Runner on 1st: {baserunners.first.playerName}
                  </Text>
                  <Select
                    data-testid="runner-first-advancement"
                    placeholder="Select advancement"
                    onChange={(e) =>
                      handleBaserunnerAdvancementChange('first', e.target.value)
                    }
                  >
                    <option value="second">Advance to 2nd</option>
                    <option value="third">Advance to 3rd</option>
                    <option value="home">Score</option>
                    <option value="out">Out</option>
                    <option value="stay">Stay at 1st</option>
                  </Select>
                </Box>
              )}

              {baserunners.second && (
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Runner on 2nd: {baserunners.second.playerName}
                  </Text>
                  <Select
                    data-testid="runner-second-advancement"
                    placeholder="Select advancement"
                    onChange={(e) =>
                      handleBaserunnerAdvancementChange(
                        'second',
                        e.target.value
                      )
                    }
                  >
                    <option value="third">Advance to 3rd</option>
                    <option value="home">Score</option>
                    <option value="out">Out</option>
                    <option value="stay">Stay at 2nd</option>
                  </Select>
                </Box>
              )}

              {baserunners.third && (
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Runner on 3rd: {baserunners.third.playerName}
                  </Text>
                  <Select
                    data-testid="runner-third-advancement"
                    placeholder="Select advancement"
                    onChange={(e) =>
                      handleBaserunnerAdvancementChange('third', e.target.value)
                    }
                  >
                    <option value="home">Score</option>
                    <option value="out">Out</option>
                    <option value="stay">Stay at 3rd</option>
                  </Select>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-advancement"
              colorScheme="green"
              onClick={handleConfirmAdvancement}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
