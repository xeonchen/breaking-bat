/**
 * Secondary Ports - Infrastructure Service Contracts
 *
 * These ports define what the application core needs from infrastructure
 * services like logging, caching, event publishing, etc.
 */

/**
 * Logging Port
 * Abstracts logging functionality from the application core
 */
export interface ILoggingPort {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void;
  fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void;
}

/**
 * Cache Port
 * Abstracts caching functionality
 */
export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Event Publishing Port
 * For domain events and integration events
 */
export interface IEventPublishingPort {
  publishDomainEvent<T>(eventType: string, payload: T): Promise<void>;
  publishIntegrationEvent<T>(eventType: string, payload: T): Promise<void>;
  publishBatch<T>(events: Array<{ type: string; payload: T }>): Promise<void>;
}

/**
 * Time Provider Port
 * Abstracts time operations for testability
 */
export interface ITimeProvider {
  now(): Date;
  utcNow(): Date;
  today(): Date;
  addDays(date: Date, days: number): Date;
  addHours(date: Date, hours: number): Date;
  format(date: Date, format: string): string;
  isBusinessDay(date: Date): boolean;
}

/**
 * ID Generation Port
 * Abstracts ID generation strategies
 */
export interface IIdGenerator {
  generateId(): string;
  generateShortId(length?: number): string;
  generateSequentialId(prefix?: string): string;
  isValidId(id: string): boolean;
}

/**
 * Configuration Port
 * Abstracts configuration management
 */
export interface IConfigurationPort {
  getString(key: string, defaultValue?: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getObject<T>(key: string, defaultValue?: T): T;
  exists(key: string): boolean;
  getConnectionString(name: string): string;
}

/**
 * File Storage Port
 * Abstracts file operations
 */
export interface IFileStoragePort {
  save(
    path: string,
    content: Buffer | string,
    metadata?: FileMetadata
  ): Promise<string>;
  load(path: string): Promise<Buffer>;
  loadAsText(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  list(directory: string, filter?: FileFilter): Promise<FileInfo[]>;
  getMetadata(path: string): Promise<FileMetadata>;
}

/**
 * Notification Port
 * For sending notifications (email, SMS, push, etc.)
 */
export interface INotificationPort {
  sendEmail(
    to: string[],
    subject: string,
    body: string,
    options?: EmailOptions
  ): Promise<void>;
  sendSMS(to: string, message: string, options?: SMSOptions): Promise<void>;
  sendPushNotification(
    to: string[],
    title: string,
    body: string,
    options?: PushOptions
  ): Promise<void>;
}

/**
 * External API Port
 * For integrating with external services
 */
export interface IExternalApiPort {
  get<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;
  post<T, U>(
    url: string,
    body: T,
    headers?: Record<string, string>
  ): Promise<ApiResponse<U>>;
  put<T, U>(
    url: string,
    body: T,
    headers?: Record<string, string>
  ): Promise<ApiResponse<U>>;
  delete<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;
}

/**
 * Security Port
 * For authentication, authorization, and security operations
 */
export interface ISecurityPort {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
  verifyToken(token: string): Promise<Record<string, unknown>>;
  encrypt(data: string): string;
  decrypt(encryptedData: string): string;
}

/**
 * Background Job Port
 * For scheduling and processing background tasks
 */
export interface IBackgroundJobPort {
  schedule<T>(
    jobName: string,
    payload: T,
    options?: JobOptions
  ): Promise<string>;
  scheduleRecurring<T>(
    jobName: string,
    cronExpression: string,
    payload: T
  ): Promise<string>;
  cancel(jobId: string): Promise<void>;
  getJobStatus(jobId: string): Promise<JobStatus>;
}

// Supporting Types
export interface FileMetadata {
  contentType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: Record<string, string>;
}

export interface FileFilter {
  extension?: string;
  pattern?: string;
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isDirectory: boolean;
  metadata?: FileMetadata;
}

export interface EmailOptions {
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SMSOptions {
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
}

export interface PushOptions {
  icon?: string;
  badge?: string;
  sound?: string;
  data?: Record<string, unknown>;
  actions?: PushAction[];
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  success: boolean;
}

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: 'fixed' | 'exponential';
  retryDelay?: number;
}

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  data?: unknown;
  result?: unknown;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}
