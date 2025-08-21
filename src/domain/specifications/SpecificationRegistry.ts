/**
 * Specification Registry
 *
 * Central registry for all data specifications and boundary validations.
 * Initializes validation schemas for the application.
 */

import {
  BoundaryValidator,
  CommonBoundaries,
} from './validators/BoundaryValidator';
import {
  BaserunnerStateSchema,
  BaserunnerSchema,
} from './domain/BaserunnerState.schema';
import { PlayerStatisticsSchema } from './domain/PlayerStatistics.schema';

export class SpecificationRegistry {
  private static initialized = false;

  /**
   * Initialize all boundary validations
   */
  static initialize(): void {
    if (this.initialized) {
      console.warn('⚠️ SpecificationRegistry already initialized');
      return;
    }

    console.log('📋 Initializing data specifications...');

    // Domain specifications
    BoundaryValidator.registerBoundary(
      'baserunner-state',
      BaserunnerStateSchema,
      { logErrors: true, throwOnError: true }
    );

    BoundaryValidator.registerBoundary('baserunner', BaserunnerSchema, {
      logErrors: true,
      throwOnError: true,
    });

    BoundaryValidator.registerBoundary(
      'player-statistics',
      PlayerStatisticsSchema,
      { logErrors: true, throwOnError: true }
    );

    // Boundary-specific validations
    BoundaryValidator.registerBoundary(
      CommonBoundaries.DOMAIN_TO_APPLICATION,
      BaserunnerStateSchema
    );

    BoundaryValidator.registerBoundary(
      CommonBoundaries.APPLICATION_TO_PRESENTATION,
      BaserunnerStateSchema
    );

    this.initialized = true;

    const registeredBoundaries = BoundaryValidator.getBoundaries();
    console.log(
      `✅ Initialized ${registeredBoundaries.length} boundary validations:`,
      registeredBoundaries
    );
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    BoundaryValidator.clear();
    this.initialized = false;
    console.log('🔄 Specification registry reset');
  }

  /**
   * Check if registry is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all registered specifications
   */
  static getRegisteredSpecs(): string[] {
    return BoundaryValidator.getBoundaries();
  }
}

// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  SpecificationRegistry.initialize();
}

/**
 * Usage:
 *
 * // In application startup
 * SpecificationRegistry.initialize();
 *
 * // In tests
 * beforeEach(() => {
 *   SpecificationRegistry.reset();
 *   SpecificationRegistry.initialize();
 * });
 */
