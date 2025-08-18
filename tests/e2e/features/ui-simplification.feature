Feature: UI Simplification and Enhanced User Experience
  As a Breaking-Bat user, I want a simplified and intuitive interface that reduces friction in my primary workflows while maintaining access to all functionality, so that I can focus on scoring games efficiently without unnecessary navigation complexity.

  Background:
    Given I am using the Breaking-Bat application
    And the simplified UI improvements are active
    And I have some existing data including teams and games

  @AC001
  Scenario: Streamlined navigation with 4 main sections
    Given I am accessing the application navigation
    When I view the main navigation options
    Then I should see exactly 4 main sections
    And the sections should be "Games", "Teams", "Statistics", "Settings"
    And I should not see a separate "Home" page option
    And the navigation should be consistent on both desktop and mobile
    And mobile navigation should provide larger touch targets

  @AC002
  Scenario: Games page as default landing page
    Given I navigate to the application root URL "/"
    When the page loads
    Then I should be automatically redirected to "/games"
    And I should see the Games page with my game list
    And I should see game creation options immediately available
    And the page should be optimized for quick game access

  @AC001-workflow
  Scenario: Reduced navigation steps to primary workflow
    Given I want to start scoring a new game
    When I follow the streamlined workflow
    Then I should go directly from Games → Create Game → Start → Score
    And the workflow should require exactly 4 steps (down from 5)
    And I should not need to visit a Home page first
    And each step should be clearly focused on the next action

  @AC006
  Scenario: Consolidated Settings with tabbed interface
    Given I navigate to the Settings page
    When I view the settings organization
    Then I should see a tabbed interface
    And I should see "General" tab as the first tab
    And I should see "Game Configuration" tab as the second tab
    And both tabs should work smoothly on mobile devices
    And the interface should be responsive across all screen sizes

  @AC007
  Scenario: Seasons management moved to Settings
    Given I want to manage my seasons
    When I navigate to Settings → Game Configuration tab
    Then I should see seasons management functionality
    And I should be able to create new seasons
    And I should be able to edit existing seasons
    And I should be able to delete seasons
    And all existing seasons functionality should be preserved
    And there should be no separate "/seasons" route available

  @AC008
  Scenario: Game Types management moved to Settings  
    Given I want to manage my game types
    When I navigate to Settings → Game Configuration tab
    Then I should see game types management functionality
    And I should be able to create new game types
    And I should be able to edit existing game types
    And I should be able to delete game types
    And all existing game types functionality should be preserved
    And there should be no separate "/game-types" route available

  @AC009
  Scenario: General settings tab functionality
    Given I am on the Settings → General tab
    When I view the available options
    Then I should see theme settings options
    And I should see data management options
    And I should see app information and version details
    And I should be able to export my data from this location
    And I should be able to import data from this location

  @AC012
  Scenario: Optional Season and Game Type in game creation
    Given I want to create a new game quickly
    When I click "Create Game" on the Games page
    Then the Season field should be optional
    And the Game Type field should be optional
    And I should be able to create a game with just team names and basic info
    And the form validation should not require Season or Game Type
    And I should be able to start scoring immediately after creation

  @AC013
  Scenario: Quick Create mode for casual users
    Given I am a casual user who wants to score pickup games
    When I create a new game
    Then I should see "Quick Create" mode by default
    And I should only see essential fields displayed
    And I should be able to create and start a game in 2-3 minutes
    And optional fields should be hidden but available if needed

  @AC014
  Scenario: Detailed Setup mode for advanced users
    Given I am an advanced user who wants full control
    When I create a new game and enable "Detailed Setup"
    Then I should see all available fields and options
    And I should be able to set season, game type, and all metadata
    And I should be able to configure advanced game settings
    And the detailed mode should provide access to all existing functionality

  @AC015
  Scenario: Games without seasons display appropriately
    Given I have created games both with and without assigned seasons
    When I view my games list
    Then games with seasons should display the season name
    And games without seasons should display appropriately without blank fields
    And filtering and sorting should work for both types of games
    And no functionality should be broken for games without season/game type

  @AC017
  Scenario: Progressive enhancement for adding metadata later
    Given I created a game without season or game type initially
    When I want to add this information later
    Then I should be able to edit the game
    And I should be able to assign it to a season
    And I should be able to assign it a game type
    And the changes should be saved properly
    And the game should display with the new information

  @AC018
  Scenario: Enhanced mobile experience with larger touch targets
    Given I am using the application on a mobile device
    When I interact with the navigation
    Then the bottom navigation should have 4 larger touch targets
    And each navigation item should be easily tappable with thumb navigation
    And there should be 25% larger touch areas compared to 5-item navigation
    And I should have fewer accidental taps on wrong navigation items

  @AC019
  Scenario: Mobile-optimized Games page as landing
    Given I am using a mobile device
    When I access the application
    Then I should land directly on the Games page
    And the Games page should be optimized for mobile-first experience
    And game creation should be easily accessible from mobile interface
    And the interface should work smoothly across phone and tablet sizes

  @AC020
  Scenario: Mobile-responsive Settings tabs
    Given I am using the Settings page on a mobile device
    When I switch between General and Game Configuration tabs
    Then the tab switching should work smoothly on touchscreen
    And the tab interface should be mobile-friendly
    And all settings functionality should be easily accessible on mobile
    And the layout should adapt appropriately to mobile screen sizes

  @AC024
  Scenario: Backward compatibility with existing data
    Given I am an existing user with established data
    When I use the simplified interface
    Then all my existing games should display correctly
    And all my existing seasons should be accessible in Settings
    And all my existing game types should be accessible in Settings
    And no historical data should be lost or inaccessible

  @AC025
  Scenario: Existing games with seasons and game types
    Given I have games with assigned seasons and game types
    When I view these games in the simplified interface
    Then they should display all metadata correctly
    And season information should be visible and accessible
    And game type information should be visible and accessible
    And I should be able to filter and sort by season and game type

  @AC026
  Scenario: URL redirect handling for removed routes
    Given I have bookmarked the old "/seasons" URL
    When I navigate to that bookmark
    Then I should be redirected to "/settings#game-configuration"
    And I should see the seasons management functionality
    And the redirect should be seamless without error messages

  @AC026-game-types
  Scenario: Game Types URL redirect handling
    Given I have bookmarked the old "/game-types" URL  
    When I navigate to that bookmark
    Then I should be redirected to "/settings#game-configuration"
    And I should see the game types management functionality
    And the redirect should be seamless without error messages

  @AC028
  Scenario: Data migration seamless and automatic
    Given I am upgrading from the previous interface version
    When the application loads with the new simplified interface
    Then all data migration should happen automatically
    And I should not see any migration prompts or warnings
    And all functionality should work immediately
    And there should be no disruption to my established workflows

  @AC006-discoverability
  Scenario: Feature discoverability in consolidated Settings
    Given I am looking for configuration options
    When I navigate to the Settings page
    Then I should easily find seasons management in Game Configuration
    And I should easily find game types management in Game Configuration
    And the organization should be logical and intuitive
    And related features should be grouped together appropriately

  @AC013-time-reduction
  Scenario: Time to first game creation reduction
    Given I am a new user trying to create my first game
    When I follow the simplified workflow from landing on the site
    Then I should be able to create my first game in under 3 minutes
    And I should not be required to set up seasons or game types first
    And the process should be intuitive without extensive documentation
    And this should represent a 70-80% improvement from the previous workflow

  @AC001-efficiency
  Scenario: Navigation efficiency improvement
    Given I am performing common tasks like game creation and management
    When I use the simplified 4-section navigation
    Then I should require 25% fewer clicks for common tasks
    And the most frequent actions should be more directly accessible
    And I should spend less time navigating between different sections

  @AC022
  Scenario: Mobile task completion efficiency
    Given I am using a mobile device for scoring tasks
    When I perform primary workflows like creating and starting games
    Then I should require 40% fewer taps than the previous interface
    And touch targets should be appropriately sized for thumb navigation
    And the mobile experience should be optimized for one-handed use

  @AC027
  Scenario: Advanced feature preservation
    Given I am an advanced user who uses seasons, game types, and detailed statistics
    When I use the simplified interface
    Then all advanced features should remain accessible
    And I should not experience any reduction in functionality
    And advanced features should be organized more logically
    And feature adoption should not decrease due to the interface changes

  @AC023-accessibility
  Scenario: Accessibility standards maintenance
    Given I am using assistive technologies
    When I navigate the simplified interface
    Then all accessibility features should be maintained or improved
    And screen readers should work properly with the new navigation
    And keyboard navigation should work efficiently
    And color contrast and visual accessibility should meet standards

  @AC005-performance
  Scenario: Performance optimization with simplified interface
    Given I am using the application on various devices
    When I interact with the simplified interface
    Then page load times should be maintained or improved
    And navigation responsiveness should be excellent
    And memory usage should be optimized
    And the interface should perform well across different device capabilities