Feature: Opponent Half-Inning Management Controls
  As a Scorekeeper, I want to manage workflow during opponent's turn to bat.

  Background:
    Given I am on the live scoring page
    And a game is in progress
    And it is the opponent's turn to bat

  @AC043
  Scenario: Display controls when it's opponent's turn to bat
    When the opponent's turn to bat begins
    Then I should see an alert indicating "Opponent's Turn to Bat"
    And I should see a "Skip to Our Turn" button
    And I should see a "Record Opponent Score" button
    And the at-bat recording interface should be disabled

  @AC044
  Scenario: Skip opponent turn advances to our team's half-inning
    When I click the "Skip to Our Turn" button
    Then the system should advance to my team's half-inning
    And the at-bat recording interface should be enabled
    And I should see a success message "Inning advanced"
    And the inning indicator should show it's our turn to bat

  @AC044-error-handling
  Scenario: Handle errors when skipping opponent turn
    Given the inning advancement will fail
    When I click the "Skip to Our Turn" button
    Then I should see an error message "Error advancing inning"
    And the opponent controls should remain visible
    And the game state should be unchanged

  @AC045
  Scenario: Record opponent scoring opens simplified input interface
    When I click the "Record Opponent Score" button
    Then I should see a simplified opponent scoring interface
    # Note: For now, this shows a "Coming Soon" message per implementation

  @AC045-coming-soon
  Scenario: Record opponent scoring shows coming soon message
    When I click the "Record Opponent Score" button
    Then I should see an info message "Coming Soon"
    And the message should indicate "Opponent scoring interface will be available in a future update"

  @AC046
  Scenario: After opponent scoring is handled, advance to our team's turn
    Given I have completed recording opponent scoring
    When the opponent scoring workflow is finished
    Then the system should advance to my team's turn automatically
    And the at-bat recording interface should be enabled
    And the scoreboard should reflect any opponent runs recorded

  @Integration
  Scenario: Complete opponent half-inning workflow preserves game state
    Given the game is in the 3rd inning
    And there is 1 out
    And the current score is 2-1
    When I click the "Skip to Our Turn" button
    Then the inning should advance appropriately
    And the out count should be reset to 0
    And the current score should be preserved
    And all game metadata should remain intact