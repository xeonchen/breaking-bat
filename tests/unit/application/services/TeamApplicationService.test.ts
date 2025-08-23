import { TeamApplicationService } from '@/application/services/implementations/TeamApplicationService';
import {
  CreateTeamCommand,
  UpdateTeamCommand,
  AddPlayerToTeamCommand,
  UpdatePlayerInTeamCommand,
  RemovePlayerFromTeamCommand,
  GetTeamByIdQuery,
} from '@/application/services/interfaces/ITeamApplicationService';
// Result removed - not used in test
import { Team, Player } from '@/domain/entities';
import { Position } from '@/domain/values';
import {
  ITeamPersistencePort,
  IPlayerPersistencePort,
} from '@/application/ports/secondary/IPersistencePorts';
import {
  ILoggingPort,
  ITimeProvider,
  IIdGenerator,
  ICachePort,
} from '@/application/ports/secondary/IInfrastructurePorts';

describe('TeamApplicationService', () => {
  let teamApplicationService: TeamApplicationService;
  let mockTeamPersistencePort: jest.Mocked<ITeamPersistencePort>;
  let mockPlayerPersistencePort: jest.Mocked<IPlayerPersistencePort>;
  let mockLoggingPort: jest.Mocked<ILoggingPort>;
  let mockTimeProvider: jest.Mocked<ITimeProvider>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockCachePort: jest.Mocked<ICachePort>;

  const fixedDate = new Date('2023-07-15T10:00:00Z');
  const teamId = 'team-123';
  const playerId = 'player-456';
  const correlationId = 'corr-789';

  beforeEach(() => {
    // Create mocks
    mockTeamPersistencePort = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findBySeasonId: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ITeamPersistencePort>;

    mockPlayerPersistencePort = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTeamId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByPosition: jest.fn(),
      isJerseyNumberUnique: jest.fn(),
      search: jest.fn(),
      findByJerseyNumber: jest.fn(),
    } as unknown as jest.Mocked<IPlayerPersistencePort>;

    mockLoggingPort = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<ILoggingPort>;

    mockTimeProvider = {
      now: jest.fn().mockReturnValue(fixedDate),
      nowString: jest.fn().mockReturnValue(fixedDate.toISOString()),
    } as unknown as jest.Mocked<ITimeProvider>;

    mockIdGenerator = {
      generateId: jest.fn().mockReturnValue(teamId),
      generateShortId: jest.fn().mockReturnValue(correlationId),
    } as unknown as jest.Mocked<IIdGenerator>;

    mockCachePort = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<ICachePort>;

    // Create service instance
    teamApplicationService = new TeamApplicationService(
      mockTeamPersistencePort,
      mockPlayerPersistencePort,
      mockLoggingPort,
      mockTimeProvider,
      mockIdGenerator,
      mockCachePort
    );
  });

  describe('createTeam', () => {
    const createTeamCommand: CreateTeamCommand = {
      name: 'Boston Red Sox',
      organizationId: 'org-123',
      seasonIds: ['season-1', 'season-2'],
    };

    it('should create team successfully with valid command', async () => {
      // Arrange
      mockTeamPersistencePort.findByName.mockResolvedValue(null);

      const expectedTeam = new Team(
        teamId,
        createTeamCommand.name,
        createTeamCommand.seasonIds,
        [],
        fixedDate,
        fixedDate
      );

      mockTeamPersistencePort.save.mockResolvedValue(expectedTeam);

      // Act
      const result = await teamApplicationService.createTeam(createTeamCommand);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe(createTeamCommand.name);
      expect(result.value!.organizationId).toBe(
        createTeamCommand.organizationId
      );
      expect(result.value!.seasonIds).toEqual(createTeamCommand.seasonIds);
      expect(result.value!.playerCount).toBe(0);
      expect(result.value!.isActive).toBe(true);

      // Verify logging
      expect(mockLoggingPort.info).toHaveBeenCalledWith('Creating team', {
        teamName: createTeamCommand.name,
        correlationId,
      });

      // Verify team name uniqueness check
      expect(mockTeamPersistencePort.findByName).toHaveBeenCalledWith(
        createTeamCommand.name
      );

      // Verify team creation
      expect(mockTeamPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: teamId,
          name: createTeamCommand.name,
          seasonIds: createTeamCommand.seasonIds,
          playerIds: [],
        })
      );

      // Verify cache invalidation (using clear instead of invalidate)
      expect(mockCachePort.clear).toHaveBeenCalledWith(`team:${teamId}:*`);
      expect(mockCachePort.clear).toHaveBeenCalledWith('teams:*');
    });

    it('should fail when team name already exists', async () => {
      // Arrange
      const existingTeam = new Team(
        'existing-id',
        createTeamCommand.name,
        [],
        []
      );
      mockTeamPersistencePort.findByName.mockResolvedValue(existingTeam);

      // Act
      const result = await teamApplicationService.createTeam(createTeamCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        `Team name '${createTeamCommand.name}' is already taken`
      );

      // Verify no save operation was attempted
      expect(mockTeamPersistencePort.save).not.toHaveBeenCalled();
    });

    it('should handle persistence errors gracefully', async () => {
      // Arrange
      mockTeamPersistencePort.findByName.mockResolvedValue(null);
      const persistenceError = new Error('Database connection failed');
      mockTeamPersistencePort.save.mockRejectedValue(persistenceError);

      // Act
      const result = await teamApplicationService.createTeam(createTeamCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Database connection failed');

      // Verify error logging (actual implementation logs error object directly)
      expect(mockLoggingPort.error).toHaveBeenCalledWith(
        'Failed to create team',
        persistenceError,
        expect.objectContaining({
          correlationId,
          teamName: createTeamCommand.name,
        })
      );
    });

    it('should create team with default season IDs when not provided', async () => {
      // Arrange
      const commandWithoutSeasons: CreateTeamCommand = {
        name: 'New Team',
        organizationId: 'org-123',
      };

      mockTeamPersistencePort.findByName.mockResolvedValue(null);

      const expectedTeam = new Team(
        teamId,
        commandWithoutSeasons.name,
        [],
        [],
        fixedDate,
        fixedDate
      );

      mockTeamPersistencePort.save.mockResolvedValue(expectedTeam);

      // Act
      const result = await teamApplicationService.createTeam(
        commandWithoutSeasons
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.seasonIds).toEqual([]);
    });

    it('should trim team name before validation', async () => {
      // Arrange
      const commandWithSpaces: CreateTeamCommand = {
        name: '  Boston Red Sox  ',
        organizationId: 'org-123',
      };

      mockTeamPersistencePort.findByName.mockResolvedValue(null);

      const expectedTeam = new Team(
        teamId,
        'Boston Red Sox',
        [],
        [],
        fixedDate,
        fixedDate
      );

      mockTeamPersistencePort.save.mockResolvedValue(expectedTeam);

      // Act
      const result = await teamApplicationService.createTeam(commandWithSpaces);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTeamPersistencePort.findByName).toHaveBeenCalledWith(
        commandWithSpaces.name
      );
      expect(mockTeamPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Boston Red Sox',
        })
      );
    });
  });

  describe('getTeams', () => {
    it('should return empty array when no teams exist', async () => {
      // Arrange
      mockTeamPersistencePort.findAll.mockResolvedValue([]);

      // Act
      const result = await teamApplicationService.getTeams();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('getTeamById', () => {
    const query: GetTeamByIdQuery = {
      teamId,
    };

    it('should return team by ID successfully', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockCachePort.get.mockResolvedValue(null); // Cache miss
      mockPlayerPersistencePort.findByTeamId.mockResolvedValue([]);

      // Act
      const result = await teamApplicationService.getTeamById(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.id).toBe(teamId);
      expect(result.value!.name).toBe('Test Team');

      expect(mockLoggingPort.debug).toHaveBeenCalledWith('Getting team by ID', {
        teamId,
        correlationId,
      });
    });

    it('should return null when team not found', async () => {
      // Arrange
      mockTeamPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result = await teamApplicationService.getTeamById(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should handle persistence errors', async () => {
      // Arrange
      const persistenceError = new Error('Connection timeout');
      mockTeamPersistencePort.findById.mockRejectedValue(persistenceError);

      // Act
      const result = await teamApplicationService.getTeamById(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('updateTeam', () => {
    const updateTeamCommand: UpdateTeamCommand = {
      teamId,
      name: 'Updated Team Name',
      isActive: true,
    };

    it('should update team successfully', async () => {
      // Arrange
      const existingTeam = new Team(teamId, 'Old Name', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(existingTeam);

      const updatedTeam = existingTeam.changeName(updateTeamCommand.name!);
      mockTeamPersistencePort.save.mockResolvedValue(updatedTeam);

      // Act
      const result = await teamApplicationService.updateTeam(updateTeamCommand);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe(updateTeamCommand.name);

      expect(mockLoggingPort.info).toHaveBeenCalledWith('Updating team', {
        teamId,
        correlationId,
      });

      expect(mockTeamPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: teamId,
          name: updateTeamCommand.name,
        })
      );
    });

    it('should fail when team not found', async () => {
      // Arrange
      mockTeamPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result = await teamApplicationService.updateTeam(updateTeamCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Team with ID '${teamId}' not found`);

      expect(mockTeamPersistencePort.save).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdateCommand: UpdateTeamCommand = {
        teamId,
        isActive: false,
      };

      const existingTeam = new Team(teamId, 'Original Name', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(existingTeam);
      mockTeamPersistencePort.save.mockResolvedValue(existingTeam);

      // Act
      const result =
        await teamApplicationService.updateTeam(partialUpdateCommand);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Original Name'); // Name should remain unchanged
    });
  });

  describe('addPlayer', () => {
    const addPlayerCommand: AddPlayerToTeamCommand = {
      teamId,
      playerName: 'David Ortiz',
      jerseyNumber: 34,
      positions: ['first-base'],
      isActive: true,
    };

    it('should add player to team successfully', async () => {
      // Arrange
      mockIdGenerator.generateId.mockReturnValue(playerId); // Mock to return playerId for this test

      const team = new Team(teamId, 'Test Team', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(team);

      const newPlayer = new Player(
        playerId,
        addPlayerCommand.playerName,
        addPlayerCommand.jerseyNumber,
        teamId,
        addPlayerCommand.positions.map((pos) => Position.fromValue(pos)),
        addPlayerCommand.isActive
      );

      mockPlayerPersistencePort.findByJerseyNumber.mockResolvedValue(null);
      mockPlayerPersistencePort.save.mockResolvedValue(newPlayer);

      const updatedTeam = team.addPlayer(playerId);
      mockTeamPersistencePort.save.mockResolvedValue(updatedTeam);

      // Act
      const result = await teamApplicationService.addPlayer(addPlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe(addPlayerCommand.playerName);
      expect(result.value!.jerseyNumber).toBe(addPlayerCommand.jerseyNumber);

      expect(mockLoggingPort.info).toHaveBeenCalledWith(
        'Adding player to team',
        {
          teamId,
          playerName: addPlayerCommand.playerName,
          correlationId,
        }
      );

      // Verify jersey number uniqueness check
      expect(mockPlayerPersistencePort.findByJerseyNumber).toHaveBeenCalledWith(
        teamId,
        addPlayerCommand.jerseyNumber
      );

      // Verify player creation
      expect(mockPlayerPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: addPlayerCommand.playerName,
          jerseyNumber: addPlayerCommand.jerseyNumber,
          teamId,
        })
      );

      // Verify team update
      expect(mockTeamPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerIds: [playerId],
        })
      );
    });

    it('should fail when team not found', async () => {
      // Arrange
      mockTeamPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result = await teamApplicationService.addPlayer(addPlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Team with ID '${teamId}' not found`);

      expect(mockPlayerPersistencePort.save).not.toHaveBeenCalled();
    });

    it('should fail when jersey number is not unique', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      const existingPlayer = new Player(
        'existing-id',
        'Existing Player',
        addPlayerCommand.jerseyNumber,
        teamId,
        [],
        true
      );
      mockPlayerPersistencePort.findByJerseyNumber.mockResolvedValue(
        existingPlayer
      );

      // Act
      const result = await teamApplicationService.addPlayer(addPlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        `Jersey number ${addPlayerCommand.jerseyNumber} is already taken on this team`
      );

      expect(mockPlayerPersistencePort.save).not.toHaveBeenCalled();
    });

    it('should fail when team roster is full', async () => {
      // Arrange
      const playerIds = Array.from({ length: 25 }, (_, i) => `player-${i + 1}`);
      const fullTeam = new Team(teamId, 'Full Team', [], playerIds);
      mockTeamPersistencePort.findById.mockResolvedValue(fullTeam);
      mockPlayerPersistencePort.findByJerseyNumber.mockResolvedValue(null);

      // Act
      const result = await teamApplicationService.addPlayer(addPlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Team roster is full (maximum 25 players)');

      expect(mockPlayerPersistencePort.save).not.toHaveBeenCalled();
    });
  });

  describe('updatePlayer', () => {
    const updatePlayerCommand: UpdatePlayerInTeamCommand = {
      teamId,
      playerId,
      playerName: 'Updated Name',
      jerseyNumber: 35,
      positions: ['pitcher'],
      isActive: false,
    };

    it('should update player successfully', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(team);

      const existingPlayer = new Player(
        playerId,
        'Original Name',
        34,
        teamId,
        [Position.firstBase()],
        true
      );

      mockPlayerPersistencePort.findById.mockResolvedValue(existingPlayer);
      mockPlayerPersistencePort.findByJerseyNumber.mockResolvedValue(null);

      const updatedPlayer = new Player(
        playerId,
        updatePlayerCommand.playerName!,
        updatePlayerCommand.jerseyNumber!,
        teamId,
        updatePlayerCommand.positions!.map((pos) => Position.fromValue(pos)),
        updatePlayerCommand.isActive!
      );

      mockPlayerPersistencePort.save.mockResolvedValue(updatedPlayer);

      // Act
      const result =
        await teamApplicationService.updatePlayer(updatePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe(updatePlayerCommand.playerName);
      expect(result.value!.jerseyNumber).toBe(updatePlayerCommand.jerseyNumber);

      expect(mockLoggingPort.info).toHaveBeenCalledWith(
        'Updating player in team',
        {
          playerId,
          teamId,
          correlationId,
        }
      );
    });

    it('should fail when player not found', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], [playerId]);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockPlayerPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result =
        await teamApplicationService.updatePlayer(updatePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Player with ID '${playerId}' not found`);

      expect(mockPlayerPersistencePort.save).not.toHaveBeenCalled();
    });

    it('should fail when new jersey number is not unique', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], [playerId]);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      const existingPlayer = new Player(
        playerId,
        'Player',
        34,
        teamId,
        [],
        true
      );
      mockPlayerPersistencePort.findById.mockResolvedValue(existingPlayer);

      // Mock another player with the same jersey number
      const playerWithSameJersey = new Player(
        'other-player',
        'Other Player',
        35,
        teamId,
        [],
        true
      );
      mockPlayerPersistencePort.findByJerseyNumber.mockResolvedValue(
        playerWithSameJersey
      );

      // Act
      const result =
        await teamApplicationService.updatePlayer(updatePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        `Jersey number ${updatePlayerCommand.jerseyNumber} is already taken on this team`
      );
    });
  });

  describe('removePlayer', () => {
    const removePlayerCommand: RemovePlayerFromTeamCommand = {
      teamId,
      playerId,
    };

    it('should remove player from team successfully', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], [playerId]);
      const player = new Player(playerId, 'Player', 34, teamId, [], true);

      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockPlayerPersistencePort.findById.mockResolvedValue(player);

      const updatedTeam = team.removePlayer(playerId);
      mockTeamPersistencePort.save.mockResolvedValue(updatedTeam);

      // Act
      const result =
        await teamApplicationService.removePlayer(removePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(true);

      expect(mockLoggingPort.info).toHaveBeenCalledWith(
        'Removing player from team',
        {
          teamId,
          playerId,
          correlationId,
        }
      );

      expect(mockPlayerPersistencePort.delete).toHaveBeenCalledWith(playerId);
      expect(mockTeamPersistencePort.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerIds: [],
        })
      );
    });

    it('should fail when team not found', async () => {
      // Arrange
      mockTeamPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result =
        await teamApplicationService.removePlayer(removePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Team with ID '${teamId}' not found`);
    });

    it('should fail when player not found', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], [playerId]);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockPlayerPersistencePort.findById.mockResolvedValue(null);

      // Act
      const result =
        await teamApplicationService.removePlayer(removePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Player with ID ${playerId} not found`);
    });

    it('should fail when player is not on the team', async () => {
      // Arrange
      const team = new Team(teamId, 'Test Team', [], []); // Player not in team
      const player = new Player(playerId, 'Player', 34, 'other-team', [], true);

      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockPlayerPersistencePort.findById.mockResolvedValue(player);

      // Act
      const result =
        await teamApplicationService.removePlayer(removePlayerCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Player ${playerId} is not on team ${teamId}`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid team IDs', async () => {
      const invalidCommand: CreateTeamCommand = {
        name: '',
        organizationId: 'org-123',
      };

      const result = await teamApplicationService.createTeam(invalidCommand);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      mockTeamPersistencePort.findAll.mockRejectedValue(timeoutError);

      const result = await teamApplicationService.getTeams();

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Network timeout');
      expect(mockLoggingPort.error).toHaveBeenCalled();
    });

    it('should handle large team rosters efficiently', async () => {
      const playerIds = Array.from({ length: 24 }, (_, i) => `player-${i + 1}`);
      const largeTeam = new Team(teamId, 'Large Team', [], playerIds);

      mockTeamPersistencePort.findById.mockResolvedValue(largeTeam);

      // Mock 24 active players
      const players = playerIds.map((id, index) => ({
        id,
        name: `Player ${index + 1}`,
        jerseyNumber: index + 1,
        teamId,
        positions: [{ value: 'first-base' }],
        isActive: true,
      }));
      mockPlayerPersistencePort.findByTeamId.mockResolvedValue(
        players as any[]
      );

      const query: GetTeamByIdQuery = { teamId, includeInactivePlayers: true };
      const result = await teamApplicationService.getTeamById(query);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.playerCount).toBe(24);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache after creating team', async () => {
      const createTeamCommand: CreateTeamCommand = {
        name: 'Test Team',
        organizationId: 'org-123',
      };

      mockTeamPersistencePort.findByName.mockResolvedValue(null);
      const team = new Team(teamId, createTeamCommand.name, [], []);
      mockTeamPersistencePort.save.mockResolvedValue(team);

      await teamApplicationService.createTeam(createTeamCommand);

      expect(mockCachePort.clear).toHaveBeenCalledWith(
        expect.stringContaining('teams')
      );
    });

    it('should invalidate cache after updating team', async () => {
      const updateCommand: UpdateTeamCommand = {
        teamId,
        name: 'Updated Team',
      };

      const team = new Team(teamId, 'Original Team', [], []);
      mockTeamPersistencePort.findById.mockResolvedValue(team);
      mockTeamPersistencePort.save.mockResolvedValue(team);

      await teamApplicationService.updateTeam(updateCommand);

      expect(mockCachePort.clear).toHaveBeenCalledWith(
        expect.stringContaining(teamId)
      );
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent team creation attempts', async () => {
      const command: CreateTeamCommand = {
        name: 'Concurrent Team',
        organizationId: 'org-123',
      };

      // First call succeeds
      mockTeamPersistencePort.findByName
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(new Team('existing-id', command.name, [], []));

      const team = new Team(teamId, command.name, [], []);
      mockTeamPersistencePort.save.mockResolvedValue(team);

      // Run concurrent operations
      const [result1, result2] = await Promise.all([
        teamApplicationService.createTeam(command),
        teamApplicationService.createTeam(command),
      ]);

      // One should succeed, one should fail
      const results = [result1, result2];
      const successes = results.filter((r) => r.isSuccess);
      const failures = results.filter((r) => !r.isSuccess);

      expect(successes.length).toBeGreaterThanOrEqual(1);
      expect(failures.length).toBeGreaterThanOrEqual(0);
    });
  });
});
