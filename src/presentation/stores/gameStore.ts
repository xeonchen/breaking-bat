import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Game,
  Team,
  Position,
  BattingResult,
  GameRepository,
  TeamRepository,
  PlayerRepository,
  BaserunnerState,
} from '@/domain';
import { ScoringService } from '@/domain/services/ScoringService';

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

interface AtBatResult {
  batterId: string;
  result: BattingResult;
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
  currentGame: Game | null;
  teams: Team[];
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
  updateGame: (game: Game) => Promise<void>;
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
let gameRepository: GameRepository;
let teamRepository: TeamRepository;
let playerRepository: PlayerRepository;
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
  gameRepository: GameRepository;
  teamRepository: TeamRepository;
  playerRepository: PlayerRepository;
  scoringService: ScoringService;
}): void => {
  gameRepository = deps.gameRepository;
  teamRepository = deps.teamRepository;
  playerRepository = deps.playerRepository;
  scoringService = deps.scoringService;
};

// Rehydration helper to restore Game domain entity methods after persistence
function rehydrateGame(gameData: any): Game | null {
  if (!gameData) return null;

  // Restore Game domain entity from serialized data
  // This ensures currentGame has proper methods like isHomeGame(), isAwayGame()
  return new Game(
    gameData.id,
    gameData.name,
    gameData.opponent,
    new Date(gameData.date), // Restore Date objects
    gameData.seasonId,
    gameData.gameTypeId,
    gameData.homeAway,
    gameData.teamId,
    gameData.status,
    gameData.lineupId,
    gameData.inningIds || [],
    gameData.finalScore,
    gameData.createdAt ? new Date(gameData.createdAt) : undefined,
    gameData.updatedAt ? new Date(gameData.updatedAt) : undefined
  );
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
            set({ currentGame: game, loading: false });
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
            const game = await gameRepository?.findById(gameId);
            if (!game) {
              throw new Error(`Game not found: ${gameId}`);
            }
            set({ currentGame: game, loading: false });
          } catch (error) {
            set({
              loading: false,
              error:
                error instanceof Error ? error.message : 'Failed to load game',
              currentGame: null,
            });
          }
        },

        updateGame: async (game: Game) => {
          set({ loading: true, error: null });
          try {
            const updatedGame = await gameRepository?.save(game);
            set({ currentGame: updatedGame, loading: false });
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

            if (state.currentGame.status !== 'setup') {
              throw new Error('Game can only be started from setup status');
            }

            const startedGame = state.currentGame.start(lineupId);
            await get().updateGame(startedGame);

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

            if (state.currentGame.status !== 'suspended') {
              throw new Error('Only suspended games can be resumed');
            }

            const resumedGame = state.currentGame.resume();
            await get().updateGame(resumedGame);
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
              atBatData.result,
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
              result: atBatData.result.value,
              manualAdvancement: atBatData.baserunnerAdvancement,
              hasManualAdvancement,
              automaticAdvancement: advancement.newState,
              currentState: currentBaserunnerState,
            });

            if (hasManualAdvancement) {
              // Manual advancement provided - apply it instead of automatic
              const manualAdvancement = atBatData.baserunnerAdvancement!;
              finalRunsScored = [];

              // Start with current state and apply manual advancement
              let firstBase: string | null = null;
              let secondBase: string | null = null;
              let thirdBase: string | null = null;

              // Handle existing runners based on manual advancement
              if (currentBaserunnerState.firstBase && manualAdvancement.first) {
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

              if (currentBaserunnerState.thirdBase && manualAdvancement.third) {
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
              if (atBatData.result.reachesBase()) {
                firstBase = atBatData.batterId;
              }

              finalBaserunnerState = new BaserunnerState(
                firstBase,
                secondBase,
                thirdBase
              );
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
            if (newInning >= 5 && state.currentGame?.finalScore) {
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
          if (!state.currentGame || !state.currentGame.finalScore) return;

          try {
            const currentScore = state.currentGame.finalScore;

            // Determine which team scored and update accordingly
            const isHomeTeamBatting =
              state.currentGame.isHomeGame() && !state.isTopInning;
            const isAwayTeamBatting =
              !state.currentGame.isHomeGame() && state.isTopInning;

            // Ensure current inning exists in inning scores
            const inningScores = [...currentScore.inningScores];
            const currentInningScore = inningScores.find(
              (score) => score.inning === state.currentInning
            );

            if (!currentInningScore) {
              // Create new inning score if it doesn't exist
              inningScores.push({
                inning: state.currentInning,
                homeRuns: 0,
                awayRuns: 0,
              });
            }

            // Update overall scores and inning-by-inning scores
            const newScore = {
              ...currentScore,
              homeScore: isHomeTeamBatting
                ? currentScore.homeScore + runsScored
                : currentScore.homeScore,
              awayScore: isAwayTeamBatting
                ? currentScore.awayScore + runsScored
                : currentScore.awayScore,
              // Update inning-by-inning scores
              inningScores: inningScores.map((inningScore) => {
                if (inningScore.inning === state.currentInning) {
                  return {
                    ...inningScore,
                    homeRuns: isHomeTeamBatting
                      ? inningScore.homeRuns + runsScored
                      : inningScore.homeRuns,
                    awayRuns: isAwayTeamBatting
                      ? inningScore.awayRuns + runsScored
                      : inningScore.awayRuns,
                  };
                }
                return inningScore;
              }),
            };

            const updatedGame = new Game(
              state.currentGame.id,
              state.currentGame.name,
              state.currentGame.opponent,
              state.currentGame.date,
              state.currentGame.seasonId,
              state.currentGame.gameTypeId,
              state.currentGame.homeAway,
              state.currentGame.teamId,
              state.currentGame.status,
              state.currentGame.lineupId,
              state.currentGame.inningIds,
              newScore,
              state.currentGame.createdAt,
              new Date()
            );

            await get().updateGame(updatedGame);
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
            set({ teams: teams || [] });
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
                  position: Position.extraPlayer(),
                  battingOrder: index + 1,
                };
              }
              return {
                playerId: player.id,
                playerName: player.name,
                jerseyNumber: player.jerseyNumber.toString(),
                position: player.positions[0] || Position.extraPlayer(),
                battingOrder: index + 1,
              };
            });

            const typedLineup = await Promise.all(playerPromises);
            set({ lineup: typedLineup });

            if (typedLineup.length > 0) {
              set({ currentBatter: typedLineup[0] });
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
          if (!state.lineup || state.lineup.length === 0) return;

          // Find current batter index
          const currentIndex = state.currentBatter
            ? state.lineup.findIndex(
                (batter) => batter.playerId === state.currentBatter?.playerId
              )
            : -1;

          // Advance to next batter in lineup (with wrapping)
          const nextIndex = (currentIndex + 1) % state.lineup.length;
          const nextBatter = state.lineup[nextIndex];

          set({ currentBatter: nextBatter });
        },

        suspendGame: async () => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame) throw new Error('No current game');

            const suspendedGame = state.currentGame.suspend();
            await get().updateGame(suspendedGame);
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

            const completedGame = state.currentGame.complete(
              state.currentGame.finalScore
            );
            await get().updateGame(completedGame);
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
            // Restore Game domain entity methods after persistence rehydration
            // This fixes: "TypeError: currentGame.isHomeGame is not a function"
            state.currentGame = rehydrateGame(state.currentGame);
          }
        },
      }
    ),
    {
      name: 'game-store',
    }
  )
);
