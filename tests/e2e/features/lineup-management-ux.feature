Feature: Enhanced Lineup Management UX
  As a Scorekeeper
  I want to manage game lineups with an intuitive interface that shows all players by default and provides real-time validation
  So that I can quickly set up lineups with minimal clicking, clear visual feedback, and immediate error detection

  Background:
    Given I have a team with 12 active players
    And each player has defined positions they can play
    And I am on the lineup setup modal

  # Default Player Display (AC001-AC004)
  @lineup-configuration:AC001
  Scenario: All team players displayed by default when modal opens
    When I open the lineup setup modal
    Then I should see all 12 team players displayed
    And all players should be visible without needing to scroll initially

  @lineup-configuration:AC002
  Scenario: Upper section shows starting players with configurable count
    Given the starting position count is set to 10
    When I view the lineup interface
    Then I should see an upper section labeled "Starting Lineup"
    And the upper section should show 10 position slots
    And the slots should be numbered 1 through 10

  @lineup-configuration:AC003
  Scenario: Lower section shows bench players
    When I view the lineup interface
    Then I should see a lower section labeled "Bench Players"
    And the bench section should display remaining players not in starting lineup

  @lineup-configuration:AC004
  Scenario: All players initially appear in bench section
    When I open the lineup setup modal for the first time
    Then all 12 players should initially appear in the bench section
    And the starting lineup section should be empty
    And no players should be pre-assigned to batting positions

  # Configurable Starting Positions (AC005-AC008)
  @lineup-configuration:AC005
  Scenario: Configure number of starting positions with default of 10
    When I open the lineup setup modal
    Then I should see a starting position selector
    And the selector should allow values from 9 to 12
    And the default value should be 10
    And the selector should be clearly labeled "Starting Positions"

  @lineup-configuration:AC006
  Scenario: Interface adjusts when starting position count changes
    Given the starting position count is currently 10
    When I change the starting position count to 12
    Then the starting lineup section should immediately show 12 slots
    And the bench section should adjust to show remaining players
    And the change should happen without page refresh

  @lineup-configuration:AC007
  Scenario: Additional slots appear when starting positions increased
    Given the starting position count is currently 9
    When I increase the starting position count to 11
    Then 2 additional batting position slots should appear
    And the new slots should be numbered 10 and 11
    And the new slots should be empty and ready for assignment

  @lineup-configuration:AC008
  Scenario: Excess players move to bench when positions decreased
    Given I have 11 starting positions with players assigned
    When I decrease the starting position count to 9
    Then the players from positions 10 and 11 should move to the bench
    And the starting lineup should only show 9 positions
    And the moved players should be available for reassignment

  @lineup-configuration:AC008a
  Scenario: Starting position count is saved with lineup data
    Given I have set the starting position count to 11
    And I have configured a complete lineup
    When I click the "Save Lineup" button
    Then the starting position count of 11 should be saved along with the batting order and positions

  # Drag-and-Drop Interface (AC009-AC012)
  @lineup-configuration:AC009
  Scenario: Drag player rows to reorder batting lineup
    Given I have players assigned to batting positions
    When I drag a player row to a different position
    Then the player should move to the new batting position
    And the batting order should automatically renumber
    And player selection dropdowns remain available for initial assignment

  @lineup-configuration:AC010
  Scenario: Swap players between batting positions using dropdowns
    Given Player A is assigned to position 1
    And Player B is assigned to position 3
    When I assign Player A to position 3
    Then Player A should move to position 3
    And Player B should move to position 1
    And the swap should happen automatically

  @lineup-configuration:AC011
  Scenario: Immediate visual feedback when selecting players
    When I select a player from the dropdown
    Then the player's name and jersey number should appear immediately
    And there should be no delay or loading state
    And the visual update should be instant

  @lineup-configuration:AC012
  Scenario: Graceful reassignment when player already assigned elsewhere
    Given Player A is assigned to position 1
    When I try to assign Player A to position 5
    Then Player A should move to position 5
    And position 1 should become empty
    And I should see a brief notification about the reassignment

  # Position Assignment and Display (AC013-AC016)
  @lineup-configuration:AC013
  Scenario: Player's default position pre-selected automatically
    Given Player A's primary position is Pitcher
    When I assign Player A to a batting position
    Then "Pitcher (P)" should be pre-selected in the position dropdown
    And I should be able to change it if needed

  @lineup-configuration:AC014
  Scenario: All 11 positions with smart ordering
    When I open the defensive position dropdown for a player
    Then I should see the player's available positions listed first
    And then I should see all remaining positions
    And all 11 positions should be available: P, C, 1B, 2B, 3B, SS, LF, CF, RF, SF, EP

  @lineup-configuration:AC015
  Scenario: Position display format shows name and abbreviation
    When I view the position dropdown options
    Then I should see positions formatted as "Pitcher (P)"
    And I should see "First Base (1B)", "Catcher (C)", etc.
    And the format should be consistent for all positions


  @lineup-configuration:AC016
  Scenario: Position abbreviation clearly displayed when assigned
    When I assign "Pitcher (P)" to a player
    Then I should see "P" clearly displayed next to the player's name
    And the abbreviation should be visually distinct
    And it should remain visible while scrolling

  # Real-Time Validation (AC017-AC020)
  @lineup-configuration:AC017
  Scenario: Duplicate positions highlighted immediately
    Given Player A is assigned to "Pitcher (P)"
    When I assign Player B to "Pitcher (P)"
    Then both pitcher assignments should be highlighted in red immediately
    And I should see a warning about duplicate positions
    And the highlighting should appear without any delay

  @lineup-configuration:AC018
  Scenario: Highlighting disappears when duplicates fixed
    Given I have duplicate pitcher assignments highlighted in red
    When I change one player's position to "Catcher (C)"
    Then the red highlighting should disappear immediately
    And the warning message should be cleared
    And both positions should appear normal

  @lineup-configuration:AC019
  Scenario: Validation errors clearly visible with specific messages
    Given I have lineup validation errors
    When I view the error panel
    Then I should see specific error messages like "Duplicate defensive position: Pitcher"
    And each error should be clearly described
    And the errors should be actionable with clear steps to resolve

  @lineup-configuration:AC020
  Scenario: Save button enabled when no validation errors
    Given I have a complete lineup with 10 players assigned
    And all defensive positions are unique
    When the validation completes
    Then the save button should be enabled
    And it should have success styling (green or highlighted)

  # Auto-Fill Features (AC021-AC024)
  @lineup-configuration:AC021
  Scenario: Auto-fill pre-selects player's first position
    Given I have an "Auto-Fill Positions" button
    When I click the auto-fill button
    Then each assigned player should have their primary position pre-selected
    And players with Pitcher as primary should get "Pitcher (P)"
    And the assignments should happen instantly

  @lineup-configuration:AC022
  Scenario: Auto-fill allows duplicate positions for user to resolve
    Given I have multiple players with "Pitcher" as their primary position
    When I click the auto-fill button
    Then multiple players may be assigned to "Pitcher (P)"
    And the duplicates should be highlighted for user resolution
    And I should be able to manually fix the conflicts

  @lineup-configuration:AC023
  Scenario: Manual adjustments possible after auto-fill
    Given I have used auto-fill to assign positions
    When I manually change a player's position from "Pitcher (P)" to "Catcher (C)"
    Then the manual change should be accepted
    And the position should update immediately
    And it should not be overridden by subsequent auto-fills

  @lineup-configuration:AC024
  Scenario: Auto-fill doesn't override manual changes
    Given I have manually assigned Player A to "First Base (1B)"
    When I click auto-fill again
    Then Player A should remain at "First Base (1B)"
    And auto-fill should only affect unassigned or auto-filled positions
    And my manual change should be preserved

  # Visual Feedback and Error Handling (AC025-AC028)
  @lineup-configuration:AC025
  Scenario: Position conflicts highlighted in distinct color
    Given I have two players assigned to "Shortstop (SS)"
    When I view the lineup
    Then both shortstop assignments should be highlighted in a distinct red color
    And the highlighting should be different from normal position display
    And it should be clearly visible and attention-grabbing

  @lineup-configuration:AC026
  Scenario: Clear indication when player has no available positions
    Given Player A can only play positions that are already taken
    When I try to assign Player A to a batting position
    Then I should see a clear message like "No available positions for this player"
    And the position dropdown should show which positions are unavailable
    And I should get guidance on how to resolve the conflict

  @lineup-configuration:AC027
  Scenario: Progress indicator shows what's missing from lineup
    Given I have assigned 7 out of 10 required players
    When I view the progress indicator
    Then it should show "7/10 positions filled"
    And it should indicate "3 more players needed"
    And the progress should be visually represented (progress bar or fraction)

  @lineup-configuration:AC028
  Scenario: Success state clearly indicated when lineup complete and valid
    Given I have assigned all 10 required players
    And all defensive positions are unique
    And there are no validation errors
    When the validation completes
    Then I should see a success indicator (green badge or checkmark)
    And the indicator should say "Lineup Complete" or "Ready to Save"
    And the overall status should be clearly positive

  # Error Scenarios and Edge Cases
  @error-handling
  Scenario: Insufficient players for minimum lineup
    Given I have a team with only 8 active players
    When I open the lineup setup modal
    Then I should see an error message "Team needs at least 9 active players"
    And the save button should be disabled
    And I should get guidance on adding more players

  # Cross-Section Drag-and-Drop (AC029-AC031)
  @lineup-configuration:AC029
  Scenario: Drag bench player to starting lineup position
    Given I have Player A in the bench section
    And position 5 in the starting lineup is empty
    When I drag Player A from bench to position 5
    Then Player A should move to batting position 5
    And Player A should be removed from the bench section
    And their defensive position should be maintained if assigned

  @lineup-configuration:AC030
  Scenario: Drag starting player to bench section
    Given Player B is in batting position 3 of the starting lineup
    When I drag Player B from position 3 to the bench section
    Then Player B should move to the bench
    And batting position 3 should become empty
    And their defensive position should be maintained

  @lineup-configuration:AC031
  Scenario: Position assignments maintained during cross-section drag-and-drop
    Given Player C is assigned as "Pitcher (P)" in the starting lineup
    When I drag Player C to the bench section
    Then Player C should retain their "Pitcher (P)" assignment in the bench
    And I should be able to drag them back with position intact

  # Bench Player Interface Consistency (AC032-AC033)
  @lineup-configuration:AC032
  Scenario: Bench players have same visual style as starting lineup
    When I view both starting lineup and bench sections
    Then bench player rows should have the same layout as starting lineup rows
    And bench players should have drag handles like starting players
    And the visual styling should be consistent between sections

  @lineup-configuration:AC033
  Scenario: Bench players support same position assignment interface
    Given I have Player D in the bench section
    When I click on Player D's position assignment
    Then I should see the same position dropdown as starting players
    And I should be able to select from all available positions
    And the interface should work identically to starting lineup

  @error-handling
  Scenario: Handle large team rosters efficiently
    Given I have a team with 25 active players
    When I open the lineup setup modal
    Then the interface should load quickly (under 2 seconds)
    And scrolling through players should be smooth
    And search/filter functionality should work effectively

  @accessibility
  Scenario: Keyboard navigation support
    When I use Tab to navigate through the lineup interface
    Then I should be able to access all dropdown selectors
    And I should be able to open dropdowns with Enter or Space
    And I should be able to select options with arrow keys
    And focus indicators should be clearly visible

  @mobile-responsive
  Scenario: Mobile-friendly layout
    Given I am using a mobile device
    When I open the lineup setup modal
    Then the interface should be touch-friendly
    And dropdowns should be easy to tap and select
    And text should be readable without zooming
    And the layout should adapt to small screens