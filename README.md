# Breaking-Bat 🥎

A Progressive Web App (PWA) for recording slowpitch softball game statistics and scores. Designed for scorekeepers to quickly and accurately track game data during live gameplay, with complete offline functionality and local data storage.

## 🎯 Project Overview

Breaking-Bat enables scorekeepers to:

- ⚾ Manage teams, players, and game lineups
- 📊 Record live game statistics and scores in real-time
- 💾 Store all data locally with automatic saving
- 📱 Use on mobile, tablet, or desktop devices
- 🔄 Export/import game data for backup and analysis
- 🌐 Work completely offline without internet connection

### ⚾ Slowpitch Softball Specifics

This application is designed specifically for **slowpitch softball** with the following characteristics:

- **10 defensive positions**: Pitcher (P), Catcher (C), First Base (1B), Second Base (2B), Third Base (3B), Shortstop (SS), Left Field (LF), Center Field (CF), Right Field (RF), Short Fielder (SF)
- **Extra Player (EP)**: Batting-only role, does not play defense
- **Jersey numbers**: Range from 0-999 (expanded from traditional 1-99)
- **Multiple positions**: Players can be assigned multiple positions they are capable of playing
- **Conventional position order**: Follows standard numbering 1-10 for defensive positions, 11 for EP

## 🏗️ Architecture

This project follows **spec-driven development** with Clean Architecture principles:

```
User Stories → DSL Specs → API Contracts → Implementation
```

**Technology Stack:**

- **Frontend**: React 18.3.1 + TypeScript 5.6.2 + Vite 6.0.1
- **UI Framework**: Chakra UI 2.10.4 + Framer Motion
- **State Management**: Zustand 5.0.2
- **Database**: IndexedDB + Dexie.js 4.0.8
- **PWA**: Workbox + Service Worker
- **Testing**: Jest + Playwright + Testing Library
- **Data Export**: xlsx + PapaParse (CSV)

## 📁 Project Structure

```
breaking-bat/
├── docs/
│   ├── user-stories/          # Structured user stories
│   └── specs/                 # DSL specifications (YAML)
├── src/
│   ├── domain/               # Business entities & rules
│   ├── application/          # Use cases & services
│   ├── infrastructure/       # Database & external services
│   └── presentation/         # UI components & state
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
└── public/                  # PWA assets & manifest
```

## 🚀 Development Status

- ✅ **Phase 1**: User Stories Documentation
- ✅ **Phase 2**: DSL Specifications (YAML)
- ✅ **Phase 3**: API Contract Definitions
- ✅ **Phase 4**: Project Setup & Clean Architecture
- ✅ **Phase 5**: Domain Layer Implementation
- ✅ **Phase 6**: Infrastructure Layer (IndexedDB)
- ✅ **Phase 7**: Application Layer (Use Cases)
- ✅ **Phase 8**: Presentation Layer (React UI)
- ✅ **Phase 9**: PWA Features & Service Workers
- ⏳ **Phase 10**: Testing Completion & Quality Assurance **[CURRENT]**

### Current Status

**Application Status**: All core functionality implemented and working
**Testing Status**: Critical gaps identified - see [TODO.md](TODO.md) for detailed testing roadmap
**Next Phase**: UI/UX refinement (blocked pending test completion)

### Implementation Status

**✅ Core Features Complete:**

- Team Management (Teams, Players, Rosters)
- Season Management & Game Type Management
- Game Creation & Live Scoring Interface
- PWA Features (Offline, Installable)
- IndexedDB Data Persistence
- Clean Architecture Implementation

**⏳ In Progress:**

- **Test Infrastructure**: 397/493 tests passing (80.5% pass rate) - Major improvements completed
- Data Export/Import functionality  
- Game Statistics Aggregation

**🧪 Recent Testing Infrastructure Achievements:**

- Fixed TypeScript JSX namespace issues across all React components
- Resolved AtBat repository RBI validation logic and database queries
- Updated Game repository date filtering with proper timezone handling
- Aligned all Zustand store mocks with current implementation patterns
- Fixed Scoreboard component team display logic and CSS assertions
- Achieved 18/26 test suites passing with clean TypeScript compilation

**📋 For detailed task status and testing roadmap, see [TODO.md](TODO.md)**

### Available Pages & Features

- **🏠 Home** (`/`) - Dashboard with quick access to core features
- **👥 Teams** (`/teams`) - Complete team and player roster management
- **📅 Seasons** (`/seasons`) - Season creation and management with date tracking
- **🎯 Game Types** (`/game-types`) - Define game categories (Regular, Playoffs, etc.)
- **⚾ Games** (`/games`) - Game creation, lineup setup, and management
- **🎯 Live Scoring** (`/scoring/:gameId`) - Real-time game scoring interface
- **📊 Stats** (`/stats`) - Game statistics and analytics (basic implementation)
- **⚙️ Settings** (`/settings`) - App configuration and data management

## 📋 User Stories

### Core Features

1. **[Team Management](docs/user-stories/team-management.md)** - Create and manage teams, seasons, and players
2. **[Game Setup](docs/user-stories/game-setup.md)** - Create games and set up batting lineups
3. **[Live Scoring](docs/user-stories/live-scoring.md)** - Real-time game scoring and statistics tracking
4. **[Data Persistence](docs/user-stories/data-persistence.md)** - Offline storage and data export/import

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd breaking-bat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run commit       # Interactive commit with conventional format
```

### Commit Guidelines

This project uses [Conventional Commits](https://conventionalcommits.org/):

```bash
npm run commit  # Interactive commit tool
```

For detailed commit standards and development workflow, see [CLAUDE.md](CLAUDE.md).

## 📄 License

This project is developed following the AI-assisted spec-driven development workflow for educational and practical purposes.

---

**Development Approach**: This project demonstrates structured software development using user stories, DSL specifications, Clean Architecture, and SOLID principles with AI assistance.
