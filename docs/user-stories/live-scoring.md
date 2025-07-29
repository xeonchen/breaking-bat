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
- I can see a real-time scoreboard showing both teams' scores by inning
- The system automatically selects the current batter based on the lineup order
- I can quickly input batting results using fast-action buttons (1B, 2B, 3B, HR, BB, IBB, SF, E, FC, SO, GO, AO, DP)
- After entering a batting result, the system automatically suggests baserunner advancement (with manual override capability)
- When runners score, the system automatically calculates RBIs but allows manual confirmation and adjustment
- I can record the opponent's scores by inning to maintain complete game records
- The interface is optimized for quick, accurate input during live gameplay
- All scoring actions are immediately saved to prevent data loss

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