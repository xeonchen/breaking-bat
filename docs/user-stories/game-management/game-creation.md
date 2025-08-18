# User Story: Game Creation and Setup

## ID

game-creation

## As a...

Scorekeeper

## I want to...

Create new games quickly with smart defaults and flexible configuration options

## So that I can...

Efficiently set up games for scoring with minimal manual input while maintaining full control over game details

## Acceptance Criteria

### Smart Game Creation

- **game-creation:AC001**: I can create a new game with smart default values:
  - Game name: automatically generated as "[Season Name] - [Date]" (e.g., "2025 Fall Season - 2025-08-08")
  - Game name: updates automatically when season or game type changes, unless user has manually modified it
  - Opponent: left blank for user input
  - Date: today's date pre-filled
  - Team: most recently selected team, or first available team if no history
  - Season: most recently selected season, or first available season if no history
  - Game Type: most recently selected game type, or first available game type if no history
  - Home/Away: defaults to "home"

### Game Creation Workflow

- **game-creation:AC002**: Given I create a new game, the game should be saved with status "setup"
- **game-creation:AC003**: Given I create a new game, I should see it listed in the games interface
- **game-creation:AC004**: Given I open the create game form, the date input should display today's date by default
- **game-creation:AC005**: Given the date input has today's date as default, I can submit the form without changing the date
- **game-creation:AC006**: Given the date input has today's date as default, I can change it to any valid future or past date

### Game Information Management

- **game-creation:AC007**: I can edit game information after creation but before the game starts
- **game-creation:AC008**: Required fields (team, opponent) are validated before game creation
- **game-creation:AC009**: Optional fields (season, game type) can be added or modified later
- **game-creation:AC010**: Game creation form adapts to mobile screens effectively

### Quick vs Detailed Creation

- **game-creation:AC011**: Quick Create mode shows only essential fields (team, opponent, date)
- **game-creation:AC012**: Detailed Setup mode provides all options for advanced configuration
- **game-creation:AC013**: I can switch between Quick and Detailed modes during creation
- **game-creation:AC014**: Form validation is consistent across both creation modes

### Game State Management

- **game-creation:AC015**: New games start in "setup" state with appropriate UI controls
- **game-creation:AC016**: Games in "setup" state show "Setup Lineup" and configuration options
- **game-creation:AC017**: Game creation integrates with the complete workflow (teams → games → lineups → scoring)

### Data Persistence and Integration

- **game-creation:AC018**: All game creation data is saved automatically
- **game-creation:AC019**: Game creation respects data from seasons and game types management
- **game-creation:AC020**: Created games integrate seamlessly with lineup configuration
- **game-creation:AC021**: Game history and recent selections inform smart defaults

### Error Handling and Validation

- **game-creation:AC022**: Clear validation messages guide users through required fields
- **game-creation:AC023**: Duplicate detection prevents accidental game recreation
- **game-creation:AC024**: Network/storage errors are handled gracefully with retry options
- **game-creation:AC025**: Form data is preserved if creation fails temporarily

## Priority

High

## Dependencies

- team-management (requires teams to exist)
- roster-management (games need teams with players)
- season-and-game-types (optional but recommended for organization)

## Definition of Done

- [ ] DSL spec created and reviewed
- [ ] API contract defined
- [ ] Tests written and passing
- [ ] Code implementation complete
- [ ] All quality gates passed
- [ ] Documentation updated

## Notes

- Focus on speed and efficiency for frequent use
- Smart defaults reduce user input while maintaining flexibility
- Mobile optimization critical as games are often created on-site
- Integration with lineup setup should be seamless
- Consider templates for recurring game types or opponents
