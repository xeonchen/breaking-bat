import { ZodSchema, ZodError } from 'zod';

/**
 * Boundary Validation System
 *
 * Provides utilities for validating data at interface boundaries.
 * Ensures data integrity when crossing architectural layers.
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly boundary: string,
    public readonly errors: string[],
    public readonly originalData: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface BoundaryConfig {
  boundary: string;
  schema: ZodSchema;
  logErrors?: boolean;
  throwOnError?: boolean;
}

export class BoundaryValidator {
  private static config: Map<string, BoundaryConfig> = new Map();

  /**
   * Register a validation schema for a specific boundary
   */
  static registerBoundary<T>(
    boundaryName: string,
    schema: ZodSchema<T>,
    options: { logErrors?: boolean; throwOnError?: boolean } = {}
  ): void {
    this.config.set(boundaryName, {
      boundary: boundaryName,
      schema,
      logErrors: options.logErrors ?? true,
      throwOnError: options.throwOnError ?? true,
    });
  }

  /**
   * Validate data at a registered boundary
   */
  static validate<T>(boundaryName: string, data: unknown): T {
    const config = this.config.get(boundaryName);
    if (!config) {
      throw new Error(
        `No validation schema registered for boundary: ${boundaryName}`
      );
    }

    try {
      return config.schema.parse(data) as T;
    } catch (error) {
      const errors =
        error instanceof ZodError
          ? error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
          : [
              error instanceof Error
                ? error.message
                : 'Unknown validation error',
            ];

      const validationError = new ValidationError(
        `Validation failed at boundary '${boundaryName}': ${errors.join(', ')}`,
        boundaryName,
        errors,
        data
      );

      if (config.logErrors) {
        console.error('🚨 Boundary validation failed:', {
          boundary: boundaryName,
          errors,
          data: JSON.stringify(data, null, 2),
        });
      }

      if (config.throwOnError) {
        throw validationError;
      }

      return data as T; // Return unvalidated data if throwOnError is false
    }
  }

  /**
   * Safely validate data without throwing
   */
  static safeValidate<T>(
    boundaryName: string,
    data: unknown
  ): { success: true; data: T } | { success: false; error: ValidationError } {
    try {
      const validatedData = this.validate<T>(boundaryName, data);
      return { success: true, data: validatedData };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof ValidationError
            ? error
            : new ValidationError(
                'Unknown validation error',
                boundaryName,
                ['Unknown error occurred'],
                data
              ),
      };
    }
  }

  /**
   * Get list of registered boundaries
   */
  static getBoundaries(): string[] {
    return Array.from(this.config.keys());
  }

  /**
   * Clear all registered boundaries (useful for testing)
   */
  static clear(): void {
    this.config.clear();
  }
}

/**
 * Decorator for automatic boundary validation
 */
export function ValidateAt<T>(boundaryName: string) {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Validate arguments if schema is registered
      const validatedArgs = args.map((arg, index) => {
        const argBoundary = `${boundaryName}.arg${index}`;
        if (BoundaryValidator.getBoundaries().includes(argBoundary)) {
          return BoundaryValidator.validate<T>(argBoundary, arg);
        }
        return arg;
      });

      const result = method.apply(this, validatedArgs);

      // Validate return value if schema is registered
      if (BoundaryValidator.getBoundaries().includes(boundaryName)) {
        return BoundaryValidator.validate<T>(boundaryName, result);
      }

      return result;
    };
  };
}

/**
 * Common boundary registration utility
 */
export const CommonBoundaries = {
  DOMAIN_TO_APPLICATION: 'domain→application',
  APPLICATION_TO_PRESENTATION: 'application→presentation',
  PRESENTATION_TO_COMPONENT: 'presentation→component',
  EXTERNAL_API: 'external→api',
} as const;

/**
 * Usage Examples:
 *
 * // Register boundaries
 * BoundaryValidator.registerBoundary(
 *   CommonBoundaries.DOMAIN_TO_APPLICATION,
 *   BaserunnerStateSchema
 * );
 *
 * // Validate at boundary
 * const validatedState = BoundaryValidator.validate<BaserunnerState>(
 *   CommonBoundaries.DOMAIN_TO_APPLICATION,
 *   incomingData
 * );
 *
 * // Using decorator
 * class MyService {
 *   @ValidateAt<BaserunnerState>(CommonBoundaries.DOMAIN_TO_APPLICATION)
 *   processBaserunners(state: BaserunnerState) {
 *     // state is automatically validated
 *   }
 * }
 */
