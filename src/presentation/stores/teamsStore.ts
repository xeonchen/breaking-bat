import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PositionMapper } from '@/presentation/mappers/PositionMapper';
// Domain imports removed to fix Clean Architecture violations
// Using DTOs from application layer instead
import {
  ITeamApplicationService,
  CreateTeamCommand,
  UpdateTeamCommand,
  AddPlayerToTeamCommand,
  UpdatePlayerInTeamCommand,
  RemovePlayerFromTeamCommand,
  TeamDto,
  // GetTeamByIdQuery, // TODO: Remove unused import
  // TeamWithPlayersDto, // TODO: Remove unused import
  // TeamPlayerDto, // TODO: Remove unused import
} from '@/application/services/interfaces/ITeamApplicationService';
// import { Result } from '@/application/common/Result'; // TODO: Remove unused import
import {
  PresentationTeam,
  PresentationPlayer,
} from '@/presentation/interfaces/IPresentationServices';

// Helper function to convert TeamDto to PresentationTeam
function convertDtoToPresentation(dto: TeamDto): PresentationTeam {
  return {
    id: dto.id,
    name: dto.name,
    players: [], // Will be loaded separately when needed
    seasonIds: dto.seasonIds || [],
    isActive: dto.isActive || true,
  };
}

// Using canonical PresentationPlayer type instead of custom PlayerData
type PlayerData = Omit<PresentationPlayer, 'id'>;

interface TeamData {
  id: string;
  name: string;
  seasonIds: string[];
  playerIds: string[];
}

interface PlayerStats {
  avg: number;
  hits: number;
  atBats: number;
  rbi: number;
}

interface TeamsState {
  // State
  teams: PresentationTeam[];
  selectedTeam: PresentationTeam | null;
  loading: boolean;
  error: string | null;
  playerStats: Record<string, PlayerStats>;

  // Actions
  getTeams: () => Promise<void>;
  createTeam: (command: CreateTeamCommand) => Promise<void>;
  updateTeam: (teamId: string, teamData: TeamData) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addPlayer: (teamId: string, playerData: PlayerData) => Promise<void>;
  updatePlayer: (
    playerId: string,
    playerData: PresentationPlayer
  ) => Promise<void>;
  removePlayer: (teamId: string, playerId: string) => Promise<void>;
  getPlayerStats: () => Promise<void>;
  selectTeam: (team: PresentationTeam) => void;
  clearSelection: () => void;
  clearError: () => void;
}

// Application services - will be injected in production
let teamApplicationService: ITeamApplicationService;

// Initialize function for dependency injection
export const initializeTeamsStore = (deps: {
  teamApplicationService: ITeamApplicationService;
}): void => {
  console.log('🔧 Initializing TeamsStore with dependencies:', {
    teamApplicationService: !!deps.teamApplicationService,
  });

  teamApplicationService = deps.teamApplicationService;

  console.log('✅ TeamsStore dependencies initialized successfully');
};

export const useTeamsStore = create<TeamsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        teams: [],
        selectedTeam: null,
        loading: false,
        error: null,
        playerStats: {},

        // Actions
        getTeams: async () => {
          console.log('📋 Getting teams...');
          set({ loading: true, error: null });
          try {
            // Call application service to get teams (Clean Architecture compliance)
            const result = await teamApplicationService.getTeams();
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to fetch teams');
            }
            const domainTeams = result.value || [];
            console.log(
              `✅ Found ${domainTeams.length} teams from application layer:`,
              domainTeams.map((t) => ({
                id: t.id,
                name: t.name,
              }))
            );

            console.log('💧 Converting teams to presentation format...');
            // Convert DTOs to presentation teams
            const hydratedTeams = domainTeams.map(convertDtoToPresentation);
            console.log(
              `✅ Hydrated ${hydratedTeams.length} teams:`,
              hydratedTeams.map((t: PresentationTeam) => ({
                id: t.id,
                name: t.name,
                playerCount: t.players.length,
              }))
            );

            set({ teams: hydratedTeams, loading: false });
            console.log('✅ Teams loaded successfully into store');
          } catch (error) {
            console.error('❌ Failed to load teams:', error);
            set({
              loading: false,
              error: 'Failed to load teams',
              teams: [],
            });
          }
        },

        createTeam: async (command: CreateTeamCommand) => {
          console.log('🏗️ Creating team:', command);
          set({ loading: true, error: null });
          try {
            console.log('🔧 Executing TeamApplicationService.createTeam...');
            const result = await teamApplicationService.createTeam(command);
            console.log('📝 CreateTeamUseCase result:', {
              isSuccess: result.isSuccess,
              error: result.error,
            });

            if (!result.isSuccess) {
              console.error('❌ Team creation failed:', result.error);
              set({ loading: false, error: result.error });
              return;
            }

            console.log('✅ Team created successfully:', result.value);

            // Refresh the entire teams list to get proper hydration
            console.log('🔄 Refreshing teams list to include new team...');
            const teamsResult = await teamApplicationService.getTeams();
            if (!teamsResult.isSuccess) {
              throw new Error(teamsResult.error || 'Failed to refresh teams');
            }
            const hydratedTeams = (teamsResult.value || []).map(
              convertDtoToPresentation
            );

            set({
              teams: hydratedTeams,
              loading: false,
            });
            console.log('✅ Team created and teams list refreshed');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Team creation error:', error);
            set({
              loading: false,
              error: `Failed to create team: ${message}`,
            });
          }
        },

        updateTeam: async (_teamId: string, teamData: TeamData) => {
          set({ loading: true, error: null });
          try {
            const updateCommand: UpdateTeamCommand = {
              teamId: teamData.id,
              name: teamData.name,
              seasonIds: teamData.seasonIds,
              isActive: true,
            };

            const result =
              await teamApplicationService.updateTeam(updateCommand);
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to update team');
            }

            // Refresh teams list to get updated data with proper hydration
            const teamsResult = await teamApplicationService.getTeams();
            if (!teamsResult.isSuccess) {
              throw new Error(teamsResult.error || 'Failed to refresh teams');
            }
            const hydratedTeams = (teamsResult.value || []).map(
              convertDtoToPresentation
            );

            set({ teams: hydratedTeams, loading: false });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to update team: ${message}`,
            });
          }
        },

        deleteTeam: async (teamId: string) => {
          set({ loading: true, error: null });
          try {
            // Soft delete by setting isActive to false
            const updateCommand: UpdateTeamCommand = {
              teamId,
              isActive: false,
            };
            const result =
              await teamApplicationService.updateTeam(updateCommand);
            if (!result.isSuccess) {
              throw new Error(result.error || 'Failed to delete team');
            }

            const currentTeams = get().teams;
            const filteredTeams = currentTeams.filter(
              (team) => team.id !== teamId
            );

            set({ teams: filteredTeams, loading: false });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to delete team: ${message}`,
            });
          }
        },

        addPlayer: async (teamId: string, playerData: PlayerData) => {
          set({ loading: true, error: null });
          try {
            const command: AddPlayerToTeamCommand = {
              teamId,
              playerName: playerData.name,
              jerseyNumber: parseInt(playerData.jerseyNumber, 10),
              positions: playerData.positions.map((posString) => {
                // Convert string to PresentationPosition first, then to domain string
                const presentationPos =
                  PositionMapper.domainStringToPresentation(posString);
                return PositionMapper.presentationToDomainString(
                  presentationPos
                );
              }),
              isActive: playerData.isActive,
            };

            const result = await teamApplicationService.addPlayer(command);

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            // Refresh teams list to get updated data
            const teamsResult = await teamApplicationService.getTeams();
            if (!teamsResult.isSuccess) {
              throw new Error(teamsResult.error || 'Failed to refresh teams');
            }
            const hydratedTeams = (teamsResult.value || []).map(
              convertDtoToPresentation
            );

            // Update selectedTeam if it matches the affected team
            const currentSelectedTeam = get().selectedTeam;
            let updatedSelectedTeam = currentSelectedTeam;
            if (currentSelectedTeam && currentSelectedTeam.id === teamId) {
              updatedSelectedTeam =
                hydratedTeams.find((t: PresentationTeam) => t.id === teamId) ||
                currentSelectedTeam;
            }

            set({
              teams: hydratedTeams,
              selectedTeam: updatedSelectedTeam,
              loading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to add player: ${message}`,
            });
          }
        },

        updatePlayer: async (
          playerId: string,
          playerData: PresentationPlayer
        ) => {
          console.log('🔧 teamsStore.updatePlayer called:', {
            playerId,
            playerData,
          });
          set({ loading: true, error: null });
          try {
            const currentState = get();
            const teamId = currentState.selectedTeam?.id;

            console.log('🔧 Current selectedTeam:', {
              selectedTeamId: teamId,
              selectedTeamName: currentState.selectedTeam?.name,
            });

            if (!teamId) {
              console.error('❌ No team selected for player update');
              set({
                loading: false,
                error: 'No team selected for player update',
              });
              return;
            }

            const updateCommand: UpdatePlayerInTeamCommand = {
              teamId,
              playerId,
              playerName: playerData.name,
              jerseyNumber: parseInt(playerData.jerseyNumber, 10),
              positions: playerData.positions.map((posString) => {
                // Convert string to PresentationPosition first, then to domain string
                const presentationPos =
                  PositionMapper.domainStringToPresentation(posString);
                return PositionMapper.presentationToDomainString(
                  presentationPos
                );
              }),
              isActive: playerData.isActive,
            };
            const result =
              await teamApplicationService.updatePlayer(updateCommand);

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }
            // Refresh teams list to get updated data
            const teamsResult = await teamApplicationService.getTeams();
            if (!teamsResult.isSuccess) {
              throw new Error(teamsResult.error || 'Failed to refresh teams');
            }
            const hydratedTeams = (teamsResult.value || []).map(
              convertDtoToPresentation
            );

            // Update selectedTeam if it contains the updated player
            const currentSelectedTeam = get().selectedTeam;
            let updatedSelectedTeam = currentSelectedTeam;
            if (
              currentSelectedTeam &&
              currentSelectedTeam.players.some((p) => p.id === playerId)
            ) {
              updatedSelectedTeam =
                hydratedTeams.find(
                  (t: PresentationTeam) => t.id === currentSelectedTeam.id
                ) || currentSelectedTeam;
            }

            console.log('🔧 Setting updated store state:', {
              teamsCount: hydratedTeams.length,
              selectedTeamName: updatedSelectedTeam?.name,
              selectedTeamPlayerCount: updatedSelectedTeam?.players?.length,
            });

            set({
              teams: hydratedTeams,
              selectedTeam: updatedSelectedTeam,
              loading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to update player: ${message}`,
            });
          }
        },

        removePlayer: async (teamId: string, playerId: string) => {
          set({ loading: true, error: null });
          try {
            const removeCommand: RemovePlayerFromTeamCommand = {
              teamId,
              playerId,
            };
            const result =
              await teamApplicationService.removePlayer(removeCommand);

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            // Refresh teams list to get updated data
            const teamsResult = await teamApplicationService.getTeams();
            if (!teamsResult.isSuccess) {
              throw new Error(teamsResult.error || 'Failed to refresh teams');
            }
            const hydratedTeams = (teamsResult.value || []).map(
              convertDtoToPresentation
            );

            // Update selectedTeam if it matches the affected team
            const currentSelectedTeam = get().selectedTeam;
            let updatedSelectedTeam = currentSelectedTeam;
            if (currentSelectedTeam && currentSelectedTeam.id === teamId) {
              updatedSelectedTeam =
                hydratedTeams.find((t: PresentationTeam) => t.id === teamId) ||
                currentSelectedTeam;
            }

            set({
              teams: hydratedTeams,
              selectedTeam: updatedSelectedTeam,
              loading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to remove player: ${message}`,
            });
          }
        },

        getPlayerStats: async () => {
          set({ error: null });
          try {
            // TODO: Replace with proper statistics application service call
            // For now, use empty stats to avoid repository violation
            const stats = {};
            set({ playerStats: stats });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              error: `Failed to load player statistics: ${message}`,
              playerStats: {},
            });
          }
        },

        selectTeam: (team: PresentationTeam) => {
          set({ selectedTeam: team });
        },

        clearSelection: () => {
          set({ selectedTeam: null });
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'teams-store',
        partialize: (state) => ({
          teams: state.teams,
          selectedTeam: state.selectedTeam,
        }),
      }
    ),
    {
      name: 'teams-store',
    }
  )
);
