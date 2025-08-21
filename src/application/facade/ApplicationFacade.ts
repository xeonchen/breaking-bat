/**
 * Application Facade - Clean Architecture Entry Point
 *
 * This facade provides the ONLY entry point for the presentation layer
 * into the application core. It ensures proper dependency direction
 * and prevents presentation layer from importing infrastructure or domain directly.
 *
 * Following the Facade pattern, this simplifies the interface between
 * presentation and application layers while maintaining Clean Architecture boundaries.
 */

import {
  ITeamApplicationService,
  IGameApplicationService,
  IDataApplicationService,
} from '../services/interfaces';
import { IStatisticsApplicationService } from '../services/interfaces/IStatisticsApplicationService';

/**
 * Application Facade Interface
 * This is the contract that presentation layer depends on
 */
export interface IApplicationFacade {
  readonly teamService: ITeamApplicationService;
  readonly gameService: IGameApplicationService;
  readonly statisticsService: IStatisticsApplicationService;
  readonly dataService: IDataApplicationService;

  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Application Facade Implementation
 * Hides all infrastructure complexity from presentation layer
 */
export class ApplicationFacade implements IApplicationFacade {
  constructor(
    public readonly teamService: ITeamApplicationService,
    public readonly gameService: IGameApplicationService,
    public readonly statisticsService: IStatisticsApplicationService,
    public readonly dataService: IDataApplicationService
  ) {}

  public async initialize(): Promise<void> {
    // Any application-level initialization logic
    console.log('🚀 Application facade initialized');
  }

  public async shutdown(): Promise<void> {
    // Any cleanup logic
    console.log('🔽 Application facade shutdown');
  }
}

/**
 * Global Application Facade Instance
 * This will be injected by the infrastructure layer during bootstrap
 */
let applicationFacadeInstance: IApplicationFacade | null = null;

/**
 * Set the application facade instance (called by infrastructure during bootstrap)
 * This is the ONLY way presentation layer gets access to application services
 */
export function setApplicationFacade(facade: IApplicationFacade): void {
  applicationFacadeInstance = facade;
}

/**
 * Get the application facade instance
 * This is what presentation layer calls to access application services
 */
export function getApplicationFacade(): IApplicationFacade {
  if (!applicationFacadeInstance) {
    throw new Error(
      'Application facade not initialized. Ensure bootstrap process calls setApplicationFacade() first.'
    );
  }
  return applicationFacadeInstance;
}

/**
 * Reset the application facade (useful for testing)
 */
export function resetApplicationFacade(): void {
  applicationFacadeInstance = null;
}
