Feature: Team Management with Multiple Player Positions
  As a Scorekeeper, I want to assign multiple positions to each player with position ordering
  so that I can track each player's capabilities and set appropriate defaults for lineups.

  Background:
    Given I have a team "Red Sox" created
    And I am on the Team Management page
    And I have all softball positions available: [Pitcher, Catcher, First Base, Second Base, Third Base, Shortstop, Left Field, Center Field, Right Field, Short Fielder, Extra Player]

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
    And I save the player
    Then the player should have positions ["First Base", "Third Base", "Pitcher"]
    And the default position should remain "First Base"

  @AC009
  Scenario: Remove position from player's position list
    Given I have a player "Lisa Davis" with positions ["Catcher", "First Base", "Third Base"]
    When I remove position "First Base" from the player's positions
    And I save the player
    Then the player should have positions ["Catcher", "Third Base"]
    And the default position should remain "Catcher"

  @AC009
  Scenario: Cannot remove all positions from a player
    Given I have a player "Alex Rodriguez" with position ["Extra Player"]
    When I attempt to remove the "Extra Player" position
    Then I should see an error message "Player must have at least one position assigned"
    And the position should not be removed
    And the player should still have ["Extra Player"] position

  @AC010
  Scenario: View all positions a player can play
    Given I have a player "Carlos Mendez" with positions ["Pitcher", "Shortstop", "Center Field", "Extra Player"]
    When I view the player's position capabilities
    Then I should see all positions listed: ["Pitcher", "Shortstop", "Center Field", "Extra Player"]
    And the positions should be displayed with full names and abbreviations
    And they should show: ["Pitcher (P)", "Shortstop (SS)", "Center Field (CF)", "Extra Player (EP)"]

  @AC007
  Scenario: New player defaults to Extra Player if no positions selected
    Given I am creating a new player "Default Player"
    And I don't select any positions
    When I save the player
    Then the player should automatically have position ["Extra Player"]
    And the default position should be "Extra Player"

  @AC007
  Scenario: Position validation ensures at least one position
    Given I am editing a player "Emily Clark" with positions ["Pitcher", "Catcher"]
    When I try to remove all positions
    Then I should see a validation error "Player must have at least one position assigned"
    And the positions should not be removed

  @AC008
  Scenario: Drag and drop reordering of positions
    Given I have a player with positions ["Third Base", "First Base", "Shortstop"]
    When I drag "Shortstop" to the first position
    And I drop it there
    Then the positions should be reordered to ["Shortstop", "Third Base", "First Base"]
    And the default position should update to "Shortstop"

  @AC010
  Scenario: Player position display in different contexts
    Given I have a player "Rachel Green" with positions ["Left Field", "Center Field", "Right Field"]
    When I view the player in the roster list
    Then I should see positions displayed as "LF, CF, RF"
    When I view the player in the lineup setup
    Then I should see the full position names with abbreviations: "Left Field (LF), Center Field (CF), Right Field (RF)"

  @AC007 @AC010
  Scenario: Position management integrates with lineup setup
    Given I have a player "Joey Tribbiani" with positions ["First Base", "Left Field", "Extra Player"]
    When I open the lineup setup modal
    And I select this player for a lineup position
    Then the position dropdown should default to "First Base"
    And the dropdown should contain all player's positions: ["First Base (1B)", "Left Field (LF)", "Extra Player (EP)"]

  @AC008
  Scenario: Position reordering affects lineup defaults immediately
    Given I have a player in a lineup setup with default position "Second Base"
    And the player has positions ["Second Base", "Shortstop", "Third Base"]
    When I reorder the player's positions to ["Shortstop", "Second Base", "Third Base"]
    And I return to lineup setup
    Then the position dropdown should now default to "Shortstop"

  @AC009
  Scenario: Adding position makes it available in lineup setup
    Given I have a player "Monica Geller" with positions ["Catcher", "Third Base"]
    And the player is assigned in a lineup
    When I add position "First Base" to the player
    And I return to the lineup setup
    Then "First Base (1B)" should be available in the position dropdown for this player

  @AC009
  Scenario: Removing position updates lineup setup options
    Given I have a player "Chandler Bing" with positions ["Pitcher", "First Base", "Right Field"]
    And the player is assigned in a lineup
    When I remove position "Right Field" from the player
    And I return to the lineup setup
    Then "Right Field (RF)" should not be available in the position dropdown for this player

  @AC007
  Scenario: Position array ordering is preserved in database
    Given I create a player with positions ["Shortstop", "Second Base", "Third Base", "Left Field"]
    When I save the player
    And I reload the application
    And I view the player's positions
    Then the positions should be in the exact order: ["Shortstop", "Second Base", "Third Base", "Left Field"]
    And the default position should still be "Shortstop"

  @AC010
  Scenario: Position display methods work with all position types
    Given I have a player with all possible positions
    When I call getPositionsDisplay()
    Then it should return all abbreviations: "P, C, 1B, 2B, 3B, SS, LF, CF, RF, SF, EP"
    When I view position names with abbreviations
    Then each should display as "Full Name (Abbreviation)" format

  @AC007 @AC008 @AC009
  Scenario: Complete position management workflow
    Given I create a new player "Complete Test Player"
    When I assign initial positions ["Third Base", "Shortstop"]
    And I save the player
    Then the default position should be "Third Base"
    When I reorder positions to ["Shortstop", "Third Base"]
    Then the default position should be "Shortstop"
    When I add position "Second Base" at the end
    Then the positions should be ["Shortstop", "Third Base", "Second Base"]
    When I move "Second Base" to the first position
    Then the default position should be "Second Base"
    And the final positions should be ["Second Base", "Shortstop", "Third Base"]