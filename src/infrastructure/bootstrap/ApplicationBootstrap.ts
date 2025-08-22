/**
 * Application Bootstrap - Infrastructure Layer
 *
 * Responsible for bootstrapping the entire application following Clean Architecture.
 * This is the composition root that:
 * 1. Creates all dependencies in the infrastructure layer
 * 2. Wires up the hexagonal architecture (ports → adapters)
 * 3. Creates the application facade
 * 4. Initializes presentation layer stores
 *
 * This ensures proper dependency direction: Infrastructure → Application → Domain
 */

import { CompositionRoot } from '../di/CompositionRoot';
import {
  ApplicationFacade,
  setApplicationFacade,
} from '@/application/facade/ApplicationFacade';

// Store initialization imports (presentation layer)
import { initializeTeamsStore } from '@/presentation/stores/teamsStore';
import { initializeGamesStore } from '@/presentation/stores/gamesStore';
import { initializeGameStore } from '@/presentation/stores/gameStore';

/**
 * Application Bootstrap Service
 * This is the ONLY place where infrastructure creates and wires everything
 */
export class ApplicationBootstrap {
  private static isInitialized = false;
  private static compositionRoot: CompositionRoot | null = null;

  /**
   * Bootstrap the entire application
   * This method sets up Clean Architecture properly:
   * Infrastructure → Application → Domain (proper dependency direction)
   */
  public static async bootstrap(): Promise<void> {
    if (ApplicationBootstrap.isInitialized) {
      console.log('⚠️ Application already bootstrapped');
      return;
    }

    try {
      console.log('🚀 Starting Clean Architecture bootstrap...');

      // Step 1: Create and compose the dependency injection container
      ApplicationBootstrap.compositionRoot = CompositionRoot.getInstance();
      const container = ApplicationBootstrap.compositionRoot.compose();

      console.log('✅ Dependency injection container created');

      // Step 2: Create the application facade (Clean Architecture boundary)
      const applicationFacade = new ApplicationFacade(
        container.teamApplicationService,
        container.gameApplicationService,
        container.statisticsApplicationService,
        container.dataApplicationService
      );

      // Step 3: Set the facade globally (presentation layer will access this)
      setApplicationFacade(applicationFacade);
      await applicationFacade.initialize();

      console.log('✅ Application facade initialized');

      // Step 4: Initialize presentation layer stores with proper dependencies
      // Note: Stores now get dependencies through the facade, not direct injection
      await ApplicationBootstrap.initializePresentationLayer(container);

      console.log('✅ Presentation layer initialized');

      ApplicationBootstrap.isInitialized = true;
      console.log('🎉 Clean Architecture bootstrap completed successfully!');
    } catch (error) {
      console.error('❌ Application bootstrap failed:', error);
      throw new Error(
        `Bootstrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Initialize presentation layer stores
   * This maintains backward compatibility while fixing architecture violations
   */
  private static async initializePresentationLayer(
    container: any
  ): Promise<void> {
    try {
      // Initialize stores with application services (not repositories)
      initializeTeamsStore({
        teamApplicationService: container.teamApplicationService,
      });

      initializeGamesStore({
        gameApplicationService: container.gameApplicationService,
        dataApplicationService: container.dataApplicationService,
        teamApplicationService: container.teamApplicationService,
      });

      initializeGameStore({
        gameApplicationService: container.gameApplicationService,
        teamApplicationService: container.teamApplicationService,
        scoringService: container.scoringService,
      });

      console.log(
        '✅ All presentation stores initialized with proper dependencies'
      );
    } catch (error) {
      throw new Error(
        `Failed to initialize presentation layer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Shutdown the application gracefully
   */
  public static async shutdown(): Promise<void> {
    if (!ApplicationBootstrap.isInitialized) {
      return;
    }

    try {
      console.log('🔽 Shutting down application...');

      // Reset composition root
      if (ApplicationBootstrap.compositionRoot) {
        ApplicationBootstrap.compositionRoot.reset();
        ApplicationBootstrap.compositionRoot = null;
      }

      ApplicationBootstrap.isInitialized = false;
      console.log('✅ Application shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Check if application is properly initialized
   */
  public static isReady(): boolean {
    return ApplicationBootstrap.isInitialized;
  }

  /**
   * Get composition root (for testing purposes only)
   */
  public static getCompositionRoot(): CompositionRoot | null {
    return ApplicationBootstrap.compositionRoot;
  }

  /**
   * Get application container (deprecated - use ApplicationFacade instead)
   * This method is provided for backward compatibility but violates Clean Architecture
   */
  public static getContainer(): any {
    if (
      !ApplicationBootstrap.compositionRoot ||
      !ApplicationBootstrap.isInitialized
    ) {
      throw new Error(
        'Application not bootstrapped. Call ApplicationBootstrap.bootstrap() first.'
      );
    }
    return ApplicationBootstrap.compositionRoot.getContainer();
  }
}
