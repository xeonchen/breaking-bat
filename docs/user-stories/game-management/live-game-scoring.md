# User Story: Live Game Scoring and Real-Time Recording

## ID

live-game-scoring

## As a...

Scorekeeper

## I want to...

Record batting results, manage baserunners, and track game progress in real-time during gameplay with accurate home/away innings management

## So that I can...

Maintain accurate game statistics and scores without missing any plays, making errors, or recording during wrong innings

## Acceptance Criteria

### Core At-Bat Recording

- **live-game-scoring:AC001**: I can record at-bat results that are functionally connected to the business logic and persist to the database
- **live-game-scoring:AC002**: The system automatically selects the current batter based on the lineup order and advances to the next batter after each at-bat
- **live-game-scoring:AC003**: I can quickly input batting results using fast-action buttons (1B, 2B, 3B, HR, BB, IBB, SF, E, FC, SO, GO, AO, DP)
- **live-game-scoring:AC003A**: Given the current game situation, fast-action buttons should be enabled/disabled based on validity (e.g., no Double Play when no runners)
- **live-game-scoring:AC004**: The interface is optimized for quick, accurate input during live gameplay
- **live-game-scoring:AC004A**: Given I don't need pitch tracking, I should be able to collapse the pitch tracking section to focus on at-bat results
- **live-game-scoring:AC005**: The interface works well with touch input on tablets and mobile devices

### Baserunner Management and Advancement

- **live-game-scoring:AC006**: After entering a batting result, the system applies standard softball baserunner advancement rules automatically
- **live-game-scoring:AC007**: I can manually override any runner advancement when unusual situations occur (e.g., runner scores from second on a single)
- **live-game-scoring:AC008**: The system tracks which runners score and calculates RBIs accurately
- **live-game-scoring:AC009**: I can see a visual representation of current baserunners at all times
- **live-game-scoring:AC009A**: Given I need to see baserunner positions, they should be displayed in field-accurate layout (3rd-2nd-1st from left to right, with 2nd elevated)

### Detailed Runner Advancement Rules

- **live-game-scoring:AC010**: Given I record a single, runners should advance one base automatically with modal confirmation options
- **live-game-scoring:AC011**: Given I record a double, runners should advance two bases automatically with modal confirmation options
- **live-game-scoring:AC012**: Given I record a triple, runners should advance three bases automatically with modal confirmation options
- **live-game-scoring:AC013**: Given I record a home run, all runners including the batter should score automatically
- **live-game-scoring:AC014**: Given I record a walk, runners should advance only when forced by the batter taking first base
- **live-game-scoring:AC015**: Given I record a strikeout, no runners should advance automatically

### Baserunner Management Interface

- **live-game-scoring:AC016**: Given there are runners on base, I should see a baserunner advancement modal for applicable batting results
- **live-game-scoring:AC016A**: Given there are no runners on base, the system should not show the baserunner advancement modal
- **live-game-scoring:AC017**: Given the baserunner advancement modal appears, I should be able to confirm or modify the default advancement
- **live-game-scoring:AC017A**: Given the baserunner advancement modal appears, all runner advancement selections must be made before confirmation
- **live-game-scoring:AC017B**: Given I make advancement selections, the system must validate that no runners disappear without scoring or being out
- **live-game-scoring:AC017C**: Given I make advancement selections, the system must prevent multiple runners on the same base
- **live-game-scoring:AC018**: Given I confirm runner advancement, the system should update runner positions and scoring immediately
- **live-game-scoring:AC019**: Given a runner scores, the system should increment the team score and track RBIs for the batter
- **live-game-scoring:AC020**: Given multiple at-bats are recorded, the system should maintain accurate runner positions throughout the inning

### Inning and Out Management

- **live-game-scoring:AC021**: The system automatically counts outs and switches sides when 3 outs are reached
- **live-game-scoring:AC022**: Given the side is retired (3 outs), all runners should be cleared and the inning should progress
- **live-game-scoring:AC023**: Innings progress automatically and are tracked correctly throughout the game
- **live-game-scoring:AC024**: The scoreboard updates in real-time as runs are scored

### Home/Away Innings Management

- **live-game-scoring:AC025**: Given my team is playing away, I should only record scoring for the top half of each inning
- **live-game-scoring:AC026**: Given my team is playing at home, I should only record scoring for the bottom half of each inning
- **live-game-scoring:AC027**: Given I am recording an away game, the interface should clearly indicate "Top of [Inning]" when it's our turn to bat
- **live-game-scoring:AC028**: Given I am recording a home game, the interface should clearly indicate "Bottom of [Inning]" when it's our turn to bat
- **live-game-scoring:AC029**: Given it's the opponent's turn to bat, I should not be able to record at-bats for my team
- **live-game-scoring:AC030**: Given the inning switches, the interface should automatically disable my team's batting interface during opponent innings
- **live-game-scoring:AC043**: Given it's the opponent's turn to bat, I should have controls to either "Skip to Our Turn" or "Record Opponent Score"
- **live-game-scoring:AC044**: Given I choose to skip the opponent's turn, the system should advance to my team's half-inning and enable the batting interface
- **live-game-scoring:AC045**: Given I choose to record opponent scoring, I should have a simplified interface to input opponent runs for this half-inning
- **live-game-scoring:AC046**: Given opponent scoring is recorded or skipped, the system should update the scoreboard and advance to my team's turn automatically

### Game Flow Integration

- **live-game-scoring:AC031**: All at-bat data is immediately saved to prevent data loss during live gameplay
- **live-game-scoring:AC032**: The scoring interface integrates with the game state (can only score during in-progress games)
- **live-game-scoring:AC033**: I can see both teams' scores by inning with running totals
- **live-game-scoring:AC034**: All scoring actions provide immediate visual feedback

### Data Persistence and Reliability

- **live-game-scoring:AC035**: Every scoring action is automatically saved in real-time
- **live-game-scoring:AC036**: Game state is preserved if the app is accidentally closed or crashes
- **live-game-scoring:AC037**: Network connectivity issues do not prevent scoring (offline-first design)
- **live-game-scoring:AC038**: All scoring data integrates with game statistics and reporting

### Error Prevention and Validation

- **live-game-scoring:AC039**: The system prevents impossible scoring scenarios (e.g., 4 outs in an inning)
- **live-game-scoring:AC040**: Invalid at-bat combinations are caught and explained to the user
- **live-game-scoring:AC041**: Undo functionality allows correction of recent scoring errors
- **live-game-scoring:AC042**: Clear confirmation dialogs prevent accidental major changes

## Priority

Critical

## Dependencies

- game-creation (requires game to exist and be started)
- lineup-configuration (requires complete lineup setup)
- roster-management (requires player data for at-bat recording)

## Definition of Done

- [ ] DSL spec created and reviewed
- [ ] API contract defined
- [ ] Tests written and passing
- [ ] Code implementation complete
- [ ] All quality gates passed
- [ ] Documentation updated

## Notes

- This is the core functionality during active gameplay
- Performance and reliability are critical - any bugs directly impact game recording
- Interface must be intuitive enough for use under pressure during live games
- Touch-friendly design essential for tablet/mobile scoring
- Real-time validation prevents scoring errors that would be difficult to correct later
- Home/away innings logic prevents one of the most common scoring mistakes
- Comprehensive undo/correction capabilities essential for live use
