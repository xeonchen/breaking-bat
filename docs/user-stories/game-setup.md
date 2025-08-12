# User Story: Game Setup and Lineup Management

## ID

game-setup

## As a...

Scorekeeper

## I want to...

Create new games and set up starting lineups efficiently on the same page

## So that I can...

Quickly prepare for game recording with proper team selection, opponent details, and batting order

## Acceptance Criteria

### Game Creation

- **AC001**: Given I am on the Games page, I can create a new game with smart default values:
  - Game name: automatically generated as "[Season Name] - [Date]" (e.g., "2025 Fall Season - 2025-08-08")
  - Game name: updates automatically when season or game type changes, unless user has manually modified it
  - Opponent: left blank for user input
  - Date: today's date pre-filled
  - Team: most recently selected team, or first available team if no history
  - Season: most recently selected season, or first available season if no history
  - Game Type: most recently selected game type, or first available game type if no history
  - Home/Away: defaults to "home"
- **AC002**: Given I create a new game, the game should be saved with status "setup"
- **AC003**: Given I create a new game, I should see it listed in the games interface
- **AC004**: Given I open the create game form, the date input should display today's date by default
- **AC005**: Given the date input has today's date as default, I should be able to submit the form without changing the date
- **AC006**: Given the date input has today's date as default, I should be able to change it to any valid future or past date

### Lineup Setup Interface

- **AC007**: Given I have created a game, I should see a "Setup Lineup" button on the game card
- **AC008**: Given I click "Setup Lineup", a lineup management modal should open
- **AC009**: Given the lineup modal is open, I should see all team players available for selection
- **AC010**: Given the lineup modal is open, I should be able to set batting order with configurable starting positions (9-12 selectable in UI, default 10)
- **AC011**: Given the lineup modal is open, I should be able to assign defensive positions to each player

### Lineup Validation

- **AC012**: Given I have not completed the lineup setup, the "Start Game" button should be disabled
- **AC013**: Given I have assigned fewer than the configured starting positions (9-12), the lineup should be marked as incomplete
- **AC014**: Given I have not assigned all defensive positions, the lineup should be marked as incomplete
- **AC015**: Given I complete a valid lineup (configured starting positions filled, all defensive positions assigned), the "Start Game" button should be enabled

### Game State Transitions

- **AC016**: Given I have a complete lineup, when I click "Start Game", the game status should change to "in_progress"
- **AC017**: Given I have a complete lineup, when I click "Start Game", I should be redirected to the scoring interface
- **AC018**: Given the game has started, the "Setup Lineup" button should be replaced with "View/Edit Lineup"

### Data Persistence

- **AC019**: Given I make changes to the lineup, they should be saved automatically
- **AC020**: Given I close the lineup modal without completing setup, my progress should be preserved
- **AC021**: Given I complete the lineup setup, the game's lineupId should be populated

## Priority

High

## Dependencies

- team-management (requires teams and players to be created first)

### Complete Workflow Integration

- **AC022**: Given I navigate through the complete workflow, I should be able to create prerequisites (teams, seasons, game types) → create game → setup lineup → start game in one continuous process
- **AC023**: Given I complete the full workflow, the system should handle lineup validation and provide clear feedback at each step
- **AC024**: Given any step fails in the complete workflow, I should get actionable error messages with guidance on resolution

### Game State Management

- **AC025**: Given a game is created, it should start in "setup" state and display appropriate UI actions
- **AC026**: Given a game has started, it should transition to "in_progress" state and show game management controls
- **AC027**: Given a game in progress, I should be able to suspend/pause it, changing state to "suspended"
- **AC028**: Given a suspended game, I should be able to resume it, returning state to "in_progress"
- **AC029**: Given a game in progress or suspended, I should be able to complete it, changing state to "completed"
- **AC030**: Given each state transition, the UI should update to show appropriate actions and prevent invalid operations
- **AC031**: Given I navigate away and return, game states should persist correctly across page refreshes and browser sessions

### Prerequisites Management (Game Types)

- **AC032**: Given I need to create games, I should be able to manage game types through a dedicated interface
- **AC033**: Given I create a game type, I should provide a name (required) and optional description
- **AC034**: Given I create a game type, validation should enforce name requirements (1-100 characters) and description limits (≤500 characters)
- **AC035**: Given I have created game types, I should be able to edit their names and descriptions
- **AC036**: Given I have created game types, I should be able to delete unused game types with confirmation
- **AC037**: Given I create multiple game types, they should appear in a grid layout for easy management

### Prerequisites Management (Seasons)

- **AC038**: Given I need to create games, I should be able to manage seasons through a dedicated interface
- **AC039**: Given I create a season, I should provide a name (required), year, and optional start/end dates
- **AC040**: Given I create a season, validation should enforce that end date is after start date when both are provided
- **AC041**: Given I have created seasons, I should be able to edit their details while maintaining data integrity
- **AC042**: Given I have created seasons, I should be able to delete unused seasons with confirmation
- **AC043**: Given seasons have date ranges, the system should show appropriate status badges (upcoming, active, completed)

## Priority

High

## Dependencies

- team-management (requires teams and players to be created first)

## Notes

- This directly impacts game flow efficiency
- Interface should be optimized for quick setup
- Must work reliably on mobile/tablet devices
- E2E test coverage: complete-game-workflow.spec.ts, game-state-transitions.spec.ts, game-types-management.spec.ts, seasons-management.spec.ts
