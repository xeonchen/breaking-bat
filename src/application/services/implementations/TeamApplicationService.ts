/**
 * Team Application Service Implementation
 */

import {
  ITeamApplicationService,
  CreateTeamCommand,
  UpdateTeamCommand,
  AddPlayerToTeamCommand,
  UpdatePlayerInTeamCommand,
  RemovePlayerFromTeamCommand,
  ArchiveTeamCommand,
  GetTeamByIdQuery,
  GetTeamsBySeasonQuery,
  SearchTeamsQuery,
  GetTeamRosterQuery,
  GetTeamStatisticsQuery,
  TeamDto,
  TeamWithPlayersDto,
  TeamPlayerDto,
  TeamStatisticsDto,
  TeamRosterDto,
} from '../interfaces/ITeamApplicationService';

import { Result } from '@/application/common/Result';
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

export class TeamApplicationService implements ITeamApplicationService {
  constructor(
    private readonly teamPersistencePort: ITeamPersistencePort,
    private readonly playerPersistencePort: IPlayerPersistencePort,
    private readonly loggingPort: ILoggingPort,
    private readonly timeProvider: ITimeProvider,
    private readonly idGenerator: IIdGenerator,
    private readonly cachePort: ICachePort
  ) {}

  // Command Operations (Write Side)

  public async createTeam(
    command: CreateTeamCommand
  ): Promise<Result<TeamDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Creating team', {
        teamName: command.name,
        correlationId,
      });

      // Validate team name availability
      const existingTeam = await this.teamPersistencePort.findByName(
        command.name
      );
      if (existingTeam) {
        return Result.failure(`Team name '${command.name}' is already taken`);
      }

      // Create domain entity
      const teamId = this.idGenerator.generateId();
      const now = this.timeProvider.now();

      const team = new Team(
        teamId,
        command.name,
        command.seasonIds || [],
        [], // no players initially
        now,
        now
      );

      // Persist the team
      const savedTeam = await this.teamPersistencePort.save(team);

      // Convert to DTO
      const teamDto: TeamDto = {
        id: savedTeam.id,
        name: savedTeam.name,
        organizationId: command.organizationId,
        seasonIds: savedTeam.seasonIds,
        playerCount: 0,
        isActive: true,
        createdAt: savedTeam.createdAt,
        updatedAt: savedTeam.updatedAt,
      };

      // Invalidate relevant caches
      await this.invalidateTeamCaches(teamId);

      this.loggingPort.info('Team created successfully', {
        teamId: teamId,
        teamName: command.name,
        correlationId,
      });

      return Result.success(teamDto);
    } catch (error) {
      this.loggingPort.error('Failed to create team', error as Error, {
        teamName: command.name,
        correlationId,
      });
      return Result.failure(
        `Failed to create team: ${(error as Error).message}`
      );
    }
  }

  public async updateTeam(
    command: UpdateTeamCommand
  ): Promise<Result<TeamDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Updating team', {
        teamId: command.teamId,
        correlationId,
      });

      // Retrieve existing team
      const existingTeam = await this.teamPersistencePort.findById(
        command.teamId
      );
      if (!existingTeam) {
        return Result.failure(`Team with ID '${command.teamId}' not found`);
      }

      // Check name availability if name is being changed
      if (command.name && command.name !== existingTeam.name) {
        const nameInUse = await this.teamPersistencePort.findByName(
          command.name
        );
        if (nameInUse) {
          return Result.failure(`Team name '${command.name}' is already taken`);
        }
      }

      // Update team properties
      const updatedTeam = new Team(
        existingTeam.id,
        command.name || existingTeam.name,
        command.seasonIds || existingTeam.seasonIds,
        existingTeam.playerIds,
        existingTeam.createdAt,
        this.timeProvider.now()
      );

      // Persist changes
      const savedTeam = await this.teamPersistencePort.save(updatedTeam);

      // Get player count
      const playerCount = await this.getPlayerCount(savedTeam.id);

      // Convert to DTO
      const teamDto: TeamDto = {
        id: savedTeam.id,
        name: savedTeam.name,
        organizationId: undefined,
        seasonIds: savedTeam.seasonIds,
        playerCount,
        isActive: command.isActive !== undefined ? command.isActive : true,
        createdAt: savedTeam.createdAt,
        updatedAt: savedTeam.updatedAt,
      };

      // Invalidate caches
      await this.invalidateTeamCaches(command.teamId);

      this.loggingPort.info('Team updated successfully', {
        teamId: command.teamId,
        correlationId,
      });

      return Result.success(teamDto);
    } catch (error) {
      this.loggingPort.error('Failed to update team', error as Error, {
        teamId: command.teamId,
        correlationId,
      });
      return Result.failure(
        `Failed to update team: ${(error as Error).message}`
      );
    }
  }

  public async addPlayer(
    command: AddPlayerToTeamCommand
  ): Promise<Result<TeamPlayerDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Adding player to team', {
        teamId: command.teamId,
        playerName: command.playerName,
        correlationId,
      });

      // Verify team exists
      const team = await this.teamPersistencePort.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with ID '${command.teamId}' not found`);
      }

      // Check roster size limit
      if (team.playerIds.length >= 25) {
        return Result.failure('Team roster is full (maximum 25 players)');
      }

      // Validate jersey number availability
      const jerseyInUse = await this.playerPersistencePort.findByJerseyNumber(
        command.teamId,
        command.jerseyNumber
      );
      if (jerseyInUse) {
        return Result.failure(
          `Jersey number ${command.jerseyNumber} is already taken on this team`
        );
      }

      // Create player domain entity
      const playerId = this.idGenerator.generateId();
      const now = this.timeProvider.now();

      // Convert positions
      const positions = command.positions.map((pos) => Position.fromValue(pos));

      // This is a simplified player creation - in reality, you'd have more robust player statistics
      const player = {
        id: playerId,
        name: command.playerName,
        jerseyNumber: command.jerseyNumber,
        teamId: command.teamId,
        positions,
        isActive: command.isActive !== undefined ? command.isActive : true,
        statistics: {}, // Initialize with empty statistics
        createdAt: now,
        updatedAt: now,
      } as Player;

      // Persist player
      const savedPlayer = await this.playerPersistencePort.save(player);

      // Update team to include player
      const updatedTeam = new Team(
        team.id,
        team.name,
        team.seasonIds,
        [...team.playerIds, playerId],
        team.createdAt,
        now
      );
      await this.teamPersistencePort.save(updatedTeam);

      // Convert to DTO
      const playerDto: TeamPlayerDto = {
        id: savedPlayer.id,
        name: savedPlayer.name,
        jerseyNumber: savedPlayer.jerseyNumber,
        positions: savedPlayer.positions.map((pos) => pos.value),
        isActive: savedPlayer.isActive,
      };

      // Invalidate caches
      await this.invalidateTeamCaches(command.teamId);

      this.loggingPort.info('Player added successfully', {
        teamId: command.teamId,
        playerId: playerId,
        correlationId,
      });

      return Result.success(playerDto);
    } catch (error) {
      this.loggingPort.error('Failed to add player', error as Error, {
        teamId: command.teamId,
        playerName: command.playerName,
        correlationId,
      });
      return Result.failure(
        `Failed to add player: ${(error as Error).message}`
      );
    }
  }

  public async updatePlayer(
    command: UpdatePlayerInTeamCommand
  ): Promise<Result<TeamPlayerDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Updating player in team', {
        playerId: command.playerId,
        teamId: command.teamId,
        correlationId,
      });

      // Verify team exists
      const team = await this.teamPersistencePort.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with ID '${command.teamId}' not found`);
      }

      // Get existing player
      const existingPlayer = await this.playerPersistencePort.findById(
        command.playerId
      );
      if (!existingPlayer) {
        return Result.failure(`Player with ID '${command.playerId}' not found`);
      }

      // Verify player belongs to team
      if (existingPlayer.teamId !== command.teamId) {
        return Result.failure(
          `Player does not belong to team '${command.teamId}'`
        );
      }

      // Check jersey number availability if changed
      if (
        command.jerseyNumber &&
        command.jerseyNumber !== existingPlayer.jerseyNumber
      ) {
        const jerseyInUse = await this.playerPersistencePort.findByJerseyNumber(
          command.teamId,
          command.jerseyNumber
        );
        if (jerseyInUse && jerseyInUse.id !== command.playerId) {
          return Result.failure(
            `Jersey number ${command.jerseyNumber} is already taken on this team`
          );
        }
      }

      // Convert positions
      const positions = command.positions
        ? command.positions.map((pos) => Position.fromValue(pos))
        : existingPlayer.positions;

      // Update player
      const updatedPlayer = {
        ...existingPlayer,
        name: command.playerName || existingPlayer.name,
        jerseyNumber: command.jerseyNumber || existingPlayer.jerseyNumber,
        positions,
        isActive:
          command.isActive !== undefined
            ? command.isActive
            : existingPlayer.isActive,
        updatedAt: this.timeProvider.now(),
      } as Player;

      // Persist changes
      const savedPlayer = await this.playerPersistencePort.save(updatedPlayer);

      // Convert to DTO
      const playerDto: TeamPlayerDto = {
        id: savedPlayer.id,
        name: savedPlayer.name,
        jerseyNumber: savedPlayer.jerseyNumber,
        positions: savedPlayer.positions.map((pos) => pos.value),
        isActive: savedPlayer.isActive,
      };

      // Invalidate caches
      await this.invalidateTeamCaches(command.teamId);

      this.loggingPort.info('Player updated successfully', {
        playerId: command.playerId,
        teamId: command.teamId,
        correlationId,
      });

      return Result.success(playerDto);
    } catch (error) {
      this.loggingPort.error('Failed to update player', error as Error, {
        playerId: command.playerId,
        teamId: command.teamId,
        correlationId,
      });
      return Result.failure(
        `Failed to update player: ${(error as Error).message}`
      );
    }
  }

  public async removePlayer(
    command: RemovePlayerFromTeamCommand
  ): Promise<Result<void>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Removing player from team', {
        teamId: command.teamId,
        playerId: command.playerId,
        correlationId,
      });

      // Verify team exists
      const team = await this.teamPersistencePort.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with ID '${command.teamId}' not found`);
      }

      // Get existing player
      const existingPlayer = await this.playerPersistencePort.findById(
        command.playerId
      );
      if (!existingPlayer) {
        return Result.failure(`Player with ID ${command.playerId} not found`);
      }

      // Verify player belongs to team
      if (existingPlayer.teamId !== command.teamId) {
        return Result.failure(
          `Player ${command.playerId} is not on team ${command.teamId}`
        );
      }

      // Remove player from team's player list
      const updatedTeam = new Team(
        team.id,
        team.name,
        team.seasonIds,
        team.playerIds.filter((id) => id !== command.playerId),
        team.createdAt,
        this.timeProvider.now()
      );
      await this.teamPersistencePort.save(updatedTeam);

      // Remove player from persistence
      await this.playerPersistencePort.delete(command.playerId);

      // Invalidate caches
      await this.invalidateTeamCaches(command.teamId);

      this.loggingPort.info('Player removed successfully', {
        teamId: command.teamId,
        playerId: command.playerId,
        correlationId,
      });

      return Result.success(undefined);
    } catch (error) {
      this.loggingPort.error('Failed to remove player', error as Error, {
        teamId: command.teamId,
        playerId: command.playerId,
        correlationId,
      });
      return Result.failure(
        `Failed to remove player: ${(error as Error).message}`
      );
    }
  }

  public async archiveTeam(
    _command: ArchiveTeamCommand
  ): Promise<Result<void>> {
    return Result.failure('Not implemented yet');
  }

  // Query Operations (Read Side)

  public async getTeamById(
    query: GetTeamByIdQuery
  ): Promise<Result<TeamWithPlayersDto | null>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.debug('Getting team by ID', {
        teamId: query.teamId,
        correlationId,
      });

      // Check cache first
      const cacheKey = `team:${query.teamId}:details`;
      const cached = await this.cachePort.get<TeamWithPlayersDto>(cacheKey);
      if (cached) {
        this.loggingPort.debug('Team found in cache', {
          teamId: query.teamId,
          correlationId,
        });
        return Result.success(cached);
      }

      // Retrieve from persistence
      const team = await this.teamPersistencePort.findById(query.teamId);
      if (!team) {
        return Result.success(null);
      }

      // Get players if requested
      const players: TeamPlayerDto[] = [];
      if (query.includeInactivePlayers !== false) {
        const teamPlayers = await this.playerPersistencePort.findByTeamId(
          query.teamId
        );
        for (const player of teamPlayers) {
          if (query.includeInactivePlayers || player.isActive) {
            players.push({
              id: player.id,
              name: player.name,
              jerseyNumber: player.jerseyNumber,
              positions: player.positions.map((pos) => pos.value),
              isActive: player.isActive,
              statistics: query.includeStatistics ? undefined : undefined,
            });
          }
        }
      }

      // Convert to DTO
      const teamDto: TeamWithPlayersDto = {
        id: team.id,
        name: team.name,
        organizationId: undefined,
        seasonIds: team.seasonIds,
        playerCount: players.length,
        isActive: true,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        players,
      };

      // Cache the result
      await this.cachePort.set(cacheKey, teamDto, 300); // 5 minutes

      this.loggingPort.debug('Team retrieved successfully', {
        teamId: query.teamId,
        playerCount: players.length,
        correlationId,
      });

      return Result.success(teamDto);
    } catch (error) {
      this.loggingPort.error('Failed to get team by ID', error as Error, {
        teamId: query.teamId,
        correlationId,
      });
      return Result.failure(`Failed to get team: ${(error as Error).message}`);
    }
  }

  public async getTeamsBySeason(
    _query: GetTeamsBySeasonQuery
  ): Promise<Result<TeamDto[]>> {
    return Result.failure('Not implemented yet');
  }

  public async searchTeams(_query: SearchTeamsQuery): Promise<
    Result<{
      teams: TeamDto[];
      totalCount: number;
      hasMore: boolean;
    }>
  > {
    return Result.failure('Not implemented yet');
  }

  public async getTeamRoster(
    _query: GetTeamRosterQuery
  ): Promise<Result<TeamRosterDto>> {
    return Result.failure('Not implemented yet');
  }

  public async getTeamStatistics(
    _query: GetTeamStatisticsQuery
  ): Promise<Result<TeamStatisticsDto>> {
    return Result.failure('Not implemented yet');
  }

  public async isTeamNameAvailable(
    _organizationId: string,
    name: string,
    excludeTeamId?: string
  ): Promise<Result<boolean>> {
    try {
      const existingTeam = await this.teamPersistencePort.findByName(name);

      if (!existingTeam) {
        return Result.success(true);
      }

      if (excludeTeamId && existingTeam.id === excludeTeamId) {
        return Result.success(true);
      }

      return Result.success(false);
    } catch (error) {
      this.loggingPort.error(
        'Failed to check team name availability',
        error as Error
      );
      return Result.failure(
        `Failed to check name availability: ${(error as Error).message}`
      );
    }
  }

  public async isJerseyNumberAvailable(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<Result<boolean>> {
    try {
      const existingPlayer =
        await this.playerPersistencePort.findByJerseyNumber(
          teamId,
          jerseyNumber
        );

      if (!existingPlayer) {
        return Result.success(true);
      }

      if (excludePlayerId && existingPlayer.id === excludePlayerId) {
        return Result.success(true);
      }

      return Result.success(false);
    } catch (error) {
      this.loggingPort.error(
        'Failed to check jersey number availability',
        error as Error
      );
      return Result.failure(
        `Failed to check jersey availability: ${(error as Error).message}`
      );
    }
  }

  // Private helper methods

  private async getPlayerCount(teamId: string): Promise<number> {
    try {
      const players = await this.playerPersistencePort.findByTeamId(teamId);
      return players.filter((p) => p.isActive).length;
    } catch {
      return 0;
    }
  }

  public async getTeams(_query?: any): Promise<Result<any[]>> {
    try {
      const teams = await this.teamPersistencePort.findAll();
      return Result.success(teams);
    } catch (error) {
      this.loggingPort.error('Failed to get teams', error as Error);
      return Result.failure(`Failed to get teams: ${(error as Error).message}`);
    }
  }

  private async invalidateTeamCaches(teamId: string): Promise<void> {
    try {
      await this.cachePort.clear(`team:${teamId}:*`);
      await this.cachePort.clear('teams:*');
    } catch (error) {
      this.loggingPort.warn('Failed to invalidate team caches', {
        teamId,
        error,
      });
    }
  }
}
