import { z } from 'zod';

/**
 * Baserunner State Data Specification
 *
 * Defines the canonical structure for baserunner state across all layers.
 * This prevents the string vs object inconsistencies we've been seeing.
 */

// Base schema for a single baserunner
export const BaserunnerSchema = z
  .object({
    playerId: z.string().min(1, 'Player ID is required'),
    playerName: z.string().min(1, 'Player name is required'),
  })
  .strict();

export type Baserunner = z.infer<typeof BaserunnerSchema>;

// Complete baserunner state schema
export const BaserunnerStateSchema = z
  .object({
    first: BaserunnerSchema.nullable(),
    second: BaserunnerSchema.nullable(),
    third: BaserunnerSchema.nullable(),
  })
  .strict();

export type BaserunnerState = z.infer<typeof BaserunnerStateSchema>;

// Validation functions
export const validateBaserunner = (data: unknown): Baserunner => {
  return BaserunnerSchema.parse(data);
};

export const validateBaserunnerState = (data: unknown): BaserunnerState => {
  return BaserunnerStateSchema.parse(data);
};

// Type guards
export const isValidBaserunner = (data: unknown): data is Baserunner => {
  return BaserunnerSchema.safeParse(data).success;
};

export const isValidBaserunnerState = (
  data: unknown
): data is BaserunnerState => {
  return BaserunnerStateSchema.safeParse(data).success;
};

// Helper functions for common operations
export const createEmptyBaserunnerState = (): BaserunnerState => ({
  first: null,
  second: null,
  third: null,
});

export const createBaserunner = (
  playerId: string,
  playerName: string
): Baserunner => {
  return validateBaserunner({ playerId, playerName });
};

// Migration helpers for converting legacy data
export const convertLegacyBaserunnerState = (legacy: any): BaserunnerState => {
  const converted = {
    first:
      typeof legacy.first === 'string'
        ? { playerId: legacy.first, playerName: `Player ${legacy.first}` }
        : legacy.first,
    second:
      typeof legacy.second === 'string'
        ? { playerId: legacy.second, playerName: `Player ${legacy.second}` }
        : legacy.second,
    third:
      typeof legacy.third === 'string'
        ? { playerId: legacy.third, playerName: `Player ${legacy.third}` }
        : legacy.third,
  };

  return validateBaserunnerState(converted);
};

/**
 * Usage Examples:
 *
 * // Creating a valid baserunner state
 * const state = createEmptyBaserunnerState();
 * state.first = createBaserunner("player-123", "John Doe");
 *
 * // Validating incoming data
 * const validatedState = validateBaserunnerState(incomingData);
 *
 * // Type-safe checking
 * if (isValidBaserunnerState(someData)) {
 *   // someData is now typed as BaserunnerState
 * }
 */
