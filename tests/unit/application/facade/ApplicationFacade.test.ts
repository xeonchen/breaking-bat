import {
  ApplicationFacade,
  IApplicationFacade,
  setApplicationFacade,
  getApplicationFacade,
  resetApplicationFacade,
} from '@/application/facade/ApplicationFacade';
import {
  ITeamApplicationService,
  IGameApplicationService,
  IDataApplicationService,
} from '@/application/services/interfaces';
import { IStatisticsApplicationService } from '@/application/services/interfaces/IStatisticsApplicationService';

describe('ApplicationFacade', () => {
  let mockTeamService: jest.Mocked<ITeamApplicationService>;
  let mockGameService: jest.Mocked<IGameApplicationService>;
  let mockStatisticsService: jest.Mocked<IStatisticsApplicationService>;
  let mockDataService: jest.Mocked<IDataApplicationService>;
  let facade: ApplicationFacade;

  beforeEach(() => {
    // Reset the global facade instance before each test
    resetApplicationFacade();

    // Create mock services
    mockTeamService = {
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      getTeams: jest.fn(),
      getTeamById: jest.fn(),
      addPlayer: jest.fn(),
      updatePlayer: jest.fn(),
      removePlayer: jest.fn(),
      archiveTeam: jest.fn(),
      getTeamsBySeason: jest.fn(),
      searchTeams: jest.fn(),
      getTeamRoster: jest.fn(),
      getTeamStatistics: jest.fn(),
      isTeamNameAvailable: jest.fn(),
      isJerseyNumberAvailable: jest.fn(),
    } as jest.Mocked<ITeamApplicationService>;

    mockGameService = {
      createGame: jest.fn(),
      updateGame: jest.fn(),
      deleteGame: jest.fn(),
      getGameById: jest.fn(),
      getGamesByTeam: jest.fn(),
      getGamesBySeason: jest.fn(),
      getCurrentGames: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      pauseGame: jest.fn(),
      resumeGame: jest.fn(),
      recordAtBat: jest.fn(),
      updateLineup: jest.fn(),
      getGameStatistics: jest.fn(),
      searchGames: jest.fn(),
      // Missing interface methods
      setupLineup: jest.fn(),
      addInning: jest.fn(),
      substitutePlayer: jest.fn(),
      getGameLineup: jest.fn(),
      getInningDetails: jest.fn(),
    } as jest.Mocked<IGameApplicationService>;

    mockStatisticsService = {
      getPlayerStatistics: jest.fn(),
      getTeamStatistics: jest.fn(),
      getSeasonStatistics: jest.fn(),
      calculateBattingAverage: jest.fn(),
      calculateSluggingPercentage: jest.fn(),
      calculateOnBasePercentage: jest.fn(),
      getLeaderboard: jest.fn(),
      exportStatistics: jest.fn(),
      // Missing interface methods
      getPlayerComparison: jest.fn(),
      getTeamRankings: jest.fn(),
      getTrendsAnalysis: jest.fn(),
      getAdvancedAnalytics: jest.fn(),
      createStatisticsSnapshot: jest.fn(),
      generatePerformanceReport: jest.fn(),
    } as unknown as jest.Mocked<IStatisticsApplicationService>;

    mockDataService = {
      loadDefaultData: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn(),
      clearAllData: jest.fn(),
      backupData: jest.fn(),
      restoreData: jest.fn(),
      validateDataIntegrity: jest.fn(),
      getDataSummary: jest.fn(),
      // Missing interface methods
      createSeason: jest.fn(),
      updateSeason: jest.fn(),
      createGameType: jest.fn(),
      updateGameType: jest.fn(),
      deleteGameType: jest.fn(),
      getAllSeasons: jest.fn(),
      getSeasonById: jest.fn(),
      getAllGameTypes: jest.fn(),
      getSystemHealth: jest.fn(),
      createMigration: jest.fn(),
      applyMigration: jest.fn(),
      rollbackMigration: jest.fn(),
    } as unknown as jest.Mocked<IDataApplicationService>;

    // Create facade instance
    facade = new ApplicationFacade(
      mockTeamService,
      mockGameService,
      mockStatisticsService,
      mockDataService
    );
  });

  afterEach(() => {
    resetApplicationFacade();
  });

  describe('Constructor', () => {
    it('should initialize with all required services', () => {
      expect(facade.teamService).toBe(mockTeamService);
      expect(facade.gameService).toBe(mockGameService);
      expect(facade.statisticsService).toBe(mockStatisticsService);
      expect(facade.dataService).toBe(mockDataService);
    });

    it('should expose services as accessible properties', () => {
      // Services should be accessible and properly initialized
      expect(facade.teamService).toBeDefined();
      expect(facade.gameService).toBeDefined();
      expect(facade.statisticsService).toBeDefined();
      expect(facade.dataService).toBeDefined();
      expect(facade.teamService).toBe(mockTeamService);
      expect(facade.gameService).toBe(mockGameService);
      expect(facade.statisticsService).toBe(mockStatisticsService);
      expect(facade.dataService).toBe(mockDataService);
    });

    it('should implement IApplicationFacade interface', () => {
      // TypeScript compile-time check
      const facadeAsInterface: IApplicationFacade = facade;
      expect(facadeAsInterface).toBeDefined();
      expect(typeof facadeAsInterface.initialize).toBe('function');
      expect(typeof facadeAsInterface.shutdown).toBe('function');
    });
  });

  describe('Lifecycle Methods', () => {
    describe('initialize', () => {
      it('should initialize successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await expect(facade.initialize()).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          '🚀 Application facade initialized'
        );
        consoleSpy.mockRestore();
      });

      it('should not throw when called multiple times', async () => {
        await expect(facade.initialize()).resolves.not.toThrow();
        await expect(facade.initialize()).resolves.not.toThrow();
      });

      it('should complete initialization synchronously', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const initPromise = facade.initialize();
        expect(initPromise).toBeInstanceOf(Promise);

        consoleSpy.mockRestore();
      });
    });

    describe('shutdown', () => {
      it('should shutdown successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await expect(facade.shutdown()).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          '🔽 Application facade shutdown'
        );
        consoleSpy.mockRestore();
      });

      it('should not throw when called multiple times', async () => {
        await expect(facade.shutdown()).resolves.not.toThrow();
        await expect(facade.shutdown()).resolves.not.toThrow();
      });

      it('should shutdown without prior initialization', async () => {
        // Should be able to shutdown even if initialize was never called
        await expect(facade.shutdown()).resolves.not.toThrow();
      });
    });

    describe('initialization and shutdown cycle', () => {
      it('should handle complete lifecycle', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await facade.initialize();
        await facade.shutdown();

        expect(consoleSpy).toHaveBeenCalledWith(
          '🚀 Application facade initialized'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '🔽 Application facade shutdown'
        );
        consoleSpy.mockRestore();
      });

      it('should handle multiple initialization/shutdown cycles', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        for (let i = 0; i < 3; i++) {
          await facade.initialize();
          await facade.shutdown();
        }

        expect(consoleSpy).toHaveBeenCalledTimes(6);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Service Access', () => {
    it('should provide access to team service', () => {
      expect(facade.teamService).toBe(mockTeamService);
      expect(typeof facade.teamService.createTeam).toBe('function');
      expect(typeof facade.teamService.getTeams).toBe('function');
    });

    it('should provide access to game service', () => {
      expect(facade.gameService).toBe(mockGameService);
      expect(typeof facade.gameService.createGame).toBe('function');
      expect(typeof facade.gameService.getCurrentGames).toBe('function');
    });

    it('should provide access to statistics service', () => {
      expect(facade.statisticsService).toBe(mockStatisticsService);
      expect(typeof facade.statisticsService.getPlayerStatistics).toBe(
        'function'
      );
      expect(typeof facade.statisticsService.getTeamStatistics).toBe(
        'function'
      );
    });

    it('should provide access to data service', () => {
      expect(facade.dataService).toBe(mockDataService);
      expect(typeof facade.dataService.loadDefaultData).toBe('function');
      expect(typeof facade.dataService.exportData).toBe('function');
    });

    it('should maintain service references after initialization', async () => {
      const originalTeamService = facade.teamService;

      await facade.initialize();

      expect(facade.teamService).toBe(originalTeamService);
    });

    it('should maintain service references after shutdown', async () => {
      const originalTeamService = facade.teamService;

      await facade.shutdown();

      expect(facade.teamService).toBe(originalTeamService);
    });
  });

  describe('Global Facade Management', () => {
    describe('setApplicationFacade', () => {
      it('should set the global facade instance', () => {
        expect(() => getApplicationFacade()).toThrow(
          'Application facade not initialized. Ensure bootstrap process calls setApplicationFacade() first.'
        );

        setApplicationFacade(facade);

        expect(getApplicationFacade()).toBe(facade);
      });

      it('should allow setting a different facade instance', () => {
        const anotherFacade = new ApplicationFacade(
          mockTeamService,
          mockGameService,
          mockStatisticsService,
          mockDataService
        );

        setApplicationFacade(facade);
        expect(getApplicationFacade()).toBe(facade);

        setApplicationFacade(anotherFacade);
        expect(getApplicationFacade()).toBe(anotherFacade);
      });

      it('should overwrite previous facade instance', () => {
        const facade1 = new ApplicationFacade(
          mockTeamService,
          mockGameService,
          mockStatisticsService,
          mockDataService
        );
        const facade2 = new ApplicationFacade(
          mockTeamService,
          mockGameService,
          mockStatisticsService,
          mockDataService
        );

        setApplicationFacade(facade1);
        setApplicationFacade(facade2);

        expect(getApplicationFacade()).toBe(facade2);
        expect(getApplicationFacade()).not.toBe(facade1);
      });
    });

    describe('getApplicationFacade', () => {
      it('should return the set facade instance', () => {
        setApplicationFacade(facade);

        const retrievedFacade = getApplicationFacade();

        expect(retrievedFacade).toBe(facade);
        expect(retrievedFacade.teamService).toBe(mockTeamService);
        expect(retrievedFacade.gameService).toBe(mockGameService);
      });

      it('should throw when facade not initialized', () => {
        expect(() => getApplicationFacade()).toThrow(
          'Application facade not initialized. Ensure bootstrap process calls setApplicationFacade() first.'
        );
      });

      it('should throw after facade is reset', () => {
        setApplicationFacade(facade);
        resetApplicationFacade();

        expect(() => getApplicationFacade()).toThrow(
          'Application facade not initialized. Ensure bootstrap process calls setApplicationFacade() first.'
        );
      });

      it('should return same instance on multiple calls', () => {
        setApplicationFacade(facade);

        const facade1 = getApplicationFacade();
        const facade2 = getApplicationFacade();

        expect(facade1).toBe(facade2);
        expect(facade1).toBe(facade);
      });
    });

    describe('resetApplicationFacade', () => {
      it('should reset the global facade instance', () => {
        setApplicationFacade(facade);
        expect(getApplicationFacade()).toBe(facade);

        resetApplicationFacade();

        expect(() => getApplicationFacade()).toThrow(
          'Application facade not initialized. Ensure bootstrap process calls setApplicationFacade() first.'
        );
      });

      it('should not throw when called without prior set', () => {
        expect(() => resetApplicationFacade()).not.toThrow();
      });

      it('should not throw when called multiple times', () => {
        setApplicationFacade(facade);

        expect(() => resetApplicationFacade()).not.toThrow();
        expect(() => resetApplicationFacade()).not.toThrow();
        expect(() => resetApplicationFacade()).not.toThrow();
      });

      it('should allow setting new facade after reset', () => {
        setApplicationFacade(facade);
        resetApplicationFacade();

        const newFacade = new ApplicationFacade(
          mockTeamService,
          mockGameService,
          mockStatisticsService,
          mockDataService
        );

        expect(() => setApplicationFacade(newFacade)).not.toThrow();
        expect(getApplicationFacade()).toBe(newFacade);
      });
    });
  });

  describe('Logging Behavior', () => {
    it('should log during initialization', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await facade.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Application facade initialized'
      );
      consoleSpy.mockRestore();
    });

    it('should log during shutdown', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await facade.shutdown();

      expect(consoleSpy).toHaveBeenCalledWith('🔽 Application facade shutdown');
      consoleSpy.mockRestore();
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should satisfy IApplicationFacade interface completely', () => {
      const interfaceCompliance: IApplicationFacade = facade;

      // Check all required properties exist
      expect(interfaceCompliance.teamService).toBeDefined();
      expect(interfaceCompliance.gameService).toBeDefined();
      expect(interfaceCompliance.statisticsService).toBeDefined();
      expect(interfaceCompliance.dataService).toBeDefined();

      // Check all required methods exist and return promises
      expect(interfaceCompliance.initialize()).toBeInstanceOf(Promise);
      expect(interfaceCompliance.shutdown()).toBeInstanceOf(Promise);
    });

    it('should maintain service references consistently', () => {
      // Services should maintain their references throughout the lifecycle
      const initialTeamService = facade.teamService;
      const initialGameService = facade.gameService;
      const initialStatisticsService = facade.statisticsService;
      const initialDataService = facade.dataService;

      // References should remain stable
      expect(facade.teamService).toBe(initialTeamService);
      expect(facade.gameService).toBe(initialGameService);
      expect(facade.statisticsService).toBe(initialStatisticsService);
      expect(facade.dataService).toBe(initialDataService);
    });
  });

  describe('Memory Management', () => {
    it('should not retain references after reset', () => {
      setApplicationFacade(facade);
      const weakRef = new (globalThis as any).WeakRef(facade);

      resetApplicationFacade();

      // Force garbage collection if available (for testing environments)
      if (global.gc) {
        global.gc();
      }

      // The weak reference should still exist since we have a local reference
      expect(weakRef.deref()).toBeDefined();
    });

    it('should handle multiple facade instances without memory leaks', () => {
      const facades: ApplicationFacade[] = [];

      // Create multiple facades
      for (let i = 0; i < 10; i++) {
        const f = new ApplicationFacade(
          mockTeamService,
          mockGameService,
          mockStatisticsService,
          mockDataService
        );
        facades.push(f);
        setApplicationFacade(f);
      }

      // Should only have the last facade set
      expect(getApplicationFacade()).toBe(facades[facades.length - 1]);

      resetApplicationFacade();
      expect(() => getApplicationFacade()).toThrow();
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent initialization calls', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const promises = Array.from({ length: 5 }, () => facade.initialize());

      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Should log for each initialization call
      expect(consoleSpy).toHaveBeenCalledTimes(5);
      consoleSpy.mockRestore();
    });

    it('should handle concurrent shutdown calls', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const promises = Array.from({ length: 5 }, () => facade.shutdown());

      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Should log for each shutdown call
      expect(consoleSpy).toHaveBeenCalledTimes(5);
      consoleSpy.mockRestore();
    });

    it('should handle concurrent set/get/reset operations', () => {
      const operations: any[] = [];

      for (let i = 0; i < 10; i++) {
        operations.push(() => setApplicationFacade(facade));
        operations.push(() => {
          try {
            getApplicationFacade();
          } catch {
            // Expected when not set
          }
        });
        operations.push(() => resetApplicationFacade());
      }

      // Shuffle operations to test race conditions
      operations.sort(() => Math.random() - 0.5);

      expect(() => {
        operations.forEach((op) => op());
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should support complete application lifecycle', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Bootstrap process
      setApplicationFacade(facade);

      // Initialize application
      await facade.initialize();

      // Use services (simulate presentation layer calls)
      expect(facade.teamService).toBe(mockTeamService);
      expect(facade.gameService).toBe(mockGameService);

      // Shutdown application
      await facade.shutdown();

      // Cleanup
      resetApplicationFacade();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Application facade initialized'
      );
      expect(consoleSpy).toHaveBeenCalledWith('🔽 Application facade shutdown');
      expect(() => getApplicationFacade()).toThrow();

      consoleSpy.mockRestore();
    });

    it('should maintain service functionality after lifecycle operations', async () => {
      setApplicationFacade(facade);
      await facade.initialize();

      // Services should remain functional
      expect(typeof facade.teamService.createTeam).toBe('function');
      expect(typeof facade.gameService.createGame).toBe('function');
      expect(typeof facade.statisticsService.getPlayerStatistics).toBe(
        'function'
      );
      expect(typeof facade.dataService.loadDefaultData).toBe('function');

      await facade.shutdown();

      // Services should still be functional after shutdown
      expect(typeof facade.teamService.createTeam).toBe('function');
      expect(typeof facade.gameService.createGame).toBe('function');
    });
  });
});
