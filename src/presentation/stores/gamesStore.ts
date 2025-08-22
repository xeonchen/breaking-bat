import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
// Domain imports removed to fix Clean Architecture violations
// Using DTOs from application layer instead
// import { Game, Season, GameType, Team, Player } from '@/domain'; // REMOVED
import {
  IGameApplicationService,
  IDataApplicationService,
  CreateGameCommand,
  GameDto,
  LoadDefaultDataResultDto,
  GameStatus,
} from '@/application/services/interfaces';
import {
  ITeamApplicationService,
  TeamDto,
} from '@/application/services/interfaces/ITeamApplicationService';
import {
  SeasonDto,
  GameTypeDto,
  CreateSeasonCommand,
  CreateGameTypeCommand,
  UpdateSeasonCommand,
  UpdateGameTypeCommand,
  ArchiveSeasonCommand,
} from '@/application/services/interfaces/IDataApplicationService';
// import { Result } from '@/application/common/Result'; // TODO: Remove unused import

interface GamesState {
  // State
  games: GameDto[];
  seasons: SeasonDto[];
  gameTypes: GameTypeDto[];
  teams: TeamDto[];
  selectedGame: GameDto | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: GameStatus | 'all';

  // Actions
  loadGames: () => Promise<void>;
  loadSeasons: () => Promise<void>;
  loadGameTypes: () => Promise<void>;
  loadTeams: () => Promise<void>;
  loadPlayersForTeam: (teamId: string) => Promise<unknown[]>; // Using DTOs
  createGame: (command: CreateGameCommand) => Promise<unknown>; // Using DTOs
  updateGame: (game: GameDto) => Promise<void>; // Using DTOs
  saveLineup: (
    gameId: string,
    lineupId: string,
    playerIds: string[],
    defensivePositions: string[]
  ) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  createSeason: (command: CreateSeasonCommand) => Promise<SeasonDto>;
  updateSeason: (season: SeasonDto) => Promise<void>;
  deleteSeason: (seasonId: string) => Promise<void>;
  createGameType: (command: CreateGameTypeCommand) => Promise<GameTypeDto>;
  updateGameType: (gameType: GameTypeDto) => Promise<void>;
  deleteGameType: (gameTypeId: string) => Promise<void>;
  selectGame: (game: GameDto) => void;
  clearSelection: () => void;
  clearError: () => void;
  searchGames: (query: string) => void;
  filterGamesByStatus: (status: GameStatus | 'all') => void;
  filterGamesByTeam: (teamId: string) => void;
  loadDefaultData: () => Promise<LoadDefaultDataResultDto>;
}

// Application services - will be injected in production
let gameApplicationService: IGameApplicationService;
let dataApplicationService: IDataApplicationService;
let teamApplicationService: ITeamApplicationService;

// Initialize function for dependency injection
export const initializeGamesStore = (deps: {
  gameApplicationService: IGameApplicationService;
  dataApplicationService: IDataApplicationService;
  teamApplicationService: ITeamApplicationService;
}): void => {
  console.log('🔧 Initializing GamesStore with dependencies:', {
    gameApplicationService: !!deps.gameApplicationService,
    dataApplicationService: !!deps.dataApplicationService,
    teamApplicationService: !!deps.teamApplicationService,
  });

  gameApplicationService = deps.gameApplicationService;
  dataApplicationService = deps.dataApplicationService;
  teamApplicationService = deps.teamApplicationService;

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
            const result = await gameApplicationService.getCurrentGames({});
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to fetch games');
            }
            const games = result.value || [];
            console.log(`✅ Loaded ${games.length} games`);

            // Apply current filters
            const { searchQuery, statusFilter } = get();
            let filteredGames = games;

            if (searchQuery) {
              filteredGames = games.filter(
                (game: GameDto) =>
                  game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  game.opponent
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              );
            }

            if (statusFilter !== 'all') {
              filteredGames = filteredGames.filter(
                (game: GameDto) => game.status === statusFilter
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
            const seasonsResult = await dataApplicationService.getSeasons({});
            const seasons = seasonsResult.isSuccess
              ? seasonsResult.value || []
              : [];
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
            const gameTypesResult = await dataApplicationService.getGameTypes(
              {}
            );
            const gameTypes = gameTypesResult.isSuccess
              ? gameTypesResult.value || []
              : [];
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
            const teamsResult = await teamApplicationService.getTeams({});
            const teams = teamsResult.isSuccess ? teamsResult.value || [] : [];
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

            // Use team application service to get team roster (temporary placeholder)
            console.log(
              '⚠️ Using placeholder implementation - getTeamRoster not implemented yet'
            );
            return []; // Placeholder return until getTeamRoster is properly implemented
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
            const result = await gameApplicationService.createGame(command);

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

        updateGame: async (game: GameDto) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating game:', game.id);

            // Use GameApplicationService to update the game
            const result = await gameApplicationService.updateGame({
              gameId: game.id,
              name: game.name,
              opponent: game.opponent,
              date: game.date,
              location: game.location,
              isHomeGame: game.isHomeGame,
            });

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            const updatedGame = result.value;
            if (!updatedGame) {
              throw new Error('Updated game data not returned from service');
            }

            // Update game in current list
            const currentGames = get().games;
            const updatedGames = currentGames.map((g: GameDto) =>
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

        saveLineup: async (
          gameId: string,
          lineupId: string,
          playerIds: string[],
          defensivePositions: string[]
        ) => {
          set({ loading: true, error: null });
          try {
            console.log('📋 Saving lineup:', lineupId, 'for game:', gameId);

            // Use GameApplicationService to set up lineup
            const result = await gameApplicationService.setupLineup({
              gameId: gameId,
              playerIds: playerIds,
              defensivePositions: defensivePositions,
              battingOrder: playerIds.map((_, index) => index + 1), // Simple 1-based order
              lineupName: `Lineup ${lineupId}`,
            });

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            set({ loading: false });
            console.log('✅ Lineup saved successfully');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to save lineup:', message);
            set({
              loading: false,
              error: `Failed to save lineup: ${message}`,
            });
            throw error; // Re-throw so calling code can handle it
          }
        },

        deleteGame: async (gameId: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🗑️ Deleting game:', gameId);

            // Call application service to delete game
            const result = await gameApplicationService.deleteGame(gameId);

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            // Remove game from current state if delete was successful
            const currentGames = get().games;
            const updatedGames = currentGames.filter(
              (game) => game.id !== gameId
            );

            // Clear selected game if it was the deleted one
            const selectedGame = get().selectedGame;
            const newSelectedGame =
              selectedGame?.id === gameId ? null : selectedGame;

            set({
              games: updatedGames,
              selectedGame: newSelectedGame,
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

        selectGame: (game: GameDto) => {
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
          set({ searchQuery: query });

          // Apply search filter to current games
          const allGames = get().games;
          if (!query.trim()) {
            // If empty query, reload all games
            get().loadGames();
            return;
          }

          const filteredGames = allGames.filter(
            (game: GameDto) =>
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
            (game: GameDto) => game.status === status
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
            (game: GameDto) => game.teamId === teamId
          );
          set({ games: filteredGames });
        },

        loadDefaultData: async (): Promise<LoadDefaultDataResultDto> => {
          set({ loading: true, error: null });
          try {
            console.log('🔄 Loading default data...');

            // Use DataApplicationService instead of use case and repositories
            const result = await dataApplicationService.loadDefaultData({
              includeTeams: true,
              includePlayers: true,
              includeSeasons: true,
              includeGameTypes: true,
              overwriteExisting: false,
              sampleDataSize: 'standard',
            });

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

            // Use DataApplicationService to create season
            const result = await dataApplicationService.createSeason({
              name: command.name,
              year: command.year,
              startDate: command.startDate,
              endDate: command.endDate,
              description: command.description,
              isActive: command.isActive,
            });

            if (!result.isSuccess || !result.value) {
              throw new Error(result.error || 'Failed to create season');
            }

            const savedSeason = result.value;

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

        updateSeason: async (season: SeasonDto) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating season:', season.id);
            const updateCommand: UpdateSeasonCommand = {
              seasonId: season.id,
              name: season.name,
              year: season.year,
              startDate: season.startDate,
              endDate: season.endDate,
              description: season.description,
              isActive: season.isActive,
            };
            const result =
              await dataApplicationService.updateSeason(updateCommand);

            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to update season');
            }

            // Refresh seasons list to get updated data
            const seasonsResult = await dataApplicationService.getSeasons({
              includeArchived: false,
              isActive: true,
            });
            if (!seasonsResult.isSuccess) {
              throw new Error(
                seasonsResult.error || 'Failed to refresh seasons'
              );
            }
            const updatedSeasons = seasonsResult.value || [];

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
            // TODO: Add deleteSeason method to IDataApplicationService
            // For now, use archiveSeason as alternative
            const archiveCommand: ArchiveSeasonCommand = {
              seasonId,
              archiveReason: 'User requested deletion',
              preserveStatistics: false,
            };
            const result =
              await dataApplicationService.archiveSeason(archiveCommand);

            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to delete season');
            }

            // Remove season from current list
            const currentSeasons = get().seasons;
            const filteredSeasons = currentSeasons.filter(
              (s: SeasonDto) => s.id !== seasonId
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

            // Call application service to create game type
            const result = await dataApplicationService.createGameType(command);
            if (!result.isSuccess || !result.value) {
              throw new Error(result.error || 'Failed to create game type');
            }

            // Refresh game types list
            const gameTypesResult = await dataApplicationService.getGameTypes({
              includeInactive: false,
            });
            if (!gameTypesResult.isSuccess) {
              throw new Error(
                gameTypesResult.error || 'Failed to refresh game types'
              );
            }

            // Update game types list with the refreshed data
            const currentGameTypes = gameTypesResult.value || [];
            set({
              gameTypes: currentGameTypes,
              loading: false,
            });

            console.log('✅ Game type created successfully');
            return result.value;
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

        updateGameType: async (gameType: GameTypeDto) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Updating game type:', gameType.id);
            const updateCommand: UpdateGameTypeCommand = {
              gameTypeId: gameType.id,
              name: gameType.name,
              description: gameType.description,
              defaultInnings: gameType.defaultInnings,
              allowTies: gameType.allowTies,
              mercyRule: gameType.mercyRule,
              isActive: gameType.isActive,
            };
            const result =
              await dataApplicationService.updateGameType(updateCommand);

            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to update game type');
            }

            // Refresh game types list to get updated data
            const gameTypesResult = await dataApplicationService.getGameTypes({
              includeInactive: false,
            });
            if (!gameTypesResult.isSuccess) {
              throw new Error(
                gameTypesResult.error || 'Failed to refresh game types'
              );
            }
            const updatedGameTypes = gameTypesResult.value || [];

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

            // Call application service to delete game type
            const result =
              await dataApplicationService.deleteGameType(gameTypeId);

            if (!result.isSuccess) {
              throw new Error(result.error);
            }

            // Remove game type from current state if delete was successful
            const currentGameTypes = get().gameTypes;
            const updatedGameTypes = currentGameTypes.filter(
              (gt) => gt.id !== gameTypeId
            );

            set({
              gameTypes: updatedGameTypes,
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
