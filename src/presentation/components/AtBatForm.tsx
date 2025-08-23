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
  Collapse,
  Flex,
} from '@chakra-ui/react';
import {
  RepeatIcon,
  DeleteIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import {
  PresentationPosition,
  PresentationBattingResult,
  PresentationBattingHelper,
} from '../types/presentation-values';
import { useState, useEffect, useCallback } from 'react';

/**
 * Convert a number to its ordinal string representation
 * Following the UI schema specification in live-scoring.yaml
 */
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  // Handle special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`;
  }

  // Handle regular cases
  switch (lastDigit) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

interface CurrentBatter {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  position: PresentationPosition;
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
  currentOuts?: number; // Enhanced AC003A: out count for contextual button enablement
  onAtBatComplete: (result: {
    batterId: string;
    result: PresentationBattingResult;
    finalCount: { balls: number; strikes: number };
    pitchSequence?: string[];
    baserunnerAdvancement?: Record<string, string>;
  }) => void;
  showBaserunnerOptions?: boolean;
  showPitchHistory?: boolean;
  enablePitchTypes?: boolean;
  enableUndo?: boolean;
  isMobile?: boolean;
  disabled?: boolean;
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
  currentOuts = 0, // Enhanced AC003A: default to 0 outs
  onAtBatComplete,
  showBaserunnerOptions = false,
  showPitchHistory = false,
  enablePitchTypes = false,
  enableUndo = false,
  isMobile = false,
  disabled = false,
}: AtBatFormProps) {
  const [count, setCount] = useState<Count>(initialCount);
  const [pitchHistory, setPitchHistory] = useState<Pitch[]>([]);
  const [selectedPitchType, setSelectedPitchType] =
    useState<PitchType>('fastball');
  const [baserunnerAdvancement, setBaserunnerAdvancement] =
    useState<BaserunnerAdvancement>({});
  const [hasError, setHasError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPitchTrackingCollapsed, setIsPitchTrackingCollapsed] = useState(
    () => {
      // AC046A: Pitch tracking defaults to collapsed for streamlined scoring experience
      if (typeof window !== 'undefined') {
        try {
          const storedValue = localStorage.getItem('pitch-tracking-collapsed');
          // Default to true (collapsed) if no preference stored or invalid value
          if (storedValue === null) return true;
          if (storedValue === 'true') return true;
          if (storedValue === 'false') return false;
          // Invalid values default to collapsed
          return true;
        } catch {
          // If localStorage fails, default to collapsed
          return true;
        }
      }
      return true; // Default to collapsed
    }
  );

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingResult, setPendingResult] =
    useState<PresentationBattingResult | null>(null);

  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const elevatedBg = useColorModeValue('white', 'gray.700');

  // Update count from props
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // AC046B: Calculate default baserunner advancement based on batting result
  const calculateDefaultAdvancement = useCallback(
    (
      result: PresentationBattingResult,
      runners: Baserunners
    ): BaserunnerAdvancement => {
      const defaults: BaserunnerAdvancement = {};

      switch (result) {
        case PresentationBattingResult.SINGLE: // Single - runners advance 1 base
          if (runners.first) defaults.first = 'second';
          if (runners.second) defaults.second = 'home';
          if (runners.third) defaults.third = 'home';
          break;

        case PresentationBattingResult.DOUBLE: // Double - runners advance 2 bases
          if (runners.first) defaults.first = 'third';
          if (runners.second) defaults.second = 'home';
          if (runners.third) defaults.third = 'home';
          break;

        case PresentationBattingResult.TRIPLE: // Triple - all runners score
          if (runners.first) defaults.first = 'home';
          if (runners.second) defaults.second = 'home';
          if (runners.third) defaults.third = 'home';
          break;

        case PresentationBattingResult.HOME_RUN: // Home run - all runners score (grand slam)
          if (runners.first) defaults.first = 'home';
          if (runners.second) defaults.second = 'home';
          if (runners.third) defaults.third = 'home';
          break;

        case PresentationBattingResult.WALK: // Walk - only forced runners advance
        case PresentationBattingResult.INTENTIONAL_WALK: {
          // Intentional walk - only forced runners advance
          // Force advancement logic for walks

          // If first base occupied, runner must advance to second
          if (runners.first) {
            defaults.first = 'second';

            // If second also occupied, second base runner must advance to third
            if (runners.second) {
              defaults.second = 'third';

              // If third also occupied (bases loaded), third base runner must score
              if (runners.third) {
                defaults.third = 'home';
              }
              // Note: If third base is empty, second base runner still advances to third (forced by walk)
            } else {
              // Second base empty, only first base runner forced
              if (runners.third) defaults.third = 'stay';
            }
          } else {
            // First base empty, no runners forced to advance
            if (runners.second) defaults.second = 'stay';
            if (runners.third) defaults.third = 'stay';
          }
          break;
        }

        case PresentationBattingResult.ERROR: // Error - depends on error type, default to conservative advancement
          // Conservative defaults for errors - typically batter reaches first, others advance 1 base
          if (runners.first) defaults.first = 'second';
          if (runners.second) defaults.second = 'third';
          if (runners.third) defaults.third = 'home';
          break;

        case PresentationBattingResult.FIELDERS_CHOICE: // Fielders Choice - typically batter reaches first, lead runner forced out
          // Default: batter safe at first, lead runner typically out
          if (runners.first) defaults.first = 'out'; // Most common FC scenario
          if (runners.second) defaults.second = 'stay'; // Not forced unless bases loaded
          if (runners.third) defaults.third = 'stay'; // Not forced unless bases loaded
          break;

        case PresentationBattingResult.SACRIFICE_FLY: // Sacrifice Fly - batter out, runners may advance (especially from third)
          // Default: runner on third scores, others may advance one base
          if (runners.first) defaults.first = 'second'; // Tag up and advance
          if (runners.second) defaults.second = 'third'; // Tag up and advance
          if (runners.third) defaults.third = 'home'; // Standard sacrifice fly - runner scores
          break;

        default:
          // For other results, no defaults - user must choose
          break;
      }

      return defaults;
    },
    []
  );

  // Set default advancement when modal opens
  useEffect(() => {
    if (isOpen && pendingResult) {
      const defaultAdvancement = calculateDefaultAdvancement(
        pendingResult,
        baserunners
      );
      setBaserunnerAdvancement(defaultAdvancement);
    }
  }, [isOpen, pendingResult, baserunners, calculateDefaultAdvancement]);

  // Validate count boundaries
  const isValidCount = count.balls < 4 && count.strikes < 3;

  const handleAtBatComplete = useCallback(
    (result: PresentationBattingResult, finalCount?: Count) => {
      if (!currentBatter) {
        return;
      }
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

      // AC046C: Home runs never require advancement modal - let domain logic handle automatically
      if (result === PresentationBattingResult.HOME_RUN) {
        try {
          // Home runs use standard domain logic - no manual advancement needed
          const homeRunResult = {
            ...atBatResult,
            baserunnerAdvancement: undefined, // Home runs never use manual advancement
          };
          onAtBatComplete(homeRunResult);
          setHasError(false);
        } catch (error) {
          console.error(
            '❌ AtBatForm: Error in onAtBatComplete for home run:',
            error
          );
          setHasError(true);
          toast({
            title: 'Error recording home run',
            description: 'Please try again',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
        return;
      }

      // AC016A: Show baserunner modal only when runners present and advancement needed
      const hasRunners = Object.values(baserunners).some(
        (runner) => runner !== null
      );
      const requiresAdvancement = [
        PresentationBattingResult.SINGLE,
        PresentationBattingResult.DOUBLE,
        PresentationBattingResult.TRIPLE,
        PresentationBattingResult.WALK,
        PresentationBattingResult.ERROR,
        PresentationBattingResult.FIELDERS_CHOICE,
        PresentationBattingResult.SACRIFICE_FLY,
      ].includes(result);
      if (showBaserunnerOptions && hasRunners && requiresAdvancement) {
        setPendingResult(result);
        onOpen();
        return;
      }

      try {
        onAtBatComplete(atBatResult);
        setHasError(false);
      } catch (error) {
        console.error('❌ AtBatForm: Error in onAtBatComplete:', error);
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
      baserunners,
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
        handleAtBatComplete(PresentationBattingResult.WALK, newCount);
      } else if (newCount.strikes === 3) {
        handleAtBatComplete(PresentationBattingResult.STRIKEOUT, newCount);
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

  const handleTogglePitchTracking = useCallback(() => {
    const newCollapsed = !isPitchTrackingCollapsed;
    setIsPitchTrackingCollapsed(newCollapsed);
    // AC046A: Persist collapse preference
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'pitch-tracking-collapsed',
          newCollapsed.toString()
        );
      } catch {
        // If localStorage fails, continue without persistence
        console.warn('Failed to persist pitch tracking preference');
      }
    }
  }, [isPitchTrackingCollapsed]);

  // AC003A: Enhanced contextual fast-action button enablement (runners + out count)
  const getButtonState = useCallback(
    (buttonType: string) => {
      const hasRunners = Object.values(baserunners).some(
        (runner) => runner !== null && runner !== undefined
      );
      const hasThirdBaseRunner =
        baserunners.third !== null && baserunners.third !== undefined;
      const twoOuts = currentOuts === 2;

      switch (buttonType) {
        case 'dp': // Double Play - requires runners AND ≤1 outs
          if (twoOuts) {
            return {
              enabled: false,
              tooltip: 'Impossible with 2 outs',
            };
          }
          return {
            enabled: hasRunners,
            tooltip: hasRunners ? null : 'No runners for double play',
          };
        case 'sf': // Sacrifice Fly - requires third base runner AND ≤1 outs
          if (twoOuts) {
            return {
              enabled: false,
              tooltip: 'Impossible with 2 outs',
            };
          }
          return {
            enabled: hasThirdBaseRunner,
            tooltip: hasThirdBaseRunner ? null : 'No runner on third base',
          };
        case 'fc': // Fielders Choice - requires runners AND ≤1 outs
          if (twoOuts) {
            return {
              enabled: false,
              tooltip: 'Impossible with 2 outs',
            };
          }
          return {
            enabled: hasRunners,
            tooltip: hasRunners ? null : 'No runners on base',
          };
        default:
          return { enabled: true, tooltip: null };
      }
    },
    [baserunners, currentOuts]
  );

  // AC017A-C: Baserunner advancement validation
  const validateAdvancement = useCallback(() => {
    const errors: string[] = [];
    // Get runners that need selections
    const runnersNeedingSelection = Object.keys(baserunners).filter(
      (base) =>
        baserunners[base as keyof Baserunners] !== null &&
        baserunners[base as keyof Baserunners] !== undefined
    );

    // AC017A: All selections required
    for (const base of runnersNeedingSelection) {
      const advancement =
        baserunnerAdvancement[base as keyof BaserunnerAdvancement];
      if (!advancement) {
        const runnerName =
          baserunners[base as keyof Baserunners]?.playerName || 'Runner';
        errors.push(
          `Please select advancement for ${runnerName} on ${base} base`
        );
      }
    }

    // AC017B: No runners can disappear
    for (const base of runnersNeedingSelection) {
      const advancement =
        baserunnerAdvancement[base as keyof BaserunnerAdvancement];
      if (
        advancement &&
        !['second', 'third', 'home', 'out', 'stay'].includes(advancement)
      ) {
        errors.push(`Invalid advancement selection: ${advancement}`);
      }
    }

    // AC017C: No base conflicts
    const finalPositions: Record<string, string[]> = {
      first: [],
      second: [],
      third: [],
    };

    // Add batter if they reach base (for hits)
    if (pendingResult && PresentationBattingHelper.reachesBase(pendingResult)) {
      finalPositions.first.push('Batter');
    }

    // Process existing runners
    Object.entries(baserunnerAdvancement).forEach(([fromBase, advancement]) => {
      const runner = baserunners[fromBase as keyof Baserunners];
      if (
        runner &&
        advancement &&
        advancement !== 'home' &&
        advancement !== 'out'
      ) {
        const targetBase = advancement === 'stay' ? fromBase : advancement;
        if (finalPositions[targetBase]) {
          finalPositions[targetBase].push(runner.playerName);
        }
      }
    });

    // Check for conflicts
    Object.entries(finalPositions).forEach(([base, runners]) => {
      if (runners.length > 1) {
        errors.push(
          `Multiple runners cannot occupy ${base} base: ${runners.join(', ')}`
        );
      }
    });

    return errors;
  }, [baserunners, baserunnerAdvancement, pendingResult]);

  // Update validation when advancement changes
  useEffect(() => {
    if (isOpen) {
      const errors = validateAdvancement();
      setValidationErrors(errors);
    }
  }, [baserunnerAdvancement, isOpen, validateAdvancement]);

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
      opacity={disabled ? 0.6 : 1}
      transition="opacity 0.3s ease"
    >
      <VStack spacing={6}>
        {/* Current Batter Info */}
        <Box data-testid="current-batter" textAlign="center" w="full">
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
            #{currentBatter.jerseyNumber} {currentBatter.playerName}
          </Text>
          <Text
            data-testid="batting-order-display"
            color={mutedColor}
            fontSize="sm"
          >
            {getOrdinalSuffix(currentBatter.battingOrder)} Batter
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

        {/* Baserunner Status - AC009A: Field-accurate layout */}
        <Box w="full">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Baserunners
          </Text>
          <Box
            data-testid="baserunner-field-layout"
            position="relative"
            width="100%"
            minHeight={isMobile ? '100px' : '120px'}
            padding={4}
          >
            {/* Third Base - Left */}
            <Box
              position="absolute"
              left="10%"
              bottom="20px"
              textAlign="center"
            >
              <Text fontSize="xs" color={mutedColor} mb={1}>
                3rd
              </Text>
              <Badge
                data-testid="baserunner-third"
                variant={baserunners.third ? 'solid' : 'outline'}
                colorScheme={baserunners.third ? 'blue' : 'gray'}
                fontSize="xs"
                minWidth="60px"
                textAlign="center"
              >
                {baserunners.third ? baserunners.third.playerName : 'Empty'}
              </Badge>
            </Box>

            {/* Second Base - Center, Elevated */}
            <Box
              position="absolute"
              left="50%"
              top="10px"
              transform="translateX(-50%)"
              textAlign="center"
              className="elevated"
              boxShadow="0 4px 8px rgba(0,0,0,0.1)"
              borderRadius="md"
              padding={1}
              backgroundColor={elevatedBg}
            >
              <Text fontSize="xs" color={mutedColor} mb={1}>
                2nd
              </Text>
              <Badge
                data-testid="baserunner-second"
                variant={baserunners.second ? 'solid' : 'outline'}
                colorScheme={baserunners.second ? 'blue' : 'gray'}
                fontSize="xs"
                minWidth="60px"
                textAlign="center"
              >
                {baserunners.second ? baserunners.second.playerName : 'Empty'}
              </Badge>
            </Box>

            {/* First Base - Right */}
            <Box
              position="absolute"
              right="10%"
              bottom="20px"
              textAlign="center"
            >
              <Text fontSize="xs" color={mutedColor} mb={1}>
                1st
              </Text>
              <Badge
                data-testid="baserunner-first"
                variant={baserunners.first ? 'solid' : 'outline'}
                colorScheme={baserunners.first ? 'blue' : 'gray'}
                fontSize="xs"
                minWidth="60px"
                textAlign="center"
              >
                {baserunners.first ? baserunners.first.playerName : 'Empty'}
              </Badge>
            </Box>
          </Box>
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
              isDisabled={disabled}
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
          data-testid="pitch-tracking-section"
          w="full"
          className={isMobile ? 'mobile-compact' : ''}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold">
              Pitch Tracking
            </Text>
            <IconButton
              data-testid="pitch-tracking-toggle"
              icon={
                isPitchTrackingCollapsed ? (
                  <ChevronDownIcon />
                ) : (
                  <ChevronUpIcon />
                )
              }
              size="sm"
              variant="ghost"
              aria-label="Toggle pitch tracking section"
              onClick={handleTogglePitchTracking}
              isDisabled={disabled}
            />
          </Flex>
          <Collapse in={!isPitchTrackingCollapsed} animateOpacity>
            <VStack spacing={3}>
              <HStack spacing={2} justify="center" wrap="wrap">
                <Button
                  data-testid="ball-button"
                  colorScheme="blue"
                  variant="outline"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => handlePitch('ball')}
                  tabIndex={0}
                  isDisabled={disabled}
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
                  isDisabled={disabled}
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
                  isDisabled={disabled}
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
                            const pitchAbbreviations: Record<
                              PitchType,
                              string
                            > = {
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
                      isDisabled={disabled || pitchHistory.length === 0}
                    />
                  )}
                  <IconButton
                    data-testid="clear-count-button"
                    aria-label="Clear count"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={handleClearCount}
                    isDisabled={disabled}
                  />
                </HStack>
              </HStack>
            </VStack>
          </Collapse>
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
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.SINGLE)
                }
                isDisabled={disabled}
              >
                Single
              </Button>
              <Button
                data-testid="double-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.DOUBLE)
                }
                isDisabled={disabled}
              >
                Double
              </Button>
              <Button
                data-testid="triple-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.TRIPLE)
                }
                isDisabled={disabled}
              >
                Triple
              </Button>
              <Button
                data-testid="home-run-button"
                colorScheme="green"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.HOME_RUN)
                }
                isDisabled={disabled}
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
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.WALK)
                }
                isDisabled={disabled}
              >
                Walk
              </Button>
              <Button
                data-testid="ibb-button"
                colorScheme="blue"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(
                    PresentationBattingResult.INTENTIONAL_WALK
                  )
                }
                isDisabled={disabled}
              >
                IBB
              </Button>
              <Button
                data-testid="sf-button"
                colorScheme="orange"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.SACRIFICE_FLY)
                }
                isDisabled={disabled || !getButtonState('sf').enabled}
                title={getButtonState('sf').tooltip || undefined}
              >
                Sac Fly
              </Button>
              <Button
                data-testid="error-button"
                colorScheme="yellow"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.ERROR)
                }
                isDisabled={disabled}
              >
                Error
              </Button>
            </HStack>
            <HStack spacing={2} justify="center" wrap="wrap">
              <Button
                data-testid="fc-button"
                colorScheme="purple"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.FIELDERS_CHOICE)
                }
                isDisabled={disabled || !getButtonState('fc').enabled}
                title={getButtonState('fc').tooltip || undefined}
              >
                FC
              </Button>
              <Button
                data-testid="strikeout-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.STRIKEOUT)
                }
                isDisabled={disabled}
              >
                Strikeout
              </Button>
              <Button
                data-testid="ground-out-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.GROUND_OUT)
                }
                isDisabled={disabled}
              >
                Ground Out
              </Button>
              <Button
                data-testid="air-out-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.AIR_OUT)
                }
                isDisabled={disabled}
              >
                Air Out
              </Button>
              <Button
                data-testid="dp-button"
                colorScheme="red"
                variant="outline"
                size={isMobile ? 'sm' : 'md'}
                onClick={() =>
                  handleAtBatComplete(PresentationBattingResult.DOUBLE_PLAY)
                }
                isDisabled={disabled || !getButtonState('dp').enabled}
                title={getButtonState('dp').tooltip || undefined}
              >
                Double Play
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
              {/* AC017A-C: Validation Errors Display */}
              {validationErrors.length > 0 && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Advancement Validation Errors
                    </Text>
                    <VStack align="start" spacing={1}>
                      {validationErrors.map((error, index) => (
                        <Text key={index} fontSize="sm">
                          {error}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                </Alert>
              )}
              {baserunners.first && (
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Runner on 1st: {baserunners.first.playerName}
                  </Text>
                  <Select
                    data-testid="runner-first-advancement"
                    placeholder="Select advancement"
                    value={baserunnerAdvancement.first || ''}
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
                    value={baserunnerAdvancement.second || ''}
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
                    value={baserunnerAdvancement.third || ''}
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
              colorScheme={validationErrors.length > 0 ? 'gray' : 'green'}
              onClick={handleConfirmAdvancement}
              isDisabled={validationErrors.length > 0}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
