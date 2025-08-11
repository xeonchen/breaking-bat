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

- Given I am on the Games page, I can create a new game with game name, opponent, date, season, game type, and home/away designation
- Given I create a new game, the game should be saved with status "setup"
- Given I create a new game, I should see it listed in the games interface

### Lineup Setup Interface

- Given I have created a game, I should see a "Setup Lineup" button on the game card
- Given I click "Setup Lineup", a lineup management modal should open
- Given the lineup modal is open, I should see all team players available for selection
- Given the lineup modal is open, I should be able to set batting order (1-9 positions minimum)
- Given the lineup modal is open, I should be able to assign defensive positions to each player

### Lineup Validation

- Given I have not completed the lineup setup, the "Start Game" button should be disabled
- Given I have assigned fewer than 9 batting positions, the lineup should be marked as incomplete
- Given I have not assigned all defensive positions, the lineup should be marked as incomplete
- Given I complete a valid lineup (9+ batting positions, all defensive positions assigned), the "Start Game" button should be enabled

### Game State Transitions

- Given I have a complete lineup, when I click "Start Game", the game status should change to "in_progress"
- Given I have a complete lineup, when I click "Start Game", I should be redirected to the scoring interface
- Given the game has started, the "Setup Lineup" button should be replaced with "View/Edit Lineup"

### Data Persistence

- Given I make changes to the lineup, they should be saved automatically
- Given I close the lineup modal without completing setup, my progress should be preserved
- Given I complete the lineup setup, the game's lineupId should be populated

## Priority

High

## Dependencies

- team-management (requires teams and players to be created first)

## Notes

- This directly impacts game flow efficiency
- Interface should be optimized for quick setup
- Must work reliably on mobile/tablet devices
