Feature: Game Setup with Smart Defaults
  As a Scorekeeper, I want the game creation form to auto-populate with smart default values
  so that I can quickly create games without repeatedly entering the same information.

  Background:
    Given I have loaded sample data with teams, seasons, and game types
    And I am on the Games page

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
    Then the game name should update to include "2025 Spring" in the name
    And the date portion should remain unchanged

  @AC007
  Scenario: Game name updates when game type changes
    Given the create game modal is open
    And the game name has not been manually modified
    When I change the game type to "Playoffs"
    Then the game name should update to include "Playoffs" as a prefix
    And the format should be "Playoffs - [Season Name] - [Date]"

  @AC008
  Scenario: Game name updates when date changes
    Given the create game modal is open
    And the game name has not been manually modified
    When I change the date to "2025-12-25"
    Then the game name should update to use "2025-12-25" in the name
    And the season portion should remain unchanged

  @AC009
  Scenario: Manual game name modification prevents auto-updates
    Given the create game modal is open
    When I manually change the game name to "Championship Final"
    And I change the season selection
    Then the game name should remain "Championship Final"
    And it should not be auto-updated

  @AC010
  Scenario: Selected values persist to localStorage
    Given the create game modal is open
    When I select team "Blue Jays"
    And I select season "2025 Spring"
    And I select game type "Tournament"
    And I close the modal without creating a game
    And I reopen the create game modal
    Then the team should be pre-selected as "Blue Jays"
    And the season should be pre-selected as "2025 Spring"
    And the game type should be pre-selected as "Tournament"

  @AC011
  Scenario: Form can be cleared to test validation
    Given the create game modal is open
    When I clear the auto-populated team field
    And I clear the opponent field
    And I click "Create"
    Then I should see validation errors for required fields
    And the modal should remain open

  @AC012
  Scenario: Smart defaults work with successful game creation
    Given the create game modal is open
    And all fields have smart default values
    When I enter "Yankees" as the opponent
    And I click "Create"
    Then the game should be created successfully
    And I should see a success message
    And the modal should close
    And the new game should appear in the games list

  @AC013
  Scenario: Form resets with smart defaults after successful creation
    Given I have successfully created a game
    When I click the "Create Game" button again
    Then all fields should be populated with smart defaults
    And the game name should be auto-generated with today's date
    And the manually modified flag should be reset

  @AC014
  Scenario: Game name generation handles missing data gracefully
    Given there are no seasons available
    When I click the "Create Game" button
    Then the game name field should be empty
    And no auto-generation should occur

  @AC015
  Scenario: Date selector works independently of smart defaults
    Given the create game modal is open
    When I change the date to "2025-06-15"
    Then the date field should show "2025-06-15"
    And the game name should update to reflect the new date if not manually modified

  @AC016
  Scenario: Home/Away selection defaults to Home
    Given the create game modal is open
    Then the Home/Away field should be pre-selected to "Home"

  @AC017
  Scenario: All dropdown options are populated correctly
    Given the create game modal is open
    Then the team dropdown should contain all available teams
    And the season dropdown should contain all available seasons
    And the game type dropdown should contain all available game types
    And each dropdown should have a "Select a..." placeholder option

  @AC018
  Scenario: Smart defaults preserve user workflow
    Given I am creating multiple games in sequence
    When I create a game with team "Red Sox" and season "2024 Fall"
    And I immediately create another game
    Then the new game form should remember "Red Sox" and "2024 Fall"
    And the workflow should be streamlined for batch game creation

  @AC019
  Scenario: Generated game name includes game type prefix when selected
    Given the create game modal is open
    And game type "Championship" is selected
    And season "2024 Fall" is selected
    And date is "2024-08-15"
    Then the generated game name should be "Championship - 2024 Fall - 2024-08-15"

  @AC020
  Scenario: Generated game name excludes game type when none selected
    Given the create game modal is open
    And no game type is selected
    And season "2024 Fall" is selected  
    And date is "2024-08-15"
    Then the generated game name should be "2024 Fall - 2024-08-15"

  @AC021
  Scenario: localStorage integration persists across browser sessions
    Given I have selected specific teams, seasons, and game types
    And I close the browser
    When I reopen the application
    And I navigate to the Games page
    And I click "Create Game"
    Then my previous selections should still be remembered
    And the smart defaults should reflect my last usage patterns