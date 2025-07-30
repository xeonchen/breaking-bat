import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Team, Player, Position } from '@/domain';
import { CreateTeamCommand } from '@/application/use-cases/CreateTeamUseCase';
import { v4 as uuidv4 } from 'uuid';

interface PlayerData {
  name: string;
  jerseyNumber: string;
  position: Position;
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
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;
  playerStats: Record<string, PlayerStats>;

  // Actions
  getTeams: () => Promise<void>;
  createTeam: (command: CreateTeamCommand) => Promise<void>;
  updateTeam: (teamId: string, teamData: TeamData) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addPlayer: (teamId: string, playerData: PlayerData) => Promise<void>;
  updatePlayer: (playerId: string, playerData: Player) => Promise<void>;
  removePlayer: (teamId: string, playerId: string) => Promise<void>;
  getPlayerStats: () => Promise<void>;
  selectTeam: (team: Team) => void;
  clearSelection: () => void;
  clearError: () => void;
}

// Repository interfaces - will be injected in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let teamRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let playerRepository: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createTeamUseCase: any;

// Initialize function for dependency injection
export const initializeTeamsStore = (deps: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playerRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTeamUseCase: any;
}): void => {
  teamRepository = deps.teamRepository;
  playerRepository = deps.playerRepository;
  createTeamUseCase = deps.createTeamUseCase;
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
          set({ loading: true, error: null });
          try {
            const teams = await teamRepository.findAll();
            set({ teams, loading: false });
          } catch {
            set({
              loading: false,
              error: 'Failed to load teams',
              teams: [],
            });
          }
        },

        createTeam: async (command: CreateTeamCommand) => {
          set({ loading: true, error: null });
          try {
            const result = await createTeamUseCase.execute(command);

            if (!result.isSuccess) {
              set({ loading: false, error: result.error });
              return;
            }

            const currentTeams = get().teams;
            set({
              teams: [...currentTeams, result.value],
              loading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to create team: ${message}`,
            });
          }
        },

        updateTeam: async (teamId: string, teamData: TeamData) => {
          set({ loading: true, error: null });
          try {
            const updatedTeam = new Team(
              teamData.id,
              teamData.name,
              teamData.seasonIds,
              teamData.playerIds
            );

            const savedTeam = await teamRepository.save(updatedTeam);

            const currentTeams = get().teams;
            const updatedTeams = currentTeams.map((team) =>
              team.id === teamId ? savedTeam : team
            );

            set({ teams: updatedTeams, loading: false });
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
            // Create and save the player
            const playerId = uuidv4();
            const player: Player = {
              id: playerId,
              name: playerData.name,
              jerseyNumber: playerData.jerseyNumber,
              position: playerData.position,
              isActive: playerData.isActive,
            };

            await playerRepository.save(player);

            // Add player to team
            const updatedTeam = await teamRepository.addPlayer(
              teamId,
              playerId
            );

            const currentTeams = get().teams;
            const updatedTeams = currentTeams.map((team) =>
              team.id === teamId ? updatedTeam : team
            );

            set({ teams: updatedTeams, loading: false });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            set({
              loading: false,
              error: `Failed to add player: ${message}`,
            });
          }
        },

        updatePlayer: async (playerId: string, playerData: Player) => {
          set({ loading: true, error: null });
          try {
            await playerRepository.save(playerData);
            set({ loading: false });
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
            // Remove player from team
            const updatedTeam = await teamRepository.removePlayer(
              teamId,
              playerId
            );

            // Delete the player
            await playerRepository.delete(playerId);

            const currentTeams = get().teams;
            const updatedTeams = currentTeams.map((team) =>
              team.id === teamId ? updatedTeam : team
            );

            set({ teams: updatedTeams, loading: false });
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

        selectTeam: (team: Team) => {
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
