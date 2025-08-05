import {
  ValidationRule,
  AtBatValidationScenario,
  RuleEngineConfig,
  RuleEngineValidationResult,
} from '../values/ValidationRule';
import {
  ValidationResult,
  RuleViolation,
  ViolationType,
} from '../values/RuleViolation';

/**
 * Configurable rule engine that manages validation rules
 * Allows enabling/disabling individual rules and combining their results
 */
export class ConfigurableRuleEngine {
  private rules: Map<string, ValidationRule> = new Map();
  private config: RuleEngineConfig;

  constructor(config?: Partial<RuleEngineConfig>) {
    this.config = {
      ruleStates: new Map(),
      defaultEnabled: true,
      ...config,
    };
  }

  /**
   * Register a new validation rule
   */
  public registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);

    // Set initial enabled state from config or rule default
    if (this.config.ruleStates.has(rule.id)) {
      const ruleState = this.config.ruleStates.get(rule.id);
      rule.enabled =
        ruleState !== undefined ? ruleState : this.config.defaultEnabled;
    } else {
      rule.enabled = this.config.defaultEnabled;
      this.config.ruleStates.set(rule.id, rule.enabled);
    }
  }

  /**
   * Enable a specific rule
   */
  public enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.config.ruleStates.set(ruleId, true);
    } else {
      throw new Error(`Rule with ID '${ruleId}' not found`);
    }
  }

  /**
   * Disable a specific rule
   */
  public disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      this.config.ruleStates.set(ruleId, false);
    } else {
      throw new Error(`Rule with ID '${ruleId}' not found`);
    }
  }

  /**
   * Get the current enabled state of a rule
   */
  public isRuleEnabled(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    return rule ? rule.enabled : false;
  }

  /**
   * Get all registered rules
   */
  public getAllRules(): readonly ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all enabled rules
   */
  public getEnabledRules(): readonly ValidationRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  /**
   * Get rules by category
   */
  public getRulesByCategory(
    category: 'critical' | 'configurable' | 'optional'
  ): readonly ValidationRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.category === category
    );
  }

  /**
   * Validate an at-bat scenario against all enabled rules
   */
  public validateAtBat(
    scenario: AtBatValidationScenario
  ): RuleEngineValidationResult {
    const enabledRules = this.getEnabledRules();
    const ruleResults = new Map<string, ValidationResult>();
    let isValid = true;
    const allViolations: import('../values/RuleViolation').RuleViolation[] = [];
    const allSuggestions: import('../values/ValidOutcome').ValidOutcome[] = [];

    // Run each enabled rule
    for (const rule of enabledRules) {
      try {
        const result = rule.validate(scenario);
        ruleResults.set(rule.id, result);

        if (!result.isValid) {
          isValid = false;
          allViolations.push(...result.violations);
          allSuggestions.push(...result.suggestedCorrections);
        }
      } catch (error) {
        // Rule execution failed - treat as validation failure
        const errorResult = ValidationResult.invalid(
          new RuleViolation(
            ViolationType.INVALID_HIT_TYPE,
            `Rule '${rule.name}' failed to execute: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              before: scenario.beforeState,
              after: scenario.afterState,
              hitType: scenario.battingResult.toHitType(),
              rbis: scenario.rbis,
              outs: scenario.outs,
            }
          )
        );

        ruleResults.set(rule.id, errorResult);
        isValid = false;
        allViolations.push(...errorResult.violations);
      }
    }

    return {
      isValid,
      ruleResults,
      allViolations,
      allSuggestions,
    };
  }

  /**
   * Clear all registered rules
   */
  public clearRules(): void {
    this.rules.clear();
    this.config.ruleStates.clear();
  }

  /**
   * Get current configuration
   */
  public getConfig(): RuleEngineConfig {
    return {
      ruleStates: new Map(this.config.ruleStates),
      defaultEnabled: this.config.defaultEnabled,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RuleEngineConfig>): void {
    if (newConfig.ruleStates) {
      // Update rule states and apply to existing rules
      for (const [ruleId, enabled] of newConfig.ruleStates) {
        this.config.ruleStates.set(ruleId, enabled);
        const rule = this.rules.get(ruleId);
        if (rule) {
          rule.enabled = enabled;
        }
      }
    }

    if (newConfig.defaultEnabled !== undefined) {
      this.config.defaultEnabled = newConfig.defaultEnabled;
    }
  }
}
