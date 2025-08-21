# Hexagonal Architecture Implementation

This document describes the Hexagonal Architecture (Ports & Adapters) implementation in Breaking Bat.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HEXAGONAL ARCHITECTURE                       │
│                         (Ports & Adapters)                         │
└─────────────────────────────────────────────────────────────────────┘

   Primary Adapters                                    Secondary Adapters
        (Drivers)                                          (Driven)
┌──────────────────────┐                           ┌──────────────────────┐
│  Presentation Layer  │                           │ Infrastructure Layer │
│                      │                           │                      │
│  • React Components  │────┐                 ┌────│  • IndexedDB         │
│  • Zustand Stores    │    │                 │    │  • LocalStorage      │
│  • UI Controllers    │    │                 │    │  • Console Logger    │
│                      │    │                 │    │  • Browser APIs      │
└──────────────────────┘    │                 │    └──────────────────────┘
                            │                 │
                       ┌────▼─────────────────▼────┐
                       │     APPLICATION CORE      │
                       │                           │
                       │  ┌─────────────────────┐  │
                       │  │   PRIMARY PORTS     │  │
                       │  │ (Command Handlers)  │  │
                       │  └─────────────────────┘  │
                       │                           │
                       │  ┌─────────────────────┐  │
                       │  │  DOMAIN SERVICES    │  │
                       │  │ (Business Logic)    │  │
                       │  └─────────────────────┘  │
                       │                           │
                       │  ┌─────────────────────┐  │
                       │  │  SECONDARY PORTS    │  │
                       │  │ (Repository Intfs)  │  │
                       │  └─────────────────────┘  │
                       └───────────────────────────┘
```

## Layer Responsibilities

### Application Core

- **Domain Entities**: Team, Player, Game, AtBat, etc.
- **Domain Services**: ScoringService, GameSessionService, etc.
- **Use Cases**: CreateTeamUseCase, RecordAtBatUseCase, etc.
- **Ports**: Interfaces defining external contracts

### Primary Adapters (Driving Side)

- **React Components**: UI that drives application behavior
- **Zustand Stores**: State management adapters
- **REST Controllers**: (Future) API endpoints

### Secondary Adapters (Driven Side)

- **Persistence**: IndexedDB adapters for data storage
- **Infrastructure**: Logging, caching, file storage adapters
- **External APIs**: (Future) External service integrations

## Ports & Adapters

### Primary Ports (Application → External)

Located in: `src/application/ports/primary/`

- **ICommandHandlers.ts**: Command and query handler interfaces
- Define what external actors can request from our application

### Secondary Ports (Application ← External)

Located in: `src/application/ports/secondary/`

- **IPersistencePorts.ts**: Data persistence contracts
- **IInfrastructurePorts.ts**: Infrastructure service contracts
- Define what our application needs from external systems

### Primary Adapters (External → Application)

Located in: `src/presentation/`

- **React Components**: UI adapters that call application use cases
- **Zustand Stores**: State management adapters
- **ApplicationProvider**: Dependency injection adapter

### Secondary Adapters (Application → External)

Located in: `src/infrastructure/adapters/`

- **IndexedDBPersistenceAdapter**: Database persistence implementations
- **InfrastructureServiceAdapters**: Logging, caching, etc. implementations

## Dependency Flow

```
Presentation Layer ──→ Application Ports ──→ Domain Services
                                          ↙
Infrastructure Adapters ←── Secondary Ports
```

**Key Principles:**

1. **Dependency Inversion**: All dependencies point inward toward the domain
2. **Interface Segregation**: Specific, focused port interfaces
3. **Single Responsibility**: Each adapter handles one concern
4. **Testability**: Ports can be easily mocked for testing

## Benefits Achieved

### ✅ **Testability**

- Domain logic can be tested without external dependencies
- Adapters can be mocked through port interfaces
- Unit tests focus on business logic

### ✅ **Flexibility**

- Storage mechanism can be changed (IndexedDB → PostgreSQL)
- UI framework can be swapped (React → Vue)
- External services can be replaced

### ✅ **Maintainability**

- Clear separation of concerns
- Business logic isolated from technical concerns
- Easy to understand dependency relationships

### ✅ **Extensibility**

- New adapters can be added without changing core logic
- Multiple adapters can implement the same port
- Feature flags can switch between adapters

## File Structure

```
src/
├── application/
│   ├── ports/
│   │   ├── primary/           # Driving ports
│   │   │   └── ICommandHandlers.ts
│   │   └── secondary/         # Driven ports
│   │       ├── IPersistencePorts.ts
│   │       └── IInfrastructurePorts.ts
│   ├── use-cases/             # Application services
│   └── common/                # Shared application logic
│
├── domain/
│   ├── entities/              # Business entities
│   ├── services/              # Domain services
│   └── values/                # Value objects
│
├── infrastructure/
│   ├── adapters/
│   │   ├── persistence/       # Database adapters
│   │   └── services/          # Infrastructure service adapters
│   ├── di/
│   │   └── CompositionRoot.ts # Dependency wiring
│   └── bootstrap/             # Application startup
│
└── presentation/
    ├── components/            # UI components (primary adapters)
    ├── stores/                # State management (primary adapters)
    └── providers/             # React context providers
```

## Usage Examples

### Adding a New Storage Mechanism

1. **Create new adapter**:

```typescript
// infrastructure/adapters/persistence/PostgreSQLPersistenceAdapter.ts
export class PostgreSQLTeamPersistenceAdapter implements ITeamPersistencePort {
  // Implementation using PostgreSQL
}
```

2. **Update composition root**:

```typescript
// Switch adapter in CompositionRoot.ts
const teamPersistencePort = new PostgreSQLTeamPersistenceAdapter();
```

3. **No changes needed** in application core or presentation layer!

### Adding a New External Service

1. **Define port**:

```typescript
// application/ports/secondary/IEmailPort.ts
export interface IEmailPort {
  sendNotification(to: string, subject: string, body: string): Promise<void>;
}
```

2. **Create adapter**:

```typescript
// infrastructure/adapters/services/SendGridEmailAdapter.ts
export class SendGridEmailAdapter implements IEmailPort {
  // SendGrid implementation
}
```

3. **Wire in composition root** and use in application services

## Migration Status

### ✅ Completed

- [x] Hexagonal architecture foundation
- [x] Primary and secondary port definitions
- [x] Core infrastructure adapters
- [x] Composition root with port wiring
- [x] Legacy compatibility layer

### 🔄 In Progress

- [ ] Migrate all repository implementations to adapters
- [ ] Complete command/query handler implementations
- [ ] Full presentation layer adapter migration

### 📋 Future Enhancements

- [ ] Event sourcing adapter
- [ ] External API adapters
- [ ] Advanced caching strategies
- [ ] Multiple storage backends
