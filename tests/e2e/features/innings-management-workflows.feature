Feature: Innings Management for Home/Away Teams
  As a Scorekeeper, I want the scoring interface to automatically manage innings based on home/away status
  so that I only record at-bats during my team's batting turn and avoid confusion during live games.

  Background:
    Given I have a game "Red Sox vs Yankees" set up with lineup
    And the game is in progress
    And I am on the live scoring page

  @AC029 @AC031
  Scenario: Away team records only top half innings
    Given my team "Red Sox" is playing away against "Yankees"
    And we are in the top of the 1st inning
    When the scoring interface loads
    Then I should see "Top of 1st" displayed prominently
    And the at-bat recording interface should be enabled for my team
    And I should be able to record batting results for Red Sox players

  @AC030 @AC032
  Scenario: Home team records only bottom half innings
    Given my team "Blue Jays" is playing at home against "Tigers"
    And we are in the bottom of the 2nd inning
    When the scoring interface loads
    Then I should see "Bottom of 2nd" displayed prominently
    And the at-bat recording interface should be enabled for my team
    And I should be able to record batting results for Blue Jays players

  @AC033 @AC034
  Scenario: Interface disabled during opponent's batting turn (away team)
    Given my team "Red Sox" is playing away
    And we are in the bottom of the 3rd inning (Yankees batting)
    When I view the scoring interface
    Then I should see "Bottom of 3rd - Yankees Batting" displayed
    And the at-bat recording interface should be disabled
    And I should see a message "Opponent's turn to bat - interface disabled"
    And all batting input controls should be inactive

  @AC033 @AC034
  Scenario: Interface disabled during opponent's batting turn (home team)
    Given my team "Blue Jays" is playing at home
    And we are in the top of the 4th inning (Tigers batting)
    When I view the scoring interface
    Then I should see "Top of 4th - Tigers Batting" displayed
    And the at-bat recording interface should be disabled
    And I should see a message "Opponent's turn to bat - interface disabled"
    And all batting input controls should be inactive

  @AC031 @AC032
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

  @AC031 @AC032
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

  @AC034
  Scenario: Automatic interface state changes when inning switches (away)
    Given my team "Dodgers" is playing away
    And I am recording the top of the 5th inning (our turn)
    And the interface is enabled
    When the inning switches to bottom of the 5th
    Then the interface should automatically disable
    And I should see "Bottom of 5th - Opponent Batting"
    And all at-bat controls should become inactive
    And the current batter should be cleared/hidden

  @AC034
  Scenario: Automatic interface state changes when inning switches (home)
    Given my team "Padres" is playing at home
    And we are in the top of the 6th inning (opponent's turn)
    And the interface is disabled
    When the inning switches to bottom of the 6th
    Then the interface should automatically enable
    And I should see "Bottom of 6th"
    And all at-bat controls should become active
    And the current batter should be displayed

  @AC029 @AC030
  Scenario: Scoreboard shows correct team batting context
    Given my team "Mariners" is playing away
    When I view the scoreboard during different innings
    Then it should clearly indicate which team is batting:
      | Inning State | Scoreboard Display |
      | Top of 1st | Mariners Batting (Away) |
      | Bottom of 1st | Opponent Batting |
      | Top of 2nd | Mariners Batting (Away) |
      | Bottom of 2nd | Opponent Batting |

  @AC031 @AC032
  Scenario: Inning progression respects home/away logic
    Given my team "Brewers" is playing away
    When I complete the top of the 7th inning
    Then the interface should transition to "Bottom of 7th - Opponent"
    And my controls should be disabled
    When the opponent completes the bottom of the 7th
    Then the interface should transition to "Top of 8th"
    And my controls should be enabled again

  @AC033
  Scenario: Attempt to record during opponent's turn shows clear error
    Given my team "Cubs" is playing away
    And we are in the bottom of the 1st inning (opponent batting)
    When I attempt to click any at-bat recording button
    Then the buttons should not respond
    And I should see a tooltip or message "Cannot record - opponent's turn to bat"
    And no at-bat data should be recorded

  @AC034
  Scenario: Interface state persists across page refreshes
    Given my team "White Sox" is playing at home
    And we are in the top of the 2nd inning (opponent batting)
    And the interface is properly disabled
    When I refresh the page
    Then the interface should load in the disabled state
    And it should still show "Top of 2nd - Opponent Batting"
    And controls should remain inactive

  @AC031 @AC032
  Scenario: Visual distinction between enabled and disabled states
    Given I am recording a game with innings management active
    When the interface is enabled (my team's turn)
    Then all controls should have normal appearance
    And the inning indicator should use active colors (green/blue)
    And buttons should be clickable and responsive
    When the interface is disabled (opponent's turn)
    Then all controls should appear grayed out/dimmed
    And the inning indicator should use inactive colors (gray/red)
    And buttons should appear disabled

  @AC029 @AC030
  Scenario: Game setup determines home/away innings behavior
    Given I have two games configured:
      | Game | Team | Home/Away |
      | Game 1 | Red Sox | Away |
      | Game 2 | Red Sox | Home |
    When I start recording Game 1
    Then I should only be able to record during top half innings
    When I switch to recording Game 2
    Then I should only be able to record during bottom half innings

  @AC031 @AC032
  Scenario: Extra innings maintain home/away logic
    Given my team "Twins" is playing away
    And we are in extra innings (10th inning and beyond)
    When we are in the top of the 10th
    Then I should see "Top of 10th" and interface should be enabled
    When we are in the bottom of the 10th
    Then I should see "Bottom of 10th - Opponent" and interface should be disabled
    And the same pattern should continue for all extra innings

  @AC033 @AC034
  Scenario: Game state transitions respect innings management
    Given my team "Royals" is playing at home
    And the game is in progress
    When I pause/suspend the game during the top of the 3rd
    Then the interface should remember it was disabled (opponent's turn)
    When I resume the game
    Then the interface should load in the disabled state
    And show the correct inning indicator

  @AC029 @AC030 @AC031 @AC032
  Scenario: Innings management integrates with scoring workflow
    Given my team "Angels" is playing away
    And we are in the top of the 1st (our turn)
    When I record a complete at-bat that results in an out
    And we reach 3 outs to end the top of the inning
    Then the interface should automatically transition to disabled state
    And show "Bottom of 1st - Opponent Batting"
    And wait for manual progression to the next inning when appropriate

  @AC034
  Scenario: Multiple games with different home/away settings
    Given I have multiple games in progress:
      | Game | Home/Away | Current Inning |
      | Game A | Away | Top of 2nd |
      | Game B | Home | Bottom of 3rd |
    When I switch between games
    Then each game should maintain its correct home/away interface state
    And Game A should show enabled interface in top innings
    And Game B should show enabled interface in bottom innings

  @AC031 @AC032
  Scenario: Inning indicator works with different inning numbering
    Given my team "Pirates" is playing away
    When I progress through all innings of a standard game
    Then the inning indicators should display correctly:
      | Inning Number | My Turn Display | Opponent Turn Display |
      | 1 | Top of 1st | Bottom of 1st - Opponent |
      | 7 | Top of 7th | Bottom of 7th - Opponent |
      | 9 | Top of 9th | Bottom of 9th - Opponent |
      | 10 | Top of 10th | Bottom of 10th - Opponent |