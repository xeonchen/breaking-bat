Feature: Team and Player Management
  As a Scorekeeper, I want to create and manage teams, seasons, game types, and player rosters so that I can organize data by different teams and events throughout various seasons.

  Background:
    Given I am on the application home page
    And the local database is available

  Scenario: Display teams management interface
    Given I navigate to the Teams page
    Then I should see a "Create Team" button
    And I should see any existing teams listed
    And I should see team management options

  Scenario: Create a new team successfully
    Given I am on the Teams page
    When I click the "Create Team" button
    And I fill in the team name "Hawks Baseball"
    And I fill in the team year "2025"
    And I submit the team creation form
    Then I should see "Hawks Baseball" in the teams list
    And the team should be saved to local storage
    And I should see team management options for "Hawks Baseball"

  Scenario: Add players to team roster
    Given I have created a team "Eagles Softball"
    And I am viewing the team details page
    When I click the "Add Player" button
    And I fill in player name "John Smith"
    And I fill in jersey number "12"
    And I select primary position "First Base"
    And I submit the player creation form
    Then I should see "John Smith (#12)" in the team roster
    And the player should be saved to local storage
    And the player should have primary position "First Base"

  Scenario: Manage multiple players on roster
    Given I have created a team "Thunder"
    And I am viewing the team roster
    When I add 15 players to the roster
    Then I should see all 15 players listed
    And each player should have unique jersey numbers
    And each player should have assigned positions
    And the full roster should be saved to local storage

  Scenario: Edit existing player information
    Given I have a team "Lions" with player "Mike Johnson (#8)"
    And I am viewing the team roster
    When I click "Edit" for "Mike Johnson"
    And I change the jersey number to "15"
    And I add "Catcher" as a secondary position
    And I save the changes
    Then I should see "Mike Johnson (#15)" in the roster
    And the player should have "Catcher" as an additional position
    And the changes should be persisted to local storage

  Scenario: Remove player from roster
    Given I have a team "Wolves" with players on the roster
    And I am viewing the team roster
    When I click "Remove" for a specific player
    And I confirm the removal
    Then the player should be removed from the roster display
    And the player should be removed from local storage
    And the remaining players should still be displayed

  Scenario: Create seasons for organizing games
    Given I am on the Seasons page
    When I click the "Create Season" button
    And I fill in season name "Spring 2025"
    And I set the start date to "2025-03-01"
    And I set the end date to "2025-06-30"
    And I submit the season creation form
    Then I should see "Spring 2025" in the seasons list
    And the season should span from "2025-03-01" to "2025-06-30"
    And the season should be saved to local storage

  Scenario: Associate teams with seasons
    Given I have created season "Fall 2024"
    And I have created team "Cardinals"
    When I navigate to season details for "Fall 2024"
    And I click "Add Team to Season"
    And I select "Cardinals" from available teams
    And I confirm the association
    Then "Cardinals" should appear in the season's team list
    And the association should be saved to local storage

  Scenario: Create different game types
    Given I am on the Game Types page
    When I click the "Create Game Type" button
    And I fill in type name "Regular Season"
    And I set the description "Standard league games"
    And I submit the game type creation form
    Then I should see "Regular Season" in the game types list
    And the game type should be available for game creation
    And the game type should be saved to local storage

  Scenario: Manage game types for different contexts
    Given I am managing game types
    When I create game type "Playoffs" with description "Postseason elimination games"
    And I create game type "Tournament" with description "Single or multi-day tournaments"
    And I create game type "Scrimmage" with description "Practice games"
    Then I should see all 3 game types listed
    And each should be available when creating new games
    And all game types should persist in local storage

  Scenario: Set player positions and specializations
    Given I have team "Raptors" with player "Sarah Davis"
    When I edit "Sarah Davis" player details
    And I set primary position to "Pitcher"
    And I add secondary positions "First Base" and "Outfield"
    And I save the position assignments
    Then "Sarah Davis" should show "Pitcher" as primary position
    And she should have "First Base" and "Outfield" as secondary positions
    And the position data should be saved to local storage

  Scenario: Validate jersey number uniqueness within team
    Given I have team "Vipers" with player wearing jersey "#7"
    When I try to add a new player with jersey "#7"
    Then I should see an error message "Jersey number 7 is already taken"
    And the new player should not be added
    And I should be prompted to choose a different number

  Scenario: Handle team data persistence across sessions
    Given I have created team "Sharks" with 10 players
    And I have created season "Summer League 2025"
    When I close and reopen the application
    And I navigate to the Teams page
    Then I should see "Sharks" in the teams list
    And "Sharks" should still have all 10 players
    And "Summer League 2025" should still exist in seasons

  Scenario: Export team and player data
    Given I have team "Panthers" with complete roster
    And I am viewing team management options
    When I click "Export Team Data"
    And I select "JSON" format
    Then I should receive a downloadable JSON file
    And the file should contain all team information
    And the file should include all player details and positions

  Scenario: Import team data from backup
    Given I have a valid team data JSON export file
    And I am on the Teams page
    When I click "Import Team Data"
    And I select the JSON file
    And I confirm the import
    Then the team should be restored with all players
    And all player positions and details should be preserved
    And the imported data should be saved to local storage

  Scenario: Manage team in offline mode
    Given the application is running offline
    And I am on the Teams page
    When I create team "Storm" with 5 players
    And I assign positions to all players
    Then all data should be saved locally
    And the team should be fully functional for game creation
    And no network errors should occur