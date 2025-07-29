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
- ⏳ **Phase 5**: Domain Layer Implementation
- ⏳ **Phase 6**: Infrastructure Layer (IndexedDB)
- ⏳ **Phase 7**: Application Layer (Use Cases)
- ⏳ **Phase 8**: Presentation Layer (React UI)
- ⏳ **Phase 9**: PWA Features & Testing
- ⏳ **Phase 10**: Documentation & Deployment

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

This project uses [Conventional Commits](https://conventionalcommits.org/) for consistent commit messages:

```bash
npm run commit  # Use interactive commit tool
# or manually:
git commit -m "feat(live-scoring): add batting result recording"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks

## 📄 License

This project is developed following the AI-assisted spec-driven development workflow for educational and practical purposes.

---

**Development Approach**: This project demonstrates structured software development using user stories, DSL specifications, Clean Architecture, and SOLID principles with AI assistance.
