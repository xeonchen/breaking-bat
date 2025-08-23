/**
 * Data Specifications - Main Export
 *
 * Central exports for all data specifications and validation utilities.
 */

// Domain specifications
export * from './BaserunnerState.schema';
export * from './PlayerStatistics.schema';

// Validation system
export * from './validators/BoundaryValidator';

// Registry
export * from './SpecificationRegistry';

// Re-export common types
export type { ZodSchema } from 'zod';

/**
 * Quick start guide:
 *
 * import {
 *   validateBaserunnerState,
 *   BoundaryValidator,
 *   SpecificationRegistry
 * } from '@/specifications';
 *
 * // Initialize specifications (done automatically in non-test environments)
 * SpecificationRegistry.initialize();
 *
 * // Validate data
 * const validState = validateBaserunnerState(incomingData);
 *
 * // Validate at boundaries
 * const validatedData = BoundaryValidator.validate('baserunner-state', data);
 */
