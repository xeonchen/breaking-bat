export * from './entities';
export * from './values';
export * from './services';
export * from './interfaces';
export * from './repositories';
// Note: specifications exports are available separately to avoid conflicts

// Re-export domain service interfaces for backward compatibility
export type {
  IAtBatProcessingService,
  IGameSessionService,
  IScoreCalculationService,
  IScoringService,
  IStatisticsCalculationService,
  IRuleMatrixService,
} from './interfaces';

// Repository interfaces moved to Application layer
// Import them from '@/application' instead
