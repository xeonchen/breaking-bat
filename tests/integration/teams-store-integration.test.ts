import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { TeamHydrationService } from '@/infrastructure/adapters/services/TeamHydrationService';
import {
  initializeTeamsStore,
  useTeamsStore,
} from '@/presentation/stores/teamsStore';
import { createFreshTestDatabase } from '../test-helpers/database';
import { PresentationPosition } from '@/presentation/types/presentation-values';
import Dexie from 'dexie';

// PresentationPosition is now an enum, no helper needed

describe('Teams Store Integration Tests', () => {
  let db: Dexie;
  let teamRepository: IndexedDBTeamRepository;
  let playerRepository: IndexedDBPlayerRepository;
  let teamHydrationService: TeamHydrationService;
  let addPlayerUseCase: AddPlayerUseCase;
  let updatePlayerUseCase: UpdatePlayerUseCase;
  let removePlayerUseCase: RemovePlayerUseCase;
  let createTeamUseCase: CreateTeamUseCase;
  let testTeamId: string;

  beforeEach(async () => {
    // Create fresh test database
    db = createFreshTestDatabase();
    await db.open();

    // Initialize repositories and services
    teamRepository = new IndexedDBTeamRepository(db);
    playerRepository = new IndexedDBPlayerRepository(db);
    teamHydrationService = new TeamHydrationService(playerRepository);

    // Initialize use cases
    addPlayerUseCase = new AddPlayerUseCase(playerRepository, teamRepository);
    updatePlayerUseCase = new UpdatePlayerUseCase(
      playerRepository,
      teamRepository
    );
    removePlayerUseCase = new RemovePlayerUseCase(
      playerRepository,
      teamRepository
    );
    createTeamUseCase = new CreateTeamUseCase(teamRepository);

    // Create a simple application service wrapper for integration testing
    const teamApplicationService = {
      getTeams: async () => {
        const teams = await teamRepository.findAll();
        return { isSuccess: true, value: teams };
      },
      createTeam: async (command: any) => {
        return await createTeamUseCase.execute(command);
      },
      updateTeam: async (command: any) => {
        // Not implemented for this test
        return { isSuccess: true, value: null };
      },
      deleteTeam: async (teamId: string) => {
        // Not implemented for this test
        return { isSuccess: true, value: null };
      },
      getTeamById: async (teamId: string) => {
        return await teamRepository.findById(teamId);
      },
      addPlayer: async (command: any) => {
        // Map AddPlayerToTeamCommand to AddPlayerCommand
        const addPlayerCommand = {
          teamId: command.teamId,
          name: command.playerName, // Map playerName to name
          jerseyNumber: command.jerseyNumber,
          positions: command.positions.map((pos: string) => ({ value: pos })), // Convert to Position objects
          isActive: command.isActive !== undefined ? command.isActive : true,
        };
        return await addPlayerUseCase.execute(addPlayerCommand);
      },
      updatePlayer: async (command: any) => {
        // Map UpdatePlayerInTeamCommand to UpdatePlayerCommand
        const updatePlayerCommand = {
          playerId: command.playerId,
          name: command.playerName, // Use playerName field from UpdatePlayerInTeamCommand
          jerseyNumber: command.jerseyNumber,
          positions: command.positions.map((pos: string) => ({ value: pos })), // Convert to Position objects
          isActive: command.isActive,
        };
        return await updatePlayerUseCase.execute(updatePlayerCommand);
      },
      removePlayer: async (command: any) => {
        return await removePlayerUseCase.execute(command);
      },
    };

    // Initialize the store with the application service
    initializeTeamsStore({
      teamApplicationService,
      teamHydrationService,
    });

    // Create a test team
    const teamResult = await createTeamUseCase.execute({
      name: 'Test Red Sox',
      seasonIds: [],
      playerIds: [],
    });
    expect(teamResult.isSuccess).toBe(true);
    expect(teamResult.value).toBeDefined();
    if (teamResult.value) {
      testTeamId = teamResult.value.id;
    }
  }, 15000);

  afterEach(async () => {
    if (db) {
      await db.delete();
      db.close();
    }
  }, 10000);

  describe('Team and Player Management', () => {
    it('should load teams correctly', async () => {
      const store = useTeamsStore.getState();

      // Load teams
      await store.getTeams();

      const updatedStore = useTeamsStore.getState();
      expect(updatedStore.teams).toHaveLength(1);
      expect(updatedStore.teams[0].name).toBe('Test Red Sox');
      expect(updatedStore.loading).toBe(false);
      expect(updatedStore.error).toBeNull();
    });

    it('should add a player and update selectedTeam correctly', async () => {
      const store = useTeamsStore.getState();

      // Load teams first
      await store.getTeams();

      // Select the team
      const team = useTeamsStore.getState().teams[0];
      store.selectTeam(team);

      // Verify team is selected
      expect(useTeamsStore.getState().selectedTeam?.id).toBe(testTeamId);
      expect(useTeamsStore.getState().selectedTeam?.players).toHaveLength(0);

      // Add a player
      await store.addPlayer(testTeamId, {
        name: 'David Ortiz',
        jerseyNumber: '34',
        positions: [PresentationPosition.FIRST_BASE],
        isActive: true,
      });

      // Verify player was added and selectedTeam was updated
      const finalStore = useTeamsStore.getState();
      expect(finalStore.loading).toBe(false);
      expect(finalStore.error).toBeNull();
      expect(finalStore.selectedTeam?.players).toHaveLength(1);
      expect(finalStore.selectedTeam?.players[0]?.name).toBe('David Ortiz');
      expect(finalStore.selectedTeam?.players[0]?.jerseyNumber).toBe('34');
    });

    it('should remove a player and update selectedTeam correctly', async () => {
      const store = useTeamsStore.getState();

      // Load teams and select team
      await store.getTeams();
      const team = useTeamsStore.getState().teams[0];
      store.selectTeam(team);

      // Add a player first
      await store.addPlayer(testTeamId, {
        name: 'Mookie Betts',
        jerseyNumber: '50',
        positions: [PresentationPosition.RIGHT_FIELD],
        isActive: true,
      });

      // Verify player was added
      const currentStore = useTeamsStore.getState();
      expect(currentStore.selectedTeam?.players).toHaveLength(1);
      const playerId = currentStore.selectedTeam?.players[0]?.id;
      expect(playerId).toBeDefined();

      // Remove the player
      await store.removePlayer(testTeamId, playerId!);

      // Verify player was removed and selectedTeam was updated
      const finalStore = useTeamsStore.getState();
      expect(finalStore.loading).toBe(false);
      expect(finalStore.error).toBeNull();
      expect(finalStore.selectedTeam?.players).toHaveLength(0);
    });

    it('should update a player and update selectedTeam correctly', async () => {
      const store = useTeamsStore.getState();

      // Load teams and select team
      await store.getTeams();
      const team = useTeamsStore.getState().teams[0];
      store.selectTeam(team);

      // Add a player first
      await store.addPlayer(testTeamId, {
        name: 'Carl Yastrzemski',
        jerseyNumber: '8',
        positions: [PresentationPosition.LEFT_FIELD],
        isActive: true,
      });

      // Verify player was added
      const currentStore = useTeamsStore.getState();
      expect(currentStore.selectedTeam?.players).toHaveLength(1);
      const player = currentStore.selectedTeam?.players[0];
      expect(player?.name).toBe('Carl Yastrzemski');

      // Update the player - use the existing player object format to avoid type mismatches
      await store.updatePlayer(player!.id, {
        ...player!,
        name: 'Yaz', // Only change the name
      });

      // Verify player was updated and selectedTeam was updated
      const finalStore = useTeamsStore.getState();
      expect(finalStore.loading).toBe(false);
      expect(finalStore.error).toBeNull();
      expect(finalStore.selectedTeam?.players).toHaveLength(1);
      expect(finalStore.selectedTeam?.players[0]?.name).toBe('Yaz');
      expect(finalStore.selectedTeam?.players[0]?.jerseyNumber).toBe('8'); // Should remain the same
    });

    it('should handle multiple rapid operations without data inconsistency', async () => {
      const store = useTeamsStore.getState();

      // Load teams and select team
      await store.getTeams();
      const team = useTeamsStore.getState().teams[0];
      store.selectTeam(team);

      // Add multiple players rapidly
      await Promise.all([
        store.addPlayer(testTeamId, {
          name: 'Player 1',
          jerseyNumber: '1',
          positions: [PresentationPosition.FIRST_BASE],
          isActive: true,
        }),
        store.addPlayer(testTeamId, {
          name: 'Player 2',
          jerseyNumber: '2',
          positions: ['second-base'],
          isActive: true,
        }),
      ]);

      // Verify both players were added
      const finalStore = useTeamsStore.getState();
      expect(finalStore.loading).toBe(false);
      expect(finalStore.error).toBeNull();
      expect(finalStore.selectedTeam?.players).toHaveLength(2);

      const playerNames = finalStore.selectedTeam?.players
        .map((p) => p.name)
        .sort();
      expect(playerNames).toEqual(['Player 1', 'Player 2']);
    });

    it('should handle errors gracefully', async () => {
      const store = useTeamsStore.getState();

      // Try to add a player to a non-existent team
      await store.addPlayer('non-existent-team-id', {
        name: 'Test Player',
        jerseyNumber: '99',
        positions: ['pitcher'],
        isActive: true,
      });

      // Verify error was handled
      const finalStore = useTeamsStore.getState();
      expect(finalStore.loading).toBe(false);
      expect(finalStore.error).toContain(
        'Team with id non-existent-team-id not found'
      );
    });
  });
});
