/**
 * Infrastructure Layer Interfaces
 *
 * These interfaces define contracts for external dependencies and
 * infrastructure concerns like data persistence, external APIs,
 * and system integrations.
 */

/**
 * Database Connection Interface
 * Abstracts database connection and transaction management
 */
export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startTransaction(): Promise<ITransaction>;
  isConnected(): boolean;
  getHealth(): Promise<DatabaseHealth>;
}

/**
 * Transaction Interface
 * Handles database transactions
 */
export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Cache Service Interface
 * Abstracts caching mechanisms
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Logger Interface
 * Abstracts logging functionality
 */
export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Event Bus Interface
 * Abstracts event publishing and subscription
 */
export interface IEventBus {
  publish<T>(eventType: string, payload: T): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): string;
  unsubscribe(subscriptionId: string): void;
}

/**
 * Configuration Service Interface
 * Abstracts configuration management
 */
export interface IConfigurationService {
  get(key: string): string | undefined;
  getRequired(key: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
}

/**
 * File Storage Interface
 * Abstracts file storage operations
 */
export interface IFileStorage {
  save(path: string, data: Buffer | string): Promise<string>;
  load(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  list(directory: string): Promise<string[]>;
}

// Supporting types
export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
  timestamp: Date;
}

export type EventHandler<T> = (payload: T) => Promise<void> | void;

export interface InfrastructureConfig {
  database: {
    name: string;
    version: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
  cache: {
    defaultTTL: number;
    maxEntries: number;
  };
}
