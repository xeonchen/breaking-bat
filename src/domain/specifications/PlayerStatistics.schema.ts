import { z } from 'zod';

/**
 * Player Statistics Data Specification
 *
 * Defines the canonical structure for player statistics across all layers.
 * Prevents missing properties and ensures consistent calculation rules.
 */

export const PlayerStatisticsSchema = z
  .object({
    // Required fields
    games: z.number().int().min(0, 'Games must be non-negative'),
    atBats: z.number().int().min(0, 'At bats must be non-negative'),
    hits: z.number().int().min(0, 'Hits must be non-negative'),
    runs: z.number().int().min(0, 'Runs must be non-negative'),
    rbis: z.number().int().min(0, 'RBIs must be non-negative'),

    // Hit type breakdown
    singles: z.number().int().min(0, 'Singles must be non-negative'),
    doubles: z.number().int().min(0, 'Doubles must be non-negative'),
    triples: z.number().int().min(0, 'Triples must be non-negative'),
    homeRuns: z.number().int().min(0, 'Home runs must be non-negative'),

    // Other statistics
    walks: z.number().int().min(0, 'Walks must be non-negative'),
    strikeouts: z.number().int().min(0, 'Strikeouts must be non-negative'),

    // Calculated percentages
    battingAverage: z
      .number()
      .min(0)
      .max(1, 'Batting average must be between 0 and 1'),
    onBasePercentage: z.number().min(0).max(1, 'OBP must be between 0 and 1'),
    sluggingPercentage: z
      .number()
      .min(0)
      .max(4, 'Slugging percentage cannot exceed 4.000'),
  })
  .strict()
  .refine((data) => data.hits <= data.atBats, {
    message: 'Hits cannot exceed at-bats',
    path: ['hits'],
  })
  .refine(
    (data) => {
      const totalHits =
        data.singles + data.doubles + data.triples + data.homeRuns;
      return totalHits === data.hits;
    },
    {
      message: 'Sum of hit types must equal total hits',
      path: ['hits'],
    }
  )
  .refine(
    (data) => {
      if (data.atBats === 0) return data.battingAverage === 0;
      const calculatedBA = data.hits / data.atBats;
      return Math.abs(calculatedBA - data.battingAverage) < 0.001; // Allow small rounding differences
    },
    {
      message: 'Batting average must match hits/at-bats ratio',
      path: ['battingAverage'],
    }
  );

export type PlayerStatistics = z.infer<typeof PlayerStatisticsSchema>;

// Validation functions
export const validatePlayerStatistics = (data: unknown): PlayerStatistics => {
  return PlayerStatisticsSchema.parse(data);
};

export const isValidPlayerStatistics = (
  data: unknown
): data is PlayerStatistics => {
  return PlayerStatisticsSchema.safeParse(data).success;
};

// Helper function to create empty statistics
export const createEmptyPlayerStatistics = (): PlayerStatistics => ({
  games: 0,
  atBats: 0,
  hits: 0,
  runs: 0,
  rbis: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 0,
  strikeouts: 0,
  battingAverage: 0,
  onBasePercentage: 0,
  sluggingPercentage: 0,
});

// Helper function to calculate derived statistics
export const calculateDerivedStatistics = (
  stats: Omit<
    PlayerStatistics,
    'battingAverage' | 'onBasePercentage' | 'sluggingPercentage'
  >
): PlayerStatistics => {
  const battingAverage = stats.atBats > 0 ? stats.hits / stats.atBats : 0;
  const onBasePercentage =
    stats.atBats + stats.walks > 0
      ? (stats.hits + stats.walks) / (stats.atBats + stats.walks)
      : 0;
  const totalBases =
    stats.singles + stats.doubles * 2 + stats.triples * 3 + stats.homeRuns * 4;
  const sluggingPercentage = stats.atBats > 0 ? totalBases / stats.atBats : 0;

  const fullStats = {
    ...stats,
    battingAverage: Math.round(battingAverage * 1000) / 1000, // Round to 3 decimal places
    onBasePercentage: Math.round(onBasePercentage * 1000) / 1000,
    sluggingPercentage: Math.round(sluggingPercentage * 1000) / 1000,
  };

  return validatePlayerStatistics(fullStats);
};

/**
 * Usage Examples:
 *
 * // Creating empty statistics
 * const stats = createEmptyPlayerStatistics();
 *
 * // Calculating derived statistics automatically
 * const calculatedStats = calculateDerivedStatistics({
 *   games: 10,
 *   atBats: 40,
 *   hits: 12,
 *   runs: 8,
 *   rbis: 6,
 *   singles: 8,
 *   doubles: 3,
 *   triples: 1,
 *   homeRuns: 0,
 *   walks: 5,
 *   strikeouts: 8
 * });
 *
 * // Validating incoming statistics
 * try {
 *   const validStats = validatePlayerStatistics(incomingData);
 * } catch (error) {
 *   console.error('Invalid statistics:', error.message);
 * }
 */
