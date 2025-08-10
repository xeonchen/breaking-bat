# User Story: Live Game Scoring and Statistics

## ID

live-scoring

## As a...

Scorekeeper

## I want to...

Record batting results and game progress in real-time during gameplay

## So that I can...

Maintain accurate game statistics and scores without missing any plays or making errors

## Acceptance Criteria

### Core At-Bat Recording (Currently Missing Integration)

- **AC001**: I can record at-bat results that are functionally connected to the business logic and persist to the database
- **AC002**: The system automatically selects the current batter based on the lineup order and advances to the next batter after each at-bat
- **AC003**: I can quickly input batting results using fast-action buttons (1B, 2B, 3B, HR, BB, IBB, SF, E, FC, SO, GO, AO, DP)

### Baserunner Management (Currently Missing)

- **AC004**: After entering a batting result, the system applies standard softball baserunner advancement rules automatically
- **AC005**: I can manually override any runner advancement when unusual situations occur (e.g., runner scores from second on a single)
- **AC006**: The system tracks which runners score and calculates RBIs accurately
- **AC007**: I can see a visual representation of current baserunners at all times

### Inning and Out Management (Currently Missing)

- **AC008**: The system automatically counts outs and switches sides when 3 outs are reached
- **AC009**: Innings progress automatically and are tracked correctly throughout the game
- **AC010**: The scoreboard updates in real-time as runs are scored

### Home/Away Innings Management

- **AC029**: Given my team is playing away, I should only record scoring for the top half of each inning
- **AC030**: Given my team is playing at home, I should only record scoring for the bottom half of each inning
- **AC031**: Given I am recording an away game, the interface should clearly indicate "Top of [Inning]" when it's our turn to bat
- **AC032**: Given I am recording a home game, the interface should clearly indicate "Bottom of [Inning]" when it's our turn to bat
- **AC033**: Given it's the opponent's turn to bat, I should not be able to record at-bats for my team
- **AC034**: Given the inning switches, the interface should automatically disable my team's batting interface during opponent innings

### Game Flow Integration (Currently Missing)

- **AC011**: All at-bat data is immediately saved to prevent data loss during live gameplay
- **AC012**: The scoring interface integrates with the game state (can only score during in-progress games)
- **AC013**: I can see both teams' scores by inning with running totals

### User Experience

- **AC014**: The interface is optimized for quick, accurate input during live gameplay
- **AC015**: The interface works well with touch input on tablets
- **AC016**: All scoring actions provide immediate visual feedback

## Priority

Critical

## Dependencies

- game-setup (requires game and lineup to be established)
- team-management (requires player data)

## Sub-stories

### Real-time Scoreboard Display

- Show current inning and team at bat
- Display runs scored by inning for both teams
- Show current game totals

### Batting Interface

- Auto-advance to next batter in lineup
- Quick-select buttons for all possible outcomes
- Clear visual feedback for selected actions

### Baserunner Management

- Visual representation of current baserunners
- Automatic advancement logic with override
- RBI calculation and confirmation

### Opponent Scoring

- Simple inning-by-inning score entry for opposing team
- Running total calculation

## Notes

- This is the core functionality that will be used most frequently
- Must be highly responsive and error-free
- Interface should work well with touch input on tablets
- Consider implementing undo functionality for corrections
