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

  # Multiple Player Positions Management
  @AC007
  Scenario: Assign multiple positions to a player with first as default
    Given I am adding a new player "John Smith"
    When I assign positions in order: ["Shortstop", "Second Base", "Third Base"]
    And I save the player
    Then the player should have positions ["Shortstop", "Second Base", "Third Base"]
    And the default position should be "Shortstop"
    And the player should be saved successfully

  @AC007
  Scenario: Player's getDefaultPosition() returns first position
    Given I have a player "Jane Doe" with positions ["Pitcher", "First Base"]
    When I call getDefaultPosition() on the player
    Then it should return "Pitcher"

  @AC007
  Scenario: Player positions display shows abbreviations
    Given I have a player "Mike Johnson" with positions ["Pitcher", "Catcher", "First Base"]
    When I view the player's positions display
    Then it should show "P, C, 1B"

  @AC008
  Scenario: Reorder player positions to change default position
    Given I have a player "Sarah Wilson" with positions ["Second Base", "Shortstop", "Third Base"]
    When I reorder the positions to ["Shortstop", "Second Base", "Third Base"]
    And I save the changes
    Then the default position should be "Shortstop"
    And the positions array should be ["Shortstop", "Second Base", "Third Base"]

  @AC008
  Scenario: Position reordering updates default position immediately
    Given I have a player with positions ["Center Field", "Left Field", "Right Field"]
    And the current default position is "Center Field"
    When I move "Right Field" to the first position
    Then the new default position should be "Right Field"
    And the positions array should be ["Right Field", "Center Field", "Left Field"]

  @AC009
  Scenario: Add position to existing player's position list
    Given I have a player "Tom Brown" with positions ["First Base", "Third Base"]
    When I add position "Pitcher" to the player's positions
    And I save the changes
    Then the player should have positions ["First Base", "Third Base", "Pitcher"]
    And the default position should remain "First Base"

  @AC009
  Scenario: Remove position from player maintaining array integrity
    Given I have a player "Lisa Green" with positions ["Pitcher", "Catcher", "First Base"]
    When I remove position "Catcher" from the player's positions
    And I save the changes
    Then the player should have positions ["Pitcher", "First Base"]
    And the default position should remain "Pitcher"

  @AC010
  Scenario: Position validation prevents duplicate positions for same player
    Given I have a player "Alex Rodriguez" with positions ["Shortstop", "Third Base"]
    When I try to add position "Shortstop" again
    Then I should see a validation error "Position already assigned to player"
    And the positions array should remain ["Shortstop", "Third Base"]

  @AC010
  Scenario: All 11 positions available for assignment
    Given I am editing a player's positions
    When I view the available positions list
    Then I should see all 11 positions: ["Pitcher", "Catcher", "First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field", "Short Fielder", "Extra Player"]
    And each position should be selectable