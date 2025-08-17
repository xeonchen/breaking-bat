Feature: Live Game Scoring and Statistics
  As a Scorekeeper, I want to record batting results and game progress in real-time during gameplay so that I can maintain accurate game statistics and scores without missing any plays or making errors.

  Background:
    Given I am on the application home page
    And the local database is available
    And I have created a team "Home Hawks" with a complete 9-player lineup
    And I have created a team "Visitors Eagles" 
    And I have created a game "Hawks vs Eagles" with "Home Hawks" as home team
    And the game has a complete lineup setup
    And the game status is "in_progress"

  Scenario: Display real-time scoreboard interface
    Given I am on the Live Scoring page for "Hawks vs Eagles"
    Then I should see the current inning display
    And I should see the home team score "Home Hawks: 0"
    And I should see the visitor team score "Visitors Eagles: 0"
    And I should see the inning-by-inning score grid
    And I should see which team is currently batting
    And I should see the current batter from the lineup

  Scenario: Record single base hit during gameplay
    Given I am scoring the game "Hawks vs Eagles"
    And it is the top of the 1st inning
    And "John Smith" is the current batter
    When I click the "1B" (single) button
    Then I should see "John Smith" advance to first base
    And the next batter in the lineup should be displayed
    And the play should be recorded in the game log
    And all data should be auto-saved to local storage

  Scenario: Record home run with automatic RBI calculation
    Given I am scoring the game "Hawks vs Eagles"
    And "Mike Johnson" is on first base
    And "Sarah Davis" is the current batter
    When I click the "HR" (home run) button
    Then "Sarah Davis" should advance to home plate and score
    And "Mike Johnson" should advance to home plate and score
    And "Sarah Davis" should be credited with 2 RBIs
    And the home team score should increase by 2 runs
    And the current inning total should show 2 runs

  Scenario: Handle baserunner advancement with override capability
    Given I am scoring the game "Hawks vs Eagles"
    And "Tom Wilson" is on second base
    And "Lisa Brown" is the current batter
    When I click the "1B" (single) button
    Then the system should suggest "Tom Wilson" advances to home
    And I should see baserunner advancement options
    When I override "Tom Wilson" to advance only to third base
    And I confirm the baserunner positions
    Then "Tom Wilson" should be on third base
    And "Lisa Brown" should be on first base
    And no runs should be scored for this play

  Scenario: Record strikeout without baserunner changes
    Given I am scoring the game "Hawks vs Eagles"
    And "David Lee" is on first base
    And "Chris Martin" is the current batter
    When I click the "SO" (strikeout) button
    Then "Chris Martin" should be marked as struck out
    And "David Lee" should remain on first base
    And the out count should increase to 1
    And the next batter should be displayed

  Scenario: Complete inning with 3 outs and team change
    Given I am scoring the game "Hawks vs Eagles"
    And it is the top of the 1st inning with 2 outs
    And "Kevin White" is the current batter
    When I click the "GO" (ground out) button
    Then the out count should reach 3
    And the inning should automatically change to "bottom of the 1st"
    And the batting team should switch to "Home Hawks"
    And the first batter in the home lineup should be displayed
    And all baserunners should be cleared

  Scenario: Record opponent team scores by inning
    Given I am scoring the game "Hawks vs Eagles"
    And I am on the Live Scoring interface
    When I click on the visitor score for "2nd inning"
    And I enter "3" runs for the visitors in the 2nd inning
    And I confirm the opponent score entry
    Then the visitor total should show 3 runs
    And the 2nd inning visitor score should display "3"
    And the scoreboard should reflect the updated totals

  Scenario: Handle double play with multiple outs
    Given I am scoring the game "Hawks vs Eagles"
    And "Alex Green" is on first base
    And "Ryan Blue" is the current batter
    And there are 0 outs in the inning
    When I click the "DP" (double play) button
    Then "Ryan Blue" should be marked as out (ground out)
    And "Alex Green" should be marked as out (force out)
    And the out count should increase to 2
    And the bases should be cleared
    And the next batter should be displayed

  Scenario: Record fielder's choice with baserunner out
    Given I am scoring the game "Hawks vs Eagles"
    And "Steve Red" is on second base
    And "Tony Black" is the current batter
    When I click the "FC" (fielder's choice) button
    Then I should see fielding choice options
    When I select "runner out at third base"
    Then "Steve Red" should be marked as out
    And "Tony Black" should advance to first base
    And the out count should increase by 1

  Scenario: Handle error with baserunner advancement
    Given I am scoring the game "Hawks vs Eagles"
    And "Paul Gray" is the current batter
    When I click the "E" (error) button
    Then I should see error type options
    When I select "E6" (shortstop error)
    Then "Paul Gray" should advance to first base on error
    And the error should be recorded in game statistics
    And no earned runs should be attributed for subsequent scoring

  Scenario: Record sacrifice fly with RBI
    Given I am scoring the game "Hawks vs Eagles"
    And "Mark Yellow" is on third base
    And "Sam Orange" is the current batter
    When I click the "SF" (sacrifice fly) button
    Then "Sam Orange" should be marked as out (fly out)
    And "Mark Yellow" should advance to home and score
    And "Sam Orange" should be credited with 1 RBI
    And the out count should increase by 1
    And the team score should increase by 1

  Scenario: Handle intentional walk with bases loaded
    Given I am scoring the game "Hawks vs Eagles"
    And "Player A" is on first base
    And "Player B" is on second base
    And "Player C" is on third base
    And "Player D" is the current batter
    When I click the "IBB" (intentional walk) button
    Then "Player D" should advance to first base
    And "Player A" should advance to second base
    And "Player B" should advance to third base
    And "Player C" should advance to home and score
    And the team score should increase by 1 run

  Scenario: Auto-save all scoring actions in real-time
    Given I am scoring the game "Hawks vs Eagles"
    And I have recorded 5 different plays
    When I simulate an unexpected browser close
    And I reopen the application
    And I navigate to the game "Hawks vs Eagles"
    Then all 5 plays should still be recorded
    And the current game state should be preserved
    And I should be able to continue from where I left off

  Scenario: Display current batting statistics during game
    Given I am scoring the game "Hawks vs Eagles"
    And "Jessica Purple" has had 2 at-bats with 1 hit
    When "Jessica Purple" comes to bat again
    Then I should see her current batting average for this game
    And I should see her season statistics (if available)
    And I should see her position and batting order number

  Scenario: Handle game completion after 7+ innings
    Given I am scoring the game "Hawks vs Eagles"
    And we are in the bottom of the 7th inning
    And the home team is leading 8-5 after their turn at bat
    When the visiting team completes their half of the 8th inning
    And the home team score is still higher
    Then the game should automatically be marked as "completed"
    And I should see final game statistics
    And the final score should be recorded permanently

  Scenario: Undo last play for error correction
    Given I am scoring the game "Hawks vs Eagles"
    And I have just recorded "James Pink" as striking out
    When I realize it was actually a single
    And I click the "Undo Last Play" button
    Then "James Pink" should return to batting
    And the previous game state should be restored
    And I should be able to record the correct play
    And the undo action should be logged for audit purposes

  Scenario: Switch between innings efficiently
    Given I am scoring the game "Hawks vs Eagles"
    And the game is in the middle of the 4th inning
    When I need to review or correct the 2nd inning scoring
    Then I should be able to navigate to the 2nd inning
    And I should see all plays from that inning
    And I should be able to make corrections if needed
    And I should be able to return to current play efficiently

  Scenario: Handle extra innings scenario
    Given I am scoring the game "Hawks vs Eagles"
    And we have completed 7 full innings
    And the score is tied 4-4
    When we enter the 8th inning
    Then the game should continue normally
    And I should be able to record plays in extra innings
    And the game should only end when one team leads after a complete inning

  Scenario: Export current game data during play
    Given I am scoring the game "Hawks vs Eagles"
    And the game is in progress with recorded plays
    When I click "Export Current Game"
    And I select "JSON" format
    Then I should receive a downloadable file
    And the file should contain all current game data
    And the file should include current inning and play-by-play
    And I should be able to continue scoring after export

  Scenario: Handle network disconnection gracefully
    Given I am scoring the game "Hawks vs Eagles"
    And I am recording plays normally
    When the network connection is lost
    Then all plays should continue to save locally
    And I should see an offline mode indicator
    And no data should be lost during offline operation
    And the interface should remain fully functional

  # Innings Management for Home/Away Teams
  @live-game-scoring:AC029 @live-game-scoring:AC031
  Scenario: Away team records only top half innings
    Given my team "Red Sox" is playing away against "Yankees"
    And we are in the top of the 1st inning
    When the scoring interface loads
    Then I should see "Top of 1st" displayed prominently
    And the at-bat recording interface should be enabled for my team
    And I should be able to record batting results for Red Sox players

  @live-game-scoring:AC030 @live-game-scoring:AC032
  Scenario: Home team records only bottom half innings
    Given my team "Blue Jays" is playing at home against "Tigers"
    And we are in the bottom of the 2nd inning
    When the scoring interface loads
    Then I should see "Bottom of 2nd" displayed prominently
    And the at-bat recording interface should be enabled for my team
    And I should be able to record batting results for Blue Jays players

  @live-game-scoring:AC033 @live-game-scoring:AC034
  Scenario: Interface disabled during opponent's batting turn (away team)
    Given my team "Red Sox" is playing away
    And we are in the bottom of the 3rd inning (Yankees batting)
    When I view the scoring interface
    Then I should see "Bottom of 3rd - Yankees Batting" displayed
    And the at-bat recording interface should be disabled
    And I should see a message "Opponent's turn to bat - interface disabled"
    And all batting input controls should be inactive

  @live-game-scoring:AC033 @live-game-scoring:AC034
  Scenario: Interface disabled during opponent's batting turn (home team)
    Given my team "Blue Jays" is playing at home
    And we are in the top of the 4th inning (Tigers batting)
    When I view the scoring interface
    Then I should see "Top of 4th - Tigers Batting" displayed
    And the at-bat recording interface should be disabled
    And I should see a message "Opponent's turn to bat - interface disabled"
    And all batting input controls should be inactive

  @live-game-scoring:AC031 @live-game-scoring:AC032
  Scenario: Clear inning indicator throughout the game (away team)
    Given my team "Cardinals" is playing away
    When I am in different innings
    Then I should see the correct inning indicators:
      | Inning | My Team's Turn | Display Text | Interface State |
      | 1 | Top | Top of 1st | Enabled |
      | 1 | Bottom | Bottom of 1st - Opponent | Disabled |
      | 2 | Top | Top of 2nd | Enabled |
      | 2 | Bottom | Bottom of 2nd - Opponent | Disabled |
      | 3 | Top | Top of 3rd | Enabled |

  @live-game-scoring:AC031 @live-game-scoring:AC032
  Scenario: Clear inning indicator throughout the game (home team)
    Given my team "Giants" is playing at home
    When I am in different innings
    Then I should see the correct inning indicators:
      | Inning | My Team's Turn | Display Text | Interface State |
      | 1 | Top | Top of 1st - Opponent | Disabled |
      | 1 | Bottom | Bottom of 1st | Enabled |
      | 2 | Top | Top of 2nd - Opponent | Disabled |
      | 2 | Bottom | Bottom of 2nd | Enabled |
      | 3 | Top | Top of 3rd - Opponent | Disabled |

  @live-game-scoring:AC034
  Scenario: Automatic interface state changes when inning switches (away)
    Given my team "Dodgers" is playing away
    And I am recording the top of the 5th inning (our turn)
    And the interface is enabled
    When the inning switches to bottom of the 5th
    Then the interface should automatically disable
    And I should see "Bottom of 5th - Opponent Batting"
    And all at-bat controls should become inactive
    And the current batter should be cleared/hidden

  @live-game-scoring:AC034
  Scenario: Automatic interface state changes when inning switches (home)
    Given my team "Padres" is playing at home
    And we are in the top of the 6th inning (opponent's turn)
    And the interface is disabled
    When the inning switches to bottom of the 6th
    Then the interface should automatically enable
    And I should see "Bottom of 6th"
    And all at-bat controls should become active
    And the current batter should be displayed

  @live-game-scoring:AC029 @live-game-scoring:AC030
  Scenario: Scoreboard shows correct team batting context
    Given my team "Mariners" is playing away
    When I view the scoreboard during different innings
    Then it should clearly indicate which team is batting:
      | Inning State | Scoreboard Display |
      | Top of 1st | Mariners Batting (Away) |
      | Bottom of 1st | Opponent Batting (Mariners Away) |
      | Top of 2nd | Mariners Batting (Away) |

  # UX Improvements Scenarios - AC003A, AC004A, AC009A, AC016A, AC017A-C, AC045A-D

  @live-game-scoring:AC043 @live-game-scoring:AC044
  Scenario: Skip opponent turn advances to our team's half-inning
    Given it is the opponent's turn to bat
    When I click the "Skip to Our Turn" button
    Then the system should advance to my team's half-inning
    And the at-bat recording interface should be enabled
    And I should see a success message "Inning advanced"
    And the inning indicator should show it's our turn to bat

  @live-game-scoring:AC045A @live-game-scoring:AC045B @live-game-scoring:AC045C @live-game-scoring:AC045D
  Scenario: Complete opponent scoring interface workflow
    Given it is the opponent's turn to bat
    And the current score is Home: 4, Away: 2
    And we are in the top of the 5th inning
    When I click the "Record Opponent Score" button
    Then I should see the opponent scoring interface
    And I should see the current inning displayed as "Top of 5th"
    And I should see the opponent team name clearly indicated
    When I enter "3" in the opponent runs field
    And I click the "Record Runs" button
    Then the scoreboard should immediately update to show Away: 5
    And the system should advance to our team's half-inning
    And I should see a success message "Opponent score recorded. Your turn to bat!"

  @live-game-scoring:AC004A
  Scenario: Collapsible pitch tracking section for better focus
    Given I am on the at-bat form
    When I view the pitch tracking section
    Then I should see a toggle control for collapsing the section
    When I click the toggle to collapse pitch tracking
    Then the pitch tracking content should be hidden
    And the at-bat outcome buttons should remain fully visible
    When I refresh the page
    Then the pitch tracking section should remain collapsed
    And my preference should be preserved

  @live-game-scoring:AC003A
  Scenario: Contextual fast-action button enablement with runner requirements
    Given there are no runners on base
    And the current out count is 0
    When I view the fast-action buttons
    Then the "Double Play" button should be disabled
    And I should see a tooltip indicating "No runners for double play"
    And the "Sacrifice Fly" button should be disabled
    And I should see a tooltip indicating "No runner on third base"
    And the "FC" button should be disabled
    And I should see a tooltip indicating "No runners on base"
    When a runner reaches first base
    Then the "Double Play" button should become enabled
    And the "FC" button should become enabled
    When a runner reaches third base
    Then the "Sacrifice Fly" button should become enabled

  @live-game-scoring:AC003A-out-count
  Scenario: Contextual button enablement based on out count
    Given there is a runner on first base
    And there is a runner on third base
    And the current out count is 0
    When I view the fast-action buttons
    Then the "Double Play" button should be enabled
    And the "Sacrifice Fly" button should be enabled
    And the "FC" button should be enabled
    When the out count becomes 1
    Then the "Double Play" button should remain enabled
    And the "Sacrifice Fly" button should remain enabled
    And the "FC" button should remain enabled
    When the out count becomes 2
    Then the "Double Play" button should be disabled
    And I should see a tooltip indicating "Impossible with 2 outs"
    And the "Sacrifice Fly" button should be disabled
    And I should see a tooltip indicating "Impossible with 2 outs"
    And the "FC" button should be disabled
    And I should see a tooltip indicating "Impossible with 2 outs"

  @live-game-scoring:AC003A-integration
  Scenario: Complete contextual enablement with game situation
    Given there are no runners on base
    And the current out count is 2
    When I view the fast-action buttons
    Then contextual buttons "DP", "SF", "FC" should all be disabled
    And tooltips should explain both runner and out count requirements
    When a runner reaches third base
    Then the "Sacrifice Fly" button should still be disabled due to 2 outs
    When the inning changes and out count resets to 0
    Then the "Sacrifice Fly" button should become enabled

  @live-game-scoring:AC009A
  Scenario: Field-accurate baserunner layout display
    Given there are runners on all bases
    When I view the baserunner display
    Then third base should be positioned on the left
    And second base should be positioned in the center and elevated
    And first base should be positioned on the right
    And the layout should resemble a baseball diamond
    And the visual styling should clearly distinguish occupied vs empty bases

  @live-game-scoring:AC016A
  Scenario: Conditional baserunner advancement modal
    Given there are no runners on base
    When I click the "Single" button
    Then the baserunner advancement modal should not appear
    And the at-bat should be completed automatically
    When a runner reaches first base
    And I click the "Single" button
    Then the baserunner advancement modal should appear
    And I should see advancement options for the first base runner

  @live-game-scoring:AC017A @live-game-scoring:AC017B @live-game-scoring:AC017C
  Scenario: Comprehensive baserunner advancement validation
    Given there are runners on first and third base
    And the baserunner advancement modal is open
    When I attempt to confirm without selecting advancement for all runners
    Then I should see a validation error "Please select advancement for all runners"
    And the confirmation button should be disabled
    When I select "Stay at 1st" for the first base runner
    And I select "Advance to 1st" for the third base runner
    Then I should see a validation error "Multiple runners cannot occupy the same base"
    And I should see "First base would have: Runner One, Runner Three"
    When I select "Advance to 2nd" for the first base runner
    And I select "Score" for the third base runner
    Then no validation errors should be shown
    And the confirmation button should be enabled

  @Integration
  Scenario: Complete UX improvements integration workflow
    Given it is the opponent's turn to bat
    And the pitch tracking section is collapsed from my previous session
    When I skip the opponent's turn
    And there are runners on first and third base
    And I click the "Double" button
    Then the baserunner advancement modal should appear
    And I should see the field-accurate baserunner layout
    And only contextually relevant buttons should be enabled
    When I select valid advancement for all runners
    And I confirm the advancement
    Then the at-bat should be completed successfully
    And the pitch tracking preference should be preserved
    And the game should continue normally

  @live-game-scoring:AC046A
  Scenario: Pitch tracking defaults to collapsed for streamlined experience
    Given I am starting a new scoring session
    When I navigate to the live scoring interface
    Then the pitch tracking section should be collapsed by default
    And I should see the at-bat outcome buttons prominently
    When I expand the pitch tracking section
    And I refresh the page
    Then the pitch tracking section should remember my preference and remain expanded

  @live-game-scoring:AC046B
  Scenario: Baserunner advancement modal pre-populates with standard defaults
    Given there are runners on first and second base
    When I click the "Double" button
    Then the baserunner advancement modal should appear
    And the first base runner should be pre-selected to "Advance to 3rd"
    And the second base runner should be pre-selected to "Score"
    When I click "Confirm" without making changes
    Then the advancement should proceed with the default selections
    And the first base runner should be moved to third base
    And the second base runner should score

  @live-game-scoring:AC046B-single
  Scenario: Single advancement defaults
    Given there are runners on first, second, and third base
    When I click the "Single" button
    Then the baserunner advancement modal should appear
    And the first base runner should be pre-selected to "Advance to 2nd"
    And the second base runner should be pre-selected to "Score"
    And the third base runner should be pre-selected to "Score"

  @live-game-scoring:AC046B-walk
  Scenario: Walk advancement only affects forced runners by default
    Given there are runners on first and third base
    When I click the "Walk" button
    Then the baserunner advancement modal should appear
    And the first base runner should be pre-selected to "Advance to 2nd" (forced)
    And the third base runner should be pre-selected to "Stay at 3rd" (not forced)

  @live-game-scoring:AC046C
  Scenario: Home run immediately clears all baserunners and scores everyone
    Given there are runners on first, second, and third base
    And the current team score is 5 runs
    When I click the "Home Run" button
    Then no baserunner advancement modal should appear
    And all baserunners should be immediately cleared from the bases
    And the team score should increase by 4 runs (3 runners + batter = 9 total)
    And the next batter should be displayed
    And the play should be recorded as "Home Run - 4 RBI"

  @live-game-scoring:AC046C-empty-bases
  Scenario: Home run with no runners on base
    Given there are no runners on base
    And the current team score is 2 runs
    When I click the "Home Run" button
    Then no baserunner advancement modal should appear
    And the team score should increase by 1 run (batter only = 3 total)
    And the next batter should be displayed
    And the play should be recorded as "Home Run - 1 RBI"

  @live-game-scoring:AC046C-integration
  Scenario: Home run vs other hits - different behavior verification
    Given there are runners on first and third base
    When I click the "Triple" button
    Then the baserunner advancement modal should appear for manual confirmation
    When I cancel and click the "Home Run" button instead
    Then no modal should appear
    And all runners should score automatically
    And bases should be cleared immediately