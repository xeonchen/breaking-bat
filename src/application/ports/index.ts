/**
 * Application Ports - Hexagonal Architecture
 *
 * This module exports all ports (interfaces) that define the boundaries
 * of our application core. These ports are implemented by adapters
 * in the infrastructure layer.
 */

// Primary Ports (driving side - what external actors can do to our app)
export * from './primary/ICommandHandlers';

// Secondary Ports (driven side - what our app needs from external systems)
export * from './secondary/IPersistencePorts';
export * from './secondary/IInfrastructurePorts';
