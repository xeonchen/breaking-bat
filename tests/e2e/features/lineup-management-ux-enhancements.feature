Feature: Lineup Management UX Enhancements
  As a Scorekeeper, I want an enhanced lineup setup interface with all 11 positions and real-time validation
  so that I can quickly create accurate lineups without errors.

  Background:
    Given I have a team "Red Sox" with 15 players
    And each player has multiple positions assigned
    And I have a game "Red Sox vs Yankees" ready for lineup setup
    And I am on the lineup setup modal

  @AC001
  Scenario: Display all 11 softball positions in correct order
    When I open the lineup setup modal
    Then I should see all 11 positions in order:
      | Position Order | Position Name | Abbreviation |
      | 1              | Pitcher       | P            |
      | 2              | Catcher       | C            |
      | 3              | First Base    | 1B           |
      | 4              | Second Base   | 2B           |
      | 5              | Third Base    | 3B           |
      | 6              | Shortstop     | SS           |
      | 7              | Left Field    | LF           |
      | 8              | Center Field  | CF           |
      | 9              | Right Field   | RF           |
      | 10             | Short Fielder | SF           |
      | 11             | Extra Player  | EP           |

  @AC002
  Scenario: Configure starting positions from 9 to 12 with default 10
    When I open the lineup configuration settings
    Then the default number of starting positions should be 10
    And I should be able to configure starting positions from 9 to 12
    When I select 9 starting positions
    Then positions 1-9 should be marked as "Starting"
    And positions 10-11 should be marked as "Bench"

  @AC002
  Scenario: Configuring 12 starting positions includes Extra Player
    When I configure the lineup for 12 starting positions
    Then all 11 positions should be marked as "Starting"
    And there should be 1 additional "Extra Player" starting position
    And the interface should show "Starting (12)" and "Bench (remaining)"

  @AC003
  Scenario: Position display shows full name with abbreviation
    When I view the lineup setup interface
    Then each position should display as "Full Name (Abbreviation)"
    And I should see "Pitcher (P)", "Catcher (C)", "First Base (1B)", etc.
    And the abbreviations should be consistently formatted

  @AC004
  Scenario: Real-time duplicate position validation
    Given I have assigned "John Smith" to "Pitcher (P)"
    When I assign "Mike Johnson" to "Pitcher (P)"
    Then both "Pitcher (P)" dropdowns should be highlighted in red
    And I should see a visual indicator showing the duplicate position
    And the validation message should appear immediately

  @AC004
  Scenario: Duplicate validation clears when conflict resolved
    Given I have a duplicate position conflict on "Shortstop (SS)"
    When I change one of the conflicting assignments to "Second Base (2B)"
    Then the red highlighting should disappear from both positions
    And the validation error should clear immediately
    And the interface should return to normal state

  @AC005
  Scenario: Auto-fill available positions attempts to fill lineup
    Given I have 11 players available
    When I click "Auto-fill Available Positions"
    Then the system should assign players to positions based on their default positions
    And each player should be assigned to their first available position
    And no duplicate positions should be created

  @AC005
  Scenario: Auto-fill handles insufficient players gracefully
    Given I have only 8 players available
    When I click "Auto-fill Available Positions"
    Then 8 positions should be filled with available players
    And 3 positions should remain empty
    And no duplicate assignments should occur

  @AC006
  Scenario: Quick-fill common lineups provides preset configurations
    When I click "Quick-fill Common Lineups"
    Then I should see lineup presets like:
      | Preset Name | Description |
      | Standard 10 | Traditional 10-player starting lineup |
      | Power Hitting | Optimized for offensive play |
      | Defensive | Strong defensive positioning |
    When I select "Standard 10"
    Then 10 starting positions should be filled appropriately
    And 1 bench position should remain

  @AC007
  Scenario: Player position dropdown shows all player's positions
    Given player "Sarah Wilson" can play ["Shortstop", "Second Base", "Third Base"]
    When I select "Sarah Wilson" for batting order position 4
    Then the position dropdown should show:
      | Option | Display |
      | Default | Shortstop (SS) |
      | Option 2 | Second Base (2B) |
      | Option 3 | Third Base (3B) |
    And "Shortstop (SS)" should be pre-selected as the default

  @AC008
  Scenario: Clear all assignments resets lineup to empty state
    Given I have partially filled the lineup with 6 players
    When I click "Clear All"
    Then all player assignments should be removed
    And all position dropdowns should return to "Select player..."
    And all positions should show as unassigned
    And duplicate validation should be reset

  @AC009
  Scenario: Save lineup validates completeness before saving
    Given I have assigned players to only 8 out of 10 starting positions
    When I click "Save Lineup"
    Then I should see a validation message "Please assign players to all starting positions"
    And the save action should not proceed
    And empty positions should be highlighted

  @AC010
  Scenario: Position assignments persist during modal session
    Given I have assigned players to several positions
    When I scroll down and scroll back up
    Then all my position assignments should remain unchanged
    And the duplicate validation state should be preserved
    And no data should be lost

  @AC011
  Scenario: Position validation works with all 11 positions
    Given I am setting up a full 11-player starting lineup
    When I assign the same player to multiple positions
    Then all conflicting positions should be highlighted
    And the specific duplicate positions should be clearly indicated
    And I should see how many conflicts exist

  @AC012
  Scenario: Bench players are clearly distinguished from starters
    Given I have configured 10 starting positions
    When I assign players to all positions
    Then positions 1-10 should be labeled as "Starting"
    And position 11 (Extra Player) should be labeled as "Bench"
    And the visual distinction should be clear

  @AC013
  Scenario: Responsive design works on tablet devices
    Given I am using a tablet device
    When I open the lineup setup modal
    Then the interface should be touch-friendly
    And dropdowns should be easy to tap and select
    And the modal should fit properly on the tablet screen
    And all positions should be clearly visible

  @AC014
  Scenario: Keyboard navigation supports accessibility
    When I use Tab to navigate through the lineup form
    Then I should be able to reach all player dropdowns
    And I should be able to reach all position dropdowns
    And focus indicators should be clearly visible
    And I should be able to make selections using Enter key

  @AC015
  Scenario: Screen reader compatibility
    Given I am using a screen reader
    When I navigate through the lineup setup
    Then each position should be announced clearly
    And player names should be pronounced correctly
    And validation errors should be announced immediately
    And form labels should be descriptive and helpful

  @AC016
  Scenario: Lineup changes are tracked for validation
    Given I have a saved lineup
    When I make changes to player assignments
    Then the interface should indicate unsaved changes
    And I should see a "Save Changes" button become enabled
    And closing without saving should prompt for confirmation

  @AC017
  Scenario: Multiple Extra Players can be assigned when configured
    Given I have configured the lineup for 12 starting positions
    When I reach the 11th and 12th positions
    Then both should show as "Extra Player" positions
    And I should be able to assign different players to each
    And both should be marked as starting positions

  @AC018
  Scenario: Position reordering maintains logical softball order
    When I view the lineup setup interface
    Then the positions should follow standard softball numbering:
      | Position Number | Position Name |
      | 1 | Pitcher |
      | 2 | Catcher |
      | 3 | First Base |
      | 4 | Second Base |
      | 5 | Third Base |
      | 6 | Shortstop |
      | 7 | Left Field |
      | 8 | Center Field |
      | 9 | Right Field |
      | 10 | Short Fielder |
      | 11+ | Extra Player |

  @AC019
  Scenario: Error recovery handles validation gracefully
    Given I have duplicate position assignments
    When I attempt to save the lineup
    Then I should see specific error messages for each conflict
    And the problematic positions should remain highlighted
    And I should be able to fix errors one by one
    And the save button should become enabled when all conflicts are resolved

  @AC020
  Scenario: Lineup setup integrates with team roster data
    Given my team roster has players with varied position capabilities
    When I open lineup setup
    Then only eligible players should appear in position-specific dropdowns
    And players should be ordered by their primary position suitability
    And inactive players should not appear in the selection lists