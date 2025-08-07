# Settings Page Redesign Documentation

## Overview

Transform the Settings page from a simple placeholder into a comprehensive multi-tab interface that consolidates seasons and game types management while providing general application preferences.

## Current Settings Page

### Current Structure

```
Settings Page
├── Heading: "Settings"
├── Description: "Application settings and preferences will be managed here"
└── Data Management Section
    └── Export Data Button
```

### Current File Content

- Minimal placeholder implementation
- Single export data button
- No actual settings or preferences

## Proposed Multi-Tab Settings Page

### Tab Structure

```
Settings Page
├── Tab 1: General Preferences (Default)
│   ├── Theme/Color Mode Settings
│   ├── Data Management (Export/Import)
│   ├── App Information
│   └── PWA Settings
└── Tab 2: Game Configuration
    ├── Seasons Management (from /seasons)
    ├── Game Types Management (from /game-types)
    └── Default Game Settings
```

## Detailed Tab Specifications

### Tab 1: General Preferences

#### Theme Settings Section

```
┌─────────────────────────────────────┐
│ Theme Settings                      │
├─────────────────────────────────────┤
│ Color Mode: ○ Light ● Dark ○ Auto   │
│ [Color mode follows system setting] │
└─────────────────────────────────────┘
```

#### Data Management Section

```
┌─────────────────────────────────────┐
│ Data Management                     │
├─────────────────────────────────────┤
│ [📥 Import Data]  [📤 Export Data]  │
│                                     │
│ Last Export: Never                  │
│ Database Size: ~2.4 MB             │
└─────────────────────────────────────┘
```

#### Application Information Section

```
┌─────────────────────────────────────┐
│ Application Information             │
├─────────────────────────────────────┤
│ Version: 0.1.0                      │
│ Build: 2025.08.05                   │
│ PWA Status: ✅ Installed            │
│                                     │
│ [📖 User Guide]  [🐛 Report Issue]  │
└─────────────────────────────────────┘
```

### Tab 2: Game Configuration

#### Seasons Management Section

```
┌─────────────────────────────────────┐
│ Seasons Management          [+ New] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📅 Season 2025                  │ │
│ │ Jan 1, 2025 - Dec 31, 2025     │ │
│ │ Teams: 4  Games: 12             │ │
│ │              [Edit] [Delete]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Season 2024                  │ │
│ │ Jan 1, 2024 - Dec 31, 2024     │ │
│ │ Teams: 6  Games: 24             │ │
│ │              [Edit] [Delete]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Game Types Management Section

```
┌─────────────────────────────────────┐
│ Game Types Management       [+ New] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Regular Season               │ │
│ │ Standard league games           │ │
│ │ Used in: 18 games               │ │
│ │              [Edit] [Delete]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 Playoffs                     │ │
│ │ Tournament elimination games    │ │
│ │ Used in: 4 games                │ │
│ │              [Edit] [Delete]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Default Game Settings Section

```
┌─────────────────────────────────────┐
│ Default Game Settings               │
├─────────────────────────────────────┤
│ Default Innings: [7] ▼              │
│ Mercy Rule: ☑ 10 runs after 5 inn.  │
│ Time Limit: ☐ 90 minutes            │
│                                     │
│ Auto-advance: ☑ Next batter         │
│ Score tracking: ☑ Inning by inning  │
└─────────────────────────────────────┘
```

## Mobile Layout Adaptations

### Mobile Tab Navigation

```
┌─────────────────────────────────────┐
│ General | Game Config               │ ← Tabs
├─────────────────────────────────────┤
│                                     │
│     Tab Content                     │
│     (Stacked vertically)            │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Mobile Sections

- Stack all sections vertically
- Full-width cards for each section
- Larger touch targets for buttons
- Collapsible sections for seasons/game types lists

## Component Architecture

### New Settings Page Structure

```typescript
SettingsPage
├── SettingsTabs
│   ├── GeneralPreferencesTab
│   │   ├── ThemeSettings
│   │   ├── DataManagement
│   │   └── AppInformation
│   └── GameConfigurationTab
│       ├── SeasonsManagement (from SeasonsPage)
│       ├── GameTypesManagement (from GameTypesPage)
│       └── DefaultGameSettings
└── SettingsModals
    ├── SeasonModal
    ├── GameTypeModal
    └── ImportDataModal
```

### Reused Components

- Move SeasonsPage components → SeasonsManagement
- Move GameTypesPage components → GameTypesManagement
- Keep existing modal patterns
- Reuse existing form validation

## Integration with Existing Code

### Move Seasons Management

```typescript
// From: src/presentation/pages/SeasonsPage.tsx
// To: src/presentation/components/settings/SeasonsManagement.tsx

// Keep all existing functionality:
// - Season creation/editing/deletion
// - Season validation
// - Date range handling
// - Team associations
```

### Move Game Types Management

```typescript
// From: src/presentation/pages/GameTypesPage.tsx
// To: src/presentation/components/settings/GameTypesManagement.tsx

// Keep all existing functionality:
// - Game type creation/editing/deletion
// - Game type validation
// - Usage tracking
// - Deletion warnings
```

### Store Integration

- No changes to existing stores
- SeasonsStore and GameTypesStore remain unchanged
- Settings page uses existing store hooks

## New Features Added

### Theme Management

```typescript
interface ThemeSettings {
  colorMode: 'light' | 'dark' | 'system';
  accentColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}
```

### Data Management Enhancements

```typescript
interface DataManagement {
  lastExportDate: Date | null;
  databaseSize: number;
  autoBackup: boolean;
  exportFormat: 'json' | 'csv' | 'both';
}
```

### Default Game Settings

```typescript
interface DefaultGameSettings {
  defaultInnings: number;
  mercyRule: boolean;
  mercyRunDifference: number;
  mercyInningMinimum: number;
  timeLimit: number | null;
  autoAdvanceBatter: boolean;
  trackInningByInning: boolean;
}
```

## URL Structure and Navigation

### Internal Tab Navigation

```typescript
// Use hash fragments for tab state
/settings              → General tab (default)
/settings#general      → General tab
/settings#game-config  → Game Configuration tab
```

### Deep Linking Support

- Direct links to specific tabs
- Browser back/forward navigation
- Preserve tab state during navigation

## Responsive Design Considerations

### Desktop (md+)

- Side-by-side layout for some sections
- Wider modals and forms
- More content visible without scrolling

### Tablet (sm to md)

- Stacked sections with adequate spacing
- Touch-friendly buttons and inputs
- Optimized modal sizes

### Mobile (base)

- Full-width components
- Larger touch targets
- Scrollable tab content
- Simplified layouts

## Implementation Tasks

### Phase 1: Tab Structure

1. Create TabsCard wrapper component
2. Implement tab switching logic
3. Add URL hash navigation

### Phase 2: General Preferences Tab

1. Theme settings component
2. Enhanced data management
3. App information display

### Phase 3: Game Configuration Tab

1. Move seasons management components
2. Move game types management components
3. Add default game settings

### Phase 4: Integration & Testing

1. Update navigation links
2. Test all existing functionality
3. Add new settings persistence

## Testing Requirements

### Component Tests

- Tab switching functionality
- Each settings section renders correctly
- Form validation works in new context
- Modal interactions function properly

### Integration Tests

- Seasons management works within settings
- Game types management works within settings
- Settings persistence across page refreshes
- Deep linking to tabs functions correctly

### E2E Tests

- Complete settings workflow
- Navigation from other pages
- Mobile responsiveness
- Theme changes apply correctly

## Migration Strategy

### Backward Compatibility

- Keep existing routes active during transition
- Add redirects from old routes to settings tabs
- Ensure bookmarked links continue working

### Data Migration

- No database changes required
- Settings stored in localStorage/IndexedDB
- Default values for new settings

### User Communication

- Update help text to reference new locations
- Consider in-app notification of changes
- Update any documentation or tutorials
