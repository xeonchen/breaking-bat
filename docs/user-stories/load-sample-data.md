# User Story: Load Sample Data for Testing

## ID

load-sample-data

## As a...

Developer/Tester

## I want to...

Load sample data (teams with MLB players, seasons, and game types) with a single click in the settings page

## So that I can...

Quickly populate the application with realistic test data for manual testing and development without having to create teams, players, seasons, and game types individually

## Acceptance Criteria

- **AC001**: Given I am on the Settings page General tab, I should see a "Load Sample Data" button with a clear description
- **AC002**: Given I click the "Load Sample Data" button, the system should create 3 teams with MLB fantasy players, 3 seasons, and 5 game types
- **AC003**: Given the sample data loading is successful, I should see a success toast notification with details of what was created
- **AC004**: Given the sample data loading encounters an error, I should see an error toast notification with a helpful error message
- **AC005**: Given sample data already exists, the system should not create duplicates and should handle existing data gracefully
- **AC006**: Given the loading process is in progress, the button should show a loading state and be disabled
- **AC007**: Given the sample data is loaded, I should be able to navigate to Teams, Games, and Seasons pages and see the created data
