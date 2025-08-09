Feature: Baserunner Advancement with Standard Rules and Manual Override
  As a Scorekeeper, I want baserunners to advance automatically using standard softball rules
  So that I can quickly score games while having the flexibility to handle unusual situations

  Background:
    Given I have a game in "in-progress" status
    And the game has a complete lineup setup
    And I am on the live scoring page

  @AC004
  Scenario: Standard baserunner advancement for single
    Given there are runners on 1st base "Player A" and 3rd base "Player C"
    When the batter hits a "Single"
    Then "Player C" on 3rd base should automatically score
    And "Player A" on 1st base should advance to 2nd base
    And the batter should be placed on 1st base
    And the advancement should be applied without manual intervention

  @AC004-double-advancement
  Scenario: Standard baserunner advancement for double
    Given there are runners on 1st base "Player A" and 2nd base "Player B"
    When the batter hits a "Double" 
    Then "Player B" on 2nd base should score
    And "Player A" on 1st base should score
    And the batter should be placed on 2nd base
    And all advancement should happen automatically

  @AC004-walk-forced-runners
  Scenario: Walk advances only forced runners
    Given there are runners on 1st base "Player A" and 3rd base "Player C"
    When the batter receives a "Walk"
    Then "Player A" on 1st base should advance to 2nd base (forced)
    And "Player C" on 3rd base should stay on 3rd base (not forced)
    And the batter should be placed on 1st base

  @AC005
  Scenario: Manual override for unusual runner advancement
    Given there are runners on 2nd base "Player B"
    And I have enabled manual baserunner override
    When the batter hits a "Single"
    Then the system should show standard advancement: "Player B" scores
    And I should see a manual override interface
    When I manually set "Player B" to "stay at 2nd base"
    Then "Player B" should remain on 2nd base
    And the manual override should be saved with the at-bat record

  @AC005-manual-interface
  Scenario: Manual baserunner advancement interface
    Given there are runners on all bases
    And the batter hits a "Double"
    When the manual override modal opens
    Then I should see dropdown options for each runner:
      | Runner Position | Available Options                    |
      | 1st Base       | Advance to 2nd, Advance to 3rd, Score, Out, Stay |
      | 2nd Base       | Advance to 3rd, Score, Out, Stay     |
      | 3rd Base       | Score, Out, Stay                     |
    And I should be able to confirm my selections
    And I should be able to cancel and use standard rules

  @AC006
  Scenario: Track scoring runners and calculate RBIs accurately
    Given there are runners on 2nd base "Player B" and 3rd base "Player C"
    When the batter hits a "Double"
    Then both "Player B" and "Player C" should score
    And the batter should be credited with 2 RBIs
    And the scoring runners should be tracked in the at-bat record
    And the team's run total should increase by 2

  @AC006-rbi-calculation
  Scenario: RBI calculation for different scenarios
    Given there are runners on all three bases
    When the batter hits a "Home Run"
    Then all three runners should score plus the batter
    And the batter should be credited with 4 RBIs
    And the team's run total should increase by 4
    And all scoring should be recorded accurately

  @AC007
  Scenario: Visual representation of current baserunners
    Given there are runners on 1st base "John Smith" and 3rd base "Jane Doe"
    When I view the at-bat form
    Then I should see a visual baserunner display showing:
      | Base     | Status  | Player Name |
      | 1st Base | Filled  | John Smith  |
      | 2nd Base | Empty   | Empty       |
      | 3rd Base | Filled  | Jane Doe    |
    And the display should update in real-time as runners advance
    And empty bases should be clearly distinguished from occupied bases