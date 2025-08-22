/**
 * Data Application Service Implementation
 *
 * Concrete implementation of IDataApplicationService following CQRS pattern.
 * This service provides data management capabilities including seasons, game types,
 * data import/export, and system administration functions.
 */

import {
  IDataApplicationService,
  CreateSeasonCommand,
  UpdateSeasonCommand,
  CreateGameTypeCommand,
  UpdateGameTypeCommand,
  LoadDefaultDataCommand,
  ImportDataCommand,
  ExportDataCommand,
  ArchiveSeasonCommand,
  InitializeOrganizationCommand,
  GetSeasonsQuery,
  GetSeasonByIdQuery,
  GetGameTypesQuery,
  GetGameTypeByIdQuery,
  GetDataSummaryQuery,
  GetSystemHealthQuery,
  SeasonDto,
  SeasonWithDetailsDto,
  GameTypeDto,
  GameTypeWithDetailsDto,
  LoadDefaultDataResultDto,
  ImportDataResultDto,
  ExportDataResultDto,
  DataSummaryDto,
  SystemHealthDto,
} from '../interfaces/IDataApplicationService';

import { Result } from '@/application/common/Result';
import { Season, GameType } from '@/domain/entities';
import {
  ISeasonPersistencePort,
  IGameTypePersistencePort,
} from '@/application/ports/secondary/IPersistencePorts';
import {
  ILoggingPort,
  ITimeProvider,
  IIdGenerator,
  ICachePort,
} from '@/application/ports/secondary/IInfrastructurePorts';

export class DataApplicationService implements IDataApplicationService {
  constructor(
    private readonly seasonPersistencePort: ISeasonPersistencePort,
    private readonly gameTypePersistencePort: IGameTypePersistencePort,
    private readonly loggingPort: ILoggingPort,
    private readonly timeProvider: ITimeProvider,
    private readonly idGenerator: IIdGenerator,
    private readonly cachePort: ICachePort
  ) {}

  // Command Operations (Write Side)

  public async createSeason(
    command: CreateSeasonCommand
  ): Promise<Result<SeasonDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Creating season', {
        seasonName: command.name,
        year: command.year,
        correlationId,
      });

      // Validate season name and year availability
      const existingSeasons = await this.seasonPersistencePort.findByYear(
        command.year
      );
      const nameExists = existingSeasons.some(
        (season) => season.name === command.name
      );
      if (nameExists) {
        return Result.failure(
          `Season '${command.name}' for year ${command.year} already exists`
        );
      }

      // Create domain entity
      const seasonId = this.idGenerator.generateId();
      const now = this.timeProvider.now();

      const season = new Season(
        seasonId,
        command.name,
        command.year,
        command.startDate,
        command.endDate,
        [], // no teams initially
        now,
        now
      );

      // Persist the season
      const savedSeason = await this.seasonPersistencePort.save(season);

      // Convert to DTO
      const seasonDto: SeasonDto = {
        id: savedSeason.id,
        name: savedSeason.name,
        year: savedSeason.year,
        startDate: savedSeason.startDate,
        endDate: savedSeason.endDate,
        description: command.description,
        isActive: command.isActive !== undefined ? command.isActive : true,
        isArchived: false,
        teamCount: 0,
        gameCount: 0,
        playerCount: 0,
        createdAt: savedSeason.createdAt,
        updatedAt: savedSeason.updatedAt,
      };

      // Invalidate relevant caches
      await this.invalidateSeasonCaches();

      this.loggingPort.info('Season created successfully', {
        seasonId: seasonId,
        seasonName: command.name,
        correlationId,
      });

      return Result.success(seasonDto);
    } catch (error) {
      this.loggingPort.error('Failed to create season', error as Error, {
        seasonName: command.name,
        correlationId,
      });
      return Result.failure(
        `Failed to create season: ${(error as Error).message}`
      );
    }
  }

  public async updateSeason(
    _command: UpdateSeasonCommand
  ): Promise<Result<SeasonDto>> {
    return Result.failure('Not implemented yet');
  }

  public async createGameType(
    command: CreateGameTypeCommand
  ): Promise<Result<GameTypeDto>> {
    const correlationId = this.idGenerator.generateShortId();

    try {
      this.loggingPort.info('Creating game type', {
        gameTypeName: command.name,
        correlationId,
      });

      // Validate game type name availability
      const existingGameType = await this.gameTypePersistencePort.findByName(
        command.name
      );
      if (existingGameType) {
        return Result.failure(`Game type '${command.name}' already exists`);
      }

      // Create domain entity
      const gameTypeId = this.idGenerator.generateId();
      const now = this.timeProvider.now();

      const gameType = new GameType(
        gameTypeId,
        command.name,
        command.description || '',
        now,
        now
      );

      // Persist the game type
      const savedGameType = await this.gameTypePersistencePort.save(gameType);

      // Convert to DTO
      const gameTypeDto: GameTypeDto = {
        id: savedGameType.id,
        name: savedGameType.name,
        description: savedGameType.description,
        defaultInnings: command.defaultInnings || 9,
        allowTies: command.allowTies || false,
        mercyRule: command.mercyRule,
        isActive: command.isActive !== undefined ? command.isActive : true,
        gameCount: 0,
        createdAt: savedGameType.createdAt,
        updatedAt: savedGameType.updatedAt,
      };

      // Invalidate relevant caches
      await this.invalidateGameTypeCaches();

      this.loggingPort.info('Game type created successfully', {
        gameTypeId: gameTypeId,
        gameTypeName: command.name,
        correlationId,
      });

      return Result.success(gameTypeDto);
    } catch (error) {
      this.loggingPort.error('Failed to create game type', error as Error, {
        gameTypeName: command.name,
        correlationId,
      });
      return Result.failure(
        `Failed to create game type: ${(error as Error).message}`
      );
    }
  }

  public async updateGameType(
    _command: UpdateGameTypeCommand
  ): Promise<Result<GameTypeDto>> {
    return Result.failure('Not implemented yet');
  }

  public async deleteGameType(gameTypeId: string): Promise<Result<void>> {
    try {
      this.loggingPort.info('Deleting game type', { gameTypeId });

      // Delete from persistence layer
      await this.gameTypePersistencePort.delete(gameTypeId);

      // Invalidate related caches
      await this.cachePort.clear('gametypes:*');
      await this.cachePort.clear(`gametype:${gameTypeId}:*`);

      this.loggingPort.info('Game type deleted successfully', { gameTypeId });
      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.loggingPort.error('Failed to delete game type', {
        gameTypeId,
        error: message,
      });
      return Result.failure(message);
    }
  }

  public async loadDefaultData(
    command: LoadDefaultDataCommand
  ): Promise<Result<LoadDefaultDataResultDto>> {
    const correlationId = this.idGenerator.generateShortId();
    const startTime = Date.now();

    try {
      this.loggingPort.info('Loading default data', {
        options: command,
        correlationId,
      });

      const summary = {
        teamsCreated: 0,
        playersCreated: 0,
        seasonsCreated: 0,
        gameTypesCreated: 0,
      };

      const warnings: string[] = [];
      const errors: string[] = [];

      // Load default seasons if requested
      if (command.includeSeasons !== false) {
        try {
          const currentYear = new Date().getFullYear();
          const seasonResult = await this.createSeason({
            name: `${currentYear} Season`,
            year: currentYear,
            startDate: new Date(currentYear, 2, 1), // March 1st
            endDate: new Date(currentYear, 9, 31), // October 31st
            description: 'Default season created by system',
            isActive: true,
          });

          if (seasonResult.isSuccess) {
            summary.seasonsCreated++;
          } else {
            warnings.push(`Default season creation: ${seasonResult.error}`);
          }
        } catch (error) {
          errors.push(
            `Failed to create default season: ${(error as Error).message}`
          );
        }
      }

      // Load default game types if requested
      if (command.includeGameTypes !== false) {
        const defaultGameTypes = [
          {
            name: 'Regular Game',
            description: 'Standard 9-inning baseball game',
            defaultInnings: 9,
            allowTies: false,
          },
          {
            name: 'Scrimmage',
            description: 'Practice or exhibition game',
            defaultInnings: 7,
            allowTies: true,
          },
          {
            name: 'Tournament',
            description: 'Tournament game with extra innings if needed',
            defaultInnings: 9,
            allowTies: false,
          },
        ];

        for (const gameTypeData of defaultGameTypes) {
          try {
            const gameTypeResult = await this.createGameType(gameTypeData);
            if (gameTypeResult.isSuccess) {
              summary.gameTypesCreated++;
            } else {
              warnings.push(
                `Game type '${gameTypeData.name}': ${gameTypeResult.error}`
              );
            }
          } catch (error) {
            errors.push(
              `Failed to create game type '${gameTypeData.name}': ${(error as Error).message}`
            );
          }
        }
      }

      const executionTime = Date.now() - startTime;

      const result: LoadDefaultDataResultDto = {
        success: errors.length === 0,
        summary,
        details: {
          teams: [],
          players: [],
          seasons: [],
          gameTypes: [],
        },
        warnings,
        errors,
        executionTime,
      };

      this.loggingPort.info('Default data loading completed', {
        summary,
        warningCount: warnings.length,
        errorCount: errors.length,
        executionTime,
        correlationId,
      });

      return Result.success(result);
    } catch (error) {
      this.loggingPort.error('Failed to load default data', error as Error, {
        correlationId,
      });
      return Result.failure(
        `Failed to load default data: ${(error as Error).message}`
      );
    }
  }

  public async importData(
    _command: ImportDataCommand
  ): Promise<Result<ImportDataResultDto>> {
    return Result.failure('Not implemented yet');
  }

  public async exportData(
    _command: ExportDataCommand
  ): Promise<Result<ExportDataResultDto>> {
    return Result.failure('Not implemented yet');
  }

  public async archiveSeason(
    _command: ArchiveSeasonCommand
  ): Promise<Result<void>> {
    return Result.failure('Not implemented yet');
  }

  public async initializeOrganization(
    _command: InitializeOrganizationCommand
  ): Promise<Result<void>> {
    return Result.failure('Not implemented yet');
  }

  // Query Operations (Read Side)

  public async getSeasons(
    query: GetSeasonsQuery
  ): Promise<Result<SeasonDto[]>> {
    try {
      this.loggingPort.debug('Getting seasons', { query });

      // Check cache first
      const cacheKey = `seasons:${JSON.stringify(query)}`;
      const cached = await this.cachePort.get<SeasonDto[]>(cacheKey);
      if (cached) {
        return Result.success(cached);
      }

      // Get seasons from persistence
      const seasons = await this.seasonPersistencePort.findAll();

      // Filter and sort based on query
      let filteredSeasons = seasons;

      if (query.year !== undefined) {
        filteredSeasons = filteredSeasons.filter((s) => s.year === query.year);
      }

      if (query.isActive !== undefined) {
        filteredSeasons = filteredSeasons.filter(
          (s) => s.isActive() === query.isActive
        );
      }

      if (!query.includeArchived) {
        // Add isArchived support to Season entity
        filteredSeasons = filteredSeasons.filter((_s) => true); // For now, don't filter archived
      }

      // Sort
      if (query.sortBy) {
        filteredSeasons.sort((a, b) => {
          const aValue = (a as unknown as Record<string, string | number>)[
            query.sortBy!
          ];
          const bValue = (b as unknown as Record<string, string | number>)[
            query.sortBy!
          ];
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return query.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      // Convert to DTOs
      const seasonDtos: SeasonDto[] = filteredSeasons.map((season) => ({
        id: season.id,
        name: season.name,
        year: season.year,
        startDate: season.startDate,
        endDate: season.endDate,
        description: undefined, // Add description support to Season entity
        isActive: season.isActive(),
        isArchived: false, // Add isArchived support to Season entity
        teamCount: season.teamIds?.length || 0,
        gameCount: 0, // Calculate game count
        playerCount: 0, // Calculate player count
        createdAt: season.createdAt,
        updatedAt: season.updatedAt,
      }));

      // Cache the result
      await this.cachePort.set(cacheKey, seasonDtos, 300); // 5 minutes

      return Result.success(seasonDtos);
    } catch (error) {
      this.loggingPort.error('Failed to get seasons', error as Error);
      return Result.failure(
        `Failed to get seasons: ${(error as Error).message}`
      );
    }
  }

  public async getSeasonById(
    _query: GetSeasonByIdQuery
  ): Promise<Result<SeasonWithDetailsDto | null>> {
    return Result.failure('Not implemented yet');
  }

  public async getGameTypes(
    _query: GetGameTypesQuery
  ): Promise<Result<GameTypeDto[]>> {
    return Result.failure('Not implemented yet');
  }

  public async getGameTypeById(
    _query: GetGameTypeByIdQuery
  ): Promise<Result<GameTypeWithDetailsDto | null>> {
    return Result.failure('Not implemented yet');
  }

  public async getDataSummary(
    _query: GetDataSummaryQuery
  ): Promise<Result<DataSummaryDto>> {
    return Result.failure('Not implemented yet');
  }

  public async getSystemHealth(
    _query: GetSystemHealthQuery
  ): Promise<Result<SystemHealthDto>> {
    return Result.failure('Not implemented yet');
  }

  // Helper methods

  private async invalidateSeasonCaches(): Promise<void> {
    try {
      await this.cachePort.clear('seasons:*');
      await this.cachePort.clear('data:summary:*');
    } catch (error) {
      this.loggingPort.warn('Failed to invalidate season caches', { error });
    }
  }

  private async invalidateGameTypeCaches(): Promise<void> {
    try {
      await this.cachePort.clear('gameTypes:*');
      await this.cachePort.clear('data:summary:*');
    } catch (error) {
      this.loggingPort.warn('Failed to invalidate game type caches', { error });
    }
  }
}
