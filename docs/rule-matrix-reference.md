# Softball Rule Matrix Reference

## Overview

This document serves as the comprehensive reference for the Breaking-Bat softball rule validation system. It defines all possible game scenarios and their valid outcomes according to slow-pitch softball rules.

**Matrix Dimensions:**

- **8 Base Configurations** × **13 Hit Types** = **104 Scenario Groups**
- Each scenario can have **multiple valid outcomes** (standard, aggressive, error-based)
- **O(1) lookup performance** for real-time game recording

## Base Configuration Matrix

### The 8 Base Configurations

| Configuration        | Key            | State                | Description                 |
| -------------------- | -------------- | -------------------- | --------------------------- |
| Empty                | `empty`        | `(null, null, null)` | No runners on base          |
| Runner on 1st        | `first_only`   | `(R1, null, null)`   | Runner on first base only   |
| Runner on 2nd        | `second_only`  | `(null, R2, null)`   | Runner on second base only  |
| Runner on 3rd        | `third_only`   | `(null, null, R3)`   | Runner on third base only   |
| Runners on 1st & 2nd | `first_second` | `(R1, R2, null)`     | Runners on first and second |
| Runners on 1st & 3rd | `first_third`  | `(R1, null, R3)`     | Runners on first and third  |
| Runners on 2nd & 3rd | `second_third` | `(null, R2, R3)`     | Runners on second and third |
| Bases Loaded         | `loaded`       | `(R1, R2, R3)`       | Runners on all three bases  |

## Hit Type Reference

### The 13 Hit Types

| Category    | Hit Type         | Code  | Description                         | Batter Result | Forces Advancement        |
| ----------- | ---------------- | ----- | ----------------------------------- | ------------- | ------------------------- |
| **Hits**    | Single           | `1B`  | Batter reaches first safely         | 1st base      | Yes                       |
|             | Double           | `2B`  | Batter reaches second safely        | 2nd base      | Yes                       |
|             | Triple           | `3B`  | Batter reaches third safely         | 3rd base      | Yes                       |
|             | Home Run         | `HR`  | Batter and all runners score        | Home          | Yes                       |
| **Walks**   | Walk             | `BB`  | Batter walks to first               | 1st base      | Only if forced            |
|             | Intentional Walk | `IBB` | Batter intentionally walked         | 1st base      | Only if forced            |
| **Outs**    | Strikeout        | `SO`  | Batter strikes out                  | Out           | No                        |
|             | Ground Out       | `GO`  | Batter grounds out                  | Out           | No (force plays possible) |
|             | Air Out          | `AO`  | Batter flies/pops out               | Out           | No                        |
| **Special** | Sacrifice Fly    | `SF`  | Batter out, runner on 3rd scores    | Out           | No (runner on 3rd only)   |
|             | Fielder's Choice | `FC`  | Batter safe, lead runner forced out | 1st base      | Lead runner only          |
|             | Double Play      | `DP`  | Two outs recorded                   | Out           | No                        |
|             | Error            | `E`   | Defensive error allows advancement  | Variable      | Variable                  |

## Scenario Matrix Tables

### 1. Empty Bases (`empty`)

| Hit Type | Outcome Type                        | Description                     | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ----------------------------------- | ------------------------------- | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                            | Batter to 1st                   | 0    | 0    | []                     | `(Batter, null, null)` | ✅     |
| 1B       | Error                               | Batter to 2nd on error          | 0    | 0    | []                     | `(null, Batter, null)` | ✅     |
| 1B       | Error                               | Batter to 3rd on error          | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| 1B       | Error                               | Batter scores on multiple errors| 0    | 0    | [Batter]               | `(null, null, null)`   | ✅     |
| 2B       | Standard                            | Batter to 2nd                   | 0    | 0    | []                     | `(null, Batter, null)` | ✅     |
| 2B       | Error                               | Batter to 3rd on error          | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| 2B       | Error                               | Batter scores on error          | 0    | 0    | [Batter]               | `(null, null, null)`   | ✅     |
| 3B       | Standard                            | Batter reaches 3rd base         | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| 3B       | Error                               | Batter scores on error          | 0    | 0    | [Batter]               | `(null, null, null)`   | ✅     |
| HR       | Standard                            | Solo home run                   | 1    | 0    | [Batter]               | `(null, null, null)`   | ✅     |
| BB/IBB   | Standard                            | Batter walks                    | 0    | 0    | []                     | `(Batter, null, null)` | ✅     |
| SO       | Standard                            | Batter out                      | 0    | 1    | []                     | `(null, null, null)`   | ✅     |
| GO       | Standard                            | Batter out                      | 0    | 1    | []                     | `(null, null, null)`   | ✅     |
| AO       | Standard                            | Batter out                      | 0    | 1    | []                     | `(null, null, null)`   | ✅     |
| SF       | N/A                                 | No runner to sacrifice          | N/A  | N/A  | N/A                    | N/A                    | ✅     |
| FC       | N/A                                 | No runner to force out          | N/A  | N/A  | N/A                    | N/A                    | ✅     |
| DP       | N/A                                 | No runner for double play       | N/A  | N/A  | N/A                    | N/A                    | ✅     |
| E        | Standard                            | Batter to 1st on error          | 0    | 0    | []                     | `(Batter, null, null)` | ✅     |
| E        | Error                               | Batter to 2nd on error          | 0    | 0    | []                     | `(null, Batter, null)` | ✅     |
| E        | Error                               | Batter to 3rd on error          | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| E        | Error                               | Batter scores on error          | 0    | 0    | [Batter]               | `(null, null, null)`   | ✅     |

### 2. Runner on First Only (`first_only`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State Examples   | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R1→2nd, Batter→1st                   | 0    | 0    | []                     | `(Batter, R1, null)`   | ✅     |
| 1B       | Aggressive                           | R1→3rd OR R1 scores, Batter→1st      | 0-1  | 0-1  | [] OR [R1]             | Various                | ✅     |
| 1B       | Error                                | Extra advancement on defensive errors | 0    | 0    | Variable               | Various combinations   | ✅     |
| 1B       | Aggressive+Error                     | Aggressive running + error advancement| 0    | 0-1  | Variable               | Various combinations   | ✅     |
| 2B       | Standard                             | R1→3rd, Batter→2nd                   | 0    | 0    | []                     | `(null, Batter, R1)`   | ✅     |
| 2B       | Aggressive                           | R1 scores, Batter→2nd                | 1    | 0    | [R1]                   | `(null, Batter, null)` | ✅     |
| 2B       | Error                                | Extra advancement beyond standard     | 0    | 0    | Variable               | Various combinations   | ✅     |
| 3B       | Standard                             | R1 scores, Batter→3rd                | 1    | 0    | [R1]                   | `(null, null, Batter)` | ✅     |
| 3B       | Error                                | Both score on error                  | 0    | 0    | [R1, Batter]           | `(null, null, null)`   | ✅     |
| HR       | Standard                             | 2-run homer                          | 2    | 0    | [R1, Batter]           | `(null, null, null)`   | ✅     |
| BB/IBB   | Standard (Forced)                    | R1→2nd, Batter→1st                   | 0    | 0    | []                     | `(Batter, R1, null)`   | ✅     |
| SO       | Standard                             | Batter out, R1 stays                 | 0    | 1    | []                     | `(R1, null, null)`     | ✅     |
| GO       | Standard                             | Batter out, R1 stays                 | 0    | 1    | []                     | `(R1, null, null)`     | ✅     |
| GO       | Force Play                           | R1 forced at 2nd, Batter out         | 0    | 1    | []                     | `(null, null, null)`   | ✅     |
| AO       | Standard                             | Batter out, R1 stays                 | 0    | 1    | []                     | `(R1, null, null)`     | ✅     |
| AO       | Aggressive                           | R1 attempts advancement after catch   | 0    | 1-2  | []                     | Variable               | ✅     |
| SF       | N/A                                  | No runner on 3rd to sacrifice        | N/A  | N/A  | N/A                    | N/A                    | ✅     |
| FC       | Standard                             | R1 forced out, Batter→1st            | 0    | 1    | []                     | `(Batter, null, null)` | ✅     |
| DP       | Standard                             | Classic 6-4-3 double play            | 0    | 2    | []                     | `(null, null, null)`   | ✅     |
| E        | Standard                             | Batter→1st, R1→2nd on error          | 0    | 0    | []                     | `(Batter, R1, null)`   | ✅     |
| E        | Error                                | Variable advancement combinations     | 0    | 0    | Variable               | Various combinations   | ✅     |

### 3. Runner on Second Only (`second_only`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State Examples   | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R2 scores, Batter→1st                | 1    | 0    | [R2]                   | `(Batter, null, null)` | ❌     |
| 1B       | Error                                | Extra advancement on defensive errors | 0    | 0    | Variable               | Various combinations   | ❌     |
| 2B       | Standard                             | R2 scores, Batter→2nd                | 1    | 0    | [R2]                   | `(null, Batter, null)` | ❌     |
| 2B       | Error                                | Extra advancement beyond standard     | 0    | 0    | Variable               | Various combinations   | ❌     |
| 3B       | Standard                             | R2 scores, Batter→3rd                | 1    | 0    | [R2]                   | `(null, null, Batter)` | ❌     |
| 3B       | Error                                | Both score on error                  | 0    | 0    | [R2, Batter]           | `(null, null, null)`   | ❌     |
| HR       | Standard                             | 2-run homer                          | 2    | 0    | [R2, Batter]           | `(null, null, null)`   | ❌     |
| BB/IBB   | Standard                             | R2 stays, Batter→1st                 | 0    | 0    | []                     | `(Batter, R2, null)`   | ❌     |
| SO       | Standard                             | Batter out, R2 stays                 | 0    | 1    | []                     | `(null, R2, null)`     | ❌     |
| GO       | Standard                             | Batter out, R2 stays                 | 0    | 1    | []                     | `(null, R2, null)`     | ❌     |
| AO       | Standard                             | Batter out, R2 stays                 | 0    | 1    | []                     | `(null, R2, null)`     | ❌     |
| AO       | Aggressive                           | R2 attempts advancement after catch   | 0    | 1    | []                     | Variable               | ❌     |
| SF       | Standard                             | R2 advances to 3rd, Batter out       | 0    | 1    | []                     | `(null, null, R2)`     | ❌     |
| SF       | Aggressive                           | R2 scores on sacrifice fly           | 1    | 1    | [R2]                   | `(null, null, null)`   | ❌     |
| FC       | Standard                             | R2 forced at 3rd, Batter→1st         | 0    | 1    | []                     | `(Batter, null, null)` | ❌     |
| DP       | N/A                                  | No double play possible               | N/A  | N/A  | N/A                    | N/A                    | ❌     |
| E        | Standard                             | Batter→1st, R2→3rd on error          | 0    | 0    | []                     | `(Batter, null, R2)`   | ❌     |
| E        | Error                                | Variable advancement combinations     | 0    | 0    | Variable               | Various combinations   | ❌     |

### 4. Runner on Third Only (`third_only`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R3 scores, Batter→1st                | 1    | 0    | [R3]                   | `(Batter, null, null)` | ❌     |
| 1B       | Error                                | R3 scores, Batter→2nd on error       | 0    | 0    | [R3]                   | `(null, Batter, null)` | ❌     |
| 1B       | Error                                | R3 scores, Batter→3rd on error       | 0    | 0    | [R3]                   | `(null, null, Batter)` | ❌     |
| 1B       | Error                                | Both score on error                  | 0    | 0    | [R3, Batter]           | `(null, null, null)`   | ❌     |
| 2B       | Standard                             | R3 scores, Batter→2nd                | 1    | 0    | [R3]                   | `(null, Batter, null)` | ❌     |
| 2B       | Error                                | R3 scores, Batter→3rd on error       | 0    | 0    | [R3]                   | `(null, null, Batter)` | ❌     |
| 2B       | Error                                | Both score on error                  | 0    | 0    | [R3, Batter]           | `(null, null, null)`   | ❌     |
| 3B       | Standard                             | R3 scores, Batter→3rd                | 1    | 0    | [R3]                   | `(null, null, Batter)` | ❌     |
| 3B       | Error                                | Both score on error                  | 0    | 0    | [R3, Batter]           | `(null, null, null)`   | ❌     |
| HR       | Standard                             | 2-run homer                          | 2    | 0    | [R3, Batter]           | `(null, null, null)`   | ❌     |
| BB/IBB   | Standard                             | R3 stays, Batter→1st                 | 0    | 0    | []                     | `(Batter, null, R3)`   | ❌     |
| SO       | Standard                             | Batter out, R3 stays                 | 0    | 1    | []                     | `(null, null, R3)`     | ❌     |
| GO       | Standard                             | Batter out, R3 stays                 | 0    | 1    | []                     | `(null, null, R3)`     | ❌     |
| GO       | RBI Groundout                        | R3 scores on groundout, Batter out   | 1    | 1    | [R3]                   | `(null, null, null)`   | ❌     |
| AO       | Standard                             | Batter out, R3 stays                 | 0    | 1    | []                     | `(null, null, R3)`     | ❌     |
| SF       | Standard                             | R3 scores on sacrifice fly           | 1    | 1    | [R3]                   | `(null, null, null)`   | ❌     |
| FC       | Standard                             | R3 forced at home, Batter→1st        | 0    | 1    | []                     | `(Batter, null, null)` | ❌     |
| DP       | N/A                                  | No double play possible               | N/A  | N/A  | N/A                    | N/A                    | ❌     |
| E        | Standard                             | Batter→1st on error, R3 stays        | 0    | 0    | []                     | `(Batter, null, R3)`   | ❌     |
| E        | Error                                | R3 scores on error, Batter→1st       | 0    | 0    | [R3]                   | `(Batter, null, null)` | ❌     |
| E        | Error                                | R3 scores on error, Batter→2nd       | 0    | 0    | [R3]                   | `(null, Batter, null)` | ❌     |
| E        | Error                                | Both score on error                  | 0    | 0    | [R3, Batter]           | `(null, null, null)`   | ❌     |

### 5. Runners on First and Second (`first_second`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R2 scores, R1→3rd, Batter→1st        | 1    | 0    | [R2]                   | `(Batter, null, R1)`   | ❌     |
| 1B       | Aggressive                           | Both runners score, Batter→1st       | 2    | 0    | [R1, R2]               | `(Batter, null, null)` | ❌     |
| 1B       | Error                                | R2 scores, R1→3rd, Batter→2nd on error | 0  | 0    | [R2]                   | `(null, Batter, R1)`   | ❌     |
| 1B       | Error                                | All score on error                   | 0    | 0    | [R1, R2, Batter]       | `(null, null, null)`   | ❌     |
| 2B       | Standard                             | Both runners score, Batter→2nd       | 2    | 0    | [R1, R2]               | `(null, Batter, null)` | ❌     |
| 2B       | Error                                | All score on error                   | 0    | 0    | [R1, R2, Batter]       | `(null, null, null)`   | ❌     |
| 3B       | Standard                             | All score                            | 3    | 0    | [R1, R2, Batter]       | `(null, null, null)`   | ❌     |
| HR       | Standard                             | 3-run homer                          | 3    | 0    | [R1, R2, Batter]       | `(null, null, null)`   | ❌     |
| BB/IBB   | Standard (Forced)                    | Bases loaded                         | 0    | 0    | []                     | `(Batter, R1, R2)`     | ❌     |
| SO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, null)`       | ❌     |
| GO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, null)`       | ❌     |
| GO       | Force Play                           | R2 forced at 3rd, others stay        | 0    | 1    | []                     | `(R1, null, null)`     | ❌     |
| GO       | Double Play                          | R2 forced at 3rd, R1 forced at 2nd   | 0    | 2    | []                     | `(Batter, null, null)` | ❌     |
| AO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, null)`       | ❌     |
| AO       | Tag Up                               | R2 advances to 3rd after catch       | 0    | 1    | []                     | `(R1, null, R2)`       | ❌     |
| SF       | N/A                                  | No runner on 3rd to sacrifice        | N/A  | N/A  | N/A                    | N/A                    | ❌     |
| FC       | Standard                             | R2 forced at 3rd, others advance     | 0    | 1    | []                     | `(Batter, R1, null)`   | ❌     |
| DP       | Standard                             | 6-4-3 double play                    | 0    | 2    | []                     | `(null, R2, null)`     | ❌     |
| DP       | Alternative                          | 5-4-3 double play                    | 0    | 2    | []                     | `(null, R2, null)`     | ❌     |
| E        | Standard                             | Batter→1st, R1→2nd, R2→3rd on error  | 0    | 0    | []                     | `(Batter, R1, R2)`     | ❌     |
| E        | Error                                | R2 scores on error, others advance   | 0    | 0    | [R2]                   | `(Batter, null, R1)`   | ❌     |
| E        | Error                                | Both runners score on error          | 0    | 0    | [R1, R2]               | `(Batter, null, null)` | ❌     |
| E        | Error                                | All score on error                   | 0    | 0    | [R1, R2, Batter]       | `(null, null, null)`   | ❌     |

### 6. Runners on First and Third (`first_third`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R3 scores, R1→2nd, Batter→1st        | 1    | 0    | [R3]                   | `(Batter, R1, null)`   | 🚧     |
| 1B       | Aggressive                           | Both runners score, Batter→1st       | 2    | 0    | [R1, R3]               | `(Batter, null, null)` | 🚧     |
| 1B       | Error                                | R3 scores, R1→3rd, Batter→2nd on error | 0  | 0    | [R3]                   | `(null, Batter, R1)`   | 🚧     |
| 1B       | Error                                | All score on error                   | 0    | 0    | [R1, R3, Batter]       | `(null, null, null)`   | 🚧     |
| 2B       | Standard                             | R3 scores, R1→3rd, Batter→2nd        | 1    | 0    | [R3]                   | `(null, Batter, R1)`   | 🚧     |
| 2B       | Aggressive                           | Both runners score, Batter→2nd       | 2    | 0    | [R1, R3]               | `(null, Batter, null)` | 🚧     |
| 2B       | Error                                | All score on error                   | 0    | 0    | [R1, R3, Batter]       | `(null, null, null)`   | 🚧     |
| 3B       | Standard                             | All score                            | 3    | 0    | [R1, R3, Batter]       | `(null, null, null)`   | 🚧     |
| HR       | Standard                             | 3-run homer                          | 3    | 0    | [R1, R3, Batter]       | `(null, null, null)`   | 🚧     |
| BB/IBB   | Standard (Forced)                    | R1→2nd, Batter→1st, R3 stays         | 0    | 0    | []                     | `(Batter, R1, R3)`     | 🚧     |
| SO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, null, R3)`       | 🚧     |
| GO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, null, R3)`       | 🚧     |
| GO       | Force Play                           | R1 forced at 2nd, R3 scores on play  | 1    | 1    | [R3]                   | `(null, null, null)`   | 🚧     |
| GO       | Double Play                          | R1 forced at 2nd, Batter out         | 0    | 2    | []                     | `(null, null, R3)`     | 🚧     |
| AO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, null, R3)`       | 🚧     |
| AO       | Tag Up                               | R1 advances to 2nd after catch       | 0    | 1    | []                     | `(null, R1, R3)`       | 🚧     |
| SF       | Standard                             | R3 scores on sacrifice fly, R1 stays | 1    | 1    | [R3]                   | `(R1, null, null)`     | 🚧     |
| FC       | Standard                             | R3 forced at home, R1→2nd, Batter→1st | 0   | 1    | []                     | `(Batter, R1, null)`   | 🚧     |
| FC       | Alternative                          | R1 forced at 2nd, R3 stays, Batter→1st | 0  | 1    | []                     | `(Batter, null, R3)`   | 🚧     |
| DP       | Standard                             | R3 forced at home, R1 forced at 2nd  | 0    | 2    | []                     | `(Batter, null, null)` | 🚧     |
| E        | Standard                             | Batter→1st, R1→2nd, R3 stays on error | 0   | 0    | []                     | `(Batter, R1, R3)`     | 🚧     |
| E        | Error                                | R3 scores on error, R1→2nd, Batter→1st | 0  | 0    | [R3]                   | `(Batter, R1, null)`   | 🚧     |
| E        | Error                                | Both runners score on error          | 0    | 0    | [R1, R3]               | `(Batter, null, null)` | 🚧     |
| E        | Error                                | All score on error                   | 0    | 0    | [R1, R3, Batter]       | `(null, null, null)`   | 🚧     |

### 7. Runners on Second and Third (`second_third`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | Both runners score, Batter→1st       | 2    | 0    | [R2, R3]               | `(Batter, null, null)` | ❌     |
| 1B       | Error                                | Both runners score, Batter→2nd on error | 0 | 0    | [R2, R3]               | `(null, Batter, null)` | ❌     |
| 1B       | Error                                | All score on error                   | 0    | 0    | [R2, R3, Batter]       | `(null, null, null)`   | ❌     |
| 2B       | Standard                             | Both runners score, Batter→2nd       | 2    | 0    | [R2, R3]               | `(null, Batter, null)` | ❌     |
| 2B       | Error                                | All score on error                   | 0    | 0    | [R2, R3, Batter]       | `(null, null, null)`   | ❌     |
| 3B       | Standard                             | All score                            | 3    | 0    | [R2, R3, Batter]       | `(null, null, null)`   | ❌     |
| HR       | Standard                             | 3-run homer                          | 3    | 0    | [R2, R3, Batter]       | `(null, null, null)`   | ❌     |
| BB/IBB   | Standard                             | Runners stay, Batter→1st             | 0    | 0    | []                     | `(Batter, R2, R3)`     | ❌     |
| SO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(null, R2, R3)`       | ❌     |
| GO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(null, R2, R3)`       | ❌     |
| GO       | RBI Groundout                        | R3 scores on groundout, Batter out   | 1    | 1    | [R3]                   | `(null, R2, null)`     | ❌     |
| AO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(null, R2, R3)`       | ❌     |
| AO       | Tag Up                               | Both runners advance after catch     | 0    | 1    | []                     | `(Batter, null, R2)`   | ❌     |
| SF       | Standard                             | R3 scores on sacrifice fly, R2 stays | 1    | 1    | [R3]                   | `(null, R2, null)`     | ❌     |
| SF       | Aggressive                           | R3 scores, R2→3rd on sacrifice fly   | 1    | 1    | [R3]                   | `(null, null, R2)`     | ❌     |
| FC       | Standard                             | R3 forced at home, R2 stays, Batter→1st | 0 | 1    | []                     | `(Batter, R2, null)`   | ❌     |
| DP       | N/A                                  | No double play possible               | N/A  | N/A  | N/A                    | N/A                    | ❌     |
| E        | Standard                             | Batter→1st, runners advance on error | 0    | 0    | []                     | `(Batter, null, R2)`   | ❌     |
| E        | Error                                | R3 scores on error, R2→3rd, Batter→1st | 0  | 0    | [R3]                   | `(Batter, null, R2)`   | ❌     |
| E        | Error                                | Both runners score on error          | 0    | 0    | [R2, R3]               | `(Batter, null, null)` | ❌     |
| E        | Error                                | All score on error                   | 0    | 0    | [R2, R3, Batter]       | `(null, null, null)`   | ❌     |

### 8. Bases Loaded (`loaded`)

| Hit Type | Outcome Type                         | Description                          | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ------------------------------------ | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R3 scores, others advance            | 1    | 0    | [R3]                   | `(Batter, R1, R2)`     | ❌     |
| 1B       | Error                                | R3 scores, others advance on error   | 0    | 0    | [R3]                   | `(Batter, R1, R2)`     | ❌     |
| 1B       | Error                                | Multiple runners score on error      | 0    | 0    | [R2, R3]               | `(Batter, R1, null)`   | ❌     |
| 1B       | Error                                | All runners score on error           | 0    | 0    | [R1, R2, R3]           | `(Batter, null, null)` | ❌     |
| 1B       | Error                                | Everyone scores on error             | 0    | 0    | [R1, R2, R3, Batter]   | `(null, null, null)`   | ❌     |
| 2B       | Standard                             | R2+R3 score, R1→3rd, Batter→2nd      | 2    | 0    | [R2, R3]               | `(null, Batter, R1)`   | ❌     |
| 2B       | Error                                | All runners score on error           | 0    | 0    | [R1, R2, R3]           | `(null, Batter, null)` | ❌     |
| 2B       | Error                                | Everyone scores on error             | 0    | 0    | [R1, R2, R3, Batter]   | `(null, null, null)`   | ❌     |
| 3B       | Standard                             | All runners score, Batter→3rd        | 3    | 0    | [R1, R2, R3]           | `(null, null, Batter)` | ❌     |
| 3B       | Error                                | Everyone scores on error             | 0    | 0    | [R1, R2, R3, Batter]   | `(null, null, null)`   | ❌     |
| HR       | Standard                             | Grand slam - everyone scores         | 4    | 0    | [R1, R2, R3, Batter]   | `(null, null, null)`   | ❌     |
| BB/IBB   | Standard (Forced)                    | Forced walk - R3 scores              | 1    | 0    | [R3]                   | `(Batter, R1, R2)`     | ❌     |
| SO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, R3)`         | ❌     |
| GO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, R3)`         | ❌     |
| GO       | Force at Home                        | R3 forced at home, bases still loaded | 0   | 1    | []                     | `(R1, R2, Batter)`     | ❌     |
| GO       | RBI Groundout                        | R3 scores, R2 forced at home         | 1    | 1    | [R3]                   | `(R1, null, Batter)`   | ❌     |
| GO       | Double Play                          | R3 forced at home, R2 forced at 3rd  | 0    | 2    | []                     | `(R1, Batter, null)`   | ❌     |
| GO       | Triple Play                          | All forced outs                      | 0    | 3    | []                     | `(null, null, null)`   | ❌     |
| AO       | Standard                             | Batter out, runners stay             | 0    | 1    | []                     | `(R1, R2, R3)`         | ❌     |
| AO       | Tag Up                               | Runners advance after catch          | 0    | 1    | []                     | `(Batter, R1, R2)`     | ❌     |
| SF       | Standard                             | R3 scores on sacrifice fly           | 1    | 1    | [R3]                   | `(R1, R2, null)`       | ❌     |
| FC       | Standard                             | R3 forced at home, others advance    | 0    | 1    | []                     | `(Batter, R1, R2)`     | ❌     |
| FC       | Alternative                          | R2 forced at 3rd, others advance     | 0    | 1    | []                     | `(Batter, R1, R3)`     | ❌     |
| DP       | Standard                             | R3 forced at home, R2 forced at 3rd  | 0    | 2    | []                     | `(Batter, R1, null)`   | ❌     |
| DP       | Alternative                          | R2 forced at 3rd, R1 forced at 2nd   | 0    | 2    | []                     | `(Batter, null, R3)`   | ❌     |
| E        | Standard                             | Batter→1st, runners advance on error | 0    | 0    | []                     | `(Batter, R1, R2)`     | ❌     |
| E        | Error                                | R3 scores on error, others advance   | 0    | 0    | [R3]                   | `(Batter, R1, R2)`     | ❌     |
| E        | Error                                | Multiple runners score on error      | 0    | 0    | [R2, R3]               | `(Batter, R1, null)`   | ❌     |
| E        | Error                                | All runners score on error           | 0    | 0    | [R1, R2, R3]           | `(Batter, null, null)` | ❌     |
| E        | Error                                | Everyone scores on error             | 0    | 0    | [R1, R2, R3, Batter]   | `(null, null, null)`   | ❌     |

## Rule Validation Examples

### ✅ Correct Scenarios

**Example 1: Single with runner on first**

```
Before: (R1, null, null)
Hit: 1B
After: (Batter, R1, null)
RBIs: 0, Outs: 0, Runs: []
✓ Valid - Standard advancement
```

**Example 2: Double with bases loaded**

```
Before: (R1, R2, R3)
Hit: 2B
After: (null, Batter, R1)
RBIs: 2, Outs: 0, Runs: [R2, R3]
✓ Valid - R2 and R3 score, R1 advances to 3rd
```

### ❌ True Rule Violations

**Example 1: Impossible same player multiple bases**

```
Before: (Player1, Player1, null)  ❌ Same player can't be on 1st and 2nd
```

**Example 2: Incorrect RBI count**

```
Before: (null, null, R3)
Hit: 1B
After: (Batter, null, null)
RBIs: 0  ❌ Should be 1 RBI (R3 scores)
```

**Example 3: Invalid basic hit result**

```
Before: (null, null, null)
Hit: 2B
After: (Batter, null, null)  ❌ Double should put batter on 2nd base initially
```

### ✅ Valid Scenarios (Not Violations)

**Example 1: Single + error advancement**

```
Before: (null, null, null)
Hit: 1B
After: (null, Batter, null)  ✓ Valid - Single + error allowed advancement to 2nd
Hit Type: Still recorded as 1B
```

**Example 2: Force out with RBI**

```
Before: (R1, null, R3)
Hit: GO (Ground Out)
After: (null, null, null)
RBIs: 1, Outs: 2  ✓ Valid - R3 scores on force play, R1 and Batter out
```

## Implementation Status

### ✅ Phase 1 Complete (2/8 configurations)

- `empty` - All 13 hit types implemented and tested
- `first_only` - All 13 hit types implemented and tested

### 🚧 Phase 1 Partial (1/8 configurations)

- `first_third` - 13 hit types implemented, needs validation

### ❌ Phase 2 Needed (5/8 configurations)

- `second_only` - 0/13 hit types implemented
- `third_only` - 0/13 hit types implemented
- `first_second` - 0/13 hit types implemented
- `second_third` - 0/13 hit types implemented
- `loaded` - 0/13 hit types implemented

### 📊 Overall Progress

- **Implemented**: 26/104 scenario groups (25%)
- **Partially Complete**: 13/104 scenario groups (12.5%)
- **Remaining**: 65/104 scenario groups (62.5%)

## Next Steps

1. **Validate `first_third` implementation** - Review the 13 scenarios for correctness
2. **Implement remaining 5 base configurations** - Priority order: `third_only`, `second_only`, `loaded`, `first_second`, `second_third`
3. **Add comprehensive test coverage** - Each scenario needs unit tests
4. **Expert validation** - Have softball experts review all rules
5. **Edge case handling** - Advanced scenarios for Phase 2

---

_This document is updated as the rule matrix implementation progresses. Last updated: [Current Date]_
