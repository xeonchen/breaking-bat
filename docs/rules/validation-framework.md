# Configurable Rule Validation Framework

## Overview

The Breaking-Bat validation framework provides configurable rule validation to help prevent data entry mistakes during game scoring. The framework is designed to be flexible, allowing leagues to enable or disable specific validation rules based on their needs.

This framework has been **fully implemented** with core infrastructure, 3 critical validation rules, integration with the existing parameter-based system, and comprehensive test coverage.

## Purpose

**Primary Goal**: Mistake prevention, not rule prescription

The validation framework serves as an enhancement layer that:

- Catches obvious data entry errors
- Provides warnings for unusual scenarios
- Allows leagues to configure validation strictness
- Maintains flexibility for different league rules

## Framework Architecture

### Core Components

```typescript
interface ValidationRule {
  id: string; // Unique rule identifier
  name: string; // Human-readable rule name
  enabled: boolean; // Whether rule is active
  validate: (scenario: AtBatScenario) => ValidationResult;
}

interface ConfigurableRuleEngine {
  registerRule(rule: ValidationRule): void;
  enableRule(ruleId: string): void;
  disableRule(ruleId: string): void;
  validateAtBat(scenario: AtBatScenario): ValidationResult;
}
```

### Integration with Existing System

The validation framework integrates with the existing parameter-based rule system:

- **Parameter System**: Generates valid outcome variations (aggressive, error, running-error)
- **Validation Framework**: Checks for fundamental rule violations and data consistency
- **Combined Results**: Both systems work together to provide comprehensive validation

## Rule Categories

### Critical Rules (Always Important)

Rules that prevent impossible game states or mathematical inconsistencies:

- **no-runner-passing**: Trailing runner cannot pass lead runner
- **rbi-validation**: RBIs ≤ runs scored (mathematical consistency)
- **max-outs-validation**: ≤ 3 outs per at-bat

### Future Configurable Rules

Rules that may vary between leagues (planned for future implementation):

- Error vs hit attribution validation
- Running error tolerance levels
- Statistical anomaly detection

## Implementation Status

### ✅ Completed Components

**Core Framework:**

- `ValidationRule` interface with enable/disable support
- `ConfigurableRuleEngine` service for rule management
- `AtBatValidationScenario` standardized input format
- `RuleEngineValidationResult` comprehensive output format

**Critical Validation Rules:**

- `no-runner-passing` - Prevents runner order violations
- `rbi-validation` - Ensures RBI count ≤ runs scored
- `max-outs-validation` - Validates 0-3 outs per at-bat

**Integration:**

- `RuleMatrixService` integration with dual validation
- Seamless compatibility with existing parameter-based system
- Non-breaking integration preserving all existing functionality

**Testing:**

- 38 comprehensive unit tests covering framework and rules
- Edge case validation for all critical rules
- Integration testing with existing systems
- TypeScript type safety verification

### API Usage Examples

**Basic Rule Management:**

```typescript
// Access via RuleMatrixService
const ruleService = new RuleMatrixService();

// Enable/disable rules
ruleService.enableRule('no-runner-passing');
ruleService.disableRule('rbi-validation');

// Check rule status
const isEnabled = ruleService.isRuleEnabled('max-outs-validation');

// Get all available rules
const rules = ruleService.getAvailableRules();
```

**Validation Integration:**

```typescript
// Validation happens automatically in validateAtBat
const result = ruleService.validateAtBat(
  beforeState,
  afterState,
  battingResult,
  rbis,
  runsScored,
  outs
);

// Access detailed rule results if needed
const ruleEngine = ruleService.getRuleEngine();
const ruleResult = ruleEngine.validateAtBat(scenario);
```

**Custom Rule Engine:**

```typescript
// Create engine with custom configuration
const engine = new ConfigurableRuleEngine({
  defaultEnabled: false,
});

// Register and manage rules directly
CriticalValidationRules.registerWithEngine(engine);
engine.enableRule('no-runner-passing');
```

## Usage Philosophy

### What the Framework IS:

- ✅ Mistake prevention system
- ✅ Configurable validation layer
- ✅ Data consistency checker
- ✅ Enhancement to existing parameter system

### What the Framework IS NOT:

- ❌ Prescriptive rule enforcement
- ❌ League rule dictation
- ❌ Replacement for existing parameter system
- ❌ Complex scenario enumeration

## Future Enhancements

### Planned Features

- Settings page integration for rule configuration
- Rule presets for different league types
- Advanced validation rules for complex scenarios
- AI-powered suggestions for unusual plays

### Extensibility

The framework is designed to easily accommodate:

- New validation rules
- Rule dependency systems
- Performance optimizations
- Rule versioning and migration

## Testing Strategy

### Framework Testing

- Rule registration and management
- Enable/disable functionality
- Integration with existing systems

### Rule Implementation Testing

- Individual rule validation logic
- Edge cases and boundary conditions
- Integration with realistic game scenarios

### Compatibility Testing

- Existing functionality preservation
- Parameter-based system integration
- Performance impact assessment

---

_This framework provides a foundation for flexible, configurable validation while maintaining the existing parameter-based outcome generation system._
