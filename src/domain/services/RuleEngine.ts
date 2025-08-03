import { BaserunnerState } from '../values/BaserunnerState';
import { BattingResult } from '../values/BattingResult';
import { ValidOutcome } from '../values/ValidOutcome';
import { OutcomeParameters, OutcomeParametersFactory } from '../values/OutcomeParameters';
import { BaseAdvancementCalculator } from './BaseAdvancementCalculator';

/**
 * Core rule engine that generates valid outcomes based on base state, hit type, and parameters
 * This is the main interface for the parameter-based rule system
 */
export class RuleEngine {
  /**
   * Generate all valid outcomes for a given scenario and parameter combination
   */
  static generateValidOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    parameters: OutcomeParameters
  ): ValidOutcome[] {
    const outcomes: ValidOutcome[] = [];

    // Always include standard outcome when no parameters are set
    // With parameters set, standard is still a valid option alongside variations
    const standardOutcome = this.generateStandardOutcome(
      beforeState,
      battingResult,
      batterId
    );
    outcomes.push(standardOutcome);

    // Add parameter-specific outcomes
    if (parameters.runner_is_aggressive) {
      outcomes.push(
        ...this.generateAggressiveRunnerOutcomes(
          beforeState,
          battingResult,
          batterId,
          parameters
        )
      );
    }

    if (parameters.has_fielding_error) {
      outcomes.push(
        ...this.generateFieldingErrorOutcomes(
          beforeState,
          battingResult,
          batterId,
          parameters
        )
      );
    }

    if (parameters.has_running_error) {
      outcomes.push(
        ...this.generateRunningErrorOutcomes(
          beforeState,
          battingResult,
          batterId,
          parameters
        )
      );
    }

    return outcomes;
  }

  /**
   * Get all valid outcomes for all parameter combinations
   * This is useful for presenting users with all possible choices
   */
  static getAllValidOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): ValidOutcome[] {
    const allOutcomes: ValidOutcome[] = [];
    const allParameters = OutcomeParametersFactory.getAllCombinations();

    for (const parameters of allParameters) {
      const outcomes = this.generateValidOutcomes(
        beforeState,
        battingResult,
        batterId,
        parameters
      );
      allOutcomes.push(...outcomes);
    }

    // Remove duplicates based on outcome equality
    return this.removeDuplicateOutcomes(allOutcomes);
  }

  /**
   * Validate if a proposed outcome is valid for the given scenario
   */
  static validateOutcome(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    proposedOutcome: ValidOutcome
  ): boolean {
    const allValidOutcomes = this.getAllValidOutcomes(
      beforeState,
      battingResult,
      batterId
    );

    return allValidOutcomes.some((validOutcome) =>
      validOutcome.equals(proposedOutcome)
    );
  }


  private static generateStandardOutcome(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): ValidOutcome {
    const advancement = BaseAdvancementCalculator.calculateStandardAdvancement(
      beforeState,
      battingResult,
      batterId
    );

    const runsEarnedByHit = BaseAdvancementCalculator.calculateStandardRBIs(
      advancement.runsScored,
      battingResult
    );

    const rbis = runsEarnedByHit.length;
    const outs = this.calculateOutsForResult(battingResult);

    // Use appropriate factory method based on whether there are outs
    if (outs > 0) {
      return ValidOutcome.withOuts(
        advancement.afterState,
        rbis,
        outs,
        advancement.runsScored,
        `Standard ${battingResult.value}`
      );
    } else {
      return ValidOutcome.standard(
        advancement.afterState,
        rbis,
        advancement.runsScored,
        `Standard ${battingResult.value}`
      );
    }
  }

  private static generateAggressiveRunnerOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    _parameters: OutcomeParameters
  ): ValidOutcome[] {
    const outcomes: ValidOutcome[] = [];
    const result = battingResult.value;

    // Only generate aggressive outcomes for hits that allow extra advancement
    if (!['1B', '2B', '3B'].includes(result)) {
      return outcomes;
    }

    // Get standard advancement as baseline
    const standard = BaseAdvancementCalculator.calculateStandardAdvancement(
      beforeState,
      battingResult,
      batterId
    );

    // Generate aggressive variations where runners advance extra bases
    const aggressiveVariations = this.calculateAggressiveRunnerVariations(
      beforeState,
      standard,
      battingResult,
      batterId
    );

    for (const variation of aggressiveVariations) {
      const outcome = ValidOutcome.withParameters(
        variation.afterState,
        variation.rbis,
        0, // No additional outs for successful aggressive running
        variation.runsScored,
        variation.runsEarnedByHit,
        `Aggressive ${battingResult.value} - ${variation.description}`,
        { runner_is_aggressive: true, has_fielding_error: false, has_running_error: false }
      );
      outcomes.push(outcome);
    }

    return outcomes;
  }

  private static generateFieldingErrorOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    _parameters: OutcomeParameters
  ): ValidOutcome[] {
    const outcomes: ValidOutcome[] = [];

    // Get standard advancement as baseline
    const standard = BaseAdvancementCalculator.calculateStandardAdvancement(
      beforeState,
      battingResult,
      batterId
    );

    // Generate error variations where extra advancement occurs but no RBIs for error advancement
    const errorVariations = this.calculateFieldingErrorVariations(
      beforeState,
      standard,
      battingResult,
      batterId
    );

    for (const variation of errorVariations) {
      const outcome = ValidOutcome.withParameters(
        variation.afterState,
        variation.rbis,
        0, // Errors help offense, don't create additional outs
        variation.runsScored,
        variation.runsEarnedByHit,
        `${battingResult.value} + Error - ${variation.description}`,
        { runner_is_aggressive: false, has_fielding_error: true, has_running_error: false }
      );
      outcomes.push(outcome);
    }

    return outcomes;
  }

  private static generateRunningErrorOutcomes(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    _parameters: OutcomeParameters
  ): ValidOutcome[] {
    const outcomes: ValidOutcome[] = [];

    // Get standard advancement as baseline
    const standard = BaseAdvancementCalculator.calculateStandardAdvancement(
      beforeState,
      battingResult,
      batterId
    );

    // Generate running error variations where additional outs can occur
    const runningErrorVariations = this.calculateRunningErrorVariations(
      beforeState,
      standard,
      battingResult,
      batterId
    );

    for (const variation of runningErrorVariations) {
      const outcome = ValidOutcome.withParameters(
        variation.afterState,
        variation.rbis,
        variation.outs,
        variation.runsScored,
        variation.runsEarnedByHit,
        `${battingResult.value} + Running Error - ${variation.description}`,
        { runner_is_aggressive: false, has_fielding_error: false, has_running_error: true }
      );
      outcomes.push(outcome);
    }

    return outcomes;
  }

  private static calculateOutsForResult(battingResult: BattingResult): number {
    const result = battingResult.value;
    
    switch (result) {
      case 'SO':
      case 'GO':
      case 'AO':
      case 'SF':
        return 1;
      case 'DP':
        return 2;
      default:
        return 0;
    }
  }

  private static calculateAggressiveRunnerVariations(
    beforeState: BaserunnerState,
    standard: any,
    battingResult: BattingResult,
    batterId: string
  ): any[] {
    const variations: any[] = [];
    const result = battingResult.value;

    // Comprehensive aggressive running scenarios

    if (result === '1B') {
      // Single with aggressive running
      
      if (beforeState.firstBase && !beforeState.secondBase) {
        // Runner on first attempts to reach third (instead of stopping at second)
        variations.push({
          afterState: new BaserunnerState(batterId, null, beforeState.firstBase),
          runsScored: standard.runsScored,
          runsEarnedByHit: standard.runsScored,
          rbis: standard.runsScored.length,
          description: 'Runner from 1st reaches 3rd',
        });
      }
      
      if (beforeState.secondBase) {
        // Runner on second attempts to score (instead of stopping at third)
        const runsScored = [...standard.runsScored];
        if (!runsScored.includes(beforeState.secondBase)) {
          runsScored.push(beforeState.secondBase);
        }

        variations.push({
          afterState: new BaserunnerState(batterId, beforeState.firstBase, null),
          runsScored,
          runsEarnedByHit: runsScored,
          rbis: runsScored.length,
          description: 'Runner from 2nd scores',
        });
      }

      if (beforeState.firstBase && beforeState.secondBase) {
        // Both runners advance aggressively - first to third, second scores
        const runsScored = [...standard.runsScored];
        if (!runsScored.includes(beforeState.secondBase)) {
          runsScored.push(beforeState.secondBase);
        }

        variations.push({
          afterState: new BaserunnerState(batterId, null, beforeState.firstBase),
          runsScored,
          runsEarnedByHit: runsScored,
          rbis: runsScored.length,
          description: 'R1→3rd, R2 scores',
        });
      }
    }

    if (result === '2B') {
      // Double with aggressive running
      if (beforeState.firstBase) {
        // Runner on first attempts to score (instead of stopping at third)
        const runsScored = [...standard.runsScored];
        if (!runsScored.includes(beforeState.firstBase)) {
          runsScored.push(beforeState.firstBase);
        }

        variations.push({
          afterState: new BaserunnerState(null, batterId, null),
          runsScored,
          runsEarnedByHit: runsScored,
          rbis: runsScored.length,
          description: 'Runner from 1st scores',
        });
      }

      // Multiple runners scenario - first and second both try to score
      if (beforeState.firstBase && beforeState.secondBase) {
        const runsScored = [...standard.runsScored];
        if (!runsScored.includes(beforeState.firstBase)) {
          runsScored.push(beforeState.firstBase);
        }
        if (!runsScored.includes(beforeState.secondBase)) {
          runsScored.push(beforeState.secondBase);
        }

        variations.push({
          afterState: new BaserunnerState(null, batterId, null),
          runsScored,
          runsEarnedByHit: runsScored,
          rbis: runsScored.length,
          description: 'Both R1 and R2 score',
        });
      }
    }

    if (result === '3B') {
      // Triple - normally all runners score, but aggressive might mean extra advancement
      // Batter attempts to score on throwing error during triple
      if (beforeState.firstBase || beforeState.secondBase || beforeState.thirdBase) {
        const runsScored = [...standard.runsScored];
        runsScored.push(batterId); // Batter scores too

        variations.push({
          afterState: BaserunnerState.empty(),
          runsScored,
          runsEarnedByHit: runsScored,
          rbis: runsScored.length,
          description: 'Batter scores on aggressive advancement',
        });
      }
    }

    return variations;
  }

  private static calculateFieldingErrorVariations(
    beforeState: BaserunnerState,
    standard: any,
    battingResult: BattingResult,
    batterId: string
  ): any[] {
    const variations: any[] = [];
    const result = battingResult.value;

    // Comprehensive fielding error scenarios

    if (result === '1B') {
      // Single + throwing error variations
      
      // Batter reaches second on throwing error
      variations.push({
        afterState: new BaserunnerState(null, batterId, beforeState.firstBase),
        runsScored: standard.runsScored,
        runsEarnedByHit: standard.runsScored,
        rbis: standard.runsScored.length,
        description: 'Batter reaches 2nd on throwing error',
      });

      // If runner on second, they might score on the error
      if (beforeState.secondBase) {
        const errorRuns = [...standard.runsScored];
        if (!errorRuns.includes(beforeState.secondBase)) {
          errorRuns.push(beforeState.secondBase);
        }

        variations.push({
          afterState: new BaserunnerState(batterId, beforeState.firstBase, null),
          runsScored: errorRuns,
          runsEarnedByHit: standard.runsScored, // Only original runs count as RBIs
          rbis: standard.runsScored.length,
          description: 'Runner from 2nd scores on error',
        });
      }
    }

    if (result === '2B') {
      // Double + fielding error variations
      
      // Batter reaches third on error
      variations.push({
        afterState: new BaserunnerState(null, null, batterId),
        runsScored: standard.runsScored,
        runsEarnedByHit: standard.runsScored,
        rbis: standard.runsScored.length,
        description: 'Batter reaches 3rd on error',
      });

      // Runner from first scores on error (if they didn't already)
      if (beforeState.firstBase && !standard.runsScored.includes(beforeState.firstBase)) {
        const errorRuns = [...standard.runsScored, beforeState.firstBase];
        
        variations.push({
          afterState: new BaserunnerState(null, batterId, null),
          runsScored: errorRuns,
          runsEarnedByHit: standard.runsScored, // Error run doesn't count as RBI
          rbis: standard.runsScored.length,
          description: 'Runner from 1st scores on error',
        });
      }
    }

    if (result === '3B') {
      // Triple + error - batter scores
      const errorRuns = [...standard.runsScored, batterId];
      
      variations.push({
        afterState: BaserunnerState.empty(),
        runsScored: errorRuns,
        runsEarnedByHit: standard.runsScored, // Batter scoring on error doesn't count as RBI
        rbis: standard.runsScored.length,
        description: 'Batter scores on error',
      });
    }

    return variations;
  }

  private static calculateRunningErrorVariations(
    beforeState: BaserunnerState,
    standard: any,
    battingResult: BattingResult,
    batterId: string
  ): any[] {
    const variations: any[] = [];

    // Example: Runner thrown out attempting extra base
    if (battingResult.value === '1B' && beforeState.firstBase) {
      variations.push({
        afterState: new BaserunnerState(batterId, null, null),
        runsScored: standard.runsScored.filter((r: string) => r !== beforeState.firstBase),
        runsEarnedByHit: standard.runsScored.filter((r: string) => r !== beforeState.firstBase),
        rbis: standard.runsScored.filter((r: string) => r !== beforeState.firstBase).length,
        outs: 1,
        description: 'Runner thrown out at 3rd',
      });
    }

    return variations;
  }

  private static removeDuplicateOutcomes(outcomes: ValidOutcome[]): ValidOutcome[] {
    const unique: ValidOutcome[] = [];
    
    for (const outcome of outcomes) {
      if (!unique.some((existing) => existing.equals(outcome))) {
        unique.push(outcome);
      }
    }
    
    return unique;
  }
}