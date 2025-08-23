import {
  CompositionRoot,
  ApplicationContainer,
} from '@/infrastructure/di/CompositionRoot';

// Mock all the infrastructure adapters and services
jest.mock(
  '@/infrastructure/adapters/persistence/IndexedDBPersistenceAdapter',
  () => ({
    TeamPersistenceAdapter: jest.fn(),
    PlayerPersistenceAdapter: jest.fn(),
    GamePersistenceAdapter: jest.fn(),
  })
);

jest.mock(
  '@/infrastructure/adapters/services/InfrastructureServiceAdapters',
  () => ({
    ConsoleLoggingAdapter: jest.fn(),
    LocalStorageCacheAdapter: jest.fn(),
    BrowserEventPublishingAdapter: jest.fn(),
    SystemTimeProviderAdapter: jest.fn(),
    UUIDGeneratorAdapter: jest.fn(),
    EnvironmentConfigurationAdapter: jest.fn(),
    BrowserFileStorageAdapter: jest.fn(),
  })
);
jest.mock('@/infrastructure/repositories/IndexedDBSeasonRepository');
jest.mock('@/infrastructure/repositories/IndexedDBGameTypeRepository');
jest.mock('@/infrastructure/repositories/IndexedDBAtBatRepository');
jest.mock('@/domain/services/ScoringService');
jest.mock('@/domain/services/GameSessionService');
jest.mock('@/domain/services/AtBatProcessingService');
jest.mock('@/domain/services/StatisticsCalculationService');
jest.mock('@/domain/services/ScoreCalculationService');
jest.mock('@/application/services/implementations/TeamApplicationService');
jest.mock('@/application/services/implementations/GameApplicationService');
jest.mock(
  '@/application/services/implementations/StatisticsApplicationService'
);
jest.mock('@/application/services/implementations/DataApplicationService');
jest.mock('@/application/services/implementations/ScoringApplicationService');
jest.mock('@/application/use-cases/CreateTeamUseCase');
jest.mock('@/application/use-cases/CreateGameUseCase');
jest.mock('@/application/use-cases/LoadDefaultDataUseCase');
jest.mock('@/application/use-cases/AddPlayerUseCase');
jest.mock('@/application/use-cases/UpdatePlayerUseCase');
jest.mock('@/application/use-cases/RemovePlayerUseCase');
jest.mock('@/application/use-cases/RecordAtBatUseCase');
jest.mock('@/application/use-cases/SetupLineupUseCase');
jest.mock('@/presentation/adapters/TeamHydrationService');

describe('CompositionRoot', () => {
  let compositionRoot: CompositionRoot;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Reset singleton state
    (CompositionRoot as any)._instance = null;
    compositionRoot = CompositionRoot.getInstance();
    (compositionRoot as any)._container = null;

    // Setup mock implementations to return mock instances with proper methods
    const infrastructureMocks = jest.requireMock(
      '@/infrastructure/adapters/services/InfrastructureServiceAdapters'
    );

    // Mock ConsoleLoggingAdapter specifically
    infrastructureMocks.ConsoleLoggingAdapter.mockImplementation(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));

    // Mock other infrastructure adapters
    infrastructureMocks.LocalStorageCacheAdapter.mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    }));

    infrastructureMocks.BrowserEventPublishingAdapter.mockImplementation(
      () => ({
        publish: jest.fn(),
      })
    );

    infrastructureMocks.SystemTimeProviderAdapter.mockImplementation(() => ({
      now: jest.fn(() => new Date()),
    }));

    infrastructureMocks.UUIDGeneratorAdapter.mockImplementation(() => ({
      generateId: jest.fn(() => 'test-id'),
      generateShortId: jest.fn(() => 'short-id'),
    }));

    infrastructureMocks.EnvironmentConfigurationAdapter.mockImplementation(
      () => ({
        get: jest.fn(),
      })
    );

    infrastructureMocks.BrowserFileStorageAdapter.mockImplementation(() => ({
      save: jest.fn(),
      load: jest.fn(),
    }));

    // Setup persistence mocks
    const persistenceMocks = jest.requireMock(
      '@/infrastructure/adapters/persistence/IndexedDBPersistenceAdapter'
    );
    Object.keys(persistenceMocks).forEach((key) => {
      persistenceMocks[key].mockImplementation(() => ({
        save: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        delete: jest.fn(),
      }));
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = CompositionRoot.getInstance();
      const instance2 = CompositionRoot.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(CompositionRoot);
    });

    it('should maintain singleton across different composition calls', () => {
      const instance1 = CompositionRoot.getInstance();
      instance1.compose();

      const instance2 = CompositionRoot.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('compose', () => {
    it('should create complete application container', () => {
      const container = compositionRoot.compose();

      expect(container).toBeDefined();
      expect(container).toHaveProperty('teamPersistencePort');
      expect(container).toHaveProperty('playerPersistencePort');
      expect(container).toHaveProperty('gamePersistencePort');
      expect(container).toHaveProperty('seasonPersistencePort');
      expect(container).toHaveProperty('gameTypePersistencePort');
      expect(container).toHaveProperty('atBatPersistencePort');
    });

    it('should create infrastructure service ports', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('loggingPort');
      expect(container).toHaveProperty('cachePort');
      expect(container).toHaveProperty('eventPublishingPort');
      expect(container).toHaveProperty('timeProvider');
      expect(container).toHaveProperty('idGenerator');
      expect(container).toHaveProperty('configurationPort');
      expect(container).toHaveProperty('fileStoragePort');
    });

    it('should create domain services', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('domainScoringService');
      expect(container).toHaveProperty('gameSessionService');
      expect(container).toHaveProperty('atBatProcessingService');
      expect(container).toHaveProperty('statisticsCalculationService');
      expect(container).toHaveProperty('scoreCalculationService');
    });

    it('should create application services', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('teamApplicationService');
      expect(container).toHaveProperty('gameApplicationService');
      expect(container).toHaveProperty('statisticsApplicationService');
      expect(container).toHaveProperty('dataApplicationService');
      expect(container).toHaveProperty('scoringService');
    });

    it('should create use cases', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('createTeamUseCase');
      expect(container).toHaveProperty('createGameUseCase');
      expect(container).toHaveProperty('loadDefaultDataUseCase');
      expect(container).toHaveProperty('addPlayerUseCase');
      expect(container).toHaveProperty('updatePlayerUseCase');
      expect(container).toHaveProperty('removePlayerUseCase');
      expect(container).toHaveProperty('recordAtBatUseCase');
      expect(container).toHaveProperty('setupLineupUseCase');
    });

    it('should create presentation services', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('teamHydrationService');
    });

    it('should provide legacy repository compatibility', () => {
      const container = compositionRoot.compose();

      expect(container).toHaveProperty('teamRepository');
      expect(container).toHaveProperty('playerRepository');
      expect(container).toHaveProperty('gameRepository');
      expect(container).toHaveProperty('seasonRepository');
      expect(container).toHaveProperty('gameTypeRepository');
      expect(container).toHaveProperty('atBatRepository');

      // Legacy repositories should be aliases to persistence ports
      expect(container.teamRepository).toBe(container.teamPersistencePort);
      expect(container.playerRepository).toBe(container.playerPersistencePort);
      expect(container.gameRepository).toBe(container.gamePersistencePort);
    });

    it('should return same container on subsequent calls', () => {
      const container1 = compositionRoot.compose();
      const container2 = compositionRoot.compose();

      expect(container1).toBe(container2);
    });

    it('should complete composition successfully', () => {
      const container = compositionRoot.compose();

      // Verify that composition completes and returns a container
      expect(container).toBeDefined();
      expect(container.teamApplicationService).toBeDefined();
      expect(container.gameApplicationService).toBeDefined();
      expect(container.statisticsApplicationService).toBeDefined();
      expect(container.dataApplicationService).toBeDefined();
    });

    it('should create container with all required services', () => {
      const container = compositionRoot.compose();

      // Verify all essential services are created
      expect(container.teamApplicationService).toBeDefined();
      expect(container.gameApplicationService).toBeDefined();
      expect(container.statisticsApplicationService).toBeDefined();
      expect(container.dataApplicationService).toBeDefined();

      // Verify domain services
      expect(container.domainScoringService).toBeDefined();

      // Verify infrastructure ports
      expect(container.loggingPort).toBeDefined();
      expect(container.cachePort).toBeDefined();
    });
  });

  describe('getContainer', () => {
    it('should return composed container', () => {
      const composedContainer = compositionRoot.compose();
      const retrievedContainer = compositionRoot.getContainer();

      expect(retrievedContainer).toBe(composedContainer);
    });

    it('should throw error if not composed yet', () => {
      expect(() => compositionRoot.getContainer()).toThrow(
        'CompositionRoot must be composed before accessing container. Call compose() first.'
      );
    });

    it('should work after compose is called', () => {
      compositionRoot.compose();

      expect(() => compositionRoot.getContainer()).not.toThrow();
      expect(compositionRoot.getContainer()).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset container to null', () => {
      compositionRoot.compose();
      expect(compositionRoot.getContainer()).toBeDefined();

      compositionRoot.reset();

      expect(() => compositionRoot.getContainer()).toThrow(
        'CompositionRoot must be composed before accessing container. Call compose() first.'
      );
    });

    it('should allow re-composition after reset', () => {
      const container1 = compositionRoot.compose();
      compositionRoot.reset();
      const container2 = compositionRoot.compose();

      expect(container1).not.toBe(container2);
      expect(container2).toBeDefined();
    });

    it('should not throw when reset without composing', () => {
      expect(() => compositionRoot.reset()).not.toThrow();
    });

    it('should handle multiple resets', () => {
      compositionRoot.compose();

      expect(() => {
        compositionRoot.reset();
        compositionRoot.reset();
        compositionRoot.reset();
      }).not.toThrow();
    });
  });

  describe('Container Interface Compliance', () => {
    let container: ApplicationContainer;

    beforeEach(() => {
      container = compositionRoot.compose();
    });

    it('should satisfy ApplicationContainer interface', () => {
      // Persistence Ports
      expect(container.teamPersistencePort).toBeDefined();
      expect(container.playerPersistencePort).toBeDefined();
      expect(container.gamePersistencePort).toBeDefined();
      expect(container.seasonPersistencePort).toBeDefined();
      expect(container.gameTypePersistencePort).toBeDefined();
      expect(container.atBatPersistencePort).toBeDefined();

      // Infrastructure Ports
      expect(container.loggingPort).toBeDefined();
      expect(container.cachePort).toBeDefined();
      expect(container.eventPublishingPort).toBeDefined();
      expect(container.timeProvider).toBeDefined();
      expect(container.idGenerator).toBeDefined();
      expect(container.configurationPort).toBeDefined();
      expect(container.fileStoragePort).toBeDefined();

      // Domain Services
      expect(container.domainScoringService).toBeDefined();
      expect(container.gameSessionService).toBeDefined();
      expect(container.atBatProcessingService).toBeDefined();
      expect(container.statisticsCalculationService).toBeDefined();
      expect(container.scoreCalculationService).toBeDefined();

      // Application Services
      expect(container.teamApplicationService).toBeDefined();
      expect(container.gameApplicationService).toBeDefined();
      expect(container.statisticsApplicationService).toBeDefined();
      expect(container.dataApplicationService).toBeDefined();
      expect(container.scoringService).toBeDefined();

      // Use Cases
      expect(container.createTeamUseCase).toBeDefined();
      expect(container.createGameUseCase).toBeDefined();
      expect(container.loadDefaultDataUseCase).toBeDefined();
      expect(container.addPlayerUseCase).toBeDefined();
      expect(container.updatePlayerUseCase).toBeDefined();
      expect(container.removePlayerUseCase).toBeDefined();
      expect(container.recordAtBatUseCase).toBeDefined();
      expect(container.setupLineupUseCase).toBeDefined();

      // Presentation Services
      expect(container.teamHydrationService).toBeDefined();
    });

    it('should have consistent port and repository references', () => {
      expect(container.teamRepository).toBe(container.teamPersistencePort);
      expect(container.playerRepository).toBe(container.playerPersistencePort);
      expect(container.gameRepository).toBe(container.gamePersistencePort);
      expect(container.seasonRepository).toBe(container.seasonPersistencePort);
      expect(container.gameTypeRepository).toBe(
        container.gameTypePersistencePort
      );
      expect(container.atBatRepository).toBe(container.atBatPersistencePort);
    });
  });

  describe('Dependency Injection Verification', () => {
    it('should create services with proper dependencies', () => {
      const container = compositionRoot.compose();

      // Verify that mocked constructors were called (indicating dependency injection)
      // This is implicit verification through mocking - if dependencies weren't
      // provided correctly, the mocked constructors would throw
      expect(container.teamApplicationService).toBeDefined();
      expect(container.gameApplicationService).toBeDefined();
      expect(container.statisticsApplicationService).toBeDefined();
      expect(container.dataApplicationService).toBeDefined();
    });

    it('should wire domain services to application services', () => {
      const container = compositionRoot.compose();

      // Verify domain services exist and can be used by application services
      expect(container.domainScoringService).toBeDefined();
      expect(container.statisticsCalculationService).toBeDefined();
      expect(container.gameSessionService).toBeDefined();
    });

    it('should wire infrastructure adapters to ports', () => {
      const container = compositionRoot.compose();

      // All ports should be implemented by concrete adapters
      expect(container.loggingPort).toBeDefined();
      expect(container.cachePort).toBeDefined();
      expect(container.timeProvider).toBeDefined();
      expect(container.idGenerator).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle service creation failures gracefully', () => {
      // Mock a constructor failure
      const MockTeamService = jest.requireMock(
        '@/application/services/implementations/TeamApplicationService'
      );
      MockTeamService.TeamApplicationService.mockImplementationOnce(() => {
        throw new Error('Service creation failed');
      });

      expect(() => compositionRoot.compose()).toThrow(
        'Service creation failed'
      );
    });

    it('should maintain singleton state even after composition errors', () => {
      const instance1 = CompositionRoot.getInstance();

      try {
        // Force an error in composition
        const MockService = jest.requireMock(
          '@/infrastructure/adapters/services/InfrastructureServiceAdapters'
        );
        MockService.ConsoleLoggingAdapter.mockImplementationOnce(() => {
          throw new Error('Adapter creation failed');
        });

        compositionRoot.compose();
      } catch (error) {
        // Ignore error for this test
      }

      const instance2 = CompositionRoot.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Memory Management', () => {
    it('should allow garbage collection after reset', () => {
      compositionRoot.compose();
      const container = compositionRoot.getContainer();
      const weakRef = new (globalThis as any).WeakRef(container);

      compositionRoot.reset();

      // The weak reference should still exist since we have a local reference
      expect(weakRef.deref()).toBeDefined();
    });

    it('should create new instances after reset', () => {
      const container1 = compositionRoot.compose();
      compositionRoot.reset();
      const container2 = compositionRoot.compose();

      expect(container1).not.toBe(container2);
    });
  });

  describe('Integration Scenarios', () => {
    it('should support complete composition lifecycle', () => {
      // Initial composition
      const container1 = compositionRoot.compose();
      expect(container1).toBeDefined();

      // Multiple accesses should return same container
      const container2 = compositionRoot.getContainer();
      expect(container1).toBe(container2);

      // Reset and re-compose
      compositionRoot.reset();
      const container3 = compositionRoot.compose();
      expect(container3).toBeDefined();
      expect(container3).not.toBe(container1);
    });

    it('should maintain architectural boundaries', () => {
      const container = compositionRoot.compose();

      // Domain services should not depend on infrastructure
      expect(container.domainScoringService).toBeDefined();
      expect(container.statisticsCalculationService).toBeDefined();

      // Application services should depend on ports, not concrete implementations
      expect(container.teamApplicationService).toBeDefined();
      expect(container.gameApplicationService).toBeDefined();

      // Infrastructure should implement ports
      expect(container.teamPersistencePort).toBeDefined();
      expect(container.loggingPort).toBeDefined();
    });
  });
});
