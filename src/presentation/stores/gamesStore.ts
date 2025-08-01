import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Game, Season, GameType, Team, GameStatus } from '@/domain';

interface CreateGameCommand {
  name: string;
  opponent: string;
  date: Date;
  teamId: string;
  seasonId: string;
  gameTypeId: string;
  homeAway: 'home' | 'away';
}

interface GamesState {
  // State
  games: Game[];
  seasons: Season[];
  gameTypes: GameType[];
  teams: Team[];
  selectedGame: Game | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: GameStatus | 'all';

  // Actions
  loadGames: () => Promise<void>;
  loadSeasons: () => Promise<void>;
  loadGameTypes: () => Promise<void>;
  loadTeams: () => Promise<void>;
  createGame: (command: CreateGameCommand) => Promise<Game>;
  updateGame: (game: Game) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  selectGame: (game: Game) => void;
  clearSelection: () => void;
  clearError: () => void;
  searchGames: (query: string) => void;
  filterGamesByStatus: (status: GameStatus | 'all') => void;
  filterGamesByTeam: (teamId: string) => void;
}

// Repository interfaces - will be injected in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gameRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let seasonRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gameTypeRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let teamRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createGameUseCase: any;

// Initialize function for dependency injection
export const initializeGamesStore = (deps: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seasonRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameTypeRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createGameUseCase: any;
}): void => {
  console.log('🔧 Initializing GamesStore with dependencies:', {
    gameRepository: !!deps.gameRepository,
    seasonRepository: !!deps.seasonRepository,
    gameTypeRepository: !!deps.gameTypeRepository,
    teamRepository: !!deps.teamRepository,
    createGameUseCase: !!deps.createGameUseCase,
  });

  gameRepository = deps.gameRepository;
  seasonRepository = deps.seasonRepository;
  gameTypeRepository = deps.gameTypeRepository;
  teamRepository = deps.teamRepository;
  createGameUseCase = deps.createGameUseCase;

  console.log('✅ GamesStore dependencies initialized successfully');
};

export const useGamesStore = create<GamesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        games: [],
        seasons: [],
        gameTypes: [],
        teams: [],
        selectedGame: null,
        loading: false,
        error: null,
        searchQuery: '',
        statusFilter: 'all',

        // Actions
        loadGames: async () => {
          set({ loading: true, error: null });
          try {
            console.log('📊 Loading games...');
            const games = (await gameRepository?.findAll()) || [];
            console.log(`✅ Loaded ${games.length} games`);

            // Apply current filters
            const { searchQuery, statusFilter } = get();
            let filteredGames = games;

            if (searchQuery) {
              filteredGames = games.filter(
                (game: Game) =>
                  game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  game.opponent
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              );
            }

            if (statusFilter !== 'all') {
              filteredGames = filteredGames.filter(
                (game: Game) => game.status === statusFilter
              );
            }

            set({ games: filteredGames, loading: false });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to load games:', message);
            set({
              loading: false,
              error: `Failed to load games: ${message}`,
              games: [],
            });
          }
        },

        loadSeasons: async () => {
          set({ error: null });
          try {
            console.log('📅 Loading seasons...');
            const seasons = (await seasonRepository?.findAll()) || [];
            console.log(`✅ Loaded ${seasons.length} seasons`);
            set({ seasons });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to load seasons:', message);
            set({
              error: `Failed to load seasons: ${message}`,
              seasons: [],
            });
          }
        },

        loadGameTypes: async () => {
          set({ error: null });
          try {
            console.log('🎯 Loading game types...');
            const gameTypes = (await gameTypeRepository?.findAll()) || [];
            console.log(`✅ Loaded ${gameTypes.length} game types`);
            set({ gameTypes });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to load game types:', message);
            set({
              error: `Failed to load game types: ${message}`,
              gameTypes: [],
            });
          }
        },

        loadTeams: async () => {
          set({ error: null });
          try {
            console.log('👥 Loading teams...');
            const teams = (await teamRepository?.findAll()) || [];
            console.log(`✅ Loaded ${teams.length} teams`);
            set({ teams });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to load teams:', message);
            set({
              error: `Failed to load teams: ${message}`,
              teams: [],
            });
          }
        },

        createGame: async (command: CreateGameCommand) => {
          set({ loading: true, error: null });
          try {
            console.log('🆕 Creating game:', command.name);
            const result = await createGameUseCase?.execute(command);

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            const newGame = result.value;
            console.log('✅ Game created successfully:', newGame.id);

            // Add new game to current list
            const currentGames = get().games;
            set({
              games: [newGame, ...currentGames],
              loading: false,
            });

            return newGame;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to create game:', message);
            set({
              loading: false,
              error: `Failed to create game: ${message}`,
            });
            throw error;
          }
        },

        updateGame: async (game: Game) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating game:', game.id);
            const updatedGame = await gameRepository?.save(game);

            // Update game in current list
            const currentGames = get().games;
            const updatedGames = currentGames.map((g: Game) =>
              g.id === game.id ? updatedGame : g
            );

            // Update selectedGame if it matches
            const selectedGame = get().selectedGame;
            const updatedSelectedGame =
              selectedGame?.id === game.id ? updatedGame : selectedGame;

            set({
              games: updatedGames,
              selectedGame: updatedSelectedGame,
              loading: false,
            });

            console.log('✅ Game updated successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to update game:', message);
            set({
              loading: false,
              error: `Failed to update game: ${message}`,
            });
          }
        },

        deleteGame: async (gameId: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🗑️ Deleting game:', gameId);
            await gameRepository?.delete(gameId);

            // Remove game from current list
            const currentGames = get().games;
            const filteredGames = currentGames.filter(
              (g: Game) => g.id !== gameId
            );

            // Clear selection if deleted game was selected
            const selectedGame = get().selectedGame;
            const updatedSelectedGame =
              selectedGame?.id === gameId ? null : selectedGame;

            set({
              games: filteredGames,
              selectedGame: updatedSelectedGame,
              loading: false,
            });

            console.log('✅ Game deleted successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to delete game:', message);
            set({
              loading: false,
              error: `Failed to delete game: ${message}`,
            });
          }
        },

        selectGame: (game: Game) => {
          console.log('🎯 Selecting game:', game.id);
          set({ selectedGame: game });
        },

        clearSelection: () => {
          console.log('🔄 Clearing game selection');
          set({ selectedGame: null });
        },

        clearError: () => {
          set({ error: null });
        },

        searchGames: (query: string) => {
          console.log('🔍 Searching games:', query);
          set({ searchQuery: query });

          // Apply search filter to current games
          const allGames = get().games;
          if (!query.trim()) {
            // If empty query, reload all games
            get().loadGames();
            return;
          }

          const filteredGames = allGames.filter(
            (game: Game) =>
              game.name.toLowerCase().includes(query.toLowerCase()) ||
              game.opponent.toLowerCase().includes(query.toLowerCase())
          );

          set({ games: filteredGames });
        },

        filterGamesByStatus: (status: GameStatus | 'all') => {
          console.log('🎭 Filtering games by status:', status);
          set({ statusFilter: status });

          if (status === 'all') {
            get().loadGames();
            return;
          }

          // Apply status filter
          const allGames = get().games;
          const filteredGames = allGames.filter(
            (game: Game) => game.status === status
          );
          set({ games: filteredGames });
        },

        filterGamesByTeam: (teamId: string) => {
          console.log('👥 Filtering games by team:', teamId);

          if (!teamId) {
            get().loadGames();
            return;
          }

          // Apply team filter
          const allGames = get().games;
          const filteredGames = allGames.filter(
            (game: Game) => game.teamId === teamId
          );
          set({ games: filteredGames });
        },
      }),
      {
        name: 'games-store',
        partialize: (state) => ({
          selectedGame: state.selectedGame,
          searchQuery: state.searchQuery,
          statusFilter: state.statusFilter,
        }),
      }
    ),
    {
      name: 'games-store',
    }
  )
);
