# Slow-Pitch Softball Rules Primer

## Overview

This document provides the essential slow-pitch softball rules that form the foundation of our rule matrix system. Understanding these rules is crucial for validating the correctness of our implementation.

## Basic Game Structure

### Field Positions

- **10 defensive positions** (vs. 9 in baseball)
  1. Pitcher (P)
  2. Catcher (C)
  3. First Base (1B)
  4. Second Base (2B)
  5. Third Base (3B)
  6. Shortstop (SS)
  7. Left Field (LF)
  8. Center Field (CF)
  9. Right Field (RF)
  10. **Short Fielder (SF)** - Extra outfielder

Players can change their fielding positions during the game, typically there's no specific constraints.

### Batting Order

typically 10~11 in the lineup (10 defensive position + an optional EP player), sometimes (especially in unofficial games) there might be more than 1 EP.
- **Extra Player (EP)** - Bats but doesn't play defense. Depending on different rules, it is possible that an EP might switch position with another fielder (e.g. EP <-> 3B)
- **Jersey numbers** can range 0-999 (expanded from traditional 1-99)

Players cannot change their batting order once the game starts.

a player switch with a bench will be removed from the lineup, and this player can't switch back to the game unless the player is starting players (who plays from the beginning of the game). A starting player can only return to the game once and the batting order must be the same as his starting order.


## Base Running Fundamentals

### Critical Rules

1. **No lead-offs** - Runners cannot leave base until ball is hit
2. **No stealing** - Runners advance only on batted balls
3. **Force advancement** - Runners must advance when forced by batter reaching base
4. **No runner passes another** - When a trailing runner passes a lead runner, the **trailing runner** is automatically out
5. **No two runners on same base** - If this occurs, trailing runner is out

### Base Advancement Rules

#### Forced Advancement

Runners **must** advance when:

- Batter reaches first base (runners on 1st must move to 2nd)
- Walk with bases loaded (runner on 3rd scores)
- Any situation where staying would put two runners on same base

#### Optional Advancement

Runners **may** advance when:

- Ball is hit but they're not forced
- Can attempt extra bases at risk of being thrown out

## Hit Type Definitions

### Hits (Count toward batting average)

**Single (1B)**

- Batter reaches first base safely
- Runners advance at least one base (may attempt more)
- Most common hit type

**Double (2B)**

- Batter reaches second base safely
- Runners from second or third typically score or maybe on of them stays on 3B

**Triple (3B)**

- Batter reaches third base safely
- All existing runners typically score

**Home Run (HR)**

- Batter and all runners score
- Ball goes over fence in fair territory OR
- Inside-the-park home run

### Walks (Do not count as at-bats)

**Walk (BB)**

- Batter receives four balls
- **Common Taiwanese Rule**: At-bat starts at 1-strike/1-ball count, batter needs 3 additional balls to walk
- Advances to first base
- Forces runners only if necessary

**Intentional Walk (IBB)**

- Batter deliberately walked
- Same effect as regular walk
- Strategic decision by defense

### Outs (Count as at-bats except SF)

**Strikeout (SO)**

- **Common Taiwanese Rule**: At-bat starts at 1-strike/1-ball count, batter needs 2 additional strikes to strike out
- Foul balls count as strikes (2 foul balls = strikeout)
- No runners advance (wild pitch/passed ball scenarios don't occur in slow-pitch)

**Ground Out (GO)**

- Ball hit on ground, fielded cleanly
- Batter thrown out at first
- Force plays possible on other runners

**Air Out (AO) / Fly Out / Pop Out**

- Ball caught in air before hitting ground
- Batter automatically out
- Runners may attempt to advance after catch (tagging up)

### Special Plays

**Sacrifice Fly (SF)**

- only happen when 0 out or 1 out
- Fly ball caught for out BUT runner(s) scores by advancing with no fielding error
- Does NOT count as at-bat for batter
- RBI credited to batter
- Most commonly with runner on third, but runner on second can also advance and score

**Fielder's Choice (FC)**

- Batter reaches base safely BUT
- Defense chooses to get out a different runner
- Lead runner typically forced out
- Net effect: same number of runners on base (unless runners score during the play)

**Double Play (DP)**

- Defense records two outs on single play
- Most common: runner on first, ground ball to shortstop
- Sequence: Force out at second, throw to first
- Can occur in various forms

**Error (E)**

- Defensive mistake allows advancement beyond normal
- Not counted as hit for batting statistics
- Variable outcomes depending on error type
- Can allow significant extra advancement

## RBI (Runs Batted In) Rules

### RBIs are Credited When:

- Runner scores due to batter's hit
- Runner scores on sacrifice fly
- Runner scores on fielder's choice (sometimes)
- Runner scores on walk with bases loaded

### RBIs are NOT Credited When:

- Runner scores on error
- Runner scores on double play
- Runner scores while batter grounds into force out (batter gets RBI only if force out allows run to score)

### Special RBI Situations:

- **Grand Slam**: 4 RBIs (bases loaded home run)
- **Sacrifice Fly**: 1 RBI even though batter is out
- **Bases Loaded Walk**: 1 RBI (forced run scores)

## Force Play Rules

### When Force Plays Apply:

A runner is "forced" when they must advance because:

1. Batter becomes a runner (hits ball or walks)
2. Staying on current base would create two runners on same base

### Force Play Scenarios:

**Runner on First Only:**

- Any ground ball can create force at second
- Classic double play: 6-4-3 (shortstop to second to first)

**Runners on First and Second:**

- Forces at second and third base
- Possible triple play scenarios

**Bases Loaded:**

- Forces at all bases including home plate
- Easiest situation for defense to get outs

### Force vs. Tag Plays:

- **Force Play**: Defender only needs to touch base with ball
- **Tag Play**: Defender must tag runner with ball
- **Critical Rule**: Once trailing runner is out, force is removed for lead runners

## Advanced Scenarios (Future Implementation)

### Aggressive Base Running

- Runners attempt extra bases beyond "normal" advancement
- Risk being thrown out for greater reward
- Examples:
  - Runner on first attempts home on double
  - Runner on second attempts home on single

### Defensive Errors During Plays

- Error during normal play allows extra advancement
- Examples:
  - Single + throwing error = runners advance extra base
  - Double + dropped ball = all runners score

### Runners Errors During Plays

- Error during normal play cause extra out(s)
- Examples:
  - Batter hits a single, but caught out at 2nd base
  - Batter hits a double, but the 2nd base runner outs at home plate.

### Complex Double Plays

- Partial double plays where one runner advances
- Line drive double plays (catch runner off base)
- Unusual force play combinations

## Validation Rules for Rule Matrix

### These Scenarios Should NEVER Occur:

1. Same player on multiple bases simultaneously
2. More than 4 RBIs on single play (grand slam is maximum)
3. Runners moving backward (third to second) except in very rare circumstances
4. More than 3 outs recorded on single play
5. RBIs without corresponding runs scored
6. Strikeout with RBIs (except extremely rare situations)

### These Scenarios MAY Occur (Not Violations):

1. **Batter reaching beyond hit type** - Single + error can put batter on second (still recorded as 1B)
2. **Hit type vs final position** - Hit type determined by initial result, not final position after errors
3. **Ground out with RBIs** - Can occur if force out allows runner to score

### Common Validation Patterns:

1. **RBI Count = Runs Scored Count** (for that at-bat)
2. **Force advancement is mandatory** when applicable
3. **Base progression is logical** (1st → 2nd → 3rd → Home)
4. **Out counts are realistic** (0-3 per at-bat)
5. **Hit type reflects initial result** (not final position after errors or aggressive advancement)

---

_This primer covers the essential rules needed to validate our softball rule matrix implementation. For complete official rules, consult the USA Softball rulebook._
