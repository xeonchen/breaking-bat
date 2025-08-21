import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  IGameRepository,
  ITeamRepository,
  IPlayerRepository,
  BaserunnerState,
} from '../../domain';
import { ScoringService } from '../../domain/services/ScoringService';
import { GameDTO, TeamDTO } from '../types/presentation-entities';
import {
  PresentationPosition,
  PresentationBattingResult,
  PresentationGameStatus,
  PresentationBattingHelper,
} from '../types/presentation-values';
import { GameAdapter } from '../adapters/gameAdapter';

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
  teams: TeamDTO[];
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

// Repository interfaces - will be injected in production
let gameRepository: IGameRepository;
let teamRepository: ITeamRepository;
let playerRepository: IPlayerRepository;
let scoringService: ScoringService;

// Helper functions for baserunner state conversion
const convertToBaserunnerState = (
  baserunners: Baserunners
): BaserunnerState => {
  return new BaserunnerState(
    baserunners.first?.playerId || null,
    baserunners.second?.playerId || null,
    baserunners.third?.playerId || null
  );
};

const convertFromBaserunnerState = (
  baserunnerState: BaserunnerState,
  lineup: CurrentBatter[]
): Baserunners => {
  const getPlayerInfo = (playerId: string | null) => {
    if (!playerId) return null;
    const player = lineup.find((p) => p.playerId === playerId);
    return player
      ? {
          playerId: player.playerId,
          playerName: player.playerName,
        }
      : { playerId, playerName: `Player ${playerId}` };
  };

  return {
    first: getPlayerInfo(baserunnerState.firstBase),
    second: getPlayerInfo(baserunnerState.secondBase),
    third: getPlayerInfo(baserunnerState.thirdBase),
  };
};

// Initialize function for dependency injection
export const initializeGameStore = (deps: {
  gameRepository: IGameRepository;
  teamRepository: ITeamRepository;
  playerRepository: IPlayerRepository;
  scoringService: ScoringService;
}): void => {
  gameRepository = deps.gameRepository;
  teamRepository = deps.teamRepository;
  playerRepository = deps.playerRepository;
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
            // In a real implementation, this would fetch the current active game
            const game = await gameRepository?.findCurrent();
            const gameDTO = game ? GameAdapter.toGameDTO(game) : null;
            set({ currentGame: gameDTO, loading: false });
          } catch (error) {
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
            const game = await gameRepository?.findById(gameId);
            if (!game) {
              throw new Error(`Game not found: ${gameId}`);
            }
            const gameDTO = GameAdapter.toGameDTO(game);
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
            const domainGame = GameAdapter.fromGameDTO(gameDTO);
            const updatedGame = await gameRepository?.save(domainGame);
            const updatedGameDTO = GameAdapter.toGameDTO(updatedGame);
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

            // Convert presentation result to domain result for scoring service
            const domainResult = GameAdapter.fromPresentationBattingResult(
              atBatData.result
            );

            // Calculate baserunner advancement using the scoring service
            const advancement = scoringService.calculateBaserunnerAdvancement(
              domainResult,
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

            console.log('🔍 Baserunner Debug:', {
              result: atBatData.result,
              manualAdvancement: atBatData.baserunnerAdvancement,
              hasManualAdvancement,
              automaticAdvancement: advancement.newState,
              currentState: currentBaserunnerState,
            });

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
                currentBaserunnerState.firstBase &&
                manualAdvancement &&
                manualAdvancement.first
              ) {
                switch (manualAdvancement.first) {
                  case 'second':
                    secondBase = currentBaserunnerState.firstBase;
                    break;
                  case 'third':
                    thirdBase = currentBaserunnerState.firstBase;
                    break;
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.firstBase);
                    break;
                  case 'stay':
                    firstBase = currentBaserunnerState.firstBase;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              if (
                currentBaserunnerState.secondBase &&
                manualAdvancement &&
                manualAdvancement.second
              ) {
                switch (manualAdvancement.second) {
                  case 'third':
                    thirdBase = currentBaserunnerState.secondBase;
                    break;
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.secondBase);
                    break;
                  case 'stay':
                    secondBase = currentBaserunnerState.secondBase;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              if (
                currentBaserunnerState.thirdBase &&
                manualAdvancement &&
                manualAdvancement.third
              ) {
                switch (manualAdvancement.third) {
                  case 'home':
                    finalRunsScored.push(currentBaserunnerState.thirdBase);
                    break;
                  case 'stay':
                    thirdBase = currentBaserunnerState.thirdBase;
                    break;
                  // 'out' case - runner is removed (no assignment)
                }
              }

              // Add batter to first base if they reached base safely
              if (PresentationBattingHelper.reachesBase(atBatData.result)) {
                firstBase = atBatData.batterId;
              }

              finalBaserunnerState = new BaserunnerState(
                firstBase,
                secondBase,
                thirdBase
              );
            } else {
              // Automatic advancement - use domain service result
              finalBaserunnerState = advancement.newState;
              finalRunsScored = advancement.runsScored;
            }

            // Calculate outs produced by this at-bat
            const outsProduced = scoringService.calculateOuts(domainResult);
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
            const newBaserunners = convertFromBaserunnerState(
              finalBaserunnerState,
              state.lineup
            );

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
            const teams = await teamRepository?.findAll();
            const teamDTOs = teams
              ? teams.map((team) => GameAdapter.toTeamDTO(team))
              : [];
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
            if (!state.currentGame?.lineupId) return;

            // Fetch player IDs from the lineup
            const playerIds = await gameRepository?.getLineup(
              state.currentGame.lineupId
            );

            if (!playerIds || playerIds.length === 0) {
              set({ lineup: [] });
              return;
            }

            // Fetch player details for each ID
            const playerPromises = playerIds.map(async (playerId, index) => {
              const player = await playerRepository?.findById(playerId);
              if (!player) {
                return {
                  playerId,
                  playerName: 'Unknown Player',
                  jerseyNumber: '0',
                  position: PresentationPosition.EXTRA_PLAYER,
                  battingOrder: index + 1,
                };
              }
              return {
                playerId: player.id,
                playerName: player.name,
                jerseyNumber: player.jerseyNumber.toString(),
                position:
                  GameAdapter.toPresentationPosition(player.positions[0]) ||
                  PresentationPosition.EXTRA_PLAYER,
                battingOrder: index + 1,
              };
            });

            const typedLineup = await Promise.all(playerPromises);
            const currentState = get();

            // Only set current batter to first player if no current batter exists
            // This prevents resetting batter progression during lineup reloads
            if (typedLineup.length > 0 && !currentState.currentBatter) {
              set({ lineup: typedLineup, currentBatter: typedLineup[0] });
            } else {
              set({ lineup: typedLineup });
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
            const gameEntity = GameAdapter.fromGameDTO(state.currentGame);
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
                    battingOrder: currentBatter.battingOrder,
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
