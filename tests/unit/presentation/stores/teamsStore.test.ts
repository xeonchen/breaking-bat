import { renderHook, act } from '@testing-library/react';
import { Team, Position } from '@/domain';
import { Result } from '@/application/common/Result';
import { useTeamsStore, initializeTeamsStore } from '@/presentation/stores/teamsStore';
import { PresentationTeam, PresentationPlayer } from '@/presentation/types/TeamWithPlayers';

// Mock dependencies
const mockTeamRepository = {
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
};

const mockPlayerRepository = {
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
};

const mockTeamHydrationService = {
  hydrateTeams: jest.fn(),
  convertPresentationPlayerToDomain: jest.fn(),
};

const mockCreateTeamUseCase = {
  execute: jest.fn(),
};

const mockAddPlayerUseCase = {
  execute: jest.fn(),
};

const mockUpdatePlayerUseCase = {
  execute: jest.fn(),
};

const mockRemovePlayerUseCase = {
  execute: jest.fn(),
};

// Initialize store with mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  initializeTeamsStore({
    teamRepository: mockTeamRepository,
    playerRepository: mockPlayerRepository,
    teamHydrationService: mockTeamHydrationService,
    createTeamUseCase: mockCreateTeamUseCase,
    addPlayerUseCase: mockAddPlayerUseCase,
    updatePlayerUseCase: mockUpdatePlayerUseCase,
    removePlayerUseCase: mockRemovePlayerUseCase,
  });
});

describe('TeamsStore', () => {

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTeamsStore());

      expect(result.current.teams).toEqual([]);
      expect(result.current.selectedTeam).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.playerStats).toEqual({});
    });
  });

  describe('Team Loading', () => {
    it('should load teams successfully', async () => {
      const mockTeams = [
        new Team('team-1', 'Yankees', [], []),
        new Team('team-2', 'Red Sox', [], []),
      ];
      mockTeamRepository.findAll.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.teams).toEqual(mockTeams);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading state correctly', async () => {
      let resolvePromise: (value: Team[]) => void;
      const promise = new Promise<Team[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockTeamRepository.findAll.mockReturnValue(promise);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.getTeams();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!([]);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load teams');
      mockTeamRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load teams');
    });
  });

  describe('Team Creation', () => {
    it('should create team successfully', async () => {
      const newTeam = new Team('team-1', 'Blue Jays', [], []);
      const mockCreateInstance = {
        execute: jest.fn().mockResolvedValue(Result.success(newTeam)),
      };
      mockCreateTeamUseCase.mockImplementation(() => mockCreateInstance);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.createTeam({
          name: 'Blue Jays',
          seasonIds: [],
          playerIds: [],
        });
      });

      expect(mockCreateInstance.execute).toHaveBeenCalledWith({
        name: 'Blue Jays',
        seasonIds: [],
        playerIds: [],
      });
      expect(result.current.teams).toContain(newTeam);
      expect(result.current.error).toBeNull();
    });

    it('should handle team creation validation errors', async () => {
      const mockCreateInstance = {
        execute: jest
          .fn()
          .mockResolvedValue(Result.failure('Team name is required')),
      };
      mockCreateTeamUseCase.mockImplementation(() => mockCreateInstance);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.createTeam({
          name: '',
          seasonIds: [],
          playerIds: [],
        });
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.error).toBe('Team name is required');
    });

    it('should handle team creation errors', async () => {
      const mockCreateInstance = {
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockCreateTeamUseCase.mockImplementation(() => mockCreateInstance);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.createTeam({
          name: 'Test Team',
          seasonIds: [],
          playerIds: [],
        });
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.error).toBe(
        'Failed to create team: Database error'
      );
    });
  });

  describe('Team Updates', () => {
    it('should update team successfully', async () => {
      const existingTeam = new Team('team-1', 'Yankees', [], []);
      const updatedTeam = new Team('team-1', 'New Yankees', [], []);

      mockTeamRepository.save.mockResolvedValue(updatedTeam);

      const { result } = renderHook(() => useTeamsStore());

      // Set initial state
      act(() => {
        result.current.teams = [existingTeam];
      });

      await act(async () => {
        await result.current.updateTeam('team-1', {
          id: 'team-1',
          name: 'New Yankees',
          seasonIds: [],
          playerIds: [],
        });
      });

      expect(mockTeamRepository.save).toHaveBeenCalledWith(updatedTeam);
      expect(result.current.teams[0].name).toBe('New Yankees');
      expect(result.current.error).toBeNull();
    });

    it('should handle team update errors', async () => {
      const existingTeam = new Team('team-1', 'Yankees', [], []);
      mockTeamRepository.save.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.teams = [existingTeam];
      });

      await act(async () => {
        await result.current.updateTeam('team-1', {
          id: 'team-1',
          name: 'New Yankees',
          seasonIds: [],
          playerIds: [],
        });
      });

      expect(result.current.teams[0].name).toBe('Yankees'); // Should remain unchanged
      expect(result.current.error).toBe('Failed to update team: Update failed');
    });
  });

  describe('Team Deletion', () => {
    it('should delete team successfully', async () => {
      const team1 = new Team('team-1', 'Yankees', [], []);
      const team2 = new Team('team-2', 'Red Sox', [], []);

      mockTeamRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.teams = [team1, team2];
      });

      await act(async () => {
        await result.current.deleteTeam('team-1');
      });

      expect(mockTeamRepository.delete).toHaveBeenCalledWith('team-1');
      expect(result.current.teams).toEqual([team2]);
      expect(result.current.error).toBeNull();
    });

    it('should handle team deletion errors', async () => {
      const team1 = new Team('team-1', 'Yankees', [], []);
      mockTeamRepository.delete.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.teams = [team1];
      });

      await act(async () => {
        await result.current.deleteTeam('team-1');
      });

      expect(result.current.teams).toEqual([team1]); // Should remain unchanged
      expect(result.current.error).toBe('Failed to delete team: Delete failed');
    });
  });

  describe('Player Management', () => {
    it('should add player to team successfully', async () => {
      const team = new Team('team-1', 'Yankees', [], []);
      const newPlayer = {
        id: 'player-1',
        name: 'John Smith',
        jerseyNumber: '12',
        position: Position.pitcher(),
        isActive: true,
      };
      const updatedTeam = new Team('team-1', 'Yankees', [], [newPlayer]);

      mockPlayerRepository.save.mockResolvedValue(newPlayer);
      mockTeamRepository.addPlayer.mockResolvedValue(updatedTeam);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.teams = [team];
      });

      await act(async () => {
        await result.current.addPlayer('team-1', {
          name: 'John Smith',
          jerseyNumber: '12',
          position: Position.pitcher(),
          isActive: true,
        });
      });

      expect(mockPlayerRepository.save).toHaveBeenCalled();
      expect(mockTeamRepository.addPlayer).toHaveBeenCalledWith(
        'team-1',
        'player-1'
      );
      expect(result.current.teams[0].playerIds).toContain(newPlayer);
      expect(result.current.error).toBeNull();
    });

    it('should update player successfully', async () => {
      const player = {
        id: 'player-1',
        name: 'John Smith',
        jerseyNumber: '12',
        position: Position.pitcher(),
        isActive: true,
      };
      const updatedPlayer = { ...player, name: 'Johnny Smith' };

      mockPlayerRepository.save.mockResolvedValue(updatedPlayer);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.updatePlayer('player-1', updatedPlayer);
      });

      expect(mockPlayerRepository.save).toHaveBeenCalledWith(updatedPlayer);
      expect(result.current.error).toBeNull();
    });

    it('should remove player from team successfully', async () => {
      const player = {
        id: 'player-1',
        name: 'John Smith',
        jerseyNumber: '12',
        position: Position.pitcher(),
        isActive: true,
      };
      const team = new Team('team-1', 'Yankees', [], [player]);
      const updatedTeam = new Team('team-1', 'Yankees', [], []);

      mockTeamRepository.removePlayer.mockResolvedValue(updatedTeam);
      mockPlayerRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.teams = [team];
      });

      await act(async () => {
        await result.current.removePlayer('team-1', 'player-1');
      });

      expect(mockTeamRepository.removePlayer).toHaveBeenCalledWith(
        'team-1',
        'player-1'
      );
      expect(mockPlayerRepository.delete).toHaveBeenCalledWith('player-1');
      expect(result.current.teams[0].playerIds).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Player Statistics', () => {
    it('should load player statistics successfully', async () => {
      const mockStats = {
        'player-1': { avg: 0.285, hits: 15, atBats: 52, rbi: 8 },
        'player-2': { avg: 0.32, hits: 22, atBats: 68, rbi: 14 },
      };
      mockStatsRepository.getPlayerStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.getPlayerStats();
      });

      expect(result.current.playerStats).toEqual(mockStats);
      expect(result.current.error).toBeNull();
    });

    it('should handle player statistics loading errors', async () => {
      mockStatsRepository.getPlayerStats.mockRejectedValue(
        new Error('Stats error')
      );

      const { result } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.getPlayerStats();
      });

      expect(result.current.playerStats).toEqual({});
      expect(result.current.error).toBe(
        'Failed to load player statistics: Stats error'
      );
    });
  });

  describe('Team Selection', () => {
    it('should select team successfully', () => {
      const team = new Team('team-1', 'Yankees', [], []);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.selectTeam(team);
      });

      expect(result.current.selectedTeam).toEqual(team);
    });

    it('should clear team selection', () => {
      const team = new Team('team-1', 'Yankees', [], []);

      const { result } = renderHook(() => useTeamsStore());

      act(() => {
        result.current.selectTeam(team);
      });

      expect(result.current.selectedTeam).toEqual(team);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedTeam).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when performing successful operations', async () => {
      const { result } = renderHook(() => useTeamsStore());

      // Set an error
      act(() => {
        result.current.error = 'Previous error';
      });

      expect(result.current.error).toBe('Previous error');

      // Successful operation should clear error
      mockTeamRepository.findAll.mockResolvedValue([]);

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.error).toBeNull();
    });

    it('should provide clear error messages for different failure scenarios', async () => {
      const { result } = renderHook(() => useTeamsStore());

      // Test different error scenarios
      mockTeamRepository.findAll.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.error).toBe('Failed to load teams');
    });
  });

  describe('Store Persistence', () => {
    it('should persist state changes correctly', async () => {
      const team1 = new Team('team-1', 'Yankees', [], []);
      const team2 = new Team('team-2', 'Red Sox', [], []);

      mockTeamRepository.findAll.mockResolvedValue([team1]);

      const { result, rerender } = renderHook(() => useTeamsStore());

      await act(async () => {
        await result.current.getTeams();
      });

      expect(result.current.teams).toEqual([team1]);

      // Add another team
      mockTeamRepository.save.mockResolvedValue(team2);

      await act(async () => {
        await result.current.createTeam({
          name: 'Red Sox',
          seasonIds: [],
          playerIds: [],
        });
      });

      rerender();

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams).toContain(team1);
      expect(result.current.teams).toContain(team2);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations correctly', async () => {
      const { result } = renderHook(() => useTeamsStore());

      // Start multiple operations concurrently
      const promises = [
        result.current.getTeams(),
        result.current.getPlayerStats(),
        result.current.createTeam({
          name: 'Team A',
          seasonIds: [],
          playerIds: [],
        }),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Should handle all operations without race conditions
      expect(result.current.loading).toBe(false);
    });
  });

  describe('SelectedTeam Updates', () => {
    const createMockPresentationTeam = (id: string, name: string, players: PresentationPlayer[] = []): PresentationTeam => ({
      id,
      name,
      players,
      seasonIds: [],
      playerIds: players.map(p => p.id),
    });

    const createMockPlayer = (id: string, name: string, jerseyNumber: string): PresentationPlayer => ({
      id,
      name,
      jerseyNumber,
      position: Position.pitcher(),
      isActive: true,
    });

    describe('addPlayer with selectedTeam', () => {
      it('should update selectedTeam when adding player to selected team', async () => {
        const initialPlayer = createMockPlayer('player-1', 'John Doe', '10');
        const newPlayer = createMockPlayer('player-2', 'Jane Smith', '12');
        const initialTeam = createMockPresentationTeam('team-1', 'Red Sox', [initialPlayer]);
        const updatedTeam = createMockPresentationTeam('team-1', 'Red Sox', [initialPlayer, newPlayer]);

        // Mock successful use case execution
        mockAddPlayerUseCase.execute.mockResolvedValue(Result.success(newPlayer));
        mockTeamRepository.findAll.mockResolvedValue([]);
        mockTeamHydrationService.hydrateTeams.mockResolvedValue([updatedTeam]);

        const { result } = renderHook(() => useTeamsStore());

        // Set initial selected team
        act(() => {
          result.current.selectTeam(initialTeam);
        });

        expect(result.current.selectedTeam).toEqual(initialTeam);

        // Add player to selected team
        await act(async () => {
          await result.current.addPlayer('team-1', {
            name: 'Jane Smith',
            jerseyNumber: '12',
            position: Position.pitcher(),
            isActive: true,
          });
        });

        // selectedTeam should be updated with new player
        expect(result.current.selectedTeam).toEqual(updatedTeam);
        expect(result.current.selectedTeam?.players).toHaveLength(2);
      });

      it('should not update selectedTeam when adding player to different team', async () => {
        const selectedTeam = createMockPresentationTeam('team-1', 'Red Sox');
        const newPlayer = createMockPlayer('player-1', 'John Doe', '10');
        const updatedOtherTeam = createMockPresentationTeam('team-2', 'Yankees', [newPlayer]);

        mockAddPlayerUseCase.execute.mockResolvedValue(Result.success(newPlayer));
        mockTeamRepository.findAll.mockResolvedValue([]);
        mockTeamHydrationService.hydrateTeams.mockResolvedValue([selectedTeam, updatedOtherTeam]);

        const { result } = renderHook(() => useTeamsStore());

        act(() => {
          result.current.selectTeam(selectedTeam);
        });

        await act(async () => {
          await result.current.addPlayer('team-2', {
            name: 'John Doe',
            jerseyNumber: '10',
            position: Position.pitcher(),
            isActive: true,
          });
        });

        // selectedTeam should remain unchanged
        expect(result.current.selectedTeam).toEqual(selectedTeam);
      });
    });

    describe('removePlayer with selectedTeam', () => {
      it('should update selectedTeam when removing player from selected team', async () => {
        const player1 = createMockPlayer('player-1', 'John Doe', '10');
        const player2 = createMockPlayer('player-2', 'Jane Smith', '12');
        const initialTeam = createMockPresentationTeam('team-1', 'Red Sox', [player1, player2]);
        const updatedTeam = createMockPresentationTeam('team-1', 'Red Sox', [player2]);

        mockRemovePlayerUseCase.execute.mockResolvedValue(Result.success(undefined));
        mockTeamRepository.findAll.mockResolvedValue([]);
        mockTeamHydrationService.hydrateTeams.mockResolvedValue([updatedTeam]);

        const { result } = renderHook(() => useTeamsStore());

        act(() => {
          result.current.selectTeam(initialTeam);
        });

        await act(async () => {
          await result.current.removePlayer('team-1', 'player-1');
        });

        expect(result.current.selectedTeam).toEqual(updatedTeam);
        expect(result.current.selectedTeam?.players).toHaveLength(1);
        expect(result.current.selectedTeam?.players[0].id).toBe('player-2');
      });
    });

    describe('updatePlayer with selectedTeam', () => {
      it('should update selectedTeam when updating player in selected team', async () => {
        const initialPlayer = createMockPlayer('player-1', 'John Doe', '10');
        const updatedPlayer = { ...initialPlayer, name: 'Johnny Doe' };
        const initialTeam = createMockPresentationTeam('team-1', 'Red Sox', [initialPlayer]);
        const updatedTeam = createMockPresentationTeam('team-1', 'Red Sox', [updatedPlayer]);

        mockUpdatePlayerUseCase.execute.mockResolvedValue(Result.success(updatedPlayer));
        mockTeamHydrationService.convertPresentationPlayerToDomain.mockReturnValue({
          name: 'Johnny Doe',
          jerseyNumber: 10,
          position: Position.pitcher(),
          isActive: true,
        });
        mockTeamRepository.findAll.mockResolvedValue([]);
        mockTeamHydrationService.hydrateTeams.mockResolvedValue([updatedTeam]);

        const { result } = renderHook(() => useTeamsStore());

        act(() => {
          result.current.selectTeam(initialTeam);
        });

        await act(async () => {
          await result.current.updatePlayer('player-1', updatedPlayer);
        });

        expect(result.current.selectedTeam).toEqual(updatedTeam);
        expect(result.current.selectedTeam?.players[0].name).toBe('Johnny Doe');
      });

      it('should not update selectedTeam when updating player in different team', async () => {
        const selectedTeamPlayer = createMockPlayer('player-1', 'John Doe', '10');
        const otherTeamPlayer = createMockPlayer('player-2', 'Jane Smith', '12');
        const selectedTeam = createMockPresentationTeam('team-1', 'Red Sox', [selectedTeamPlayer]);
        const otherTeam = createMockPresentationTeam('team-2', 'Yankees', [otherTeamPlayer]);

        mockUpdatePlayerUseCase.execute.mockResolvedValue(Result.success(otherTeamPlayer));
        mockTeamHydrationService.convertPresentationPlayerToDomain.mockReturnValue({});
        mockTeamRepository.findAll.mockResolvedValue([]);
        mockTeamHydrationService.hydrateTeams.mockResolvedValue([selectedTeam, otherTeam]);

        const { result } = renderHook(() => useTeamsStore());

        act(() => {
          result.current.selectTeam(selectedTeam);
        });

        await act(async () => {
          await result.current.updatePlayer('player-2', otherTeamPlayer);
        });

        // selectedTeam should remain unchanged since player-2 is not in selected team
        expect(result.current.selectedTeam).toEqual(selectedTeam);
      });
    });
  });
});
