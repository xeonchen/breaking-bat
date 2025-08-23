Feature: Comprehensive Rule Matrix System
  As a softball scoring application, I need a comprehensive rule validation system that understands all possible game scenarios and can provide guidance for valid scoring options while preventing invalid game states.

  Background:
    Given I am on the application home page
    And the rule matrix system is loaded and available
    And I have created a team "Test Hawks" with 9 players
    And I have created a game with complete lineup setup
    And the game is in progress with various baserunner scenarios

  @live-game-scoring:AC003
  Scenario: Basic hit type validation for empty bases
    Given the bases are empty
    And "John Smith" is the current batter
    When I access the scoring interface
    Then I should see all 13 standard hit types available
    And the hit types should include "1B", "2B", "3B", "HR", "BB", "IBB", "SF", "E", "FC", "SO", "GO", "AO", "DP"
    And each hit type should show appropriate base advancement options
    And RBI calculations should be automatically provided for each outcome

  @live-game-scoring:AC003
  Scenario: Hit type filtering based on base situation
    Given there is a runner on first base only
    And "Mike Johnson" is the current batter
    When I access the scoring options
    Then sacrifice fly "SF" should be disabled (no runner in scoring position)
    And double play "DP" should be enabled
    And all other standard hit types should be available
    And base advancement options should reflect the current runner situation

  @live-game-scoring:AC008
  Scenario: Double outcome selection with RBI calculation
    Given there is a runner on first base
    And "Sarah Davis" is the current batter
    When I select "2B" (double)
    Then I should see multiple outcome options
    And option 1 should show "Runner scores, batter to 2nd → 1 RBI"
    And option 2 should show "Runner to 3rd, batter to 2nd → 0 RBI"
    And I should be able to select the outcome that matches what actually happened
    And the system should validate the selected combination is possible

  @live-game-scoring:AC015
  Scenario: Home run with bases loaded RBI calculation
    Given there are runners on first, second, and third base
    And "David Lee" is the current batter
    When I select "HR" (home run)
    Then the system should automatically calculate 4 RBIs
    And all runners should advance to home plate and score
    And the batter should advance to home plate and score
    And the total runs scored should be 4
    And the RBI count should be confirmed as 4

  @live-game-scoring:AC010
  Scenario: Sacrifice fly validation with runner in scoring position
    Given there is a runner on third base only
    And "Lisa Brown" is the current batter
    When I select "SF" (sacrifice fly)
    Then the runner should advance to home and score
    And the batter should be marked as out (fly out)
    And the RBI count should be 1
    And the out count should increase by 1
    And the system should validate this is a legal sacrifice fly scenario

  @live-game-scoring:AC031
  Scenario: Rule lookup performance validation
    Given the game is in an active scoring state
    When I change the base situation multiple times rapidly
    Then each rule lookup should complete in under 50ms
    And the UI should update immediately when base situation changes
    And the system should handle concurrent rule validations efficiently
    And memory usage should remain reasonable throughout the process

  @live-game-scoring:AC013
  Scenario: Fielder's choice with multiple outcome options
    Given there are runners on first and second base
    And "Chris Martin" is the current batter
    When I select "FC" (fielder's choice)
    Then I should see multiple fielding choice options
    And option 1 should show "force out at third base"
    And option 2 should show "force out at second base"
    And option 3 should show "safe all around (no out)"
    And each option should show the resulting base configuration
    And I should be able to select the actual game outcome

  @live-game-scoring:AC003
  Scenario: Double play validation with insufficient runners
    Given there is only a runner on third base
    And "Kevin White" is the current batter
    When I access the scoring options
    Then "DP" (double play) should be disabled or unavailable
    And a tooltip should explain "Double play requires force play opportunity"
    And all other applicable hit types should remain available
    And the system should prevent impossible double play scenarios

  @live-game-scoring:AC003
  Scenario: Error advancement with baserunner options
    Given there is a runner on second base
    And "Alex Green" is the current batter
    When I select "E" (error)
    Then I should see error type options like "E1", "E2", "E3", "E4", "E5", "E6"
    And for each error type I should see advancement options
    And option 1 might show "Batter to 1st, runner to 3rd"
    And option 2 might show "Batter to 2nd, runner scores"
    And each option should indicate if runs are earned or unearned
    And the system should track error statistics separately

  @live-game-scoring:AC015-walk
  Scenario: Intentional walk with bases loaded scenario
    Given there are runners on first, second, and third base
    And "Ryan Blue" is the current batter
    When I select "IBB" (intentional walk)
    Then the system should show forced advancement
    And all runners should advance one base automatically
    And the runner on third should score (forced)
    And the batter should advance to first base
    And the RBI count should be 0 (no RBI on walk)
    And the system should handle the forced run scenario correctly

  @live-game-scoring:AC032
  Scenario: Test data validation for existing scenarios
    Given I am running the test validation tool
    When I scan all existing test files for rule violations
    Then the system should generate a report of any violations found
    And the report should include suggested corrections
    And all standard test scenarios should follow real softball rules
    And any violations should be clearly documented with explanations

  @live-game-scoring:AC015
  Scenario: Complex baserunner state validation
    Given there are runners on first and third base
    And "Steve Red" is the current batter
    When I select "1B" (single)
    Then I should see multiple advancement scenarios
    And scenario 1 should show "both runners advance one base"
    And scenario 2 should show "runner from 3rd scores, runner from 1st to 2nd"
    And scenario 3 should show "runner from 3rd scores, runner from 1st to 3rd"
    And each scenario should show accurate RBI calculations
    And no invalid base states should be offered (like two runners on same base)

  @live-game-scoring:AC003-groundout
  Scenario: Ground out double play with runners
    Given there are runners on first and second base
    And there are 0 outs in the inning
    And "Tom Wilson" is the current batter
    When I select "DP" (double play)
    Then I should see double play outcome options
    And option 1 should show "6-4-3 double play, runner advances to 3rd"
    And option 2 should show "4-6-3 double play, runner stays at 2nd"
    And each option should show the final out count (2 outs)
    And the system should validate realistic double play scenarios

  @live-game-scoring:AC015-forced
  Scenario: Walk with bases loaded forced run
    Given there are runners on first, second, and third base
    And "Paul Gray" is the current batter
    When I select "BB" (walk)
    Then the system should automatically force all runners to advance
    And the runner on third should be forced to score
    And all other runners should advance exactly one base
    And the batter should advance to first base
    And no RBI should be credited (walk scenario)
    And the system should handle forced advancement correctly

  @live-game-scoring:AC039
  Scenario: Rule matrix integration with live scoring
    Given I am in the live scoring interface
    And the current base situation changes during the game
    When I record each play throughout an inning
    Then the available scoring options should update for each base situation
    And the rule validations should be consistent with live gameplay
    And the system should prevent any impossible game state transitions
    And all rule lookups should maintain sub-50ms performance

  @live-game-scoring:AC016
  Scenario: Advanced scenario handling preparation
    Given the rule matrix supports basic scenarios
    When I prepare for future advanced scenario implementation
    Then the system should have extensible architecture for new rules
    And the current rule matrix should handle aggressive advancement attempts
    And the system should support fielding error combinations
    And there should be clear documentation of rule interpretations

  @live-game-scoring:AC040
  Scenario: Expert rule validation verification
    Given I am validating the rule matrix against official slow-pitch softball rules
    When I test all standard game scenarios
    Then every rule interpretation should match official slow-pitch guidelines
    And edge cases should be handled appropriately
    And the rule matrix should be updatable if rules change
    And documentation should clearly explain all rule interpretations

  @live-game-scoring:AC041
  Scenario: Memory efficiency during extended games
    Given I am scoring a long extra-inning game
    And I have performed hundreds of rule lookups
    When I check system performance after extended use
    Then memory usage should remain stable
    And rule lookup performance should not degrade
    And the system should handle concurrent validations efficiently
    And there should be no memory leaks in rule processing

  @live-game-scoring:AC042
  Scenario: Rule violation prevention in UI
    Given I am using the live scoring interface
    When I attempt to create an invalid game state
    Then the system should prevent the invalid action
    And I should see a clear explanation of why the action is not allowed
    And alternative valid actions should be suggested
    And the game state should remain consistent and valid

  @live-game-scoring:AC042
  Scenario: Comprehensive rule coverage validation
    Given the rule matrix covers all 8 possible baserunner configurations
    And all 13 standard hit types are implemented
    When I test every combination systematically
    Then every combination should have defined outcomes
    And all outcomes should follow official softball rules
    And no combination should result in undefined behavior
    And performance should remain optimal across all combinations