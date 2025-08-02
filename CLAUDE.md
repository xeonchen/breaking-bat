# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Guidance

This file provides technical guidance for Claude Code when working with the Breaking-Bat Progressive Web App. For project overview and domain specifications, see README.md.

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

## Development Guidelines

### Commit Message Standards

This project uses **Conventional Commits** for consistent commit history and automated tooling.

**Format:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Commit Types:**

- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Changes to documentation
- `style`: Formatting, missing semicolons, etc; no production code change
- `refactor`: Refactoring production code, eg. renaming a variable
- `test`: Adding missing tests, refactoring tests; no production code change
- `chore`: Updating grunt tasks etc; no production code change
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts

**Scopes (Breaking-Bat specific):**

- `team-management`: Team and player management features
- `game-setup`: Game creation and lineup configuration
- `live-scoring`: Real-time scoring functionality
- `data-persistence`: Offline storage and export/import
- `ui`: User interface components
- `theme`: Design system and styling
- `pwa`: Progressive Web App features
- `domain`: Domain layer (entities, services)
- `application`: Application layer (use cases)
- `infrastructure`: Infrastructure layer (repositories, storage)
- `presentation`: Presentation layer (React components)

**Examples:**

```bash
feat(live-scoring): add batting result recording interface
fix(team-management): correct player jersey number validation
docs(readme): update development status to reflect completed phases
test(domain): add unit tests for Player entity
refactor(ui): extract scoreboard component for reusability
chore(deps): update dependencies to latest LTS versions
```

**Interactive Commit:**

```bash
npm run commit  # Uses commitizen for guided commit creation
```

### Component Structure

- Use **Chakra UI** components for consistency
- Follow **compound component pattern** for complex UI
- Implement **loading states** and **error boundaries**
- Optimize for **touch interfaces** (tablets/phones)

### State Management

- **Zustand stores** for application state
- **React Hook Form** for form state
- **Local state** for component-specific data
- **Persistent state** synced with IndexedDB

### Testing Strategy

- **Test-driven development** following specs
- **Unit tests** for domain logic and use cases
- **Integration tests** for repository implementations
- **E2E tests** for complete user workflows
- **Component tests** for UI behavior

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

## Development Process

### Phase Completion Checklist

When completing any development phase, ensure:

1. **Code Quality**
   - [ ] All TypeScript compilation passes (`npm run type-check`)
   - [ ] All tests pass (`npm run test`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Code is properly formatted

2. **Documentation Updates**
   - [ ] Update README.md development status
   - [ ] Update CLAUDE.md if architecture changes
   - [ ] Add/update user stories or specs if needed
   - [ ] Update API contracts if interfaces change

3. **Commit Standards**
   - [ ] Use conventional commit format
   - [ ] Include proper scope and description
   - [ ] Reference related issues or specs
   - [ ] Include breaking change notes if applicable

4. **Testing Verification**
   - [ ] New features have corresponding tests
   - [ ] Build process completes successfully (`npm run build`)
   - [ ] PWA functionality works in development (`npm run dev`)

### Git Workflow

1. **Feature Development**

   ```bash
   git checkout -b feat/feature-name
   # Implement feature following Clean Architecture
   npm run commit  # Use conventional commits
   ```

2. **Commit Often Best Practice**

   Claude Code should commit progress frequently during development sessions:
   - Commit after fixing configuration issues
   - Commit after resolving test failures
   - Commit after implementing complete features
   - Commit before starting major refactoring
   - Use descriptive commit messages following conventional format

3. **Pre-commit Checks**
   - Husky automatically runs lint-staged
   - Code is formatted with Prettier
   - ESLint checks are applied
   - Commit message is validated

4. **Phase Completion Process**

   Before completing any development phase, Claude Code should follow this comprehensive checklist:

   **Code Quality Verification:**
   - [ ] Run `npm run type-check` - all TypeScript compilation passes
   - [ ] Run `npm run test` - all tests pass with adequate coverage
   - [ ] Run `npm run lint` - all linting issues resolved
   - [ ] Run `npm run build` - production build succeeds without warnings
   - [ ] No console.log statements in production code
   - [ ] All TODOs addressed or documented in TODO.md
   - [ ] Code is properly formatted with Prettier

   **Testing Completeness:**
   - [ ] New features have corresponding unit tests
   - [ ] Integration tests added for new workflows
   - [ ] E2E tests cover critical user paths
   - [ ] Test coverage meets minimum requirements (80%)
   - [ ] All tests are deterministic and don't rely on external services

   **Documentation Updates:**
   - [ ] README.md development status reflects completed phase
   - [ ] TODO.md updated with current task status
   - [ ] User stories updated if requirements changed
   - [ ] API contracts updated if interfaces changed
   - [ ] Added JSDoc comments for new functions/classes
   - [ ] Updated architectural diagrams if needed

   **Architecture Compliance:**
   - [ ] Clean Architecture principles maintained
   - [ ] Domain layer doesn't depend on external frameworks
   - [ ] Application layer orchestrates use cases correctly
   - [ ] Infrastructure layer implements repository contracts
   - [ ] Presentation layer only handles UI concerns
   - [ ] Dependency inversion principle followed
   - [ ] SOLID principles implemented correctly

   **Feature Verification:**
   - [ ] Feature works as described in user stories
   - [ ] Responsive design works on mobile/tablet/desktop
   - [ ] Offline functionality works (PWA requirement)
   - [ ] Error handling is comprehensive
   - [ ] Loading states provide good UX

   **Performance & Build:**
   - [ ] Development server starts without errors (`npm run dev`)
   - [ ] Production build completes successfully (`npm run build`)
   - [ ] PWA service worker generates correctly
   - [ ] No performance regressions introduced
   - [ ] Components are properly memoized where needed
   - [ ] Bundle sizes are reasonable

   **Commit Standards:**
   - [ ] Use conventional commit format with proper scope
   - [ ] Commit message clearly describes what was implemented
   - [ ] Reference related user stories or specs
   - [ ] Include breaking change notes if applicable

   **Phase Sign-off:**
   - [ ] All checklist items completed
   - [ ] Documentation review completed
   - [ ] Ready for next phase

   **Final Commit Example:**

   ```bash
   npm run commit

   # Format: <type>(<scope>): <description>
   # Types: feat | fix | docs | style | refactor | test | chore
   # Scopes: team-management | game-setup | live-scoring | data-persistence |
   #         ui | theme | pwa | domain | application | infrastructure | presentation

   # Example:
   # feat(tests): implement comprehensive test infrastructure fixes and achieve 80.5% pass rate
   #
   # - Fix TypeScript JSX namespace issues by removing incompatible JSX.Element return types
   # - Resolve AtBat repository RBI validation logic and compound index queries  
   # - Update Game repository date filtering with manual approach vs problematic Dexie between()
   # - Align all Zustand store mocks with actual implementation patterns
   # - Fix Scoreboard component team display logic and CSS custom property assertions
   # - Achieve 397/493 tests passing (80.5% pass rate) with 18/26 test suites passing
   #
   # Major testing infrastructure improvements completed - Ready for final cleanup phase.
   ```

   Only proceed to next phase after all checklist items are verified.

This project demonstrates structured, spec-driven development with AI assistance, emphasizing maintainability, testability, and user experience in offline-first applications.
