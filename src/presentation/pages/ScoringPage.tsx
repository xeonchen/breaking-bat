import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useColorModeValue,
  useBreakpointValue,
  useToast,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { Scoreboard } from '@/presentation/components/Scoreboard';
import { AtBatForm } from '@/presentation/components/AtBatForm';
import { useGameStore } from '@/presentation/stores/gameStore';
import { BattingResult } from '@/domain';

export default function ScoringPage() {
  const {
    currentGame,
    teams,
    currentBatter,
    currentInning,
    isTopInning,
    baserunners,
    currentCount,
    loading,
    error,
    getCurrentGame,
    recordAtBat,
    updateScore,
    advanceInning,
    getTeams,
    getLineup,
    updateCount,
    suspendGame,
    completeGame,
    clearError,
  } = useGameStore();

  const [scoreUpdateAnnouncement, setScoreUpdateAnnouncement] = useState('');
  const {
    isOpen: isPauseOpen,
    onOpen: onPauseOpen,
    onClose: onPauseClose,
  } = useDisclosure();
  const {
    isOpen: isEndOpen,
    onOpen: onEndOpen,
    onClose: onEndClose,
  } = useDisclosure();
  const {
    isOpen: isStatsOpen,
    onOpen: onStatsOpen,
    onClose: onStatsClose,
  } = useDisclosure();

  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Load initial data
  useEffect(() => {
    getCurrentGame();
    getTeams();
    getLineup();
  }, [getCurrentGame, getTeams, getLineup]);

  // Handle at-bat completion
  const handleAtBatComplete = useCallback(
    async (atBatResult: {
      batterId: string;
      result: BattingResult;
      finalCount: { balls: number; strikes: number };
      pitchSequence?: string[];
      baserunnerAdvancement?: Record<string, string>;
    }) => {
      try {
        const result = await recordAtBat(atBatResult);

        if (result.runsScored && result.runsScored > 0) {
          await updateScore(result.runsScored);
          setScoreUpdateAnnouncement(
            `${result.runsScored} run${result.runsScored > 1 ? 's' : ''} scored!`
          );
          setTimeout(() => setScoreUpdateAnnouncement(''), 3000);
        }

        // Handle automatic count updates for balls/strikes
        if (
          atBatResult.result.value === 'BB' ||
          atBatResult.result.value === 'SO'
        ) {
          updateCount({ balls: 0, strikes: 0 });
        }

        // Check if inning should advance (3 outs)
        if (result.advanceInning) {
          await advanceInning();
        }
      } catch {
        toast({
          title: 'Error recording at-bat',
          description: 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [recordAtBat, updateScore, updateCount, advanceInning, toast]
  );

  // Handle game controls
  const handlePauseGame = useCallback(async () => {
    try {
      await suspendGame();
      onPauseClose();
      toast({
        title: 'Game paused',
        status: 'info',
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Error pausing game',
        status: 'error',
        duration: 3000,
      });
    }
  }, [suspendGame, onPauseClose, toast]);

  const handleEndGame = useCallback(async () => {
    try {
      await completeGame();
      onEndClose();
      toast({
        title: 'Game completed',
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Error ending game',
        status: 'error',
        duration: 3000,
      });
    }
  }, [completeGame, onEndClose, toast]);

  const handleRetry = useCallback(() => {
    clearError();
    getCurrentGame();
  }, [clearError, getCurrentGame]);

  // Get display text for inning
  const getInningText = useCallback(() => {
    const half = isTopInning ? 'Top' : 'Bottom';
    const inningNumber = currentInning;
    let suffix = 'th';

    if (inningNumber === 1) suffix = 'st';
    else if (inningNumber === 2) suffix = 'nd';
    else if (inningNumber === 3) suffix = 'rd';

    return `${half} ${inningNumber}${suffix}`;
  }, [currentInning, isTopInning]);

  // Loading state
  if (loading && !currentGame) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
        data-testid="loading-spinner"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading game data...</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" data-testid="error-message">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text>{error}</Text>
            <Button
              data-testid="retry-button"
              size="sm"
              onClick={handleRetry}
              variant="outline"
            >
              Retry
            </Button>
          </VStack>
        </Alert>
      </Box>
    );
  }

  // No game state
  if (!currentGame) {
    return (
      <Box p={6} textAlign="center">
        <Text color={mutedColor}>No active game found</Text>
        <Button mt={4} onClick={getCurrentGame}>
          Refresh
        </Button>
      </Box>
    );
  }

  const homeTeam = currentGame.isHomeGame()
    ? teams.find((t) => t.id === currentGame.teamId)?.name || 'Home'
    : currentGame.opponent;
  const awayTeam = currentGame.isAwayGame()
    ? teams.find((t) => t.id === currentGame.teamId)?.name || 'Away'
    : currentGame.opponent;

  return (
    <Box
      data-testid="scoring-page"
      role="main"
      aria-label="Live Scoring Page"
      p={{ base: 4, md: 6 }}
      className={isMobile ? 'mobile-layout' : ''}
    >
      <VStack spacing={6} align="stretch">
        {/* Page Header */}
        <Box>
          <Heading
            data-testid="page-header"
            size={{ base: 'lg', md: 'xl' }}
            mb={2}
          >
            Live Scoring
          </Heading>
          <VStack align="start" spacing={1}>
            <Text
              data-testid="game-title"
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="semibold"
            >
              {currentGame.name}
            </Text>
            <HStack spacing={4} wrap="wrap">
              <Text data-testid="opponent-info" color={mutedColor}>
                {currentGame.getVenueText()} {currentGame.opponent}
              </Text>
              <Badge
                data-testid="page-game-status"
                colorScheme={
                  currentGame.status === 'in_progress' ? 'green' : 'gray'
                }
              >
                {currentGame.status === 'in_progress'
                  ? 'In Progress'
                  : currentGame.status}
              </Badge>
              <Text data-testid="current-inning-info" color={mutedColor}>
                {getInningText()}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Score Update Announcement for Screen Readers */}
        <Box
          data-testid="score-update-announcement"
          aria-live="polite"
          aria-atomic="true"
          position="absolute"
          left="-10000px"
          width="1px"
          height="1px"
          overflow="hidden"
        >
          {scoreUpdateAnnouncement}
        </Box>

        {/* Scoreboard Section */}
        <Box data-testid="scoreboard-section">
          {currentGame.finalScore && (
            <Scoreboard
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeScore={currentGame.finalScore.homeScore}
              awayScore={currentGame.finalScore.awayScore}
              currentInning={currentInning}
              isTopInning={isTopInning}
              isGameComplete={currentGame.status === 'completed'}
              inningScores={currentGame.finalScore.inningScores.map(
                (score) => ({
                  inning: score.inning,
                  home: score.homeRuns,
                  away: score.awayRuns,
                })
              )}
              isMobile={isMobile}
              animateChanges={true}
              onScoreChange={() => {
                // Handle real-time score updates if needed
              }}
            />
          )}
        </Box>

        {/* At-Bat Section */}
        <Box data-testid="at-bat-section">
          <AtBatForm
            currentBatter={currentBatter}
            baserunners={baserunners}
            currentCount={currentCount}
            onAtBatComplete={handleAtBatComplete}
            showBaserunnerOptions={true}
            showPitchHistory={true}
            enablePitchTypes={false}
            enableUndo={true}
            isMobile={isMobile}
          />
        </Box>

        <Divider />

        {/* Game Controls */}
        <Box data-testid="game-controls">
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            Game Controls
          </Text>
          <Flex direction={{ base: 'column', md: 'row' }} gap={3} wrap="wrap">
            <Button
              data-testid="pause-game-button"
              colorScheme="orange"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={onPauseOpen}
            >
              Pause Game
            </Button>
            <Button
              data-testid="end-game-button"
              colorScheme="red"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={onEndOpen}
            >
              End Game
            </Button>
            <Button
              data-testid="view-stats-button"
              colorScheme="blue"
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={onStatsOpen}
            >
              View Stats
            </Button>
          </Flex>
        </Box>
      </VStack>

      {/* Pause Game Modal */}
      <Modal isOpen={isPauseOpen} onClose={onPauseClose}>
        <ModalOverlay />
        <ModalContent data-testid="pause-game-modal" aria-modal="true">
          <ModalHeader>Pause Game</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure you want to pause the current game? This will suspend
              the game and you can resume it later.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPauseClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-pause-button"
              colorScheme="orange"
              onClick={handlePauseGame}
            >
              Pause Game
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* End Game Modal */}
      <Modal isOpen={isEndOpen} onClose={onEndClose}>
        <ModalOverlay />
        <ModalContent data-testid="end-game-modal" aria-modal="true">
          <ModalHeader>End Game</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure you want to end the current game? This will finalize
              the score and complete the game.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEndClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-end-button"
              colorScheme="red"
              onClick={handleEndGame}
            >
              End Game
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Game Stats Modal */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl">
        <ModalOverlay />
        <ModalContent data-testid="game-stats-modal" aria-modal="true">
          <ModalHeader>Game Statistics</ModalHeader>
          <ModalBody>
            <Box data-testid="batting-stats">
              <Heading size="md" mb={4}>
                Batting Statistics
              </Heading>
              <Text color={mutedColor}>
                Game statistics will be displayed here.
              </Text>
              {/* In a real implementation, this would show detailed game stats */}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onStatsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
