// Primary Ports - Application Service Interfaces (CQRS)
export * from './services/interfaces';

// Application Facade - Clean Architecture Entry Point
export * from './facade/ApplicationFacade';

// Secondary Ports - Hexagonal Architecture
export * from './ports/secondary/IPersistencePorts';
export * from './ports/secondary/IInfrastructurePorts';

// Common types and utilities
export * from './common/Result';

// Legacy exports - Use Cases (for backward compatibility during migration)
// These will be removed once consumers are updated to use application services
export { CreateTeamUseCase } from './use-cases/CreateTeamUseCase';
export { CreateGameUseCase } from './use-cases/CreateGameUseCase';
export { SetupLineupUseCase } from './use-cases/SetupLineupUseCase';
export { RecordAtBatUseCase } from './use-cases/RecordAtBatUseCase';
export { AtBatRecordingIntegration } from './integrations/AtBatRecordingIntegration';
