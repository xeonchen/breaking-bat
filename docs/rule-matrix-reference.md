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
| 1B       | Error                               | Batter to 2nd on throwing error | 0    | 0    | []                     | `(null, Batter, null)` | ✅     |
| 2B       | Standard                            | Batter to 2nd                   | 0    | 0    | []                     | `(null, Batter, null)` | ✅     |
| 2B       | Error                               | Batter to 3rd on fielding error | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| 3B       | Standard                            | Batter reaches 3rd base         | 0    | 0    | []                     | `(null, null, Batter)` | ✅     |
| HR       | Standard                            | Solo home run                   | 1    | 0    | [Batter]               | `(null, null, null)`   | ✅     |
| BB/IBB   | Batter walks                        | 0                               | 0    | []   | `(Batter, null, null)` | ✅                     |
| SO       | Batter out                          | 0                               | 1    | []   | `(null, null, null)`   | ✅                     |
| GO       | Batter out                          | 0                               | 1    | []   | `(null, null, null)`   | ✅                     |
| AO       | Batter out                          | 0                               | 1    | []   | `(null, null, null)`   | ✅                     |
| SF       | Batter out (no runner to sacrifice) | 0                               | 1    | []   | `(null, null, null)`   | ✅                     |
| FC       | Batter to 1st                       | 0                               | 0    | []   | `(Batter, null, null)` | ✅                     |
| DP       | Batter out (no DP possible)         | 0                               | 1    | []   | `(null, null, null)`   | ✅                     |
| E        | Batter to 1st on error              | 0                               | 0    | []   | `(Batter, null, null)` | ✅                     |

### 2. Runner on First Only (`first_only`)

| Hit Type | Outcome Type                         | Description                  | RBIs | Outs | Runs Scored            | After State            | Status |
| -------- | ------------------------------------ | ---------------------------- | ---- | ---- | ---------------------- | ---------------------- | ------ |
| 1B       | Standard                             | R1→2nd, Batter→1st           | 0    | 0    | []                     | `(Batter, R1, null)`   | ✅     |
| 1B       | Aggressive                           | R1 scores home               | 1    | 0    | [R1]                   | `(Batter, null, null)` | ✅     |
| 1B       | Error                                | Batter→2nd on throw error    | 0    | 0    | []                     | `(null, Batter, R1)`   | ✅     |
| 1B       | Agg+Error                            | R1 scores, Batter→2nd        | 1    | 0    | [R1]                   | `(null, Batter, null)` | ✅     |
| 1B       | Agg Failed                           | R1 out at home, Batter safe  | 0    | 1    | []                     | `(Batter, null, null)` | ✅     |
| 2B       | Standard                             | R1 scores, Batter→2nd        | 1    | 0    | [R1]                   | `(null, Batter, null)` | ✅     |
| 2B       | Error                                | Both score on fielding error | 2    | 0    | [R1, Batter]           | `(null, null, null)`   | ✅     |
| 3B       | Standard                             | Both score                   | 2    | 0    | [R1, Batter]           | `(null, null, null)`   | ✅     |
| HR       | Standard                             | 2-run homer                  | 2    | 0    | [R1, Batter]           | `(null, null, null)`   | ✅     |
| BB/IBB   | **Forced**: R1→2nd, Batter→1st       | 0                            | 0    | []   | `(Batter, R1, null)`   | ✅                     |
| SO       | Batter out, R1 stays                 | 0                            | 1    | []   | `(R1, null, null)`     | ✅                     |
| GO       | **Option 1**: Batter out, R1 stays   | 0                            | 1    | []   | `(R1, null, null)`     | ✅                     |
|          | **Option 2**: Force play - both out  | 0                            | 2    | []   | `(null, null, null)`   | ✅                     |
| AO       | Batter out, R1 stays                 | 0                            | 1    | []   | `(R1, null, null)`     | ✅                     |
| SF       | Batter out, R1 stays (can't advance) | 0                            | 1    | []   | `(R1, null, null)`     | ✅                     |
| FC       | R1 forced out, Batter→1st            | 0                            | 1    | []   | `(Batter, null, null)` | ✅                     |
| DP       | Classic 6-4-3 double play            | 0                            | 2    | []   | `(null, null, null)`   | ✅                     |
| E        | Batter→1st, R1→2nd on error          | 0                            | 0    | []   | `(Batter, R1, null)`   | ✅                     |

### 3. Runner on Second Only (`second_only`)

| Hit Type | Expected Outcome                 | RBIs     | Outs | Runs Scored  | After State            | Status |
| -------- | -------------------------------- | -------- | ---- | ------------ | ---------------------- | ------ |
| 1B       | R2 scores, Batter→1st            | 1        | 0    | [R2]         | `(Batter, null, null)` | ❌     |
| 2B       | R2 scores, Batter→2nd            | 1        | 0    | [R2]         | `(null, Batter, null)` | ❌     |
| 3B       | Both score                       | 2        | 0    | [R2, Batter] | `(null, null, null)`   | ❌     |
| HR       | 2-run homer                      | 2        | 0    | [R2, Batter] | `(null, null, null)`   | ❌     |
| BB/IBB   | R2 stays, Batter→1st             | 0        | 0    | []           | `(Batter, R2, null)`   | ❌     |
| SO       | Batter out, R2 stays             | 0        | 1    | []           | `(null, R2, null)`     | ❌     |
| GO       | Batter out, R2 stays             | 0        | 1    | []           | `(null, R2, null)`     | ❌     |
| AO       | Batter out, R2 stays             | 0        | 1    | []           | `(null, R2, null)`     | ❌     |
| SF       | Batter out, R2 may advance/score | Variable | 1    | Variable     | Variable               | ❌     |
| FC       | R2 forced at 3rd, Batter→1st     | 0        | 1    | []           | `(Batter, null, null)` | ❌     |
| DP       | Batter out, R2 stays             | 0        | 1    | []           | `(null, R2, null)`     | ❌     |
| E        | Variable based on error type     | Variable | 0    | Variable     | Variable               | ❌     |

### 4. Runner on Third Only (`third_only`)

| Hit Type | Expected Outcome                     | RBIs     | Outs | Runs Scored  | After State            | Status |
| -------- | ------------------------------------ | -------- | ---- | ------------ | ---------------------- | ------ |
| 1B       | R3 scores, Batter→1st                | 1        | 0    | [R3]         | `(Batter, null, null)` | ❌     |
| 2B       | R3 scores, Batter→2nd                | 1        | 0    | [R3]         | `(null, Batter, null)` | ❌     |
| 3B       | Both score                           | 2        | 0    | [R3, Batter] | `(null, null, null)`   | ❌     |
| HR       | 2-run homer                          | 2        | 0    | [R3, Batter] | `(null, null, null)`   | ❌     |
| BB/IBB   | R3 stays, Batter→1st                 | 0        | 0    | []           | `(Batter, null, R3)`   | ❌     |
| SO       | Batter out, R3 stays                 | 0        | 1    | []           | `(null, null, R3)`     | ❌     |
| GO       | Batter out, R3 stays                 | 0        | 1    | []           | `(null, null, R3)`     | ❌     |
| AO       | Batter out, R3 stays                 | 0        | 1    | []           | `(null, null, R3)`     | ❌     |
| SF       | **Sacrifice**: R3 scores, Batter out | 1        | 1    | [R3]         | `(null, null, null)`   | ❌     |
| FC       | R3 forced at home, Batter→1st        | 0        | 1    | []           | `(Batter, null, null)` | ❌     |
| DP       | Batter out, R3 stays                 | 0        | 1    | []           | `(null, null, R3)`     | ❌     |
| E        | Variable advancement                 | Variable | 0    | Variable     | Variable               | ❌     |

### 5. Runners on First and Second (`first_second`)

| Hit Type | Expected Outcome                     | RBIs     | Outs | Runs Scored      | After State            | Status |
| -------- | ------------------------------------ | -------- | ---- | ---------------- | ---------------------- | ------ |
| 1B       | R2 scores, R1→3rd, Batter→1st        | 1        | 0    | [R2]             | `(Batter, null, R1)`   | ❌     |
| 2B       | Both runners score, Batter→2nd       | 2        | 0    | [R1, R2]         | `(null, Batter, null)` | ❌     |
| 3B       | All score                            | 3        | 0    | [R1, R2, Batter] | `(null, null, null)`   | ❌     |
| HR       | 3-run homer                          | 3        | 0    | [R1, R2, Batter] | `(null, null, null)`   | ❌     |
| BB/IBB   | **Forced**: Bases loaded             | 0        | 0    | []               | `(Batter, R1, R2)`     | ❌     |
| SO       | Batter out, runners stay             | 0        | 1    | []               | `(R1, R2, null)`       | ❌     |
| GO       | **Force options** multiple scenarios | Variable | 1-2  | Variable         | Variable               | ❌     |
| AO       | Batter out, runners stay             | 0        | 1    | []               | `(R1, R2, null)`       | ❌     |
| SF       | Batter out, runners stay             | 0        | 1    | []               | `(R1, R2, null)`       | ❌     |
| FC       | Lead runner forced, others advance   | 0        | 1    | []               | Variable               | ❌     |
| DP       | Multiple DP scenarios possible       | 0        | 2    | []               | Variable               | ❌     |
| E        | Variable advancement scenarios       | Variable | 0    | Variable         | Variable               | ❌     |

### 6. Runners on First and Third (`first_third`)

| Hit Type | Expected Outcome                                | RBIs     | Outs | Runs Scored      | After State            | Status |
| -------- | ----------------------------------------------- | -------- | ---- | ---------------- | ---------------------- | ------ |
| 1B       | **Standard**: R3 scores, R1→2nd, Batter→1st     | 1        | 0    | [R3]             | `(Batter, R1, null)`   | 🚧     |
|          | **Aggressive**: Both runners score              | 2        | 0    | [R1, R3]         | `(Batter, null, null)` | 🚧     |
| 2B       | **Standard**: Both runners score                | 2        | 0    | [R1, R3]         | `(null, Batter, null)` | 🚧     |
|          | **Conservative**: R3 scores, R1→2nd, Batter→2nd | 1        | 0    | [R3]             | `(Batter, R1, null)`   | 🚧     |
| 3B       | All score                                       | 3        | 0    | [R1, R3, Batter] | `(null, null, null)`   | 🚧     |
| HR       | 3-run homer                                     | 3        | 0    | [R1, R3, Batter] | `(null, null, null)`   | 🚧     |
| BB/IBB   | **Forced**: R1→2nd, Batter→1st, R3 stays        | 0        | 0    | []               | `(Batter, R1, R3)`     | 🚧     |
| SO       | Batter out, runners stay                        | 0        | 1    | []               | `(R1, null, R3)`       | 🚧     |
| GO       | Multiple force play options                     | Variable | 1-2  | Variable         | Variable               | 🚧     |
| AO       | Batter out, runners stay                        | 0        | 1    | []               | `(R1, null, R3)`       | 🚧     |
| SF       | **Classic**: R3 scores, R1 stays                | 1        | 1    | [R3]             | `(R1, null, null)`     | 🚧     |
| FC       | Multiple force options                          | Variable | 1    | Variable         | Variable               | 🚧     |
| DP       | Double play scenarios                           | 0        | 2    | []               | Variable               | 🚧     |
| E        | Variable error advancement                      | Variable | 0    | Variable         | Variable               | 🚧     |

### 7. Runners on Second and Third (`second_third`)

| Hit Type | Expected Outcome               | RBIs     | Outs | Runs Scored      | After State            | Status |
| -------- | ------------------------------ | -------- | ---- | ---------------- | ---------------------- | ------ |
| 1B       | Both runners score, Batter→1st | 2        | 0    | [R2, R3]         | `(Batter, null, null)` | ❌     |
| 2B       | Both runners score, Batter→2nd | 2        | 0    | [R2, R3]         | `(null, Batter, null)` | ❌     |
| 3B       | All score                      | 3        | 0    | [R2, R3, Batter] | `(null, null, null)`   | ❌     |
| HR       | 3-run homer                    | 3        | 0    | [R2, R3, Batter] | `(null, null, null)`   | ❌     |
| BB/IBB   | Runners stay, Batter→1st       | 0        | 0    | []               | `(Batter, R2, R3)`     | ❌     |
| SO       | Batter out, runners stay       | 0        | 1    | []               | `(null, R2, R3)`       | ❌     |
| GO       | Batter out, runners stay       | 0        | 1    | []               | `(null, R2, R3)`       | ❌     |
| AO       | Batter out, runners stay       | 0        | 1    | []               | `(null, R2, R3)`       | ❌     |
| SF       | R3 scores, R2 stays            | 1        | 1    | [R3]             | `(null, R2, null)`     | ❌     |
| FC       | R3 forced at home, Batter→1st  | 0        | 1    | []               | `(Batter, R2, null)`   | ❌     |
| DP       | Batter out, runners stay       | 0        | 1    | []               | `(null, R2, R3)`       | ❌     |
| E        | Variable advancement           | Variable | 0    | Variable         | Variable               | ❌     |

### 8. Bases Loaded (`loaded`)

| Hit Type | Expected Outcome                | RBIs     | Outs | Runs Scored          | After State            | Status |
| -------- | ------------------------------- | -------- | ---- | -------------------- | ---------------------- | ------ |
| 1B       | R3 scores, others advance       | 1        | 0    | [R3]                 | `(Batter, R1, R2)`     | ❌     |
| 2B       | R2+R3 score, R1→3rd, Batter→2nd | 2        | 0    | [R2, R3]             | `(null, Batter, R1)`   | ❌     |
| 3B       | All runners score               | 3        | 0    | [R1, R2, R3]         | `(null, null, Batter)` | ❌     |
| HR       | **Grand slam** - all score      | 4        | 0    | [R1, R2, R3, Batter] | `(null, null, null)`   | ❌     |
| BB/IBB   | **Forced walk** - R3 scores     | 1        | 0    | [R3]                 | `(Batter, R1, R2)`     | ❌     |
| SO       | Batter out, runners stay        | 0        | 1    | []                   | `(R1, R2, R3)`         | ❌     |
| GO       | **Force play** options multiple | Variable | 1-3  | Variable             | Variable               | ❌     |
| AO       | Batter out, runners stay        | 0        | 1    | []                   | `(R1, R2, R3)`         | ❌     |
| SF       | R3 scores, others stay          | 1        | 1    | [R3]                 | `(R1, R2, null)`       | ❌     |
| FC       | Force play at any base          | Variable | 1    | Variable             | Variable               | ❌     |
| DP       | Multiple double play options    | Variable | 2    | Variable             | Variable               | ❌     |
| E        | Variable advancement            | Variable | 0    | Variable             | Variable               | ❌     |

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
