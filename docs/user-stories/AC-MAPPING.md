# Acceptance Criteria Mapping

This document tracks the mapping from old AC numbers to new prefixed AC numbers after user story reorganization.

## Format: `story-id:AC###`

### Original `ui-simplification.md` (AC001-AC029)

**Now split into:**

- `app-framework:AC001-AC028` (navigation, mobile, data persistence, compatibility)
- `app-settings:AC001-AC026` (settings interface, themes, data management)

### Original `data-persistence.md` (AC001-AC008)

**Now consolidated into:**

- `app-framework:AC010-AC023` (auto-save, export/import, offline operation, session recovery)

### Original `team-management.md` (AC001-AC013)

**Now split into:**

- `team-management:AC001-AC016` (team creation, organization, data management)
- `roster-management:AC001-AC026` (player creation, positions, jersey numbers, integration)
- `season-and-game-types:AC001-AC030` (season/game type management - originally AC002, AC003)

### Original `game-setup.md` (AC001-AC043)

**Now split into:**

- `game-creation:AC001-AC025` (game creation workflow, smart defaults)
- `lineup-configuration:AC001-AC046` (lineup setup, drag-drop, validation)
- `season-and-game-types:AC020-AC030` (prerequisites management - originally AC032-AC043)

### Original `live-scoring.md` + `innings-management.md` (AC001-AC034)

**Now consolidated into:**

- `live-game-scoring:AC001-AC042` (at-bat recording, baserunners, innings, home/away)

### New User Stories (no original mapping)

- `player-substitutions:AC001-ACxxx` (new)
- `game-statistics:AC001-ACxxx` (new)
- `individual-stats:AC001-ACxxx` (new)
- `sample-data-management:AC001-ACxxx` (from load-sample-data.md)

## Test Reference Updates Required

All test files with @AC tags need to be updated to include story prefixes:

- `@AC001` → `@app-framework:AC001`
- `@AC005 @AC006` → `@roster-management:AC005 @roster-management:AC006`

## Usage in Tests

Examples:

```typescript
test('should create teams with team name (@team-management:AC001)', ...)
test('should handle drag-and-drop lineup (@lineup-configuration:AC014-AC017)', ...)
```

```gherkin
@team-management:AC001
Scenario: Create a new team successfully
```
