/**
 * Composition Root - Infrastructure Layer
 *
 * Implements Hexagonal Architecture (Ports & Adapters) by wiring up:
 * - Primary Adapters (UI, REST API) → Application Ports
 * - Application Core → Secondary Ports → Infrastructure Adapters
 *
 * This is the only place where concrete classes are instantiated and
 * ports are bound to their adapters. The composition root creates the
 * complete object graph while maintaining proper dependency directions.
 */

// Application Ports (Secondary - what application needs)
import {
  ITeamPersistencePort,
  IPlayerPersistencePort,
  IGamePersistencePort,
  ISeasonPersistencePort,
  IGameTypePersistencePort,
  IAtBatPersistencePort,
} from '@/application/ports/secondary/IPersistencePorts';

import {
  ILoggingPort,
  ICachePort,
  IEventPublishingPort,
  ITimeProvider,
  IIdGenerator,
  IConfigurationPort,
  IFileStoragePort,
} from '@/application/ports/secondary/IInfrastructurePorts';

// Domain service interfaces
import {
  IScoringService,
  IGameSessionService,
  IAtBatProcessingService,
  IStatisticsCalculationService,
  IScoreCalculationService,
} from '@/domain';

// Infrastructure Adapters (Secondary - concrete implementations)
import {
  TeamPersistenceAdapter,
  PlayerPersistenceAdapter,
  GamePersistenceAdapter,
} from '../adapters/persistence/IndexedDBPersistenceAdapter';

import {
  ConsoleLoggingAdapter,
  LocalStorageCacheAdapter,
  BrowserEventPublishingAdapter,
  SystemTimeProviderAdapter,
  UUIDGeneratorAdapter,
  EnvironmentConfigurationAdapter,
  BrowserFileStorageAdapter,
} from '../adapters/services/InfrastructureServiceAdapters';

// Legacy repository implementations (to be replaced)
import { IndexedDBSeasonRepository } from '../repositories/IndexedDBSeasonRepository';
import { IndexedDBGameTypeRepository } from '../repositories/IndexedDBGameTypeRepository';
import { IndexedDBAtBatRepository } from '../repositories/IndexedDBAtBatRepository';

// Domain service implementations
import { ScoringService } from '@/domain/services/ScoringService';
import { GameSessionService } from '@/domain/services/GameSessionService';
import { AtBatProcessingService } from '@/domain/services/AtBatProcessingService';
import { StatisticsCalculationService } from '@/domain/services/StatisticsCalculationService';
import { ScoreCalculationService } from '@/domain/services/ScoreCalculationService';

// Application Service Interfaces (Primary Ports)
import {
  ITeamApplicationService,
  IGameApplicationService,
  IDataApplicationService,
  IScoringApplicationService,
} from '@/application/services/interfaces';

// Import IStatisticsApplicationService separately to avoid conflicts
import { IStatisticsApplicationService } from '@/application/services/interfaces/IStatisticsApplicationService';

// Application Service Implementations
import { TeamApplicationService } from '@/application/services/implementations/TeamApplicationService';
import { GameApplicationService } from '@/application/services/implementations/GameApplicationService';
import { StatisticsApplicationService } from '@/application/services/implementations/StatisticsApplicationService';
import { DataApplicationService } from '@/application/services/implementations/DataApplicationService';
import { ScoringApplicationService } from '@/application/services/implementations/ScoringApplicationService';

// Application layer use cases (legacy)
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { CreateGameUseCase } from '@/application/use-cases/CreateGameUseCase';
import { LoadDefaultDataUseCase } from '@/application/use-cases/LoadDefaultDataUseCase';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import { RecordAtBatUseCase } from '@/application/use-cases/RecordAtBatUseCase';
import { SetupLineupUseCase } from '@/application/use-cases/SetupLineupUseCase';

// Presentation services (used by stores)
import { TeamHydrationService } from '@/presentation/adapters/TeamHydrationService';

/**
 * Hexagonal Architecture Application Container
 *
 * Provides access to all ports and adapters in the system.
 * This container exposes the application's boundaries following
 * the ports and adapters pattern.
 */
export interface ApplicationContainer {
  // Secondary Ports - Persistence
  teamPersistencePort: ITeamPersistencePort;
  playerPersistencePort: IPlayerPersistencePort;
  gamePersistencePort: IGamePersistencePort;
  seasonPersistencePort: ISeasonPersistencePort;
  gameTypePersistencePort: IGameTypePersistencePort;
  atBatPersistencePort: IAtBatPersistencePort;

  // Secondary Ports - Infrastructure Services
  loggingPort: ILoggingPort;
  cachePort: ICachePort;
  eventPublishingPort: IEventPublishingPort;
  timeProvider: ITimeProvider;
  idGenerator: IIdGenerator;
  configurationPort: IConfigurationPort;
  fileStoragePort: IFileStoragePort;

  // Domain Services
  domainScoringService: IScoringService;

  // Application Services
  scoringService: IScoringApplicationService;
  gameSessionService: IGameSessionService;
  atBatProcessingService: IAtBatProcessingService;
  statisticsCalculationService: IStatisticsCalculationService;
  scoreCalculationService: IScoreCalculationService;

  // Use Cases (Application Services)
  createTeamUseCase: CreateTeamUseCase;
  createGameUseCase: CreateGameUseCase;
  loadDefaultDataUseCase: LoadDefaultDataUseCase;
  addPlayerUseCase: AddPlayerUseCase;
  updatePlayerUseCase: UpdatePlayerUseCase;
  removePlayerUseCase: RemovePlayerUseCase;
  recordAtBatUseCase: RecordAtBatUseCase;
  setupLineupUseCase: SetupLineupUseCase;

  // Primary Ports - Application Services (CQRS)
  teamApplicationService: ITeamApplicationService;
  gameApplicationService: IGameApplicationService;
  statisticsApplicationService: IStatisticsApplicationService;
  dataApplicationService: IDataApplicationService;

  // Presentation Services (Primary Adapters)
  teamHydrationService: TeamHydrationService;

  // Legacy Support (to be removed)
  teamRepository: ITeamPersistencePort;
  playerRepository: IPlayerPersistencePort;
  gameRepository: IGamePersistencePort;
  seasonRepository: ISeasonPersistencePort;
  gameTypeRepository: IGameTypePersistencePort;
  atBatRepository: IAtBatPersistencePort;
}

/**
 * Composition Root implementation
 * Creates and wires up all dependencies following Clean Architecture principles
 */
export class CompositionRoot {
  private static _instance: CompositionRoot | null = null;
  private _container: ApplicationContainer | null = null;

  private constructor() {}

  public static getInstance(): CompositionRoot {
    if (!CompositionRoot._instance) {
      CompositionRoot._instance = new CompositionRoot();
    }
    return CompositionRoot._instance;
  }

  /**
   * Compose the entire hexagonal architecture dependency graph
   * This method creates all adapters and wires them to ports
   */
  public compose(): ApplicationContainer {
    if (this._container) {
      return this._container;
    }

    // Step 1: Create Infrastructure Service Adapters (Secondary Ports)
    const loggingPort = new ConsoleLoggingAdapter('BreakingBat');
    const cachePort = new LocalStorageCacheAdapter();
    const eventPublishingPort = new BrowserEventPublishingAdapter();
    const timeProvider = new SystemTimeProviderAdapter();
    const idGenerator = new UUIDGeneratorAdapter();
    const configurationPort = new EnvironmentConfigurationAdapter();
    const fileStoragePort = new BrowserFileStorageAdapter();

    loggingPort.info('🔧 Initializing Hexagonal Architecture');

    // Step 2: Create Persistence Adapters (Secondary Ports)
    const teamPersistencePort = new TeamPersistenceAdapter();
    const playerPersistencePort = new PlayerPersistenceAdapter();
    const gamePersistencePort = new GamePersistenceAdapter();

    // Legacy adapters (to be migrated)
    const seasonPersistencePort = new IndexedDBSeasonRepository();
    const gameTypePersistencePort = new IndexedDBGameTypeRepository();
    const atBatPersistencePort = new IndexedDBAtBatRepository();

    // Step 3: Create Domain Services (Business Logic Core)
    const statisticsCalculationService = new StatisticsCalculationService();
    const domainScoringService = new ScoringService(
      statisticsCalculationService
    );
    const gameSessionService = new GameSessionService();
    const scoreCalculationService = new ScoreCalculationService();
    const atBatProcessingService = new AtBatProcessingService(
      domainScoringService,
      gameSessionService
    );

    // Step 3b: Create Application Services (wrapping domain services for presentation layer)
    const scoringService = new ScoringApplicationService(domainScoringService);

    loggingPort.info('✅ Domain services initialized');

    // Step 4: Create Application Use Cases (with port injection)
    const createTeamUseCase = new CreateTeamUseCase(teamPersistencePort);
    const createGameUseCase = new CreateGameUseCase(gamePersistencePort);
    const loadDefaultDataUseCase = new LoadDefaultDataUseCase(
      teamPersistencePort,
      playerPersistencePort,
      seasonPersistencePort,
      gameTypePersistencePort
    );
    const addPlayerUseCase = new AddPlayerUseCase(
      playerPersistencePort,
      teamPersistencePort
    );
    const updatePlayerUseCase = new UpdatePlayerUseCase(playerPersistencePort);
    const removePlayerUseCase = new RemovePlayerUseCase(
      playerPersistencePort,
      teamPersistencePort
    );
    const recordAtBatUseCase = new RecordAtBatUseCase(
      atBatPersistencePort,
      gamePersistencePort
    );
    const setupLineupUseCase = new SetupLineupUseCase(
      gamePersistencePort,
      playerPersistencePort
    );

    loggingPort.info('✅ Application use cases initialized');

    // Step 5: Create Application Services (Primary Ports)
    const teamApplicationService = new TeamApplicationService(
      teamPersistencePort,
      playerPersistencePort,
      loggingPort,
      timeProvider,
      idGenerator,
      cachePort
    );

    const gameApplicationService = new GameApplicationService(
      gamePersistencePort,
      teamPersistencePort,
      seasonPersistencePort,
      gameTypePersistencePort,
      loggingPort,
      timeProvider,
      idGenerator,
      cachePort
    );

    const statisticsApplicationService = new StatisticsApplicationService(
      teamPersistencePort,
      playerPersistencePort,
      gamePersistencePort,
      atBatPersistencePort,
      statisticsCalculationService,
      loggingPort,
      cachePort
    );

    const dataApplicationService = new DataApplicationService(
      seasonPersistencePort,
      gameTypePersistencePort,
      loggingPort,
      timeProvider,
      idGenerator,
      cachePort
    );

    loggingPort.info('✅ Application services initialized');

    // Step 6: Create Primary Adapters (Presentation Services)
    const teamHydrationService = new TeamHydrationService(
      playerPersistencePort
    );

    // Step 7: Create Hexagonal Architecture Container
    this._container = {
      // Secondary Ports - Persistence
      teamPersistencePort,
      playerPersistencePort,
      gamePersistencePort,
      seasonPersistencePort,
      gameTypePersistencePort,
      atBatPersistencePort,

      // Secondary Ports - Infrastructure Services
      loggingPort,
      cachePort,
      eventPublishingPort,
      timeProvider,
      idGenerator,
      configurationPort,
      fileStoragePort,

      // Domain Services (Business Logic Core)
      domainScoringService,

      // Application Services
      scoringService,
      gameSessionService,
      atBatProcessingService,
      statisticsCalculationService,
      scoreCalculationService,

      // Application Use Cases
      createTeamUseCase,
      createGameUseCase,
      loadDefaultDataUseCase,
      addPlayerUseCase,
      updatePlayerUseCase,
      removePlayerUseCase,
      recordAtBatUseCase,
      setupLineupUseCase,

      // Primary Ports - Application Services (CQRS)
      teamApplicationService,
      gameApplicationService,
      statisticsApplicationService,
      dataApplicationService,

      // Primary Adapters (Presentation Services)
      teamHydrationService,

      // Legacy Support (backward compatibility)
      teamRepository: teamPersistencePort,
      playerRepository: playerPersistencePort,
      gameRepository: gamePersistencePort,
      seasonRepository: seasonPersistencePort,
      gameTypeRepository: gameTypePersistencePort,
      atBatRepository: atBatPersistencePort,
    };

    loggingPort.info('🎯 Hexagonal Architecture composition complete!');
    loggingPort.debug('Container created with ports and adapters', {
      persistencePorts: 6,
      infrastructurePorts: 7,
      domainServices: 5,
      applicationServices: 4,
      useCases: 8,
      primaryAdapters: 1,
    });

    if (!this._container) {
      throw new Error('Container not initialized. Call compose() first.');
    }
    return this._container;
  }

  /**
   * Get the composed application container
   * Throws error if compose() hasn't been called yet
   */
  public getContainer(): ApplicationContainer {
    if (!this._container) {
      throw new Error(
        'CompositionRoot must be composed before accessing container. Call compose() first.'
      );
    }
    return this._container;
  }

  /**
   * Reset the composition root (useful for testing)
   */
  public reset(): void {
    this._container = null;
  }
}
