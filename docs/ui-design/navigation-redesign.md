# Navigation Redesign Documentation

## Overview

Simplify the Breaking-Bat navigation from 7 sections to 4 main sections by consolidating related functionality and removing the Home tab in favor of Games as the default landing page.

## Current Navigation Structure

### Desktop Navigation Drawer (7 sections)

```
🏠 Home         → /
👥 Teams        → /teams
📅 Seasons      → /seasons
🎯 Game Types   → /game-types
⚾ Games        → /games
📊 Stats        → /stats
⚙️ Settings     → /settings
```

### Mobile Bottom Navigation (5 sections)

```
🏠 Home     👥 Teams    📅 Seasons    ⚾ Game    📊 Stats
```

## Proposed Navigation Structure

### Unified Navigation (4 sections)

```
👥 Teams     → /teams
⚾ Games     → /games (DEFAULT)
📊 Stats     → /stats
⚙️ Settings  → /settings
```

## Changes Detail

### 1. Remove Home Tab

- **Current**: Home tab serves as dashboard with quick actions
- **Proposed**: Remove Home tab, redirect `/` to `/games`
- **Rationale**: Games is the primary workflow - users come to create/manage games

### 2. Consolidate Seasons & Game Types into Settings

- **Current**: Separate navigation items for Seasons & Game Types
- **Proposed**: Move both into Settings page as "Game Configuration" tab
- **Rationale**: These are configuration/setup items, not primary workflows

### 3. Simplified Mobile Navigation

- **Current**: 5 items in bottom navigation
- **Proposed**: 4 items with better spacing and touch targets
- **Layout**: Equal spacing across bottom navigation bar

## Navigation Wireframes

### Desktop Navigation Drawer (Proposed)

```
┌─────────────────────────┐
│ ⚾ Breaking-Bat         │ ← Header
├─────────────────────────┤
│                         │
│ 👥 Teams                │ ← Bold if active
│ ⚾ Games                 │
│ 📊 Stats                │
│ ⚙️ Settings             │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

### Mobile Bottom Navigation (Proposed)

```
┌─────────────────────────────────────┐
│                                     │
│          Main Content               │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  👥     ⚾     📊     ⚙️            │
│ Teams  Games  Stats  Settings       │
└─────────────────────────────────────┘
```

### Navigation Flow Comparison

#### Current Flow

```
Home → Teams/Seasons/Game Types/Games → Scoring
  ↓
Stats/Settings (secondary)
```

#### Proposed Flow

```
Games (default) → Teams/Settings → Scoring
  ↓
Stats (secondary)
```

## Route Changes

### Removed Routes

- `/` (Home) → redirects to `/games`
- `/seasons` → moved to `/settings#game-config`
- `/game-types` → moved to `/settings#game-config`

### New Default Route

- `/` → redirects to `/games`
- `/games` becomes the landing page

### Settings Routes (Internal Navigation)

- `/settings` → General tab (default)
- `/settings#game-config` → Game Configuration tab

## Implementation Changes Required

### 1. Route Configuration

```typescript
// Remove these routes:
// path: "/" → HomePage
// path: "/seasons" → SeasonsPage
// path: "/game-types" → GameTypesPage

// Add redirect:
path: "/" → redirect to "/games"
```

### 2. Navigation Components

#### BottomNavigation.tsx

```typescript
const navigationItems = [
  { label: 'Teams', path: '/teams', icon: '👥' },
  { label: 'Games', path: '/games', icon: '⚾' }, // Default active
  { label: 'Stats', path: '/stats', icon: '📊' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];
```

#### NavigationDrawer.tsx

```typescript
const navigationItems = [
  { label: 'Teams', path: '/teams', icon: '👥' },
  { label: 'Games', path: '/games', icon: '⚾' },
  { label: 'Stats', path: '/stats', icon: '📊' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];
```

## User Experience Impact

### Positive Changes

- **Simplified mental model**: 4 clear sections instead of 7
- **Faster access**: Games as default reduces clicks for primary workflow
- **Better organization**: Configuration items grouped in Settings
- **Mobile friendly**: 4 items fit better on mobile screens

### Considerations

- **Quick stats loss**: No dashboard overview (mitigated by improved Games page)
- **Configuration access**: Seasons/Game Types now require Settings navigation
- **Muscle memory**: Existing users need to adapt to new structure

## Accessibility Considerations

### Screen Reader Improvements

- Clearer navigation landmarks with fewer sections
- Better logical flow for keyboard navigation
- Consistent focus management with reduced complexity

### Mobile Touch Targets

- Larger touch areas with 4 items vs 5
- Better spacing and reduced accidental taps
- Improved one-handed navigation

## Implementation Priority

1. **High Priority**: Route changes and redirects
2. **High Priority**: Navigation component updates
3. **Medium Priority**: Link updates throughout app
4. **Low Priority**: Breadcrumb updates (if any)

## Testing Requirements

### Navigation Tests

- Route redirect from `/` to `/games` works
- Navigation items render correctly (4 items)
- Active state highlights correct section
- Mobile navigation layout is responsive

### Integration Tests

- All internal links work with new structure
- Settings page contains seasons/game types
- No broken links remain to old routes

## Success Metrics

- **Reduced cognitive load**: Users report easier navigation
- **Faster task completion**: Time to create game reduced
- **Mobile usability**: Better touch interaction on mobile
- **Feature discovery**: Settings consolidation improves discoverability
