Feature: At-Bat Recording with Functional Integration
  As a Scorekeeper, I want to record at-bat results with complete business logic integration
  So that all batting results are properly saved and processed in real-time

  Background:
    Given I have a game in "in-progress" status
    And the game has a complete lineup setup
    And I am on the live scoring page

  @AC001
  Scenario: Record at-bat with functional business logic integration
    Given the current batter is "John Smith" batting 3rd
    And there are runners on 1st and 2nd base
    When I click the "Double" button in the at-bat form
    Then the at-bat should be saved to the database immediately
    And the batting result should be "2B"
    And the baserunners should advance according to standard rules
    And the RBI count should be calculated correctly
    And the game statistics should be updated in real-time

  @AC001-persistence
  Scenario: At-bat data persists immediately to prevent data loss
    Given the current batter is "Jane Doe" batting 5th
    When I record a "Single" result
    Then the at-bat record should be immediately saved to IndexedDB
    And the data should persist even if the browser crashes
    And the at-bat should appear in the game's at-bat history

  @AC002
  Scenario: System automatically selects current batter from lineup
    Given the game has started with the first batter
    When I complete an at-bat for the current batter
    Then the system should automatically advance to the next batter in the lineup order
    And the next batter's information should be displayed in the at-bat form
    And the batting order should cycle back to #1 after the last batter

  @AC002-lineup-cycling
  Scenario: Batting order cycles through complete lineup
    Given the current batter is the 9th batter in the lineup
    When I complete the at-bat
    Then the system should advance to the 1st batter in the lineup
    And the batting order display should show "1st Batter"

  @AC003
  Scenario: Quick-action buttons for all batting results
    Given I am viewing the at-bat form
    Then I should see quick-action buttons for all valid results:
      | Button Type    | Label       |
      | Single         | Single      |
      | Double         | Double      |
      | Triple         | Triple      |
      | Home Run       | Home Run    |
      | Walk           | Walk        |
      | Strikeout      | Strikeout   |
      | Ground Out     | Ground Out  |
    And each button should be easily tappable on touch devices
    And clicking any button should immediately process the result

  @AC003-touch-interface
  Scenario: At-bat buttons work with touch input
    Given I am using a tablet device
    And I am viewing the at-bat form
    When I tap the "Home Run" button
    Then the result should be processed immediately
    And I should receive visual feedback that the action was recorded