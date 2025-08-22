import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  IScoringApplicationService,
  PresentationBaserunnerState,
} from '@/application/services/interfaces/IScoringApplicationService';
import {
  IGameApplicationService,
  ITeamApplicationService,
  UpdateGameCommand,
} from '@/application/services/interfaces';
import { GameDto } from '@/application/services/interfaces/IGameApplicationService';
import { TeamDto } from '@/application/services/interfaces/ITeamApplicationService';
import { GameDTO } from '../types/presentation-entities';
import {
  PresentationPosition,
  PresentationBattingResult,
  PresentationGameStatus,
  PresentationBattingHelper,
} from '../types/presentation-values';
import { DomainAdapter } from '@/presentation/adapters/DomainAdapter';

// Helper function to convert GameDto to GameDTO (temporary until proper mapping is implemented)
function convertGameDtoToDTO(dto: GameDto): GameDTO {
  const gameDTO = {
    id: dto.id,
    name: dto.name,
    opponent: dto.opponent,
    date: dto.date,
    seasonId: dto.seasonId || '',
    homeTeamId: dto.teamId, // Assuming teamId is home team
    awayTeamId: '', // TODO: Add proper away team ID
    teamId: dto.teamId,
    gameTypeId: dto.gameTypeId || '',
    status:
      dto.status === 'scheduled'
        ? PresentationGameStatus.SETUP
        : dto.status === 'in_progress'
          ? PresentationGameStatus.IN_PROGRESS
          : dto.status === 'completed'
            ? PresentationGameStatus.COMPLETED
            : PresentationGameStatus.SUSPENDED,
    currentInning: dto.currentInning || 1,
    isTopInning: dto.isTopInning || true,
    homeScore: dto.score?.homeScore || 0,
    awayScore: dto.score?.awayScore || 0,
    lineupId: undefined,
    currentBatterId: undefined,
    currentBaserunners: {
      first: null,
      second: null,
      third: null,
    },
    totalInnings: 9, // Default
    finalScore: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add missing computed methods
    isHomeGame() {
      return dto.isHomeGame || false;
    },
    isAwayGame() {
      return !dto.isHomeGame;
    },
    getVenueText() {
      const location = dto.location || 'Unknown Location';
      const homeAway = dto.isHomeGame ? 'vs' : '@';
      return `${homeAway} ${location}`;
    },
  };

  return gameDTO as GameDTO;
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

interface AtBatResult {
  batterId: string;
  result: PresentationBattingResult;
  finalCount: Count;
  pitchSequence?: string[];
  baserunnerAdvancement?: Record<string, string>;
  runsScored?: number;
  nextBatter?: CurrentBatter;
  advanceInning?: boolean;
  newBaserunners?: Baserunners;
}

interface GameState {
  // State
  currentGame: GameDTO | null;
  teams: TeamDto[];
  lineup: CurrentBatter[];
  currentBatter: CurrentBatter | null;
  currentInning: number;
  isTopInning: boolean;
  baserunners: Baserunners;
  currentCount: Count;
  currentOuts: number;
  loading: boolean;
  error: string | null;

  // Actions
  getCurrentGame: () => Promise<void>;
  loadGame: (gameId: string) => Promise<void>;
  updateGame: (game: GameDTO) => Promise<void>;
  startGame: (lineupId: string) => Promise<void>;
  resumeGame: () => Promise<void>;
  recordAtBat: (atBatResult: AtBatResult) => Promise<AtBatResult>;
  advanceInning: () => Promise<void>;
  updateScore: (runsScored: number) => Promise<void>;
  getTeams: () => Promise<void>;
  getLineup: () => Promise<void>;
  setCurrentBatter: (batter: CurrentBatter) => void;
  updateBaserunners: (baserunners: Baserunners) => void;
  updateCount: (count: Count) => void;
  updateOuts: (outs: number) => void;
  advanceToNextBatter: () => void;
  suspendGame: () => Promise<void>;
  completeGame: () => Promise<void>;
  clearError: () => void;
}

// Application services - will be injected in production
let gameApplicationService: IGameApplicationService;
let teamApplicationService: ITeamApplicationService;
let scoringService: IScoringApplicationService;

// Helper functions for baserunner state conversion
const convertToBaserunnerState = (
  baserunners: Baserunners
): PresentationBaserunnerState => {
  return {
    first: baserunners.first
      ? {
          playerId: baserunners.first.playerId,
          playerName: baserunners.first.playerName,
        }
      : null,
    second: baserunners.second
      ? {
          playerId: baserunners.second.playerId,
          playerName: baserunners.second.playerName,
        }
      : null,
    third: baserunners.third
      ? {
          playerId: baserunners.third.playerId,
          playerName: baserunners.third.playerName,
        }
      : null,
  };
};

const convertFromBaserunnerState = (
  baserunnerState: PresentationBaserunnerState
): Baserunners => {
  return {
    first: baserunnerState.first,
    second: baserunnerState.second,
    third: baserunnerState.third,
  };
};

// Initialize function for dependency injection
export const initializeGameStore = (deps: {
  gameApplicationService: IGameApplicationService;
  teamApplicationService: ITeamApplicationService;
  scoringService: IScoringApplicationService;
}): void => {
  gameApplicationService = deps.gameApplicationService;
  teamApplicationService = deps.teamApplicationService;
  scoringService = deps.scoringService;
};

// Rehydration helper to restore GameDTO data after persistence
function rehydrateGameDTO(gameData: Record<string, unknown>): GameDTO | null {
  if (!gameData) return null;

  // First restore date objects from serialized data
  const dtoWithDates = {
    ...(gameData as unknown as GameDTO),
    createdAt: gameData.createdAt
      ? new Date(gameData.createdAt as string | number | Date)
      : new Date(),
    updatedAt: gameData.updatedAt
      ? new Date(gameData.updatedAt as string | number | Date)
      : new Date(),
    date: gameData.date
      ? new Date(gameData.date as string | number | Date)
      : new Date(),
  };

  // Determine if this is a home or away game based on team IDs
  const isAway = dtoWithDates.homeTeamId !== dtoWithDates.teamId;

  // Restore helper methods
  return {
    ...dtoWithDates,
    isAwayGame: () => isAway,
    isHomeGame: () => !isAway,
    getVenueText: () => (isAway ? '@' : 'vs'),
  };
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentGame: null,
        teams: [],
        lineup: [],
        currentBatter: null,
        currentInning: 1,
        isTopInning: true,
        baserunners: {
          first: null,
          second: null,
          third: null,
        },
        currentCount: { balls: 0, strikes: 0 },
        currentOuts: 0,
        loading: false,
        error: null,

        // Actions
        getCurrentGame: async () => {
          set({ loading: true, error: null });
          try {
            // Fetch the current active game using application service
            const result = await gameApplicationService.getCurrentGames({
              limit: 1,
            });
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to fetch current game');
            }
            const games = result.value || [];
            const currentGame =
              games.length > 0 ? convertGameDtoToDTO(games[0]) : null;
            set({ currentGame, loading: false });
          } catch {
            set({
              loading: false,
              error: 'Failed to load current game',
              currentGame: null,
            });
          }
        },
        loadGame: async (gameId: string) => {
          set({ loading: true, error: null });
          try {
            const result = await gameApplicationService.getGameById({
              gameId,
              includeLineups: true,
              includeAtBats: true,
            });
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to load game');
            }
            const game = result.value;
            if (!game) {
              throw new Error(`Game not found: ${gameId}`);
            }
            const gameDTO = convertGameDtoToDTO(game);
            set({ currentGame: gameDTO, loading: false });
          } catch (error) {
            set({
              loading: false,
              error:
                error instanceof Error ? error.message : 'Failed to load game',
              currentGame: null,
            });
          }
        },

        updateGame: async (gameDTO: GameDTO) => {
          set({ loading: true, error: null });
          try {
            const updateCommand: UpdateGameCommand = {
              gameId: gameDTO.id,
              name: gameDTO.name,
              opponent: gameDTO.opponent,
              date: gameDTO.date,
              location: 'Unknown Location', // TODO: Add location to GameDTO
              isHomeGame: gameDTO.homeTeamId === gameDTO.teamId,
            };
            const result =
              await gameApplicationService.updateGame(updateCommand);
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to update game');
            }
            const updatedGameDTO = result.value
              ? convertGameDtoToDTO(result.value)
              : null;
            set({ currentGame: updatedGameDTO, loading: false });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to update game: ${message}`,
            });
          }
        },

        startGame: async (lineupId: string) => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame) {
              throw new Error('No current game to start');
            }

            if (state.currentGame.status !== PresentationGameStatus.SETUP) {
              throw new Error('Game can only be started from setup status');
            }

            // Update game status to in_progress
            const updatedGameDTO = {
              ...state.currentGame,
              status: PresentationGameStatus.IN_PROGRESS,
              lineupId,
            };
            await get().updateGame(updatedGameDTO);

            // Initialize game state for scoring
            set({
              currentInning: 1,
              isTopInning: true,
              baserunners: { first: null, second: null, third: null },
              currentCount: { balls: 0, strikes: 0 },
              currentOuts: 0,
            });

            // Load lineup and set first batter
            await get().getLineup();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to start game: ${message}`,
            });
          }
        },

        resumeGame: async () => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame) {
              throw new Error('No current game to resume');
            }

            if (state.currentGame.status !== PresentationGameStatus.SUSPENDED) {
              throw new Error('Only suspended games can be resumed');
            }

            // Update game status to in_progress
            const updatedGameDTO = {
              ...state.currentGame,
              status: PresentationGameStatus.IN_PROGRESS,
            };
            await get().updateGame(updatedGameDTO);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to resume game: ${message}`,
            });
          }
        },

        recordAtBat: async (atBatData: AtBatResult) => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame || !scoringService) {
              throw new Error(
                'Game not loaded or scoring service not available'
              );
            }

            // Convert UI baserunner state to domain BaserunnerState
            const currentBaserunnerState = convertToBaserunnerState(
              state.baserunners
            );

            // Calculate baserunner advancement using the scoring service
            const advancement = scoringService.calculateBaserunnerAdvancement(
              atBatData.result, // Use presentation string instead of domain object
              currentBaserunnerState,
              atBatData.batterId
            );

            // Apply manual baserunner advancement if provided, otherwise use automatic
            let finalBaserunnerState = advancement.newState;
            let finalRunsScored = advancement.runsScored;

            // Check if meaningful manual advancement was provided (not just empty values)
            const hasManualAdvancement =
              atBatData.baserunnerAdvancement &&
              Object.keys(atBatData.baserunnerAdvancement).length > 0 &&
              Object.values(atBatData.baserunnerAdvancement).some(
                (value) => value && value.trim() !== ''
              );

            if (hasManualAdvancement) {
              // Manual advancement provided - apply it instead of automatic
              const manualAdvancement = atBatData.baserunnerAdvancement;
              finalRunsScored = [];

              // Start with current state and apply manual advancement
              let firstBase: string | null = null;
              let secondBase: string | null = null;
              let thirdBase: string | null = null;

              // Handle existing runners based on manual advancement
              if (
                currentBaserunnerState.first &&
                manualAdvancement &&
                manualAdvancement.first
              ) {
                switch (manualAdvancement.first) {
                  case 'second':
                    secondBase = currentBaserunnerState.first.playerId;
                    break;
                  case 'third':
                    thirdBase = currentBaserunnerState.first.playerId;
                    break;
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.first);
                    break;
                  case 'stay':
                    firstBase = currentBaserunnerState.first.playerId;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              if (
                currentBaserunnerState.second &&
                manualAdvancement &&
                manualAdvancement.second
              ) {
                switch (manualAdvancement.second) {
                  case 'third':
                    thirdBase = currentBaserunnerState.second.playerId;
                    break;
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.second);
                    break;
                  case 'stay':
                    secondBase = currentBaserunnerState.second.playerId;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              if (
                currentBaserunnerState.third &&
                manualAdvancement &&
                manualAdvancement.third
              ) {
                switch (manualAdvancement.third) {
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.third);
                    break;
                  case 'stay':
                    thirdBase = currentBaserunnerState.third.playerId;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              // Add batter to first base if they reached base safely
              if (PresentationBattingHelper.reachesBase(atBatData.result)) {
                firstBase = atBatData.batterId;
              }

              // Convert player IDs back to player objects for presentation state
              const getPlayerInfo = (playerId: string | null) => {
                if (!playerId) return null;
                const player = state.lineup.find(
                  (p) => p.playerId === playerId
                );
                return player
                  ? { playerId: player.playerId, playerName: player.playerName }
                  : null;
              };

              finalBaserunnerState = {
                first: getPlayerInfo(firstBase),
                second: getPlayerInfo(secondBase),
                third: getPlayerInfo(thirdBase),
              };
            } else {
              // Automatic advancement - use domain service result
              finalBaserunnerState = advancement.newState;
              finalRunsScored = advancement.runsScored;
            }

            // Calculate outs produced by this at-bat
            const outsProduced = scoringService.calculateOuts(atBatData.result);
            const newOuts = state.currentOuts + outsProduced;

            // TODO: Create and persist AtBat entity
            // const atBatId = `at-bat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // const atBat = new AtBat(
            //   atBatId,
            //   state.currentGame.id,
            //   atBatData.batterId,
            //   atBatData.result,
            //   currentBaserunnerState,
            //   finalBaserunnerState,
            //   finalRunsScored.length,
            //   finalRunsScored,
            //   outsProduced,
            //   state.currentInning,
            //   state.isTopInning,
            //   atBatData.finalCount,
            //   new Date(),
            //   new Date()
            // );

            // Convert new baserunner state back to UI format
            const newBaserunners =
              convertFromBaserunnerState(finalBaserunnerState);

            // Update game state
            set({
              baserunners: newBaserunners,
              currentOuts: newOuts >= 3 ? 0 : newOuts, // Reset outs if inning ends
              currentCount: { balls: 0, strikes: 0 }, // Reset count for next batter
              loading: false,
            });

            // Update score if runs were scored
            if (finalRunsScored.length > 0) {
              await get().updateScore(finalRunsScored.length);
            }

            // Advance to next batter
            get().advanceToNextBatter();

            // Check if inning should advance (3 outs)
            if (newOuts >= 3) {
              await get().advanceInning();
            }

            // Return enhanced result
            return {
              ...atBatData,
              runsScored: finalRunsScored.length,
              newBaserunners,
              advanceInning: newOuts >= 3,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to record at-bat: ${message}`,
            });
            throw error;
          }
        },

        advanceInning: async () => {
          set({ loading: true, error: null });
          try {
            const state = get();
            const newInning = state.isTopInning
              ? state.currentInning
              : state.currentInning + 1;
            const newIsTop = !state.isTopInning;

            // Reset to first batter when switching sides (different team batting)
            const shouldResetBatter = true; // Always reset when advancing inning sides
            const newCurrentBatter =
              shouldResetBatter && state.lineup.length > 0
                ? state.lineup[0]
                : state.currentBatter;

            set({
              currentInning: newInning,
              isTopInning: newIsTop,
              baserunners: { first: null, second: null, third: null },
              currentCount: { balls: 0, strikes: 0 },
              currentOuts: 0, // Reset outs for new inning
              currentBatter: newCurrentBatter,
              loading: false,
            });

            // Check if game should be completed (7 innings in regulation softball)
            if (newInning > 7 && !state.isTopInning) {
              // Game completed after bottom of 7th inning
              if (state.currentGame && state.currentGame.finalScore) {
                const { homeScore, awayScore } = state.currentGame.finalScore;
                const isHomeWinning = homeScore > awayScore;
                const isAwayWinning = awayScore > homeScore;

                // Complete game if there's a winner after 7 complete innings
                if (isHomeWinning || isAwayWinning) {
                  await get().completeGame();
                  return;
                }
              }
            }

            // Check for mercy rule (10+ run difference after 5 innings)
            if (
              newInning >= 5 &&
              state.currentGame &&
              state.currentGame.finalScore
            ) {
              const { homeScore, awayScore } = state.currentGame.finalScore;
              const runDifference = Math.abs(homeScore - awayScore);

              if (runDifference >= 10) {
                await get().completeGame();
                return;
              }
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to advance inning: ${message}`,
            });
          }
        },

        updateScore: async (runsScored: number) => {
          const state = get();
          if (!state.currentGame) return;

          try {
            // Determine which team scored and update accordingly
            // In softball: top inning = away team batting, bottom inning = home team batting
            const isHomeTeamBatting = !state.isTopInning;
            const isAwayTeamBatting = state.isTopInning;

            // Update game scores
            const updatedGameDTO = {
              ...state.currentGame,
              homeScore: isHomeTeamBatting
                ? state.currentGame.homeScore + runsScored
                : state.currentGame.homeScore,
              awayScore: isAwayTeamBatting
                ? state.currentGame.awayScore + runsScored
                : state.currentGame.awayScore,
              updatedAt: new Date(),
            };

            await get().updateGame(updatedGameDTO);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              error: `Failed to update score: ${message}`,
            });
          }
        },

        getTeams: async () => {
          set({ error: null });
          try {
            const result = await teamApplicationService.getTeams();
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to load teams');
            }
            const teamDTOs = result.value || [];
            set({ teams: teamDTOs });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              error: `Failed to load teams: ${message}`,
              teams: [],
            });
          }
        },

        getLineup: async () => {
          set({ error: null });
          try {
            const state = get();
            if (!state.currentGame?.lineupId || !state.currentGame?.id) return;

            // Fetch lineup from the game application service
            const result = await gameApplicationService.getGameLineup({
              gameId: state.currentGame.id,
              lineupId: state.currentGame.lineupId,
            });

            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to load lineup');
            }

            const lineup = result.value;
            if (!lineup || !lineup.playerIds || lineup.playerIds.length === 0) {
              set({ lineup: [] });
              return;
            }

            // TODO: Need player details to build complete lineup
            // For now, use basic player info from lineup
            const lineupPlayers = lineup.playerIds.map((playerId, index) => {
              const position = lineup.defensivePositions[index] || 'EP';
              const order = lineup.battingOrder[index] || index + 1;

              return {
                playerId,
                playerName: `Player ${playerId.slice(-4)}`, // Use last 4 chars of ID as placeholder
                jerseyNumber: '0',
                position:
                  DomainAdapter.domainPositionToPresentation(position) ||
                  PresentationPosition.EXTRA_PLAYER,
                battingOrder: order,
              };
            });

            const currentState = get();

            // Only set current batter to first player if no current batter exists
            // This prevents resetting batter progression during lineup reloads
            if (lineupPlayers.length > 0 && !currentState.currentBatter) {
              set({ lineup: lineupPlayers, currentBatter: lineupPlayers[0] });
            } else {
              set({ lineup: lineupPlayers });
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              error: `Failed to load lineup: ${message}`,
              lineup: [],
            });
          }
        },

        setCurrentBatter: (batter: CurrentBatter) => {
          set({ currentBatter: batter });
        },

        updateBaserunners: (baserunners: Baserunners) => {
          set({ baserunners });
        },

        updateCount: (count: Count) => {
          set({ currentCount: count });
        },

        updateOuts: (outs: number) => {
          set({ currentOuts: outs });
        },

        advanceToNextBatter: () => {
          const state = get();
          if (!state.lineup || state.lineup.length === 0 || !state.currentGame)
            return;

          try {
            // Convert lineup to format expected by Game entity
            const gameLineup = state.lineup.map((batter) => ({
              playerId: batter.playerId,
              playerName: batter.playerName,
            }));

            // Use Game entity method to advance batter (maintains proper game state)
            const gameEntity = DomainAdapter.gameDTOToDomain(state.currentGame);
            gameEntity.advanceToNextBatter(gameLineup);

            // Get updated current batter from Game entity
            const currentBatter = gameEntity.getCurrentBatter();
            if (currentBatter) {
              // Find corresponding batter in lineup for full presentation data
              const presentationBatter = state.lineup.find(
                (b) => b.playerId === currentBatter.playerId
              );
              if (presentationBatter) {
                set({ currentBatter: presentationBatter });
              } else {
                // Fallback: create presentation batter from game data
                set({
                  currentBatter: {
                    playerId: currentBatter.playerId,
                    playerName: currentBatter.playerName,
                    jerseyNumber: '',
                    position: PresentationPosition.EXTRA_PLAYER,
                    battingOrder: 0, // Default value since not available from domain
                  },
                });
              }
            }
          } catch (error) {
            console.error('Error advancing to next batter:', error);
            // Fallback to previous simple logic
            const currentIndex = state.currentBatter
              ? state.lineup.findIndex(
                  (batter) => batter.playerId === state.currentBatter?.playerId
                )
              : -1;

            const nextIndex = (currentIndex + 1) % state.lineup.length;
            const nextBatter = state.lineup[nextIndex];

            set({ currentBatter: nextBatter });
          }
        },

        suspendGame: async () => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame) throw new Error('No current game');

            // Update game status to suspended
            const updatedGameDTO = {
              ...state.currentGame,
              status: PresentationGameStatus.SUSPENDED,
            };
            await get().updateGame(updatedGameDTO);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to suspend game: ${message}`,
            });
          }
        },

        completeGame: async () => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame || !state.currentGame.finalScore) {
              throw new Error('No current game or score');
            }

            // Update game status to completed
            const updatedGameDTO = {
              ...state.currentGame,
              status: PresentationGameStatus.COMPLETED,
            };
            await get().updateGame(updatedGameDTO);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to complete game: ${message}`,
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'game-store',
        partialize: (state) => ({
          currentGame: state.currentGame,
          currentBatter: state.currentBatter,
          currentInning: state.currentInning,
          isTopInning: state.isTopInning,
          baserunners: state.baserunners,
          currentCount: state.currentCount,
          currentOuts: state.currentOuts,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Failed to rehydrate gameStore:', error);
            return;
          }

          if (state?.currentGame) {
            // Restore GameDTO after persistence rehydration
            // This ensures proper Date object restoration
            state.currentGame = rehydrateGameDTO(
              state.currentGame as unknown as Record<string, unknown>
            );
          }
        },
      }
    ),
    {
      name: 'game-store',
    }
  )
);
