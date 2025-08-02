# User Stories: Comprehensive Rule Matrix System

## Overview

The Breaking-Bat application requires a comprehensive rule validation system that ensures all recorded game scenarios follow real slow-pitch softball rules. This system serves two primary purposes: validating test data for accuracy and enhancing the user experience by providing only valid scoring options during live game recording.

## Epic: Rule Matrix Engine

### Epic Description

As a softball scoring application, we need a comprehensive rule validation system that understands all possible game scenarios and can provide guidance for valid scoring options while preventing invalid game states.

---

## User Story 1: Basic Hit Type Validation

**As a scorer recording a live game**  
**I want the system to show only valid hitting results for the current base situation**  
**So that I cannot accidentally record impossible game scenarios**

### Acceptance Criteria

- [ ] System supports all 13 standard hit types (1B, 2B, 3B, HR, BB, IBB, SF, E, FC, SO, GO, AO, DP)
- [ ] Each hit type shows appropriate base advancement options
- [ ] Invalid hit types are hidden based on current game state
- [ ] RBI calculations are automatically provided for each outcome option

### Technical Requirements

- Rule matrix covers all 8 possible baserunner configurations
- Lookup time must be under 50ms for real-time UI responsiveness
- Integration with existing AtBat entity and BattingResult value object

---

## User Story 2: Outcome Selection with RBI Calculation

**As a scorer**  
**I want to select from valid outcome scenarios for each hit type**  
**So that I can accurately record what happened without manual RBI calculation**

### Acceptance Criteria

- [ ] After selecting hit type, system shows valid outcome combinations
- [ ] Each outcome shows: final baserunner state, RBI count, runs scored
- [ ] User can select the outcome that matches what actually happened
- [ ] System validates the selected combination is possible

### Example Scenarios

```
Current: Runner on 1st base, Hit: Double
Options:
- Runner scores, batter to 2nd → 1 RBI
- Runner to 3rd, batter to 2nd → 0 RBI
```

---

## User Story 3: Test Data Validation

**As a developer**  
**I want all test scenarios to follow real softball rules**  
**So that the application behavior accurately reflects real-world gameplay**

### Acceptance Criteria

- [ ] Tool scans all existing tests for rule violations
- [ ] Generates report of violations found with suggested corrections
- [ ] All new tests must pass rule validation before being committed
- [ ] Test data matches realistic game scenarios

### Validation Areas

- Base advancement distances match hit types
- RBI counts are accurate for runs scored
- Baserunner states are valid (no two runners on same base)
- Out counts don't exceed inning limits

---

## User Story 4: Advanced Scenario Handling (Future)

**As a scorer dealing with complex plays**  
**I want to record aggressive advancement attempts and fielding errors**  
**So that I can capture the complete story of what happened during the play**

### Acceptance Criteria (Future Implementation)

- [ ] Record aggressive advancement attempts that result in outs
- [ ] Handle fielding errors that allow extra advancement
- [ ] Support complex scenarios like double plays with partial completion
- [ ] Validate that advanced scenarios follow softball rules

### Example Advanced Scenarios

```
Aggressive Advancement:
- Runner on 1st, hit 2B, runner attempts home but is out
- Final state: Batter on 3rd (advanced during play), 1 out, 0 RBI

Fielding Error:
- Empty bases, hit 1B, error allows batter to reach 2nd
- Record as: 1B + E, final state: runner on 2nd
```

---

## User Story 5: Rule Matrix Performance

**As a user of the scoring interface**  
**I want instant feedback on available options**  
**So that the scoring process doesn't slow down the game**

### Acceptance Criteria

- [ ] Rule lookups complete in under 50ms
- [ ] UI updates immediately when base situation changes
- [ ] System handles concurrent rule validations efficiently
- [ ] Memory usage remains reasonable for extended games

---

## User Story 6: Expert Rule Validation

**As a softball expert**  
**I want to verify that the rule matrix accurately represents slow-pitch softball**  
**So that the application provides correct guidance and validation**

### Acceptance Criteria

- [ ] All standard scenarios match official slow-pitch softball rules
- [ ] Edge cases are handled appropriately
- [ ] Rule matrix can be updated if rules change
- [ ] Documentation clearly explains rule interpretations

---

## Implementation Notes

### Phase 1: Basic Matrix (MVP)

- Implement standard advancement for all 13 hit types
- Cover all 8 baserunner state combinations
- Focus on most common scenarios first
- Integrate with existing domain entities

### Phase 2: Advanced Scenarios (Future)

- Add aggressive advancement tracking
- Implement fielding error scenarios
- Handle complex double play situations
- Support customizable rule variations

### Technical Architecture

- Domain-driven design with rule matrix as domain service
- Clean separation between rule logic and UI presentation
- Extensible design for future rule additions
- Integration with existing Clean Architecture layers

### Success Metrics

- Zero rule violations in test suite
- Sub-50ms rule lookup performance
- Positive user feedback on scoring experience
- Reduction in scoring errors during live games

---

## Related Documents

- `docs/specs/comprehensive-rule-matrix.yaml` - Technical specification
- `docs/specs/domain-entities.md` - Existing domain model
- `docs/user-stories/live-scoring.md` - Related scoring functionality
