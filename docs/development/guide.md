# Development Guide

This file provides technical guidance for developing the Breaking-Bat Progressive Web App. For project overview and domain specifications, see README.md.

## Development Commands

### Core Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript type checking
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run commit       # Interactive conventional commit
```

### Testing

```bash
npm run test         # Run unit tests with Jest
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run end-to-end tests with Playwright
```

## Technology Stack (Latest LTS)

**Core Stack:**

- **React 18.3.1** + **TypeScript 5.6.2** + **Vite 6.0.1**
- **UI**: Chakra UI 2.10.4 + Framer Motion 11.11.17
- **State**: Zustand 5.0.2 (lightweight state management)
- **Database**: IndexedDB + Dexie.js 4.0.8 (offline-first)
- **PWA**: Vite PWA Plugin + Workbox (service worker)
- **Forms**: React Hook Form 7.54.0
- **Routing**: React Router DOM 7.1.1
- **Export**: xlsx 0.18.5 + PapaParse 5.4.1

**Testing Stack:**

- **Unit**: Jest 29.7.0 + Testing Library
- **E2E**: Playwright 1.49.1
- **Type**: TypeScript strict mode

## Architecture Overview

### Clean Architecture Structure

```
src/
├── domain/           # Business entities, rules, and interfaces
│   ├── entities/     # Core business objects (Team, Game, Player, etc.)
│   ├── repositories/ # Repository interfaces
│   └── services/     # Domain services
├── application/      # Use cases and application services
│   ├── use-cases/    # Business use cases
│   └── services/     # Application services
├── infrastructure/   # External concerns (database, storage)
│   ├── repositories/ # Repository implementations
│   ├── storage/      # IndexedDB, LocalStorage implementations
│   └── export/       # Data export/import services
└── presentation/     # UI layer
    ├── components/   # React components
    ├── pages/        # Page components
    ├── hooks/        # Custom React hooks
    └── stores/       # Zustand stores
```

### Data Flow

```
UI Components → Zustand Store → Use Cases → Domain Services → Repositories → IndexedDB
```

## Spec-Driven Development Workflow

This project follows the AI-assisted workflow:

1. **User Stories** (`docs/user-stories/`) - Structured Markdown format
2. **DSL Specs** (`docs/specs/`) - YAML specifications
3. **API Contracts** - TypeScript interfaces
4. **Implementation** - Following Clean Architecture
5. **Testing** - Unit, Integration, E2E tests

### Current Documentation

- ✅ `docs/user-stories/team-management.md` - Team and player management
- ✅ `docs/user-stories/game-setup.md` - Game creation and lineup setup
- ✅ `docs/user-stories/live-scoring.md` - Real-time scoring functionality
- ✅ `docs/user-stories/data-persistence.md` - Offline storage and export

## Key Design Principles

### SOLID Principles Implementation

- **Single Responsibility**: Each module has one reason to change
- **Open/Closed**: Extensible without modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Clients depend only on needed interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### PWA Requirements

- **Offline-First**: Complete functionality without internet
- **Installable**: Can be installed on mobile/tablet home screen
- **Responsive**: Optimized for mobile, tablet, desktop
- **Auto-Save**: All data persists immediately to IndexedDB
- **Service Worker**: Caches app shell and data

## Data Models

### Core Entities

```typescript
// Domain entities (simplified)
Team: { id, name, season, players[] }
Player: { id, name, jerseyNumber, positions[], teamId, isActive }
Position: { value, positionNumber, isDefensivePosition() }
Game: { id, homeTeam, awayTeam, date, innings[] }
AtBat: { playerId, result, baseRunners, rbis }
Inning: { number, runs, atBats[] }
```

### Storage Strategy

- **IndexedDB** via Dexie.js for structured data
- **Automatic persistence** - every user action saves immediately
- **Export formats**: JSON (complete), CSV (statistics)
- **Import validation** with data integrity checks

## Common Development Tasks

### Adding New Features

1. Create user story in `docs/user-stories/`
2. Define DSL spec in `docs/specs/`
3. Add domain entities and interfaces
4. Implement use cases with tests
5. Create repository interfaces and implementations
6. Build UI components with Chakra UI
7. Add integration and E2E tests

### Database Operations

```typescript
// Use Dexie for IndexedDB operations
import { db } from '@/infrastructure/storage/database';
await db.teams.add(team);
const games = await db.games.where('teamId').equals(teamId).toArray();
```

### PWA Updates

- Service worker auto-updates on new deployments
- Use `vite-plugin-pwa` for configuration
- Test offline functionality during development

## Performance Considerations

- **Bundle splitting** by route for optimal loading
- **Lazy loading** for non-critical components
- **IndexedDB indexing** for fast queries
- **Virtualization** for large lists (game history)
- **PWA caching** strategy for instant loading
