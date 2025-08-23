# Hexagonal Architecture Implementation

This document describes the Hexagonal Architecture (Ports & Adapters) implementation in Breaking Bat.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Clean Architecture                   │
│                  (Hexagonal Architecture)               │
└─────────────────────────────────────────────────────────┘

       Primary Adapters            Secondary Adapters
          (Drivers)                    (Driven)
    ┌──────────────────────┐   ┌──────────────────────┐
    │  Presentation Layer  │   │ Infrastructure Layer │
    │                      │   │                      │
    │  • React Components  │   │  • IndexedDB         │
    │  • Zustand Stores    │   │  • LocalStorage      │
    │  • UI Controllers    │   │  • Console Logger    │
    │                      │   │  • Browser APIs      │
    └──────────────────────┘   └──────────────────────┘
               ↓                        ⇡ implements
               ↓                        ⇡
    ┌─────────────────────────────────────────────────┐
    │              APPLICATION LAYER                  │
    │                                                 │
    │  ┌──────────────────┐  ┌──────────────────┐     │
    │  │  Primary Ports   │  │ Secondary Ports  │     │
    │  │  <<interfaces>>  │  │  <<interfaces>>  │     │
    │  └──────────────────┘  └──────────────────┘     │
    │              ↓                ↑                 │
    │  ┌────────────────────────────────────────┐     │
    │  │     Application Services (Use Cases)   │     │
    │  └────────────────────────────────────────┘     │
    └─────────────────────────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────────────┐
    │                  DOMAIN LAYER                   │
    │                                                 │
    │  ┌──────────────────┐  ┌──────────────────┐     │
    │  │     Entities     │  │  Domain Services │     │
    │  └──────────────────┘  └──────────────────┘     │
    │  ┌──────────────────┐  ┌──────────────────┐     │
    │  │  Value Objects   │  │  Domain Events   │     │
    │  └──────────────────┘  └──────────────────┘     │
    └─────────────────────────────────────────────────┘

Legend:
→  Direct dependency (imports concrete implementations or uses)
⇡  Implements interface (depends on abstraction)
```

## Dependency Rules

### Compile-Time Dependencies

```
Presentation Layer:
  → imports Application Use Cases
  → imports Domain Entities (for type definitions)

Infrastructure Layer:
  → imports Application Ports (interfaces only)
  → imports Domain Entities

Application Layer:
  → imports Domain Entities
  → imports Domain Services
  → defines but doesn't implement Secondary Ports

Domain Layer:
  → No external dependencies (pure business logic)
```

### Runtime Dependencies

```
User → Presentation → Application → Infrastructure
                ↓           ↓            ↓
                └───────→ Domain ←───────┘
```

## Layer Responsibilities

### Domain Layer (Core Business Logic)

**Location**: `src/domain/`
**Dependencies**: None - this is the innermost layer

- **Entities**: Core business objects with identity (Team, Player, Game, AtBat)
- **Value Objects**: Immutable objects without identity (Score, Statistics, GameSettings)
- **Domain Services**: Business logic that doesn't belong to a single entity (ScoringService, StatisticsCalculator)
- **Domain Events**: Business events that occur (GameCompleted, AtBatRecorded, InningChanged)
- **Domain Exceptions**: Business rule violations (InvalidLineupException, GameAlreadyStartedException)

### Application Layer (Use Case Orchestration)

**Location**: `src/application/`
**Dependencies**: Domain Layer only

- **Application Services (Use Cases)**: Orchestrate business operations (CreateTeamUseCase, StartGameUseCase, RecordAtBatUseCase)
- **Primary Ports**: Interfaces that external actors use to drive the application (ICommandHandler, IQueryHandler)
- **Secondary Ports**: Interfaces that the application needs from external systems (ITeamRepository, IGameRepository, INotificationService)
- **DTOs**: Data Transfer Objects for communication across boundaries
- **Application Exceptions**: Application-level errors (UseCaseValidationException)

### Infrastructure Layer (Technical Implementation)

**Location**: `src/infrastructure/`
**Dependencies**: Application Ports (interfaces), Domain Entities

- **Persistence Adapters**: Concrete implementations of repository interfaces (IndexedDBTeamRepository, LocalStorageSettingsRepository)
- **External Service Adapters**: Implementations of external service interfaces (ConsoleLoggerAdapter, BrowserNotificationAdapter)
- **Dependency Injection**: Composition root and container configuration
- **Framework Configuration**: Technical setup and bootstrapping

### Presentation Layer (User Interface)

**Location**: `src/presentation/`
**Dependencies**: Application Use Cases, Domain Entities (for types)

- **React Components**: UI components that interact with use cases
- **State Management**: Zustand stores that coordinate UI state
- **View Models**: UI-specific data transformations
- **Routes**: Application routing configuration
- **UI Utilities**: Formatting, validation helpers

## Port & Adapter Details

### Primary Ports (Driving Ports)

**Purpose**: Define how external actors can interact with the application
**Location**: `src/application/ports/primary/`

```typescript
// Example: Command Handler Interface
export interface ICommandHandler<TCommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

// Example: Query Handler Interface
export interface IQueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}
```

### Secondary Ports (Driven Ports)

**Purpose**: Define what the application needs from external systems
**Location**: `src/application/ports/secondary/`

```typescript
// Example: Repository Interface
export interface ITeamRepository {
  save(team: Team): Promise<void>;
  findById(id: string): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  delete(id: string): Promise<void>;
}

// Example: External Service Interface
export interface INotificationService {
  notify(message: string, type: NotificationType): Promise<void>;
}
```

### Primary Adapters (Driving Adapters)

**Purpose**: Adapt external inputs to application use cases
**Location**: `src/presentation/`

```typescript
// Example: React Component using Use Case
const TeamCreator: React.FC = () => {
  const createTeam = useCreateTeamUseCase(); // Injected use case

  const handleSubmit = async (name: string) => {
    await createTeam.execute({ name });
  };

  return <TeamForm onSubmit={handleSubmit} />;
};
```

### Secondary Adapters (Driven Adapters)

**Purpose**: Implement application requirements using specific technologies
**Location**: `src/infrastructure/adapters/`

```typescript
// Example: IndexedDB Implementation of Repository
export class IndexedDBTeamRepository implements ITeamRepository {
  async save(team: Team): Promise<void> {
    // IndexedDB-specific implementation
    const db = await this.openDatabase();
    const tx = db.transaction(['teams'], 'readwrite');
    await tx.objectStore('teams').put(team.toJSON());
  }

  async findById(id: string): Promise<Team | null> {
    // IndexedDB-specific implementation
    const db = await this.openDatabase();
    const data = await db.get('teams', id);
    return data ? Team.fromJSON(data) : null;
  }
}
```

## File Structure

```
src/
├── domain/                    # Domain Layer (Core Business)
│   ├── entities/              # Business entities with identity
│   │   ├── Team.ts
│   │   ├── Player.ts
│   │   └── Game.ts
│   ├── value-objects/         # Immutable values without identity
│   │   ├── Score.ts
│   │   └── Statistics.ts
│   ├── services/              # Domain services (business logic)
│   │   ├── ScoringService.ts
│   │   └── StatisticsCalculator.ts
│   ├── events/                # Domain events
│   │   └── GameCompletedEvent.ts
│   └── exceptions/            # Domain-specific exceptions
│       └── InvalidLineupException.ts
│
├── application/               # Application Layer (Use Cases)
│   ├── ports/
│   │   ├── primary/           # Driving ports (interfaces)
│   │   │   └── ICommandHandler.ts
│   │   └── secondary/         # Driven ports (interfaces)
│   │       ├── ITeamRepository.ts
│   │       └── INotificationService.ts
│   ├── use-cases/             # Application services
│   │   ├── teams/
│   │   │   └── CreateTeamUseCase.ts
│   │   └── games/
│   │       └── StartGameUseCase.ts
│   ├── dtos/                  # Data transfer objects
│   └── exceptions/            # Application exceptions
│
├── infrastructure/            # Infrastructure Layer (Technical Details)
│   ├── adapters/
│   │   ├── persistence/       # Database implementations
│   │   │   ├── IndexedDBTeamRepository.ts
│   │   │   └── IndexedDBGameRepository.ts
│   │   └── services/          # External service implementations
│   │       └── ConsoleLoggerAdapter.ts
│   ├── di/                    # Dependency injection
│   │   └── CompositionRoot.ts
│   └── bootstrap/             # Application startup
│       └── ApplicationBootstrap.ts
│
└── presentation/              # Presentation Layer (UI)
    ├── components/            # React components
    ├── stores/                # State management (Zustand)
    ├── hooks/                 # Custom React hooks
    ├── providers/             # React context providers
    └── routes/                # Routing configuration
```

## Dependency Injection & Composition

```typescript
// infrastructure/di/CompositionRoot.ts
export class CompositionRoot {
  static compose(): ApplicationContainer {
    // Create infrastructure adapters
    const teamRepository = new IndexedDBTeamRepository();
    const gameRepository = new IndexedDBGameRepository();
    const notificationService = new ConsoleLoggerAdapter();

    // Create domain services
    const scoringService = new ScoringService();
    const statsCalculator = new StatisticsCalculator();

    // Create application services (use cases)
    const createTeamUseCase = new CreateTeamUseCase(
      teamRepository,
      notificationService
    );

    const startGameUseCase = new StartGameUseCase(
      gameRepository,
      teamRepository,
      scoringService
    );

    // Return container with all services
    return {
      useCases: {
        createTeam: createTeamUseCase,
        startGame: startGameUseCase,
      },
      // Expose repositories if needed for queries
      repositories: {
        team: teamRepository,
        game: gameRepository,
      },
    };
  }
}
```

## Testing Strategy

### Domain Layer Tests

- Test pure business logic without any dependencies
- Focus on business rules and invariants
- No mocking required

### Application Layer Tests

- Mock secondary ports (repositories, services)
- Test use case orchestration and flow
- Verify correct delegation to domain services

### Infrastructure Layer Tests

- Integration tests with real databases/services
- Test adapter implementations against port contracts
- Verify technical implementation details

### Presentation Layer Tests

- Component testing with mocked use cases
- User interaction testing
- Visual regression testing

## Key Principles

1. **Dependency Rule**: Dependencies only point inward. Inner layers know nothing about outer layers.

2. **Abstraction Rule**: Depend on abstractions (interfaces), not concretions (implementations).

3. **Stability Rule**: More stable components (domain) should not depend on less stable components (infrastructure).

4. **Testability**: Every layer can be tested in isolation by mocking its dependencies.

5. **Flexibility**: Technical details (database, UI framework) can be changed without affecting business logic.

## Common Patterns

### Command Query Separation (CQS)

- Commands: Modify state, return void or simple result
- Queries: Read state, don't modify anything

### Repository Pattern

- Abstracts data persistence
- Domain works with collections, not databases

### Use Case Pattern

- One class per use case
- Clear, focused responsibilities
- Easy to test and understand

### Dependency Injection

- Dependencies provided from outside
- Enables testing and flexibility
- Composition root wires everything

## Migration Checklist

When migrating existing code to this architecture:

- [ ] Identify and extract domain entities
- [ ] Move business logic to domain services
- [ ] Define repository interfaces in application layer
- [ ] Implement repository adapters in infrastructure
- [ ] Create use cases for each user action
- [ ] Wire dependencies in composition root
- [ ] Update UI components to use use cases
- [ ] Add comprehensive tests at each layer

## Benefits

1. **Testability**: Each layer can be tested independently
2. **Maintainability**: Clear boundaries and responsibilities
3. **Flexibility**: Easy to change technical implementations
4. **Scalability**: New features fit naturally into the structure
5. **Understanding**: Architecture mirrors business domain
