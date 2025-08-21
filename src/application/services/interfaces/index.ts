/**
 * Application Service Interfaces - Complete CQRS Implementation
 *
 * This module exports all application service interfaces that define
 * the primary ports of our hexagonal architecture. These interfaces
 * implement the Command Query Responsibility Segregation (CQRS) pattern
 * with clear separation between commands (write) and queries (read).
 *
 * Each service interface represents a bounded context within the application:
 * - Team Management: Teams, players, roster management
 * - Game Management: Games, lineups, gameplay, at-bats
 * - Statistics: Analytics, leaderboards, comparisons, trends
 * - Data Management: Seasons, game types, import/export, administration
 */

// Primary Application Service Interfaces
export * from './ITeamApplicationService';
export * from './IGameApplicationService';
export * from './IDataApplicationService';
export * from './IScoringApplicationService';
// Note: IStatisticsApplicationService exported separately to avoid conflicts

// Re-export common types for convenience
export type { Result } from '@/application/common/Result';

// Application Service Registry Type
// This allows for type-safe access to all application services
export interface ApplicationServices {
  teamService: import('./ITeamApplicationService').ITeamApplicationService;
  gameService: import('./IGameApplicationService').IGameApplicationService;
  statisticsService: import('./IStatisticsApplicationService').IStatisticsApplicationService;
  dataService: import('./IDataApplicationService').IDataApplicationService;
}

// Command and Query Base Types
export interface BaseCommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
  readonly userId?: string;
  readonly correlationId?: string;
}

export interface BaseQuery {
  readonly queryId?: string;
  readonly timestamp?: Date;
  readonly userId?: string;
  readonly correlationId?: string;
}

// Common Response Patterns
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortedResponse<T> {
  items: T[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  totalCount: number;
}

// Service Operation Result Types
export interface ServiceOperationContext {
  userId?: string;
  correlationId: string;
  timestamp: Date;
  operation: string;
  entityId?: string;
  entityType?: string;
}

export interface ServiceValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ServiceBusinessError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

// Command Handler Registration Types
export interface CommandHandler<TCommand, TResult = void> {
  handle(
    command: TCommand,
    context: ServiceOperationContext
  ): Promise<import('@/application/common/Result').Result<TResult>>;
}

export interface QueryHandler<TQuery, TResult> {
  handle(
    query: TQuery,
    context: ServiceOperationContext
  ): Promise<import('@/application/common/Result').Result<TResult>>;
}

// Service Decorator Types for Cross-Cutting Concerns
export interface ServiceDecorator<T> {
  decorate(service: T): T;
}

export interface LoggingServiceDecorator<T> extends ServiceDecorator<T> {
  logCommands: boolean;
  logQueries: boolean;
  logResults: boolean;
  logErrors: boolean;
}

export interface CachingServiceDecorator<T> extends ServiceDecorator<T> {
  cacheDuration: number;
  cacheKeyPrefix: string;
  invalidationTags: string[];
}

export interface ValidatingServiceDecorator<T> extends ServiceDecorator<T> {
  validateCommands: boolean;
  validateQueries: boolean;
  strictMode: boolean;
}

export interface MetricsServiceDecorator<T> extends ServiceDecorator<T> {
  trackPerformance: boolean;
  trackUsage: boolean;
  trackErrors: boolean;
}

// Application Service Factory
export interface ApplicationServiceFactory {
  createTeamService(): import('./ITeamApplicationService').ITeamApplicationService;
  createGameService(): import('./IGameApplicationService').IGameApplicationService;
  createStatisticsService(): import('./IStatisticsApplicationService').IStatisticsApplicationService;
  createDataService(): import('./IDataApplicationService').IDataApplicationService;
}

// Service Configuration
export interface ApplicationServiceConfiguration {
  enableLogging: boolean;
  enableCaching: boolean;
  enableMetrics: boolean;
  enableValidation: boolean;
  defaultTimeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
}
