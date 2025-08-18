# User Story: Pre-Game Lineup Configuration

## ID

lineup-configuration

## As a...

Scorekeeper

## I want to...

Configure starting lineups and batting orders efficiently with an intuitive drag-and-drop interface and real-time validation

## So that I can...

Set up complete lineups quickly with minimal errors, ensuring all positions are filled and batting order is optimized

## Acceptance Criteria

### Lineup Setup Interface Access

- **lineup-configuration:AC001**: Given I have created a game, I should see a "Setup Lineup" button on the game card
- **lineup-configuration:AC002**: Given I click "Setup Lineup", a lineup management modal should open
- **lineup-configuration:AC003**: Given the lineup modal is open, I should see the modal title "Setup Lineup for [Game Name]"
- **lineup-configuration:AC004**: Given the lineup modal is open, I should see all team players available for selection

### Default Player Display and Organization

- **lineup-configuration:AC005**: Given I open the lineup setup modal, all team players should be displayed by default
- **lineup-configuration:AC006**: Given all players are displayed, the upper section should show starting players (configurable count)
- **lineup-configuration:AC007**: Given all players are displayed, the lower section should show bench players
- **lineup-configuration:AC008**: Given I haven't set up any lineup yet, all players should initially appear in the bench section

### Configurable Starting Positions

- **lineup-configuration:AC009**: Given I am setting up a lineup, I should be able to configure the number of starting positions (9-12 selectable in UI with default of 10)
- **lineup-configuration:AC010**: Given I change the starting position count, the interface should adjust the starting/bench sections accordingly
- **lineup-configuration:AC011**: Given I increase starting positions, additional slots should appear in the starting section
- **lineup-configuration:AC012**: Given I decrease starting positions, excess players should move to the bench section
- **lineup-configuration:AC013**: Given I save a lineup, the starting position count should be saved along with the batting order and positions

### Drag-and-Drop Batting Order Interface

- **lineup-configuration:AC014**: Given I want to reorder the batting lineup, I should be able to drag player rows to reorder them
- **lineup-configuration:AC015**: Given I want to reorder players, I should be able to drag a player row and drop it to a new batting position
- **lineup-configuration:AC016**: Given I drag a player, the interface should provide immediate visual feedback with drag handles and drop zones
- **lineup-configuration:AC017**: Given I drop a player in a new position, the batting order should automatically renumber and other players should shift accordingly

### Cross-Section Drag-and-Drop

- **lineup-configuration:AC018**: Given I want to move a bench player to the starting lineup, I should be able to drag a bench player row to any starting lineup position
- **lineup-configuration:AC019**: Given I want to move a starting player to the bench, I should be able to drag a starting lineup row to the bench section
- **lineup-configuration:AC020**: Given I perform cross-section drag-and-drop, position assignments should be maintained and the interface should update immediately

### Defensive Position Assignment

- **lineup-configuration:AC021**: Given the lineup modal is open, I should be able to assign defensive positions to each player
- **lineup-configuration:AC022**: Given a player has multiple positions available, their default defensive position should be pre-selected in the position dropdown
- **lineup-configuration:AC023**: Given I need to select a player's defensive position, I should use dropdown selectors showing all 11 positions (P/C/1B/2B/3B/SS/LF/CF/RF/SF/EP)
- **lineup-configuration:AC024**: Given I am viewing positions, they should display in format "Pitcher (P)", "First Base (1B)", "Catcher (C)", etc.
- **lineup-configuration:AC025**: Given a player is assigned to a position, I should see the position abbreviation clearly displayed

### Auto-Fill and Smart Defaults

- **lineup-configuration:AC026**: Given I add players to the lineup, their first (default) position should be automatically pre-selected
- **lineup-configuration:AC027**: Given auto-fill assigns positions, duplicate positions are acceptable and left for user to resolve
- **lineup-configuration:AC028**: Given I change a player's assignment, the auto-fill behavior should not override my manual changes
- **lineup-configuration:AC029**: Given I perform lineup actions, smart defaults should speed up the process without limiting flexibility

### Real-Time Validation and Feedback

- **lineup-configuration:AC030**: Given I assign duplicate positions, those positions should be highlighted immediately (not just when saving)
- **lineup-configuration:AC031**: Given I fix a duplicate position, the highlighting should disappear immediately
- **lineup-configuration:AC032**: Given there are validation errors, they should be clearly visible with specific error messages
- **lineup-configuration:AC033**: Given there are position conflicts, the conflicting positions should be highlighted in a distinct color
- **lineup-configuration:AC034**: Given the lineup is incomplete, a progress indicator should show what's missing
- **lineup-configuration:AC035**: Given the lineup is complete and valid, this should be clearly indicated with a success state

### Lineup Validation Rules

- **lineup-configuration:AC036**: Given I have assigned fewer than the configured starting positions (9-12), the lineup should be marked as incomplete
- **lineup-configuration:AC037**: Given I have not assigned all defensive positions, the lineup should be marked as incomplete
- **lineup-configuration:AC038**: Given I complete a valid lineup (configured starting positions filled, all defensive positions assigned), the save button should be enabled
- **lineup-configuration:AC039**: Given there are no validation errors, the "Start Game" button should become available

### Data Persistence and State Management

- **lineup-configuration:AC040**: Given I make changes to the lineup, they should be saved automatically
- **lineup-configuration:AC041**: Given I close the lineup modal without completing setup, my progress should be preserved
- **lineup-configuration:AC042**: Given I complete the lineup setup, the game's lineupId should be populated
- **lineup-configuration:AC043**: Given I reopen the lineup setup, all my previous configurations should be restored exactly

### Visual Interface Consistency

- **lineup-configuration:AC044**: Given I view bench players, they should have the same visual style and layout as starting lineup players
- **lineup-configuration:AC045**: Given a bench player has a defensive position assigned, I should be able to view and modify their position assignment using the same interface
- **lineup-configuration:AC046**: Given the interface is displayed on mobile/tablet, drag-and-drop should work smoothly with touch gestures

## Priority

High

## Dependencies

- game-creation (requires games to exist)
- roster-management (requires teams with players and position assignments)

## Definition of Done

- [ ] DSL spec created and reviewed
- [ ] API contract defined
- [ ] Tests written and passing
- [ ] Code implementation complete
- [ ] All quality gates passed
- [ ] Documentation updated

## Notes

- Critical for game workflow - affects all subsequent scoring activities
- Enhanced UX reduces setup time and errors significantly
- Must work reliably on mobile/tablet devices for on-site use
- Drag-and-drop interface should be intuitive for non-technical users
- Real-time validation prevents game-day lineup issues
