import {
  Box,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Collapse,
  IconButton,
  useDisclosure,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const MotionBox = motion.create(Box);

interface InningScore {
  inning: number;
  home: number;
  away: number;
}

interface ScoreboardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  currentInning: number;
  isTopInning: boolean;
  isGameComplete: boolean;
  inningScores?: InningScore[];
  homeHits?: number;
  awayHits?: number;
  homeErrors?: number;
  awayErrors?: number;
  isMobile?: boolean;
  animateChanges?: boolean;
  onScoreChange?: (homeScore: number, awayScore: number) => void;
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  currentInning,
  isTopInning,
  isGameComplete,
  inningScores,
  homeHits,
  awayHits,
  homeErrors,
  awayErrors,
  isMobile = false,
  animateChanges = false,
  onScoreChange,
}: ScoreboardProps) {
  const { isOpen, onToggle } = useDisclosure();
  const [prevHomeScore, setPrevHomeScore] = useState(homeScore);
  const [prevAwayScore, setPrevAwayScore] = useState(awayScore);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const winningColor = useColorModeValue('brand.500', 'brand.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const isHomeWinning = homeScore > awayScore;
  const isAwayWinning = awayScore > homeScore;
  const battingTeam = isTopInning ? awayTeam : homeTeam;

  // Handle score change animations and callbacks
  useEffect(() => {
    if (homeScore !== prevHomeScore || awayScore !== prevAwayScore) {
      onScoreChange?.(homeScore, awayScore);
      setPrevHomeScore(homeScore);
      setPrevAwayScore(awayScore);
    }
  }, [homeScore, awayScore, prevHomeScore, prevAwayScore, onScoreChange]);

  const ScoreDisplay = ({
    score,
    isWinning,
    testId,
  }: {
    score: number;
    isWinning: boolean;
    testId: string;
  }) => (
    <MotionBox
      data-testid={testId}
      fontSize={{ base: '3xl', md: '4xl' }}
      fontWeight="bold"
      color={isWinning ? winningColor : textColor}
      className={animateChanges ? 'animate-score' : ''}
      animate={animateChanges ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {score}
    </MotionBox>
  );

  const TeamDisplay = ({
    team,
    isWinning,
    testId,
  }: {
    team: string;
    isWinning: boolean;
    testId: string;
  }) => (
    <Text
      data-testid={testId}
      fontSize={{ base: 'lg', md: 'xl' }}
      fontWeight={isWinning ? 'bold' : 'medium'}
      color={isWinning ? winningColor : textColor}
      className={isWinning ? 'winning-team' : ''}
    >
      {team}
    </Text>
  );

  return (
    <Box
      data-testid="scoreboard"
      role="region"
      aria-label="Game Scoreboard"
      aria-live="polite"
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
      className={isMobile ? 'mobile-layout' : ''}
    >
      {/* Main Score Display */}
      <VStack spacing={4}>
        {/* Game Status */}
        <HStack justify="space-between" w="full">
          <Badge
            data-testid="game-status"
            colorScheme={isGameComplete ? 'red' : 'green'}
            variant="solid"
            fontSize="sm"
          >
            {isGameComplete ? 'Final' : `Inning ${currentInning}`}
          </Badge>

          {!isGameComplete && (
            <Badge
              data-testid="inning-half"
              variant="outline"
              colorScheme="blue"
            >
              {isTopInning ? 'Top' : 'Bottom'}
            </Badge>
          )}
        </HStack>

        {/* Team Names and Scores */}
        <VStack spacing={4} w="full">
          {/* Away Team */}
          <Flex align="center" w="full">
            <TeamDisplay
              team={awayTeam}
              isWinning={isAwayWinning}
              testId="away-team-display"
            />
            <Spacer />
            <ScoreDisplay
              score={awayScore}
              isWinning={isAwayWinning}
              testId="away-score"
            />
          </Flex>

          {/* Home Team */}
          <Flex align="center" w="full">
            <TeamDisplay
              team={homeTeam}
              isWinning={isHomeWinning}
              testId="home-team-display"
            />
            <Spacer />
            <ScoreDisplay
              score={homeScore}
              isWinning={isHomeWinning}
              testId="home-score"
            />
          </Flex>
        </VStack>

        {/* Current Inning Info */}
        <HStack justify="center" spacing={4}>
          <Text data-testid="current-inning" color={mutedColor}>
            Inning: {currentInning}
          </Text>
          {!isGameComplete && (
            <Text
              data-testid="batting-indicator"
              color={mutedColor}
              fontWeight="medium"
            >
              {battingTeam} Batting
            </Text>
          )}
        </HStack>

        {/* Inning-by-Inning Scores */}
        {inningScores && (
          <>
            {isMobile ? (
              // Mobile: Collapsible inning scores
              <VStack w="full" spacing={2}>
                <IconButton
                  data-testid="expand-inning-scores"
                  aria-label="Toggle inning scores"
                  icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                />
                <Collapse in={isOpen}>
                  <InningScoresTable
                    inningScores={inningScores}
                    homeHits={homeHits}
                    awayHits={awayHits}
                    homeErrors={homeErrors}
                    awayErrors={awayErrors}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    isCompact={true}
                  />
                </Collapse>
              </VStack>
            ) : (
              // Desktop: Always visible inning scores
              <InningScoresTable
                inningScores={inningScores}
                homeHits={homeHits}
                awayHits={awayHits}
                homeErrors={homeErrors}
                awayErrors={awayErrors}
                homeScore={homeScore}
                awayScore={awayScore}
                isCompact={false}
              />
            )}
          </>
        )}
      </VStack>
    </Box>
  );
}

interface InningScoresTableProps {
  inningScores: InningScore[];
  homeHits?: number;
  awayHits?: number;
  homeErrors?: number;
  awayErrors?: number;
  homeScore: number;
  awayScore: number;
  isCompact: boolean;
}

function InningScoresTable({
  inningScores,
  homeHits,
  awayHits,
  homeErrors,
  awayErrors,
  homeScore,
  awayScore,
  isCompact,
}: InningScoresTableProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box data-testid="inning-scores-table" overflowX="auto" w="full">
      <Table size={isCompact ? 'sm' : 'md'} variant="simple">
        <Thead>
          <Tr>
            <Th>Team</Th>
            {inningScores.map((inning) => (
              <Th key={inning.inning} textAlign="center" minW="40px">
                {inning.inning}
              </Th>
            ))}
            <Th textAlign="center">R</Th>
            {homeHits !== undefined && <Th textAlign="center">H</Th>}
            {homeErrors !== undefined && <Th textAlign="center">E</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {/* Away Team Row */}
          <Tr>
            <Td fontWeight="medium">{inningScores[0] ? 'Away' : ''}</Td>
            {inningScores.map((inning) => (
              <Td
                key={`away-${inning.inning}`}
                data-testid={`away-inning-${inning.inning}`}
                textAlign="center"
                borderColor={borderColor}
              >
                {inning.away}
              </Td>
            ))}
            <Td
              data-testid="away-total-runs"
              textAlign="center"
              fontWeight="bold"
              borderColor={borderColor}
            >
              {awayScore}
            </Td>
            {awayHits !== undefined && (
              <Td
                data-testid="away-hits"
                textAlign="center"
                borderColor={borderColor}
              >
                {awayHits}
              </Td>
            )}
            {awayErrors !== undefined && (
              <Td
                data-testid="away-errors"
                textAlign="center"
                borderColor={borderColor}
              >
                {awayErrors}
              </Td>
            )}
          </Tr>

          {/* Home Team Row */}
          <Tr>
            <Td fontWeight="medium">Home</Td>
            {inningScores.map((inning) => (
              <Td
                key={`home-${inning.inning}`}
                data-testid={`home-inning-${inning.inning}`}
                textAlign="center"
                borderColor={borderColor}
              >
                {inning.home}
              </Td>
            ))}
            <Td
              data-testid="home-total-runs"
              textAlign="center"
              fontWeight="bold"
              borderColor={borderColor}
            >
              {homeScore}
            </Td>
            {homeHits !== undefined && (
              <Td
                data-testid="home-hits"
                textAlign="center"
                borderColor={borderColor}
              >
                {homeHits}
              </Td>
            )}
            {homeErrors !== undefined && (
              <Td
                data-testid="home-errors"
                textAlign="center"
                borderColor={borderColor}
              >
                {homeErrors}
              </Td>
            )}
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}
