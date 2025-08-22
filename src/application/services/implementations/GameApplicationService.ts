/**
 * Game Application Service Implementation
 */

import {
  IGameApplicationService,
  CreateGameCommand,
  UpdateGameCommand,
  SetupLineupCommand,
  StartGameCommand,
  EndGameCommand,
  RecordAtBatCommand,
  GetGameByIdQuery,
  GetGamesByTeamQuery,
  GetGamesBySeasonQuery,
  GetCurrentGamesQuery,
  GetGameLineupQuery,
  GetInningDetailsQuery,
  GetGameStatisticsQuery,
  SubstitutePlayerCommand,
  GameDto,
  GameWithDetailsDto,
  LineupDto,
  AtBatDto,
  GameStatisticsDto,
  InningScoreDto,
  GameFlowEventDto,
  SubstitutionDto,
} from '../interfaces/IGameApplicationService';

import { Result } from '@/application/common/Result';
import { Game } from '@/domain/entities';
import { HomeAway } from '@/domain/entities/Inning';
import {
  IGamePersistencePort,
  ITeamPersistencePort,
  ISeasonPersistencePort,
  IGameTypePersistencePort,
} from '@/application/ports/secondary/IPersistencePorts';
import {
  ILoggingPort,
  ITimeProvider,
  IIdGenerator,
  ICachePort,
} from '@/application/ports/secondary/IInfrastructurePorts';

export class GameApplicationService implements IGameApplicationService {
  constructor(
    private readonly gamePersistencePort: IGamePersistencePort,
    private readonly teamPersistencePort: ITeamPersistencePort,
    private readonly seasonPersistencePort: ISeasonPersistencePort,
    private readonly gameTypePersistencePort: IGameTypePersistencePort,
    private readonly loggingPort: ILoggingPort,
    private readonly timeProvider: ITimeProvider,
    private readonly idGenerator: IIdGenerator,
    private readonly cachePort: ICachePort
  ) {}

  // Command Operations (Write Side)

  public async createGame(
    command: CreateGameCommand
  ): Promise<Result<GameDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Creating game', {
        teamId: command.teamId,
        opponent: command.opponent,
        correlationId,
      });

      // Validate team exists
      const team = await this.teamPersistencePort.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with ID '${command.teamId}' not found`);
      }

      // Validate season and game type if provided
      if (command.seasonId) {
        const season = await this.seasonPersistencePort.findById(
          command.seasonId
        );
        if (!season) {
          return Result.failure(
            `Season with ID '${command.seasonId}' not found`
          );
        }
      }

      if (command.gameTypeId) {
        const gameType = await this.gameTypePersistencePort.findById(
          command.gameTypeId
        );
        if (!gameType) {
          return Result.failure(
            `Game type with ID '${command.gameTypeId}' not found`
          );
        }
      }

      // Create domain entity
      const gameId = this.idGenerator.generateId();
      const now = this.timeProvider.now();

      const game = new Game(
        gameId,
        command.name,
        command.opponent,
        command.date,
        command.seasonId || null,
        command.gameTypeId || null,
        (command.isHomeGame ? 'home' : 'away') as HomeAway,
        command.teamId,
        'setup', // initial status
        null, // no lineup yet
        [], // no innings yet
        null, // no scoreboard yet
        now,
        now
      );

      // Persist the game
      const savedGame = await this.gamePersistencePort.save(game);

      // Convert to DTO
      const gameDto: GameDto = {
        id: savedGame.id,
        name: savedGame.name,
        teamId: savedGame.teamId,
        teamName: team.name,
        opponent: savedGame.opponent,
        date: savedGame.date,
        location: command.location,
        seasonId: savedGame.seasonId || undefined,
        gameTypeId: savedGame.gameTypeId || undefined,
        status: savedGame.status === 'setup' ? 'scheduled' : savedGame.status,
        isHomeGame: savedGame.homeAway === 'home',
        score: {
          homeScore: savedGame.scoreboard?.homeScore || 0,
          awayScore: savedGame.scoreboard?.awayScore || 0,
          inningScores: [],
        },
        createdAt: savedGame.createdAt,
        updatedAt: savedGame.updatedAt,
      };

      // Invalidate relevant caches
      await this.invalidateGameCaches(gameId, command.teamId);

      this.loggingPort.info('Game created successfully', {
        gameId: gameId,
        team: team.name,
        opponent: command.opponent,
        correlationId,
      });

      return Result.success(gameDto);
    } catch (error) {
      this.loggingPort.error('Failed to create game', error as Error, {
        teamId: command.teamId,
        opponent: command.opponent,
        correlationId,
      });
      return Result.failure(
        `Failed to create game: ${(error as Error).message}`
      );
    }
  }

  public async updateGame(
    _command: UpdateGameCommand
  ): Promise<Result<GameDto>> {
    return Result.failure('Not implemented yet');
  }

  public async deleteGame(gameId: string): Promise<Result<void>> {
    try {
      this.loggingPort.info('Deleting game', { gameId });

      // Delete from persistence layer
      await this.gamePersistencePort.delete(gameId);

      // Invalidate caches
      await this.invalidateGameCaches(gameId);

      this.loggingPort.info('Game deleted successfully', { gameId });
      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.loggingPort.error('Failed to delete game', error as Error, {
        gameId,
      });
      return Result.failure(message);
    }
  }

  public async setupLineup(
    _command: SetupLineupCommand
  ): Promise<Result<LineupDto>> {
    return Result.failure('Not implemented yet');
  }

  public async startGame(_command: StartGameCommand): Promise<Result<GameDto>> {
    return Result.failure('Not implemented yet');
  }

  public async endGame(_command: EndGameCommand): Promise<Result<GameDto>> {
    return Result.failure('Not implemented yet');
  }

  public async recordAtBat(
    _command: RecordAtBatCommand
  ): Promise<Result<AtBatDto>> {
    return Result.failure('Not implemented yet');
  }

  public async addInning(_command: unknown): Promise<Result<void>> {
    return Result.failure('Not implemented yet');
  }

  public async substitutePlayer(
    _command: SubstitutePlayerCommand
  ): Promise<Result<SubstitutionDto>> {
    return Result.failure('Not implemented yet');
  }

  // Note: UpdateGameStatusCommand and ArchiveGameCommand not defined in interface yet

  // Query Operations (Read Side)

  public async getGameById(
    query: GetGameByIdQuery
  ): Promise<Result<GameWithDetailsDto | null>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.debug('Getting game by ID', {
        gameId: query.gameId,
        correlationId,
      });

      // Check cache first
      const cacheKey = `game:${query.gameId}:details`;
      const cached = await this.cachePort.get<GameWithDetailsDto>(cacheKey);
      if (cached) {
        this.loggingPort.debug('Game found in cache', {
          gameId: query.gameId,
          correlationId,
        });
        return Result.success(cached);
      }

      // Retrieve from persistence
      const game = await this.gamePersistencePort.findById(query.gameId);
      if (!game) {
        return Result.success(null);
      }

      // Get team
      const team = await this.teamPersistencePort.findById(game.teamId);
      if (!team) {
        return Result.failure('Game team not found');
      }

      // Convert to DTO
      const gameDto: GameWithDetailsDto = {
        id: game.id,
        name: game.name,
        teamId: game.teamId,
        teamName: team.name,
        opponent: game.opponent,
        date: game.date,
        location: undefined, // Add location support
        seasonId: game.seasonId || undefined,
        gameTypeId: game.gameTypeId || undefined,
        status: game.status === 'setup' ? 'scheduled' : (game.status as any), // Align domain and DTO enums
        isHomeGame: game.homeAway === 'home',
        score: {
          homeScore: game.scoreboard?.homeScore || 0,
          awayScore: game.scoreboard?.awayScore || 0,
          inningScores: [],
        },
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        lineups: [], // Get lineups if requested
        atBats: [], // Get at-bats if requested
        statistics: {
          gameId: game.id,
          teamStatistics: {
            teamId: game.teamId,
            runs: game.scoreboard?.homeScore || 0,
            hits: 0, // Calculate hits
            errors: 0, // Calculate errors
            leftOnBase: 0, // Calculate left on base
            atBats: 0, // Calculate at bats
            battingAverage: 0, // Calculate batting average
            onBasePercentage: 0, // Calculate OBP
          },
          playerStatistics: [], // Get player statistics
          inningScores: [],
          gameFlow: [],
        },
        substitutions: [], // Get substitutions if requested
      };

      // Cache the result
      await this.cachePort.set(cacheKey, gameDto, 300); // 5 minutes

      this.loggingPort.debug('Game retrieved successfully', {
        gameId: query.gameId,
        correlationId,
      });

      return Result.success(gameDto);
    } catch (error) {
      this.loggingPort.error('Failed to get game by ID', error as Error, {
        gameId: query.gameId,
        correlationId,
      });
      return Result.failure(`Failed to get game: ${(error as Error).message}`);
    }
  }

  // Note: GetGamesBySeasonQuery not defined in interface yet

  public async getGamesByTeam(_query: GetGamesByTeamQuery): Promise<
    Result<{
      games: GameDto[];
      totalCount: number;
      hasMore: boolean;
    }>
  > {
    // Placeholder implementation
    return Result.failure('Not implemented yet');
  }

  // Note: SearchGamesQuery not defined in interface yet

  // Note: GetLineupQuery not defined in interface yet

  public async getGameStatistics(
    _query: GetGameStatisticsQuery
  ): Promise<Result<GameStatisticsDto>> {
    // Placeholder implementation
    return Result.failure('Not implemented yet');
  }

  public async getGamesBySeason(
    _query: GetGamesBySeasonQuery
  ): Promise<Result<GameDto[]>> {
    return Result.failure('Not implemented yet');
  }

  public async getCurrentGames(
    _query: GetCurrentGamesQuery
  ): Promise<Result<GameDto[]>> {
    return Result.failure('Not implemented yet');
  }

  public async getGameLineup(
    _query: GetGameLineupQuery
  ): Promise<Result<LineupDto | null>> {
    return Result.failure('Not implemented yet');
  }

  public async getInningDetails(_query: GetInningDetailsQuery): Promise<
    Result<{
      atBats: AtBatDto[];
      score: InningScoreDto;
      events: GameFlowEventDto[];
    }>
  > {
    return Result.failure('Not implemented yet');
  }

  // Helper methods

  private async invalidateGameCaches(
    gameId: string,
    homeTeamId?: string,
    awayTeamId?: string
  ): Promise<void> {
    try {
      await this.cachePort.clear(`game:${gameId}:*`);
      await this.cachePort.clear('games:*');

      if (homeTeamId) {
        await this.cachePort.clear(`team:${homeTeamId}:games:*`);
      }

      if (awayTeamId) {
        await this.cachePort.clear(`team:${awayTeamId}:games:*`);
      }
    } catch (error) {
      this.loggingPort.warn('Failed to invalidate game caches', {
        gameId,
        error,
      });
    }
  }
}
