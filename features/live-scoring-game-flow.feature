Feature: Game Flow Integration and Data Persistence
  As a Scorekeeper, I want all game data to be saved immediately and scoring to integrate with game state
  So that no data is lost during live gameplay and the interface works correctly

  Background:
    Given I have teams and players set up
    And I am on the live scoring page

  @AC011
  Scenario: All at-bat data immediately saved to prevent data loss
    Given I have a game in "in-progress" status
    And I am recording an at-bat
    When I click the "Triple" button
    Then the at-bat data should be saved to IndexedDB within 100ms
    And the save operation should complete before showing success feedback
    And if I refresh the browser, the at-bat should still be recorded
    And the game state should be fully restored

  @AC011-data-persistence
  Scenario: Immediate data persistence during rapid scoring
    Given I am scoring a game with multiple quick at-bats
    When I record the following results in rapid succession:
      | Batter  | Result    |
      | Smith   | Single    |
      | Jones   | Double    |
      | Brown   | Home Run  |
    Then each at-bat should be saved before the next one is processed
    And all three at-bats should be persisted to the database
    And the game statistics should reflect all three results
    And no data should be lost due to rapid input

  @AC012
  Scenario: Scoring interface integrates with game state
    Given I have a game in "setup" status (not started)
    When I navigate to the live scoring page
    Then the scoring interface should be disabled or show appropriate message
    And I should not be able to record at-bats
    And I should see an option to start the game first

  @AC012-game-state-integration
  Scenario: Scoring only works during in-progress games
    Given I have a game in "completed" status
    When I try to access the live scoring page
    Then the at-bat form should be disabled
    And I should see a message indicating the game is complete
    And I should have options to view final stats or start a new game

  @AC012-suspended-game-handling
  Scenario: Handle suspended game state in scoring interface
    Given I have a game in "suspended" status
    When I navigate to the live scoring page
    Then I should see an option to resume the game
    And the scoring interface should be disabled until resumed
    When I choose to resume the game
    Then the scoring interface should become active
    And I should be able to record at-bats normally

  @AC013
  Scenario: Display both teams' scores by inning with running totals
    Given I have a game with the following inning scores:
      | Inning | Home | Away |
      | 1      | 0    | 2    |
      | 2      | 1    | 0    |
      | 3      | 2    | 1    |
    When I view the live scoring page
    Then the scoreboard should display each inning's runs correctly
    And the running totals should show Home: 3, Away: 3
    And the current inning should be highlighted
    And the scoreboard should update as new runs are scored

  @AC013-scoreboard-display
  Scenario: Real-time scoreboard updates with visual feedback
    Given the current score is Home: 5, Away: 4
    And it is the bottom of the 7th inning
    When a run is scored for the home team
    Then the scoreboard should immediately show Home: 6, Away: 4
    And the score change should be visually highlighted
    And the 7th inning home column should show the new run
    And the change should be announced for screen readers

  @AC014
  Scenario: Interface optimized for quick, accurate input during live gameplay
    Given I am scoring a live game
    When I need to record an at-bat quickly
    Then the most common buttons (Single, Out, etc.) should be prominently displayed
    And I should be able to record results with minimal taps/clicks
    And the interface should provide immediate feedback for each action
    And there should be no unnecessary confirmation dialogs for basic actions

  @AC015
  Scenario: Interface works well with touch input on tablets
    Given I am using a tablet in landscape mode
    And I am viewing the live scoring page
    Then all buttons should be large enough for easy finger tapping
    And the layout should be optimized for tablet screen size
    And touch gestures should work smoothly throughout the interface
    And there should be no accidental input issues

  @AC016
  Scenario: All scoring actions provide immediate visual feedback
    Given I am viewing the at-bat form
    When I tap the "Double" button
    Then the button should show immediate visual feedback (highlight/press state)
    And a success message should appear confirming the result was recorded
    And the current batter should advance to the next player
    And the baserunners should update visually to show new positions
    And any score changes should be highlighted on the scoreboard

  @AC016-feedback-responsiveness
  Scenario: Visual feedback for various scoring actions
    Given I am actively scoring a game
    When I perform the following actions:
      | Action              | Expected Feedback                      |
      | Record strikeout    | Button highlight + "Strikeout recorded" |
      | Score a run         | Score update + run announcement         |
      | Advance inning      | Inning change + visual transition       |
      | Complete at-bat     | Batter advance + lineup update          |
    Then each action should provide clear, immediate visual confirmation
    And the feedback should be appropriate for the action performed
    And users should never wonder if their input was registered