Feature: Data Storage and Management
  As a User, I want to have all my data automatically saved locally and be able to export/import game data so that I can never lose my scoring data due to crashes or power loss, and manage my data across different devices or create backups.

  Background:
    Given I am on the application home page
    And the local database is available and functioning
    And I have created some test data including teams and games

  Scenario: Auto-save functionality during normal operations
    Given I am creating a new team "Storm Warriors"
    When I fill in the team details and submit
    Then the team should be immediately saved to IndexedDB
    And I should be able to see the team without manual save
    And the data should persist if I refresh the browser
    And no data should be lost during the operation

  Scenario: Session recovery after unexpected closure
    Given I am in the middle of scoring a game "Panthers vs Lions"
    And I have recorded 3 innings of play
    And the game is not yet completed
    When I simulate an unexpected browser closure
    And I reopen the application
    Then I should see a session recovery prompt
    And I should be offered to resume "Panthers vs Lions"
    When I choose to resume the game
    Then I should return to the exact game state before closure
    And all recorded plays should be preserved
    And I should be able to continue scoring from where I left off

  Scenario: Resume last unfinished game on startup
    Given I was scoring game "Eagles vs Hawks" yesterday
    And I closed the application before completing the game
    And the game is still in "in_progress" status
    When I start the application today
    Then I should see a notification about unfinished games
    And I should see "Eagles vs Hawks" as resumable
    When I click "Resume Game"
    Then I should be taken directly to the live scoring interface
    And the game state should be exactly as I left it

  Scenario: Export individual game data in JSON format
    Given I have a completed game "Titans vs Vikings" with full statistics
    And I am viewing the game details page
    When I click "Export Game Data"
    And I select "JSON" format
    Then I should receive a downloadable JSON file
    And the file should be named "titans-vs-vikings-2025-08-08.json"
    And the file should contain complete game information
    And the file should include team rosters, lineup, and play-by-play data
    And the file should include comprehensive statistics

  Scenario: Export individual game data in CSV format
    Given I have a completed game "Rangers vs Knights" with batting statistics
    And I am viewing the game details page
    When I click "Export Game Data"
    And I select "CSV" format
    Then I should receive a downloadable CSV file
    And the file should contain batting statistics in spreadsheet format
    And the file should include player names, at-bats, hits, and RBIs
    And the file should be suitable for analysis in Excel or similar tools

  Scenario: Export entire season data
    Given I have completed season "Summer League 2025"
    And the season contains 12 completed games
    And I am viewing the season details page
    When I click "Export Season Data"
    And I select "JSON" format with "Include all games"
    Then I should receive a comprehensive season export file
    And the file should contain all 12 games with full details
    And the file should include season-level statistics
    And the file should include team standings and player season stats

  Scenario: Import previously exported game data
    Given I have a valid game export file "hawks-vs-eagles-backup.json"
    And I am on the Games management page
    When I click "Import Game Data"
    And I select the JSON file
    And I review the import preview
    And I confirm the import
    Then the game "Hawks vs Eagles" should be restored
    And all player statistics should be preserved
    And the game should appear in my games list
    And all data should be saved to local storage

  Scenario: Validate imported data integrity
    Given I have a game export file with corrupted data
    When I attempt to import the file
    Then the system should detect the data corruption
    And I should see an error message "Invalid data format detected"
    And I should be shown specific validation errors
    And no partial data should be imported
    And my existing data should remain unchanged

  Scenario: Handle duplicate data during import
    Given I already have game "Wolves vs Bears" in my database
    And I have an export file containing the same game
    When I attempt to import the file
    Then I should see a duplicate detection warning
    And I should be offered options to "Skip", "Replace", or "Merge"
    When I choose "Replace"
    Then the existing game should be overwritten with imported data
    And I should see confirmation of the replacement

  Scenario: Merge imported data with existing records
    Given I have partial data for team "Thunder Bolts"
    And I have an import file with additional players for "Thunder Bolts"
    When I import the file and choose "Merge" for conflicts
    Then the existing team data should be preserved
    And the new players should be added to the roster
    And no duplicate players should be created
    And the merged data should be validated for consistency

  Scenario: Complete offline operation without network
    Given I am using the application without internet connection
    And I can see the offline indicator in the interface
    When I create team "Offline Warriors"
    And I add 12 players to the roster
    And I create and start a game
    And I score 5 complete innings
    Then all data should be saved to local IndexedDB
    And all functionality should work without network
    And I should see no network-related errors
    And the data should be available when I go back online

  Scenario: Handle storage quota limits gracefully
    Given I have been using the application extensively
    And my local storage is approaching browser limits
    When I try to save a new large game dataset
    And the storage quota is exceeded
    Then I should see a storage warning message
    And I should be offered options to free up space
    And I should be able to export and delete old data
    And critical game data should be prioritized for retention

  Scenario: Data compression for large datasets
    Given I have accumulated 2 years of game data
    And the total data size is becoming large
    When the system detects storage efficiency opportunities
    Then older data should be automatically compressed
    And frequently accessed data should remain uncompressed
    And the compression should be transparent to user operations
    And data retrieval performance should remain acceptable

  Scenario: Backup entire application database
    Given I have multiple teams, seasons, and completed games
    And I want to create a complete backup
    When I go to Settings and click "Export All Data"
    And I select "Complete Database Backup"
    Then I should receive a comprehensive backup file
    And the file should contain all teams, players, games, and seasons
    And the file should include application settings and preferences
    And the backup should be restorable on any device

  Scenario: Restore complete database from backup
    Given I have a complete database backup file
    And I am setting up the application on a new device
    When I click "Import Database" in initial setup
    And I select the backup file
    And I confirm the complete restoration
    Then all my teams should be restored
    And all historical games should be available
    And all player statistics should be preserved
    And the application should be ready to use immediately

  Scenario: Schedule automatic local backups
    Given I am in the application Settings page
    When I enable "Automatic Local Backups"
    And I set the frequency to "Weekly"
    And I specify the backup location
    Then the system should create weekly backup files
    And I should be notified when backups are created
    And old backups should be rotated to save space
    And I should be able to restore from any saved backup

  Scenario: Sync data across multiple devices
    Given I am using the application on my tablet
    And I have scored several games with detailed statistics
    When I export my complete database to a file
    And I import that file on my laptop
    Then all my game data should be available on the laptop
    And I should be able to continue using the application seamlessly
    And both devices should have identical data after sync

  Scenario: Handle corrupted local storage recovery
    Given my local IndexedDB has become corrupted
    And I have recent backup files available
    When I start the application
    Then I should see a database recovery prompt
    And I should be offered to restore from backup
    When I select a recent backup file
    Then my data should be recovered from the backup
    And the application should rebuild a clean database
    And I should be able to continue normal operations

  Scenario: Monitor storage usage and provide insights
    Given I have been using the application for several months
    When I go to Settings and click "Storage Information"
    Then I should see current storage usage by category
    And I should see storage usage trends over time
    And I should see recommendations for optimization
    And I should be able to identify which data uses most space

  Scenario: Preserve data during application updates
    Given I have extensive game data in the current version
    When the application is updated to a newer version
    Then all my existing data should be preserved
    And data migration should happen automatically if needed
    And I should be notified if any migration occurs
    And I should have a backup option before migration

  Scenario: Emergency data recovery procedures
    Given I have lost my primary data due to device failure
    And I have various backup files from different dates
    When I need to recover my most important recent games
    Then I should be able to preview backup contents before restoration
    And I should be able to selectively restore specific games or seasons
    And I should be able to merge data from multiple backup files
    And the recovery process should preserve data integrity