# User Story: Enhanced Lineup Management UX

## ID

lineup-management-ux

## As a...

Scorekeeper

## I want to...

Manage game lineups with an intuitive drag-and-drop batting order interface that shows all players by default and provides real-time validation

## So that I can...

Quickly set up lineups with minimal clicking through drag-and-drop reordering, clear visual feedback, and immediate error detection

## Acceptance Criteria

### Default Player Display

- **AC001**: Given I open the lineup setup modal, all team players should be displayed by default
- **AC002**: Given all players are displayed, the upper section should show starting players (configurable count)
- **AC003**: Given all players are displayed, the lower section should show bench players
- **AC004**: Given I haven't set up any lineup yet, all players should initially appear in the bench section

### Configurable Starting Positions

- **AC005**: Given I am setting up a lineup, I should be able to configure the number of starting positions (9-12 selectable in UI with default of 10, theoretically 1-infinite)
- **AC006**: Given I change the starting position count, the interface should adjust the starting/bench sections accordingly
- **AC007**: Given I increase starting positions, additional slots should appear in the starting section
- **AC008**: Given I decrease starting positions, excess players should move to the bench section
- **AC008a**: Given I save a lineup, the starting position count should be saved along with the batting order and positions

### Drag-and-Drop Batting Order Interface

- **AC009**: Given I want to set the lineup, all players should be displayed as draggable rows (no player dropdown needed)
- **AC010**: Given I want to reorder players, I should be able to drag a player row and drop it to a new batting position
- **AC011**: Given I drag a player, the interface should provide immediate visual feedback with drag handles and drop zones
- **AC012**: Given I drop a player in a new position, the batting order should automatically renumber and other players should shift accordingly

### Position Assignment and Display

- **AC013**: Given a player has multiple positions available, their default defensive position should be pre-selected in the position dropdown
- **AC014**: Given I need to select a player's defensive position, I should use dropdown selectors showing all 11 positions (P/C/1B/2B/3B/SS/LF/CF/RF/SF/EP) with smart ordering: player's available positions first, followed by other positions
- **AC015**: Given I am viewing positions, they should display in format "Pitcher (P)", "First Base (1B)", "Catcher (C)", etc.
- **AC016**: Given a player is assigned to a position, I should see the position abbreviation clearly displayed

### Real-Time Validation

- **AC017**: Given I assign duplicate positions, those positions should be highlighted immediately (not just when saving)
- **AC018**: Given I fix a duplicate position, the highlighting should disappear immediately
- **AC019**: Given there are validation errors, they should be clearly visible with specific error messages
- **AC020**: Given there are no validation errors, the save button should be enabled

### Auto-Fill Features

- **AC021**: Given I add players to the lineup, their first (default) position should be automatically pre-selected
- **AC022**: Given auto-fill assigns positions, duplicate positions are acceptable and left for user to resolve
- **AC023**: Given positions are auto-filled, I should still be able to manually adjust any assignments
- **AC024**: Given I change a player's assignment, the auto-fill behavior should not override my manual changes

### Visual Feedback and Error Handling

- **AC025**: Given there are position conflicts, the conflicting positions should be highlighted in a distinct color
- **AC026**: Given a player has no available positions for a role, this should be clearly indicated
- **AC027**: Given the lineup is incomplete, a progress indicator should show what's missing
- **AC028**: Given the lineup is complete and valid, this should be clearly indicated with a success state

## Priority

High

## Dependencies

- team-management (requires players with multiple positions)
- game-setup (integrates with existing lineup setup workflow)

## Notes

- This enhances the existing lineup setup with better UX
- Focus on reducing clicks and providing immediate feedback
- Must work well on touch devices (tablets)
- Should maintain all existing functionality while improving the interface
