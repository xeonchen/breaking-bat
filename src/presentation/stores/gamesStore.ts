import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Game,
  Season,
  GameType,
  Team,
  Player,
  GameStatus,
  GameRepository,
  SeasonRepository,
  GameTypeRepository,
  TeamRepository,
  PlayerRepository,
} from '@/domain';
import {
  CreateGameUseCase,
  CreateGameCommand,
} from '@/application/use-cases/CreateGameUseCase';
import {
  LoadDefaultDataUseCase,
  LoadDefaultDataResult,
} from '@/application/use-cases/LoadDefaultDataUseCase';

interface CreateSeasonCommand {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
}

interface CreateGameTypeCommand {
  name: string;
  description?: string;
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
  loadPlayersForTeam: (teamId: string) => Promise<Player[]>;
  createGame: (command: CreateGameCommand) => Promise<Game>;
  updateGame: (game: Game) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  createSeason: (command: CreateSeasonCommand) => Promise<Season>;
  updateSeason: (season: Season) => Promise<void>;
  deleteSeason: (seasonId: string) => Promise<void>;
  createGameType: (command: CreateGameTypeCommand) => Promise<GameType>;
  updateGameType: (gameType: GameType) => Promise<void>;
  deleteGameType: (gameTypeId: string) => Promise<void>;
  selectGame: (game: Game) => void;
  clearSelection: () => void;
  clearError: () => void;
  searchGames: (query: string) => void;
  filterGamesByStatus: (status: GameStatus | 'all') => void;
  filterGamesByTeam: (teamId: string) => void;
  loadDefaultData: () => Promise<LoadDefaultDataResult>;
}

// Repository interfaces - will be injected in production
let gameRepository: GameRepository;
let seasonRepository: SeasonRepository;
let gameTypeRepository: GameTypeRepository;
let teamRepository: TeamRepository;
let playerRepository: PlayerRepository;
let createGameUseCase: CreateGameUseCase;
let loadDefaultDataUseCase: LoadDefaultDataUseCase;

// Initialize function for dependency injection
export const initializeGamesStore = (deps: {
  gameRepository: GameRepository;
  seasonRepository: SeasonRepository;
  gameTypeRepository: GameTypeRepository;
  teamRepository: TeamRepository;
  playerRepository: PlayerRepository;
  createGameUseCase: CreateGameUseCase;
  loadDefaultDataUseCase: LoadDefaultDataUseCase;
}): void => {
  console.log('🔧 Initializing GamesStore with dependencies:', {
    gameRepository: !!deps.gameRepository,
    seasonRepository: !!deps.seasonRepository,
    gameTypeRepository: !!deps.gameTypeRepository,
    teamRepository: !!deps.teamRepository,
    playerRepository: !!deps.playerRepository,
    createGameUseCase: !!deps.createGameUseCase,
    loadDefaultDataUseCase: !!deps.loadDefaultDataUseCase,
  });

  gameRepository = deps.gameRepository;
  seasonRepository = deps.seasonRepository;
  gameTypeRepository = deps.gameTypeRepository;
  teamRepository = deps.teamRepository;
  playerRepository = deps.playerRepository;
  createGameUseCase = deps.createGameUseCase;
  loadDefaultDataUseCase = deps.loadDefaultDataUseCase;

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

        loadPlayersForTeam: async (teamId: string) => {
          try {
            console.log(`👥 Loading players for team: ${teamId}`);

            // First find the team to get player IDs
            const team = await teamRepository?.findById(teamId);
            if (!team) {
              console.log(`❌ Team ${teamId} not found`);
              return [];
            }

            let validPlayers: Player[] = [];

            // If team has playerIds, use those
            if (team.playerIds && team.playerIds.length > 0) {
              // Load all players for the team using player IDs
              const players = await Promise.all(
                team.playerIds.map(async (playerId) => {
                  const player = await playerRepository?.findById(playerId);
                  return player;
                })
              );

              // Filter out any null/undefined players
              validPlayers = players.filter(
                (player): player is Player =>
                  player !== null && player !== undefined
              );
            } else {
              // Team has no playerIds - try to find players by teamId (fallback)
              console.log(
                `🔍 Team ${team.name} has no playerIds, searching by teamId...`
              );
              validPlayers =
                (await playerRepository?.findByTeamId(teamId)) || [];
            }

            console.log(
              `✅ Loaded ${validPlayers.length} players for team ${teamId} (${team.name})`
            );
            return validPlayers;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to load players:', message);
            return [];
          }
        },

        createGame: async (command: CreateGameCommand) => {
          set({ loading: true, error: null });
          try {
            console.log('🆕 Creating game:', command.name);
            const result = await createGameUseCase.execute(command);

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            const newGame = result.value;
            if (!newGame) {
              throw new Error('Game creation returned no result');
            }

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

        loadDefaultData: async (): Promise<LoadDefaultDataResult> => {
          set({ loading: true, error: null });
          try {
            console.log('🔄 Loading sample data...');
            console.log('🔧 Dependencies check:', {
              loadDefaultDataUseCase: !!loadDefaultDataUseCase,
              playerRepository: !!playerRepository,
              teamRepository: !!teamRepository,
              seasonRepository: !!seasonRepository,
              gameTypeRepository: !!gameTypeRepository,
            });

            if (!loadDefaultDataUseCase) {
              console.error('❌ LoadDefaultDataUseCase not initialized');
              throw new Error('LoadDefaultDataUseCase not initialized');
            }

            if (!playerRepository) {
              console.error('❌ PlayerRepository not initialized');
              throw new Error('PlayerRepository not initialized');
            }

            const result = await loadDefaultDataUseCase.execute();

            if (result.isSuccess && result.value) {
              console.log('✅ Default data loaded successfully:', result.value);

              // Reload all data to reflect the changes
              await Promise.all([
                get().loadTeams(),
                get().loadSeasons(),
                get().loadGameTypes(),
              ]);

              set({ loading: false });
              return result.value;
            } else {
              throw new Error(result.error || 'Failed to load default data');
            }
          } catch (error) {
            console.error('❌ Failed to load default data:', error);
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error occurred';
            set({
              loading: false,
              error: `Failed to load default data: ${errorMessage}`,
            });
            throw error;
          }
        },

        createSeason: async (command: CreateSeasonCommand) => {
          set({ loading: true, error: null });
          try {
            console.log('🆕 Creating season:', command.name);

            // Create new season entity
            const seasonId = crypto.randomUUID();
            const newSeason = new Season(
              seasonId,
              command.name,
              command.year,
              command.startDate,
              command.endDate
            );

            // Save to repository
            const savedSeason = await seasonRepository?.save(newSeason);

            // Add new season to current list
            const currentSeasons = get().seasons;
            set({
              seasons: [savedSeason, ...currentSeasons],
              loading: false,
            });

            console.log('✅ Season created successfully:', savedSeason.id);
            return savedSeason;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to create season:', message);
            set({
              loading: false,
              error: `Failed to create season: ${message}`,
            });
            throw error;
          }
        },

        updateSeason: async (season: Season) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating season:', season.id);
            const updatedSeason = await seasonRepository?.save(season);

            // Update season in current list
            const currentSeasons = get().seasons;
            const updatedSeasons = currentSeasons.map((s: Season) =>
              s.id === season.id ? updatedSeason : s
            );

            set({
              seasons: updatedSeasons,
              loading: false,
            });

            console.log('✅ Season updated successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to update season:', message);
            set({
              loading: false,
              error: `Failed to update season: ${message}`,
            });
          }
        },

        deleteSeason: async (seasonId: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🗑️ Deleting season:', seasonId);
            await seasonRepository?.delete(seasonId);

            // Remove season from current list
            const currentSeasons = get().seasons;
            const filteredSeasons = currentSeasons.filter(
              (s: Season) => s.id !== seasonId
            );

            set({
              seasons: filteredSeasons,
              loading: false,
            });

            console.log('✅ Season deleted successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to delete season:', message);
            set({
              loading: false,
              error: `Failed to delete season: ${message}`,
            });
          }
        },

        createGameType: async (command: CreateGameTypeCommand) => {
          set({ loading: true, error: null });
          try {
            console.log('🆕 Creating game type:', command.name);

            // Create new game type entity
            const gameTypeId = crypto.randomUUID();
            const newGameType = new GameType(
              gameTypeId,
              command.name,
              command.description || ''
            );

            // Save to repository
            const savedGameType = await gameTypeRepository?.save(newGameType);

            // Add new game type to current list
            const currentGameTypes = get().gameTypes;
            set({
              gameTypes: [savedGameType, ...currentGameTypes],
              loading: false,
            });

            console.log('✅ Game type created successfully:', savedGameType.id);
            return savedGameType;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to create game type:', message);
            set({
              loading: false,
              error: `Failed to create game type: ${message}`,
            });
            throw error;
          }
        },

        updateGameType: async (gameType: GameType) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating game type:', gameType.id);
            const updatedGameType = await gameTypeRepository?.save(gameType);

            // Update game type in current list
            const currentGameTypes = get().gameTypes;
            const updatedGameTypes = currentGameTypes.map((gt: GameType) =>
              gt.id === gameType.id ? updatedGameType : gt
            );

            set({
              gameTypes: updatedGameTypes,
              loading: false,
            });

            console.log('✅ Game type updated successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to update game type:', message);
            set({
              loading: false,
              error: `Failed to update game type: ${message}`,
            });
          }
        },

        deleteGameType: async (gameTypeId: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🗑️ Deleting game type:', gameTypeId);
            await gameTypeRepository?.delete(gameTypeId);

            // Remove game type from current list
            const currentGameTypes = get().gameTypes;
            const filteredGameTypes = currentGameTypes.filter(
              (gt: GameType) => gt.id !== gameTypeId
            );

            set({
              gameTypes: filteredGameTypes,
              loading: false,
            });

            console.log('✅ Game type deleted successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to delete game type:', message);
            set({
              loading: false,
              error: `Failed to delete game type: ${message}`,
            });
          }
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
