/**
 * Infrastructure Adapters - Hexagonal Architecture
 *
 * This module exports all adapters (concrete implementations) that
 * implement the ports defined in the application layer.
 */

// Persistence Adapters (implement persistence ports)
export * from './persistence/IndexedDBPersistenceAdapter';

// Service Adapters (implement infrastructure service ports)
export * from './services/InfrastructureServiceAdapters';
