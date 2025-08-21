import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Team, Position, ITeamRepository, IPlayerRepository } from '@/domain';
import {
  CreateTeamCommand,
  CreateTeamUseCase,
} from '@/application/use-cases/CreateTeamUseCase';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import {
  PresentationTeam,
  PresentationPlayer,
} from '@/presentation/types/TeamWithPlayers';
import {
  PresentationPosition,
  PresentationValueConverter,
} from '@/presentation/types/presentation-values';
import { TeamHydrationService } from '@/presentation/services/TeamHydrationService';

interface PlayerData {
  name: string;
  jerseyNumber: string;
  positions: PresentationPosition[];
  isActive: boolean;
}

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

// Repository interfaces - will be injected in production
let teamRepository: ITeamRepository;
let teamHydrationService: TeamHydrationService;
let createTeamUseCase: CreateTeamUseCase;
let addPlayerUseCase: AddPlayerUseCase;
let updatePlayerUseCase: UpdatePlayerUseCase;
let removePlayerUseCase: RemovePlayerUseCase;

// Initialize function for dependency injection
export const initializeTeamsStore = (deps: {
  teamRepository: ITeamRepository;
  playerRepository: IPlayerRepository;
  teamHydrationService: TeamHydrationService;
  createTeamUseCase: CreateTeamUseCase;
  addPlayerUseCase: AddPlayerUseCase;
  updatePlayerUseCase: UpdatePlayerUseCase;
  removePlayerUseCase: RemovePlayerUseCase;
}): void => {
  console.log('🔧 Initializing TeamsStore with dependencies:', {
    teamRepository: !!deps.teamRepository,
    playerRepository: !!deps.playerRepository,
    teamHydrationService: !!deps.teamHydrationService,
    createTeamUseCase: !!deps.createTeamUseCase,
    addPlayerUseCase: !!deps.addPlayerUseCase,
    updatePlayerUseCase: !!deps.updatePlayerUseCase,
    removePlayerUseCase: !!deps.removePlayerUseCase,
  });

  teamRepository = deps.teamRepository;
  teamHydrationService = deps.teamHydrationService;
  createTeamUseCase = deps.createTeamUseCase;
  addPlayerUseCase = deps.addPlayerUseCase;
  updatePlayerUseCase = deps.updatePlayerUseCase;
  removePlayerUseCase = deps.removePlayerUseCase;

  console.log('✅ TeamsStore dependencies initialized successfully');
};

// Mock stats repository for now
const mockStatsRepository = {
  getPlayerStats: async (): Promise<Record<string, PlayerStats>> => {
    // In a real implementation, this would fetch from a stats repository
    return {};
  },
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
            console.log('🔍 Fetching domain teams from repository...');
            const domainTeams = await teamRepository.findAll();
            console.log(
              `✅ Found ${domainTeams.length} domain teams:`,
              domainTeams.map((t: Team) => ({ id: t.id, name: t.name }))
            );

            console.log('💧 Hydrating teams with player data...');
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);
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
            console.log('🔧 Executing CreateTeamUseCase...');
            const result = await createTeamUseCase.execute(command);
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
            const domainTeams = await teamRepository.findAll();
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);

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
            const updatedTeam = new Team(
              teamData.id,
              teamData.name,
              teamData.seasonIds,
              teamData.playerIds
            );

            await teamRepository.save(updatedTeam);

            // Refresh teams list to get updated data with proper hydration
            const domainTeams = await teamRepository.findAll();
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);

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
            await teamRepository.delete(teamId);

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
            const result = await addPlayerUseCase.execute({
              teamId,
              name: playerData.name,
              jerseyNumber: parseInt(playerData.jerseyNumber, 10),
              positions: playerData.positions.map((pos) =>
                Position.fromValue(
                  PresentationValueConverter.toDomainPosition(pos)
                )
              ),
              isActive: playerData.isActive,
            });

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            // Refresh teams list to get updated data
            const domainTeams = await teamRepository.findAll();
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);

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
          set({ loading: true, error: null });
          try {
            const domainPlayerData =
              TeamHydrationService.convertPresentationPlayerToDomain(
                playerData
              );
            const result = await updatePlayerUseCase.execute({
              playerId,
              ...domainPlayerData,
            });

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            // Refresh teams list to get updated data
            const domainTeams = await teamRepository.findAll();
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);

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
            const result = await removePlayerUseCase.execute({
              teamId,
              playerId,
            });

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            // Refresh teams list to get updated data
            const domainTeams = await teamRepository.findAll();
            const hydratedTeams =
              await teamHydrationService.hydrateTeams(domainTeams);

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
            const stats = await mockStatsRepository.getPlayerStats();
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
