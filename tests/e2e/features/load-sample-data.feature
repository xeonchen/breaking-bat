Feature: Load Sample Data for Testing
  As a Developer/Tester, I want to load sample data with a single click to populate the application for testing.

  Background:
    Given I am on the application home page
    And I navigate to the Settings page
    And I am on the "General" tab

  @AC001
  Scenario: Display Load Sample Data button with description
    Given I am on the Settings General tab
    Then I should see a "Load Sample Data" button
    And I should see the description "Load sample teams with MLB fantasy players, seasons, and game types for testing"
    And the button should have an add icon
    And the button should be blue colored

  @AC002
  Scenario: Successfully load sample data
    Given I am on the Settings General tab
    And the application has no existing sample data
    When I click the "Load Sample Data" button
    Then I should see the button change to loading state with text "Loading Sample Data..."
    And the button should be disabled during loading
    When the loading completes successfully
    Then I should see a success toast notification
    And the toast should contain "Sample Data Loaded Successfully!"
    And the toast should mention "3 teams with 33 MLB players, 3 seasons, 5 game types"

  @AC005
  Scenario: Handle existing sample data gracefully
    Given I am on the Settings General tab
    And sample data already exists in the application
    When I click the "Load Sample Data" button
    Then the system should not create duplicate data
    And I should still see a success notification
    And the existing data should remain intact

  @AC004
  Scenario: Display error notification on failure
    Given I am on the Settings General tab
    And there is a dependency initialization error
    When I click the "Load Sample Data" button
    Then I should see an error toast notification
    And the toast should contain "Failed to Load Sample Data"
    And the toast should contain a helpful error message
    And the button should return to normal state

  @AC007
  Scenario: Verify created sample data is accessible
    Given I have successfully loaded sample data
    When I navigate to the Teams page
    Then I should see 3 teams: "Dodgers All-Stars", "Yankees Legends", "Braves Champions"
    And the "Dodgers All-Stars" team should have 12 players including "Shohei Ohtani" and "Mookie Betts"
    And the "Yankees Legends" team should have 11 players including "Aaron Judge" and "Juan Soto"
    And the "Braves Champions" team should have 10 players including "Ronald Acuña Jr" and "Austin Riley"

    When I navigate to the Seasons page
    Then I should see 3 seasons for 2025: Spring, Summer, and Fall
    And each season should have appropriate date ranges

    When I navigate to the Settings Game Configuration tab
    Then I should see 5 game types: "Regular Season", "Playoff", "Championship", "Tournament", "Scrimmage"

  @AC007-players
  Scenario: Verify MLB players have correct details
    Given I have successfully loaded sample data
    When I navigate to the Teams page
    And I view the "Dodgers All-Stars" team details
    Then I should see "Shohei Ohtani" wearing jersey #17 in Short Fielder position
    And I should see "Mookie Betts" wearing jersey #50 in Right Field position
    And I should see "Walker Buehler" wearing jersey #21 in Pitcher position

    When I view the "Yankees Legends" team details  
    Then I should see "Aaron Judge" wearing jersey #99 in Center Field position
    And I should see "Juan Soto" wearing jersey #22 in Right Field position
    And I should see "Gerrit Cole" wearing jersey #45 in Pitcher position

  @AC006
  Scenario: Handle loading state properly
    Given I am on the Settings General tab
    When I click the "Load Sample Data" button
    Then the button text should change to "Loading Sample Data..."
    And the button should show a loading spinner
    And the button should be disabled
    And I should not be able to click the button again
    When the loading completes
    Then the button should return to normal state
    And the button should be enabled again