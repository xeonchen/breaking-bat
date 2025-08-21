/**
 * Infrastructure Service Adapters
 *
 * These adapters implement the infrastructure ports using concrete
 * browser APIs and external libraries. They provide the "driven" side
 * implementations for the hexagonal architecture.
 */

import {
  ILoggingPort,
  ICachePort,
  IEventPublishingPort,
  ITimeProvider,
  IIdGenerator,
  IConfigurationPort,
  IFileStoragePort,
  FileMetadata,
  FileFilter,
  FileInfo,
} from '@/application/ports/secondary/IInfrastructurePorts';

/**
 * Browser Console Logging Adapter
 * Implements logging using browser console with structured output
 */
export class ConsoleLoggingAdapter implements ILoggingPort {
  private context: string;

  constructor(context: string = 'BreakingBat') {
    this.context = context;
  }

  debug(message: string, context?: Record<string, any>): void {
    console.debug(`[${this.context}] DEBUG: ${message}`, context || {});
  }

  info(message: string, context?: Record<string, any>): void {
    console.info(`[${this.context}] INFO: ${message}`, context || {});
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(`[${this.context}] WARN: ${message}`, context || {});
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    console.error(`[${this.context}] ERROR: ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    console.error(`[${this.context}] FATAL: ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
  }
}

/**
 * LocalStorage Cache Adapter
 * Implements caching using browser localStorage with TTL support
 */
export class LocalStorageCacheAdapter implements ICachePort {
  private keyPrefix: string;

  constructor(keyPrefix: string = 'bb_cache_') {
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.keyPrefix + key;
      const item = localStorage.getItem(fullKey);

      if (!item) {
        return null;
      }

      const cached = JSON.parse(item);

      // Check TTL
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.delete(key);
        return null;
      }

      return cached.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = this.keyPrefix + key;
      const cached = {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        createdAt: Date.now(),
      };

      localStorage.setItem(fullKey, JSON.stringify(cached));
    } catch (error) {
      // Handle localStorage quota exceeded
      console.warn('Cache set failed:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.keyPrefix + key;
    localStorage.removeItem(fullKey);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      // Clear all cache items
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.keyPrefix)
      );
      keys.forEach((key) => localStorage.removeItem(key));
      return;
    }

    // Clear items matching pattern
    const regex = new RegExp(pattern);
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(this.keyPrefix))
      .filter((k) => regex.test(k.substring(this.keyPrefix.length)));

    keys.forEach((key) => localStorage.removeItem(key));
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.keyPrefix + key;
    return localStorage.getItem(fullKey) !== null;
  }
}

/**
 * Browser Event Publishing Adapter
 * Implements event publishing using CustomEvents for in-browser communication
 */
export class BrowserEventPublishingAdapter implements IEventPublishingPort {
  async publishDomainEvent<T>(eventType: string, payload: T): Promise<void> {
    const event = new CustomEvent(`domain:${eventType}`, {
      detail: { payload, timestamp: Date.now() },
    });

    document.dispatchEvent(event);
  }

  async publishIntegrationEvent<T>(
    eventType: string,
    payload: T
  ): Promise<void> {
    const event = new CustomEvent(`integration:${eventType}`, {
      detail: { payload, timestamp: Date.now() },
    });

    document.dispatchEvent(event);
  }

  async publishBatch<T>(
    events: Array<{ type: string; payload: T }>
  ): Promise<void> {
    const batchEvent = new CustomEvent('batch:events', {
      detail: { events, timestamp: Date.now() },
    });

    document.dispatchEvent(batchEvent);

    // Also publish individual events
    for (const event of events) {
      await this.publishDomainEvent(event.type, event.payload);
    }
  }
}

/**
 * System Time Provider Adapter
 * Implements time operations using native Date API
 */
export class SystemTimeProviderAdapter implements ITimeProvider {
  now(): Date {
    return new Date();
  }

  utcNow(): Date {
    return new Date();
  }

  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  format(date: Date, format: string): string {
    // Simple format implementation - in production, use a proper date library
    switch (format) {
      case 'yyyy-MM-dd':
        return date.toISOString().split('T')[0];
      case 'MM/dd/yyyy':
        return date.toLocaleDateString('en-US');
      case 'ISO':
        return date.toISOString();
      default:
        return date.toString();
    }
  }

  isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  }
}

/**
 * UUID ID Generator Adapter
 * Implements ID generation using crypto.randomUUID when available
 */
export class UUIDGeneratorAdapter implements IIdGenerator {
  generateId(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  generateShortId(length: number = 8): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  generateSequentialId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`;
  }

  isValidId(id: string): boolean {
    // UUID v4 regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}

/**
 * Environment Configuration Adapter
 * Implements configuration using environment variables and localStorage
 */
export class EnvironmentConfigurationAdapter implements IConfigurationPort {
  private envVars: Record<string, string>;
  private localConfig: Record<string, any>;

  constructor() {
    // In browser, we use Vite's import.meta.env
    this.envVars = (import.meta as any)?.env || {};

    // Load configuration from localStorage
    try {
      const stored = localStorage.getItem('bb_config');
      this.localConfig = stored ? JSON.parse(stored) : {};
    } catch {
      this.localConfig = {};
    }
  }

  getString(key: string, defaultValue: string = ''): string {
    return this.envVars[key] || this.localConfig[key] || defaultValue;
  }

  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.getString(key);
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.getString(key).toLowerCase();
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return defaultValue;
  }

  getObject<T>(key: string, defaultValue?: T): T {
    try {
      const value = this.getString(key);
      if (value) {
        return JSON.parse(value);
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Configuration key '${key}' not found and no default value provided`
      );
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Configuration key '${key}' not found and no default value provided`
      );
    }
  }

  exists(key: string): boolean {
    return key in this.envVars || key in this.localConfig;
  }

  getConnectionString(name: string): string {
    return this.getString(`CONNECTION_STRING_${name.toUpperCase()}`);
  }
}

/**
 * Browser File Storage Adapter
 * Implements file operations using browser APIs (limited functionality)
 */
export class BrowserFileStorageAdapter implements IFileStoragePort {
  private storageKey = 'bb_files';

  async save(
    path: string,
    content: Buffer | string,
    metadata?: FileMetadata
  ): Promise<string> {
    try {
      const files = this.getFiles();
      const fileData = {
        path,
        content:
          content instanceof Buffer ? content.toString('base64') : content,
        isBuffer: content instanceof Buffer,
        metadata: {
          ...metadata,
          size: content.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      files[path] = fileData;
      localStorage.setItem(this.storageKey, JSON.stringify(files));
      return path;
    } catch (error) {
      throw new Error(`Failed to save file: ${error}`);
    }
  }

  async load(path: string): Promise<Buffer> {
    const files = this.getFiles();
    const file = files[path];

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    if (file.isBuffer) {
      return Buffer.from(file.content, 'base64');
    }

    return Buffer.from(file.content);
  }

  async loadAsText(path: string): Promise<string> {
    const files = this.getFiles();
    const file = files[path];

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    if (file.isBuffer) {
      return Buffer.from(file.content, 'base64').toString();
    }

    return file.content;
  }

  async exists(path: string): Promise<boolean> {
    const files = this.getFiles();
    return path in files;
  }

  async delete(path: string): Promise<void> {
    const files = this.getFiles();
    delete files[path];
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  async list(directory: string, filter?: FileFilter): Promise<FileInfo[]> {
    const files = this.getFiles();
    const prefix = directory.endsWith('/') ? directory : directory + '/';

    let fileList = Object.keys(files)
      .filter((path) => path.startsWith(prefix))
      .map((path) => {
        const file = files[path];
        return {
          path,
          name: path.split('/').pop() || '',
          size: file.metadata?.size || 0,
          createdAt: new Date(file.metadata?.createdAt || Date.now()),
          updatedAt: new Date(file.metadata?.updatedAt || Date.now()),
          isDirectory: false,
          metadata: file.metadata,
        };
      });

    // Apply filters
    if (filter) {
      if (filter.extension) {
        fileList = fileList.filter((f) => f.name.endsWith(filter.extension!));
      }
      if (filter.pattern) {
        const regex = new RegExp(filter.pattern);
        fileList = fileList.filter((f) => regex.test(f.name));
      }
      if (filter.minSize !== undefined) {
        fileList = fileList.filter((f) => f.size >= filter.minSize!);
      }
      if (filter.maxSize !== undefined) {
        fileList = fileList.filter((f) => f.size <= filter.maxSize!);
      }
    }

    return fileList;
  }

  async getMetadata(path: string): Promise<FileMetadata> {
    const files = this.getFiles();
    const file = files[path];

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return file.metadata || {};
  }

  private getFiles(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}
