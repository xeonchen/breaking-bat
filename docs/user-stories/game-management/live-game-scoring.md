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
- **live-game-scoring:AC004**: The interface is optimized for quick, accurate input during live gameplay
- **live-game-scoring:AC005**: The interface works well with touch input on tablets and mobile devices

### Baserunner Management and Advancement

- **live-game-scoring:AC006**: After entering a batting result, the system applies standard softball baserunner advancement rules automatically
- **live-game-scoring:AC007**: I can manually override any runner advancement when unusual situations occur (e.g., runner scores from second on a single)
- **live-game-scoring:AC008**: The system tracks which runners score and calculates RBIs accurately
- **live-game-scoring:AC009**: I can see a visual representation of current baserunners at all times

### Detailed Runner Advancement Rules

- **AC010**: Given I record a single, runners should advance one base automatically with modal confirmation options
- **AC011**: Given I record a double, runners should advance two bases automatically with modal confirmation options
- **AC012**: Given I record a triple, runners should advance three bases automatically with modal confirmation options
- **AC013**: Given I record a home run, all runners including the batter should score automatically
- **AC014**: Given I record a walk, runners should advance only when forced by the batter taking first base
- **AC015**: Given I record a strikeout, no runners should advance automatically

### Baserunner Management Interface

- **AC016**: Given there are runners on base, I should see a baserunner advancement modal for applicable batting results
- **AC017**: Given the baserunner advancement modal appears, I should be able to confirm or modify the default advancement
- **AC018**: Given I confirm runner advancement, the system should update runner positions and scoring immediately
- **AC019**: Given a runner scores, the system should increment the team score and track RBIs for the batter
- **AC020**: Given multiple at-bats are recorded, the system should maintain accurate runner positions throughout the inning

### Inning and Out Management

- **AC021**: The system automatically counts outs and switches sides when 3 outs are reached
- **AC022**: Given the side is retired (3 outs), all runners should be cleared and the inning should progress
- **AC023**: Innings progress automatically and are tracked correctly throughout the game
- **AC024**: The scoreboard updates in real-time as runs are scored

### Home/Away Innings Management

- **AC025**: Given my team is playing away, I should only record scoring for the top half of each inning
- **AC026**: Given my team is playing at home, I should only record scoring for the bottom half of each inning
- **AC027**: Given I am recording an away game, the interface should clearly indicate "Top of [Inning]" when it's our turn to bat
- **AC028**: Given I am recording a home game, the interface should clearly indicate "Bottom of [Inning]" when it's our turn to bat
- **AC029**: Given it's the opponent's turn to bat, I should not be able to record at-bats for my team
- **AC030**: Given the inning switches, the interface should automatically disable my team's batting interface during opponent innings

### Game Flow Integration

- **AC031**: All at-bat data is immediately saved to prevent data loss during live gameplay
- **AC032**: The scoring interface integrates with the game state (can only score during in-progress games)
- **AC033**: I can see both teams' scores by inning with running totals
- **AC034**: All scoring actions provide immediate visual feedback

### Data Persistence and Reliability

- **AC035**: Every scoring action is automatically saved in real-time
- **AC036**: Game state is preserved if the app is accidentally closed or crashes
- **AC037**: Network connectivity issues do not prevent scoring (offline-first design)
- **AC038**: All scoring data integrates with game statistics and reporting

### Error Prevention and Validation

- **AC039**: The system prevents impossible scoring scenarios (e.g., 4 outs in an inning)
- **AC040**: Invalid at-bat combinations are caught and explained to the user
- **AC041**: Undo functionality allows correction of recent scoring errors
- **AC042**: Clear confirmation dialogs prevent accidental major changes

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
