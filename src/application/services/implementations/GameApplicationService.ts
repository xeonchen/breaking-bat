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
        lineupId: savedGame.lineupId || undefined,
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
    command: UpdateGameCommand
  ): Promise<Result<GameDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Updating game', {
        gameId: command.gameId,
        correlationId,
      });

      // Find existing game
      const existingGame = await this.gamePersistencePort.findById(
        command.gameId
      );
      if (!existingGame) {
        return Result.failure(`Game with ID '${command.gameId}' not found`);
      }

      // Create updated game (Game entities are immutable)
      const updatedGame = new Game(
        existingGame.id,
        command.name ?? existingGame.name,
        command.opponent ?? existingGame.opponent,
        command.date ?? existingGame.date,
        existingGame.seasonId,
        existingGame.gameTypeId,
        existingGame.homeAway,
        existingGame.teamId,
        existingGame.status,
        existingGame.lineupId,
        existingGame.inningIds,
        existingGame.scoreboard,
        existingGame.createdAt,
        this.timeProvider.now()
      );

      // Save updated game
      const savedGame = await this.gamePersistencePort.save(updatedGame);

      // Get team for DTO
      const team = await this.teamPersistencePort.findById(savedGame.teamId);
      if (!team) {
        return Result.failure('Game team not found');
      }

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
        status: this.mapGameStatus(savedGame.status),
        isHomeGame: savedGame.homeAway === 'home',
        lineupId: savedGame.lineupId || undefined,
        score: {
          homeScore: savedGame.scoreboard?.homeScore || 0,
          awayScore: savedGame.scoreboard?.awayScore || 0,
          inningScores: [],
        },
        createdAt: savedGame.createdAt,
        updatedAt: savedGame.updatedAt,
      };

      // Invalidate relevant caches
      await this.invalidateGameCaches(command.gameId, savedGame.teamId);

      this.loggingPort.info('Game updated successfully', {
        gameId: command.gameId,
        correlationId,
      });

      return Result.success(gameDto);
    } catch (error) {
      this.loggingPort.error('Failed to update game', error as Error, {
        gameId: command.gameId,
        correlationId,
      });
      return Result.failure(
        `Failed to update game: ${(error as Error).message}`
      );
    }
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
    command: SetupLineupCommand
  ): Promise<Result<LineupDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Setting up game lineup', {
        gameId: command.gameId,
        playerCount: command.playerIds.length,
        correlationId,
      });

      // Find the game
      const game = await this.gamePersistencePort.findById(command.gameId);
      if (!game) {
        return Result.failure(`Game with ID '${command.gameId}' not found`);
      }

      // Generate lineup ID
      const lineupId = this.idGenerator.generateId();

      // Save lineup
      const lineupData = {
        lineupId: lineupId,
        playerIds: command.playerIds,
        defensivePositions: command.defensivePositions,
        battingOrder: command.battingOrder,
      };
      await this.gamePersistencePort.saveLineup(command.gameId, lineupData);

      // Update game with lineup ID (create new immutable game)
      const updatedGame = new Game(
        game.id,
        game.name,
        game.opponent,
        game.date,
        game.seasonId,
        game.gameTypeId,
        game.homeAway,
        game.teamId,
        game.status,
        lineupId,
        game.inningIds,
        game.scoreboard,
        game.createdAt,
        this.timeProvider.now()
      );
      await this.gamePersistencePort.save(updatedGame);

      // Convert to DTO
      const lineupDto: LineupDto = {
        id: lineupId,
        gameId: command.gameId,
        name: command.lineupName,
        playerIds: command.playerIds,
        defensivePositions: command.defensivePositions,
        battingOrder: command.battingOrder,
        isActive: true,
        createdAt: game.createdAt,
      };

      // Invalidate caches
      await this.invalidateGameCaches(command.gameId, game.teamId);

      this.loggingPort.info('Game lineup setup successfully', {
        gameId: command.gameId,
        lineupId: lineupId,
        correlationId,
      });

      return Result.success(lineupDto);
    } catch (error) {
      this.loggingPort.error('Failed to setup game lineup', error as Error, {
        gameId: command.gameId,
        correlationId,
      });
      return Result.failure(
        `Failed to setup game lineup: ${(error as Error).message}`
      );
    }
  }

  public async startGame(_command: StartGameCommand): Promise<Result<GameDto>> {
    return Result.failure('Not implemented yet');
  }

  public async endGame(_command: EndGameCommand): Promise<Result<GameDto>> {
    return Result.failure('Not implemented yet');
  }

  public async recordAtBat(
    command: RecordAtBatCommand
  ): Promise<Result<AtBatDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Recording at-bat', {
        gameId: command.gameId,
        batterId: command.batterId,
        correlationId,
      });

      // Find the game
      const game = await this.gamePersistencePort.findById(command.gameId);
      if (!game) {
        return Result.failure(`Game with ID '${command.gameId}' not found`);
      }

      // Validate game is in progress
      if (game.status !== 'in_progress') {
        return Result.failure('Cannot record at-bat for game not in progress');
      }

      // Create at-bat entity
      const atBatId = this.idGenerator.generateId();
      const timestamp = this.timeProvider.now();

      const atBatDto: AtBatDto = {
        id: atBatId,
        gameId: command.gameId,
        batterId: command.batterId,
        batterName: '', // Get from batter lookup
        inning: 1, // Default inning
        isTopInning: true, // Default
        battingPosition: 1, // Default position
        result: command.battingResult,
        description: command.description || '',
        rbis: command.rbis || 0,
        runsScored: command.runsScored || [],
        baserunnersBefore: command.baserunnersBefore,
        baserunnersAfter: command.baserunnersAfter,
        pitchCount: command.pitchCount,
        fieldingCredits: command.fieldingCredits,
        timestamp: timestamp,
      };

      // Update game statistics if needed - simplified for now
      if (command.rbis && command.rbis > 0) {
        // TODO: Properly update scoreboard with domain methods
        this.loggingPort.debug('RBI recorded but scoreboard update skipped', {
          rbis: command.rbis,
          gameId: command.gameId,
        });
      }

      // Invalidate caches
      await this.invalidateGameCaches(command.gameId, game.teamId);

      this.loggingPort.info('At-bat recorded successfully', {
        gameId: command.gameId,
        atBatId: atBatId,
        rbis: command.rbis || 0,
        correlationId,
      });

      return Result.success(atBatDto);
    } catch (error) {
      this.loggingPort.error('Failed to record at-bat', error as Error, {
        gameId: command.gameId,
        batterId: command.batterId,
        correlationId,
      });
      return Result.failure(
        `Failed to record at-bat: ${(error as Error).message}`
      );
    }
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
        status: this.mapGameStatus(game.status),
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
    query: GetCurrentGamesQuery
  ): Promise<Result<GameDto[]>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.debug('Getting current games', {
        teamId: query.teamId,
        correlationId,
      });

      // Check cache first
      const cacheKey = `games:current:${query.teamId || 'all'}`;
      const cached = await this.cachePort.get<GameDto[]>(cacheKey);
      if (cached) {
        this.loggingPort.debug('Current games found in cache', {
          count: cached.length,
          correlationId,
        });
        return Result.success(cached);
      }

      // Get current date range (today and near future)
      const now = this.timeProvider.now();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      // Find games and filter by date range
      let games: Game[] = [];
      if (query.teamId) {
        games = await this.gamePersistencePort.findByTeamId(query.teamId);
      } else {
        games = await this.gamePersistencePort.findAll();
      }

      // Filter by date range
      games = games.filter(
        (game) => game.date >= thirtyDaysAgo && game.date <= thirtyDaysFromNow
      );

      // Convert to DTOs
      const gameDtos: GameDto[] = [];
      for (const game of games) {
        const team = await this.teamPersistencePort.findById(game.teamId);
        if (team) {
          const gameDto: GameDto = {
            id: game.id,
            name: game.name,
            teamId: game.teamId,
            teamName: team.name,
            opponent: game.opponent,
            date: game.date,
            location: undefined,
            seasonId: game.seasonId || undefined,
            gameTypeId: game.gameTypeId || undefined,
            status: this.mapGameStatus(game.status),
            isHomeGame: game.homeAway === 'home',
            lineupId: game.lineupId || undefined,
            score: {
              homeScore: game.scoreboard?.homeScore || 0,
              awayScore: game.scoreboard?.awayScore || 0,
              inningScores: [],
            },
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
          };
          gameDtos.push(gameDto);
        }
      }

      // Sort by date
      gameDtos.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Cache the result
      await this.cachePort.set(cacheKey, gameDtos, 300); // 5 minutes

      this.loggingPort.debug('Current games retrieved successfully', {
        count: gameDtos.length,
        correlationId,
      });

      return Result.success(gameDtos);
    } catch (error) {
      this.loggingPort.error('Failed to get current games', error as Error, {
        teamId: query.teamId,
        correlationId,
      });
      return Result.failure(
        `Failed to get current games: ${(error as Error).message}`
      );
    }
  }

  public async getGameLineup(
    query: GetGameLineupQuery
  ): Promise<Result<LineupDto | null>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.debug('Getting game lineup', {
        gameId: query.gameId,
        correlationId,
      });

      // Find the game
      const game = await this.gamePersistencePort.findById(query.gameId);
      if (!game) {
        return Result.failure(`Game with ID '${query.gameId}' not found`);
      }

      // Check if game has a lineup
      if (!game.lineupId) {
        return Result.success(null);
      }

      // Get lineup from persistence
      const lineup = await this.gamePersistencePort.getLineup(game.lineupId);
      if (!lineup || lineup.length === 0) {
        return Result.success(null);
      }

      // Convert to DTO
      const lineupDto: LineupDto = {
        id: game.lineupId,
        gameId: query.gameId,
        name: undefined,
        playerIds: lineup,
        defensivePositions: [], // Not available from persistence
        battingOrder: lineup.map((_, index) => index + 1),
        isActive: true,
        createdAt: game.createdAt,
      };

      this.loggingPort.debug('Game lineup retrieved successfully', {
        gameId: query.gameId,
        playerCount: lineup.length,
        correlationId,
      });

      return Result.success(lineupDto);
    } catch (error) {
      this.loggingPort.error('Failed to get game lineup', error as Error, {
        gameId: query.gameId,
        correlationId,
      });
      return Result.failure(
        `Failed to get game lineup: ${(error as Error).message}`
      );
    }
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

  /**
   * Map domain GameStatus to DTO GameStatus
   */
  private mapGameStatus(
    domainStatus: string
  ): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' {
    switch (domainStatus) {
      case 'setup':
        return 'scheduled';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'suspended':
        return 'postponed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }
}
