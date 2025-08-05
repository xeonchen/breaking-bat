import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Game,
  Team,
  Position,
  BattingResult,
  GameRepository,
  TeamRepository,
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
  loading: boolean;
  error: string | null;

  // Actions
  getCurrentGame: () => Promise<void>;
  updateGame: (game: Game) => Promise<void>;
  recordAtBat: (atBatResult: AtBatResult) => Promise<AtBatResult>;
  advanceInning: () => Promise<void>;
  updateScore: (runsScored: number) => Promise<void>;
  getTeams: () => Promise<void>;
  getLineup: () => Promise<void>;
  setCurrentBatter: (batter: CurrentBatter) => void;
  updateBaserunners: (baserunners: Baserunners) => void;
  updateCount: (count: Count) => void;
  suspendGame: () => Promise<void>;
  completeGame: () => Promise<void>;
  clearError: () => void;
}

// Repository interfaces - will be injected in production
let gameRepository: GameRepository;
let teamRepository: TeamRepository;
let scoringService: ScoringService;

// Initialize function for dependency injection
export const initializeGameStore = (deps: {
  gameRepository: GameRepository;
  teamRepository: TeamRepository;
  scoringService: ScoringService;
}): void => {
  gameRepository = deps.gameRepository;
  teamRepository = deps.teamRepository;
  scoringService = deps.scoringService;
};

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

        recordAtBat: async (atBatData: AtBatResult) => {
          set({ loading: true, error: null });
          try {
            const state = get();
            if (!state.currentGame || !scoringService) {
              throw new Error(
                'Game not loaded or scoring service not available'
              );
            }

            // For now, just simulate recording the at-bat
            // In a real implementation, this would call the scoring service with proper parameters
            const advancement = scoringService.calculateBaserunnerAdvancement(
              atBatData.result,
              state.baserunners as any, // TODO: convert to BaserunnerState
              atBatData.batterId
            );

            // Update game state based on the result
            if (advancement.runsScored.length > 0) {
              await get().updateScore(advancement.runsScored.length);
            }

            // Reset count for new batter
            set({ currentCount: { balls: 0, strikes: 0 }, loading: false });

            return atBatData;
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

            set({
              currentInning: newInning,
              isTopInning: newIsTop,
              baserunners: { first: null, second: null, third: null },
              currentCount: { balls: 0, strikes: 0 },
              loading: false,
            });

            // Reset to first batter in lineup
            if (state.lineup && state.lineup.length > 0) {
              set({ currentBatter: state.lineup[0] });
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
            const newScore = {
              ...currentScore,
              homeScore:
                state.currentGame.isHomeGame() && !state.isTopInning
                  ? currentScore.homeScore + runsScored
                  : currentScore.homeScore,
              awayScore:
                !state.currentGame.isHomeGame() && state.isTopInning
                  ? currentScore.awayScore + runsScored
                  : currentScore.awayScore,
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

            // In a real implementation, this would fetch the lineup
            const lineup = await gameRepository?.getLineup(
              state.currentGame.lineupId
            );
            const typedLineup: CurrentBatter[] = (lineup || []).map(
              (item: any) => ({
                playerId: item.playerId || item.id || '',
                playerName: item.playerName || item.name || '',
                jerseyNumber: item.jerseyNumber || '',
                position: item.position || Position.extraPlayer(),
                battingOrder: item.battingOrder || 1,
              })
            );
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
        }),
      }
    ),
    {
      name: 'game-store',
    }
  )
);
