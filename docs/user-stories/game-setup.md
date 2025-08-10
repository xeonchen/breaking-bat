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

## Notes

- This directly impacts game flow efficiency
- Interface should be optimized for quick setup
- Must work reliably on mobile/tablet devices
