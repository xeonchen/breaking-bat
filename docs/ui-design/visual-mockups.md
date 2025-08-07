# Visual Mockups for Interface Changes

## Overview

ASCII wireframes and visual mockups showing the key interface changes for the UI/UX simplification, including before/after comparisons and detailed component layouts.

## Navigation Changes

### Current Mobile Navigation (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                  Main Content Area                          │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠     👥      📅       ⚾      📊                        │
│ Home   Teams  Seasons   Game    Stats                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Mobile Navigation (After)

```
┌─────────────────────────────────────────────────────────────┐
│                  Main Content Area                          │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│    👥        ⚾        📊        ⚙️                        │
│   Teams     Games     Stats    Settings                     │
│  (larger touch targets with better spacing)                 │
└─────────────────────────────────────────────────────────────┘
```

### Desktop Navigation Drawer (Before)

```
┌─────────────────┐
│ ⚾ Breaking-Bat  │
├─────────────────┤
│ 🏠 Home         │
│ 👥 Teams        │
│ 📅 Seasons      │
│ 🎯 Game Types   │
│ ⚾ Games        │
│ 📊 Stats        │
│ ⚙️ Settings     │
│                 │
│                 │
│                 │
└─────────────────┘
```

### Desktop Navigation Drawer (After)

```
┌─────────────────┐
│ ⚾ Breaking-Bat  │
├─────────────────┤
│ 👥 Teams        │
│ ⚾ Games        │ ← Bold (Default)
│ 📊 Stats        │
│ ⚙️ Settings     │
│                 │
│                 │
│                 │
│                 │
│                 │
│                 │
└─────────────────┘
```

## Settings Page Transformation

### Current Settings Page (Before)

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Application settings and preferences will be managed here.  │
│                                                             │
│ Data Management                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              [📤 Export Data]                          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Multi-Tab Settings Page (After)

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│ General | Game Configuration                                │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Theme Settings                                    ⚙️        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Color Mode: ○ Light ● Dark ○ Auto                      │ │
│ │ [✓] Follow system setting                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Data Management                                   💾        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [📥 Import Data]  [📤 Export Data]                     │ │
│ │                                                         │ │
│ │ Last Export: Never                                      │ │
│ │ Database Size: ~2.4 MB                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Application Information                           ℹ️         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Version: 0.1.0                                          │ │
│ │ Build: 2025.08.05                                       │ │
│ │ PWA Status: ✅ Installed                                │ │
│ │                                                         │ │
│ │ [📖 User Guide]  [🐛 Report Issue]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Game Configuration Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│ General | Game Configuration                                │ ← Active Tab
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Seasons Management                               📅 [+ New] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 Season 2025                              [Edit] [×]  │ │
│ │ Jan 1, 2025 - Dec 31, 2025                             │ │
│ │ Teams: 4  Games: 12                                     │ │
│ │                                                         │ │
│ │ 📅 Season 2024                              [Edit] [×]  │ │
│ │ Jan 1, 2024 - Dec 31, 2024                             │ │
│ │ Teams: 6  Games: 24                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Game Types Management                            🎯 [+ New] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 Regular Season                           [Edit] [×]  │ │
│ │ Standard league games                                   │ │
│ │ Used in: 18 games                                       │ │
│ │                                                         │ │
│ │ 🏆 Playoffs                                 [Edit] [×]  │ │
│ │ Tournament elimination games                            │ │
│ │ Used in: 4 games                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Default Game Settings                            ⚾          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Default Innings: [7] ▼                                  │ │
│ │ Mercy Rule: ☑ 10 runs after 5 innings                 │ │
│ │ Time Limit: ☐ 90 minutes                               │ │
│ │                                                         │ │
│ │ Auto-advance: ☑ Next batter                           │ │
│ │ Score tracking: ☑ Inning by inning                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Game Creation Modal Changes

### Current Game Creation Modal (Before)

```
┌─────────────────────────────────────────────────────────────┐
│ Create New Game                                        [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Game Name                                                   │
│ [________________________________] *Required               │
│                                                             │
│ Opponent                                                    │
│ [________________________________] *Required               │
│                                                             │
│ Date                                                        │
│ [______________] *Required                                  │
│                                                             │
│ Team                                                        │
│ [Select a team                    ▼] *Required              │
│                                                             │
│ Season                                                      │
│ [Select a season                  ▼] *Required              │
│                                                             │
│ Game Type                                                   │
│ [Select a game type               ▼] *Required              │
│                                                             │
│ Home/Away                                                   │
│ [Home                             ▼] *Required              │
│                                                             │
│                               [Cancel] [Create]             │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Game Creation Modal (After)

```
┌─────────────────────────────────────────────────────────────┐
│ Create New Game                                        [×]  │
├─────────────────────────────────────────────────────────────┤
│ ☑ Quick Create (Essential fields)                          │
│   ☐ Detailed Setup (All options)                           │
├─────────────────────────────────────────────────────────────┤
│ Game Name                                                   │
│ [________________________________] *Required               │
│                                                             │
│ Opponent                                                    │
│ [________________________________] *Required               │
│                                                             │
│ Date                                                        │
│ [______________] *Required                                  │
│                                                             │
│ Team                                                        │
│ [Select a team                    ▼] *Required              │
│                                                             │
│ Home/Away                                                   │
│ [Home                             ▼] *Required              │
│                                                             │
│                               [Cancel] [Create]             │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Setup Mode (Expanded)

```
┌─────────────────────────────────────────────────────────────┐
│ Create New Game                                        [×]  │
├─────────────────────────────────────────────────────────────┤
│ ☐ Quick Create (Essential fields)                          │
│   ☑ Detailed Setup (All options)                           │
├─────────────────────────────────────────────────────────────┤
│ Game Name                                                   │
│ [________________________________] *Required               │
│                                                             │
│ Opponent                                                    │
│ [________________________________] *Required               │
│                                                             │
│ Date                                                        │
│ [______________] *Required                                  │
│                                                             │
│ Team                                                        │
│ [Select a team                    ▼] *Required              │
│                                                             │
│ Season (Optional)                                           │
│ [Select a season                  ▼] [None]                 │
│ Leave blank for unassigned games                            │
│                                                             │
│ Game Type (Optional)                                        │
│ [Select a game type               ▼] [None]                 │
│ Leave blank for general games                               │
│                                                             │
│ Home/Away                                                   │
│ [Home                             ▼] *Required              │
│                                                             │
│                               [Cancel] [Create]             │
└─────────────────────────────────────────────────────────────┘
```

## Game Card Display Variations

### Full Information Game Card

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Game vs Eagles                                    Setup  │
│ July 15, 2025                                              │
│ Season 2025 • Regular Season                               │
│                                                             │
│                                       [Start Game]         │
└─────────────────────────────────────────────────────────────┘
```

### Partial Information Game Card

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Game vs Eagles                                    Setup  │
│ July 15, 2025                                              │
│ Season 2025                                                │
│                                                             │
│                                       [Start Game]         │
└─────────────────────────────────────────────────────────────┘
```

### Minimal Information Game Card

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Game vs Eagles                                    Setup  │
│ July 15, 2025                                              │
│ (No season/type assigned)                                  │
│                                                             │
│                                       [Start Game]         │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Layouts

### Mobile Settings Page - General Tab

```
┌─────────────────────────────────────┐
│ Settings                       [×]  │
├─────────────────────────────────────┤
│ General | Game Config               │
├─────────────────────────────────────┤
│                                     │
│ Theme Settings              ⚙️      │
│ ┌─────────────────────────────────┐ │
│ │ Color Mode:                     │ │
│ │                                 │ │
│ │ ○ Light                         │ │
│ │ ● Dark                          │ │
│ │ ○ Auto                          │ │
│ │                                 │ │
│ │ [✓] Follow system setting       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Data Management             💾      │
│ ┌─────────────────────────────────┐ │
│ │ [📥 Import Data]                │ │
│ │ [📤 Export Data]                │ │
│ │                                 │ │
│ │ Last Export: Never              │ │
│ │ Database Size: ~2.4 MB          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ App Information             ℹ️       │
│ ┌─────────────────────────────────┐ │
│ │ Version: 0.1.0                  │ │
│ │ Build: 2025.08.05               │ │
│ │ PWA Status: ✅ Installed        │ │
│ │                                 │ │
│ │ [📖 User Guide]                 │ │
│ │ [🐛 Report Issue]               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Mobile Settings Page - Game Config Tab

```
┌─────────────────────────────────────┐
│ Settings                       [×]  │
├─────────────────────────────────────┤
│ General | Game Config               │
├─────────────────────────────────────┤
│                                     │
│ Seasons                 📅 [+ New]  │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Season 2025          [Edit]  │ │
│ │ Jan 1 - Dec 31, 2025            │ │
│ │ Teams: 4  Games: 12             │ │
│ │                                 │ │
│ │ 📅 Season 2024          [Edit]  │ │
│ │ Jan 1 - Dec 31, 2024            │ │
│ │ Teams: 6  Games: 24             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Game Types              🎯 [+ New]  │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Regular Season       [Edit]  │ │
│ │ Standard league games           │ │
│ │ Used in: 18 games               │ │
│ │                                 │ │
│ │ 🏆 Playoffs             [Edit]  │ │
│ │ Tournament games                │ │
│ │ Used in: 4 games                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Default Settings            ⚾       │
│ ┌─────────────────────────────────┐ │
│ │ Default Innings: [7] ▼          │ │
│ │ Mercy Rule: ☑ 10 runs/5 inn.   │ │
│ │ Auto-advance: ☑ Next batter    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Filter and Search Enhancements

### Enhanced Game Filtering

```
┌─────────────────────────────────────────────────────────────┐
│ Games                                            [+ Create] │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search games...                    ]                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Filters:                                                │ │
│ │ Season: [All Seasons            ▼] ☐ Include unassigned │ │
│ │ Type:   [All Types              ▼] ☐ Include unassigned │ │
│ │ Status: [All Statuses           ▼]                      │ │
│ │                              [Clear] [Apply]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ All | Setup | In Progress | Completed                      │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Games Grid (4 games found)                                 │
│ ┌─────────────────┐ ┌─────────────────┐                   │
│ │ vs Eagles       │ │ vs Cardinals    │                   │
│ │ Season 2025     │ │ (No season)     │                   │
│ │ [Start Game]    │ │ [Start Game]    │                   │
│ └─────────────────┘ └─────────────────┘                   │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐                   │
│ │ vs Pirates      │ │ vs Dodgers      │                   │
│ │ Season 2025     │ │ Regular Season  │                   │
│ │ [Continue]      │ │ [View Results]  │                   │
│ └─────────────────┘ └─────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Default Landing Page (Games)

### Games Page as Default Landing

```
┌─────────────────────────────────────────────────────────────┐
│ ⚾ Breaking-Bat                                        [☰]  │
├─────────────────────────────────────────────────────────────┤
│ Games                                            [+ Create] │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search games...                    ]                    │
│                                                             │
│ All | Setup | In Progress | Completed                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 🏠 vs Eagles    │ │ 🏠 vs Cardinals │ │ 🚌 @ Pirates    │ │
│ │ July 15, 2025   │ │ July 20, 2025   │ │ July 22, 2025   │ │
│ │ Season 2025     │ │ (No season)     │ │ Season 2025     │ │
│ │ Setup           │ │ Setup           │ │ In Progress     │ │
│ │                 │ │                 │ │                 │ │
│ │ [Start Game]    │ │ [Start Game]    │ │ [Continue]      │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐                   │
│ │ 🏠 vs Dodgers   │ │ 🚌 @ Mets       │                   │
│ │ July 10, 2025   │ │ July 8, 2025    │                   │
│ │ Regular Season  │ │ Season 2025     │                   │
│ │ Completed       │ │ Completed       │                   │
│ │ W 8-6           │ │ L 4-7           │                   │
│ │ [View Results]  │ │ [View Results]  │                   │
│ └─────────────────┘ └─────────────────┘                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│    👥        ⚾        📊        ⚙️                        │
│   Teams     Games     Stats    Settings                     │
└─────────────────────────────────────────────────────────────┘
```

## Accessibility Improvements

### Enhanced Focus States

```
┌─────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════╗   │
│ ║ Games                                    [+ Create]   ║   │ ← Focused Header
│ ╚═══════════════════════════════════════════════════════╝   │
├─────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════╗   │
│ ║ 🔍 Search games...                                    ║   │ ← Focused Input
│ ╚═══════════════════════════════════════════════════════╝   │
│                                                             │
│ All | Setup | In Progress | Completed                      │
│     ╔═════╗                                                │ ← Focused Tab
│     ║Setup║                                                │
│     ╚═════╝                                                │
└─────────────────────────────────────────────────────────────┘
```

### Screen Reader Improvements

```
<!-- Enhanced ARIA labels and structure -->
<main role="main" aria-label="Games management page">
  <h1>Games</h1>

  <section aria-label="Game filters and search">
    <input aria-label="Search games by name or opponent" />
    <div role="tablist" aria-label="Filter games by status">
      <button role="tab" aria-selected="true">All games</button>
      <button role="tab" aria-selected="false">Setup games</button>
    </div>
  </section>

  <section aria-label="Games list" aria-live="polite">
    <div role="grid" aria-label="Games grid">
      <article role="gridcell" aria-label="Game vs Eagles, July 15">
        <!-- Game card content -->
      </article>
    </div>
  </section>
</main>
```

## Success Indicators

### Visual Design Success

- ✅ Cleaner, less cluttered interface
- ✅ Improved visual hierarchy with better grouping
- ✅ Consistent spacing and typography
- ✅ Better mobile touch targets and spacing

### User Experience Success

- ✅ Faster access to primary workflow (Games)
- ✅ Logical grouping of related functionality
- ✅ Reduced decision fatigue with fewer options
- ✅ Progressive disclosure for advanced features

### Technical Success

- ✅ Responsive design works across all breakpoints
- ✅ Accessibility standards maintained/improved
- ✅ Performance not degraded by changes
- ✅ Existing functionality preserved during consolidation
