Feature: Game Setup and Lineup Management
  As a Scorekeeper, I want to create new games and configure starting lineups efficiently so that I can quickly prepare for game recording with proper team selection, opponent details, and batting order.

  Background:
    Given I am on the application home page
    And I have at least one team with 10 or more active players

  @AC001
  Scenario: Display game creation interface
    Given I navigate to the Games page
    Then I should see a "Create Game" button
    And I should see any existing games listed

  @AC001 @AC002 @AC003
  Scenario: Create a new game successfully
    Given I am on the Games page
    When I click the "Create Game" button
    And I fill in the game name "Test Game"
    And I fill in the opponent "Rival Team"
    And I set the game date to today
    And I select "home" for home/away
    And I select a team
    And I submit the game creation form
    Then I should see "Test Game" in the games list
    And the game status should be "setup"
    And I should see a "Setup Lineup" button for the game

  @AC012 @AC015
  Scenario: Start Game button is disabled without lineup
    Given I have created a game "Test Game"
    And I am on the Games page
    Then I should see the "Start Game" button is disabled
    And I should see a "Setup Lineup" button for the game

  @AC007 @AC008 @AC009
  Scenario: Open lineup setup modal
    Given I have created a game "Test Game"
    And I am on the Games page
    When I click the "Setup Lineup" button for "Test Game"
    Then the lineup setup modal should open
    And I should see the modal title "Setup Lineup for Test Game"
    And I should see all team players available for selection
    And I should see batting order positions 1-15 available
    And I should see defensive position options available

  @AC010 @AC011 @AC015
  Scenario: Create complete starting lineup
    Given I have created a game "Test Game"
    And I have opened the lineup setup modal
    When I assign 9 players to batting positions 1-9
    And I assign defensive positions to each of those 9 players
    And I save the lineup
    Then the lineup should be marked as complete
    And the modal should close
    And I should see "Lineup Complete" indicator on the game

  Scenario: Enable Start Game button after complete lineup
    Given I have created a game "Test Game"
    And I have set up a complete lineup with 9 players
    And I am on the Games page
    Then I should see the "Start Game" button is enabled
    And I should see "View/Edit Lineup" instead of "Setup Lineup"

  Scenario: Start game with complete lineup
    Given I have created a game "Test Game"
    And I have set up a complete lineup with 9 players
    And I am on the Games page
    When I click the "Start Game" button
    Then the game status should change to "in_progress"
    And I should be redirected to the scoring interface
    And I should see the batting order displayed

  Scenario: Validate minimum batting positions
    Given I have created a game "Test Game"
    And I have opened the lineup setup modal
    When I assign only 5 players to batting positions
    And I try to save the lineup
    Then I should see an error message "Lineup must have at least 9 batting positions"
    And the lineup should not be saved
    And the "Start Game" button should remain disabled

  Scenario: Validate unique defensive positions
    Given I have created a game "Test Game"
    And I have opened the lineup setup modal
    And I have assigned 9 players to batting positions
    When I try to assign the "Pitcher" position to two different players
    Then I should see an error message "Each defensive position can only be assigned to one player"
    And the second assignment should be rejected
    And the lineup should remain incomplete

  Scenario: Validate batting order sequence
    Given I have created a game "Test Game"
    And I have opened the lineup setup modal
    When I try to assign players to batting positions 1, 3, 5 (skipping 2 and 4)
    Then I should see an error message "Batting order must be sequential starting from 1"
    And the lineup should be marked as invalid

  Scenario: Preserve partial lineup progress
    Given I have created a game "Test Game"
    And I have opened the lineup setup modal
    And I have assigned 5 players to batting positions
    When I close the modal without saving
    And I reopen the lineup setup modal
    Then I should see my previous 5 player assignments preserved
    And I should be able to continue from where I left off

  Scenario: Handle team with insufficient players
    Given I have a team with only 6 active players
    And I have created a game using that team
    When I open the lineup setup modal
    Then I should see a warning "Selected team has only 6 active players available"
    And I should not be able to create a complete 9-player lineup
    And the "Start Game" button should remain disabled

  Scenario: Add substitute players to lineup
    Given I have created a game "Test Game"
    And I have set up a complete 9-player starting lineup
    And I have opened the lineup setup modal
    When I add 3 additional players as substitutes
    And I save the lineup
    Then the substitutes should be available for in-game substitutions
    And the starting lineup should remain unchanged
    And the "Start Game" button should remain enabled

  Scenario: Edit existing lineup before game starts
    Given I have created a game "Test Game"
    And I have set up a complete lineup
    And I am on the Games page
    When I click "View/Edit Lineup" for the game
    Then the lineup setup modal should open
    And I should see my current lineup configuration
    When I change the batting order of two players
    And I save the lineup
    Then the changes should be reflected
    And the "Start Game" button should remain enabled

  Scenario: Cannot edit lineup after game starts
    Given I have created a game "Test Game"
    And I have set up a complete lineup
    And I have started the game
    Then I should not see a "Setup Lineup" button
    And I should not see a "View/Edit Lineup" button
    And the lineup should be locked for the duration of the game

  # Smart Defaults for Quick Game Creation
  @AC001
  Scenario: Auto-generated game name from season and date
    When I click the "Create Game" button
    Then I should see the game name field auto-populated with a name in the format "[Season Name] - [Date]"
    And the date should be today's date in YYYY-MM-DD format
    And the game name should not be empty

  @AC002
  Scenario: Most recently selected team is pre-selected
    Given I have previously created a game with team "Red Sox"
    When I click the "Create Game" button
    Then the team dropdown should be pre-selected with "Red Sox"

  @AC003
  Scenario: First available team when no history exists
    Given I have no previous game creation history
    And there are multiple teams available
    When I click the "Create Game" button
    Then the team dropdown should be pre-selected with the first available team

  @AC004
  Scenario: Season and game type remember last selection
    Given I have previously created a game with season "2024 Fall" and game type "Regular Season"
    When I click the "Create Game" button
    Then the season dropdown should be pre-selected with "2024 Fall"
    And the game type dropdown should be pre-selected with "Regular Season"

  @AC005
  Scenario: Smart defaults work with first-time usage
    Given I am using the application for the first time
    And there are teams, seasons, and game types available
    When I click the "Create Game" button
    Then the game name should be auto-generated using the first available season
    And the team should be pre-selected as the first available team
    And the season should be pre-selected as the first available season
    And the game type should be pre-selected as the first available game type

  @AC006
  Scenario: Game name updates when season changes
    Given the create game modal is open
    And the game name has not been manually modified
    When I change the season selection to "2025 Spring"
    Then the game name should automatically update to include "2025 Spring"
    And the date portion should remain unchanged

  @AC007
  Scenario: Manual game name override prevents auto-updates
    Given the create game modal is open
    When I manually change the game name to "Special Championship Game"
    And I change the season selection
    Then the game name should remain "Special Championship Game"
    And it should not be overridden by auto-generation

  @AC008
  Scenario: Smart defaults persist across application restarts
    Given I have created a game with specific team, season, and game type selections
    When I close and restart the application
    And I click the "Create Game" button
    Then the team, season, and game type should be pre-selected with my last choices
    And the defaults should be retrieved from localStorage

  @AC009
  Scenario: Form validation works with smart defaults
    Given the create game modal is open with smart defaults populated
    When I clear the required opponent field
    And I try to submit the form
    Then I should see a validation error "Opponent is required"
    And the form should not submit
    And all other smart default values should remain intact

  @AC010
  Scenario: Smart defaults handle missing data gracefully
    Given there are no teams available in the system
    When I click the "Create Game" button
    Then the team dropdown should be empty but not cause errors
    And other fields should still have appropriate defaults where possible
    And the form should show appropriate messaging for missing data