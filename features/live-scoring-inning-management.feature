Feature: Automated Inning Management with Out Counting and Side Switching
  As a Scorekeeper, I want the system to automatically manage innings and outs
  So that I can focus on recording at-bats while the game progresses correctly

  Background:
    Given I have a game in "in-progress" status
    And the game has a complete lineup setup
    And I am on the live scoring page

  @AC008
  Scenario: Automatically count outs and switch sides at three outs
    Given it is the "Top" of the "1st" inning
    And there are currently "2" outs
    When the batter records a "Strikeout"
    Then the out count should increase to "3" outs
    And the system should automatically switch to "Bottom" of the "1st" inning
    And the out count should reset to "0" outs
    And the batting team should switch from away to home team

  @AC008-out-tracking
  Scenario: Track outs from various at-bat results
    Given it is the "Bottom" of the "2nd" inning with "1" out
    When I record the following at-bats:
      | Result      | Expected Outs After |
      | Ground Out  | 2                  |
      | Single      | 2                  |
      | Strikeout   | 3 (inning over)    |
    Then the out count should progress correctly after each at-bat
    And only out-producing results should increase the out count

  @AC009
  Scenario: Innings progress automatically throughout the game
    Given it is the "Bottom" of the "3rd" inning with "2" outs
    When the current batter records a "Ground Out"
    Then the inning should advance to "Top" of the "4th" inning
    And the out count should reset to "0" outs
    And the away team should be batting again
    And the inning display should update immediately

  @AC009-inning-advancement
  Scenario: Complete inning cycle from top to bottom to next inning
    Given it is the "Top" of the "7th" inning with "2" outs
    When I complete the at-bat with 3 outs
    Then the system should switch to "Bottom" of the "7th" inning
    When I complete the bottom half with 3 outs
    Then the system should advance to "Top" of the "8th" inning
    And both teams should have batted in the 7th inning

  @AC010
  Scenario: Scoreboard updates in real-time as runs are scored
    Given the current score is Home: 3, Away: 2
    And it is the "Bottom" of the "5th" inning
    And there is a runner on 3rd base
    When the batter hits a "Single" and the runner scores
    Then the scoreboard should immediately show Home: 4, Away: 2
    And the inning-by-inning display should show 1 run in the bottom 5th for home team
    And the scoreboard animation should highlight the score change

  @AC010-inning-scores
  Scenario: Track runs scored by inning for scoreboard display
    Given it is the "Top" of the "6th" inning
    And the away team scores 2 runs during this inning
    Then the scoreboard should display "2" runs for the away team in the 6th inning
    And the total score should reflect the 2 additional runs
    And the inning-by-inning breakdown should be accurate

  @AC008-side-switching
  Scenario: Proper team switching when sides change
    Given the away team is currently batting in the "Top" of the "4th" inning
    And the lineup shows away team players
    When the away team records their 3rd out
    Then the system should switch to home team batting
    And the lineup should display home team players
    And the current batter should be the next home team batter in order
    And the baserunners should be cleared for the new half-inning

  @AC009-baserunner-reset
  Scenario: Clear baserunners when inning advances
    Given it is the "Bottom" of the "2nd" inning
    And there are runners on 1st and 2nd base
    When the home team records their 3rd out to end the inning
    Then the system should advance to "Top" of the "3rd" inning
    And all bases should be cleared (no runners)
    And the away team should be batting with a clean slate