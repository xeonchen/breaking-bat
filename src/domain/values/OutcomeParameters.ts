/**
 * Parameters that modify standard advancement outcomes in softball
 * Each parameter enables additional valid possibilities when set to true
 */
export interface OutcomeParameters {
  /**
   * When true: Existing runners can advance extra bases beyond standard advancement
   * - Runners may take 3rd instead of 2nd, or score instead of advancing to 3rd
   * - Batter advancement still follows hit type (single→1st, double→2nd, etc.)
   * - Extra advancement by runners can result in RBIs
   * - Risk of being thrown out for aggressive advancement
   */
  runner_is_aggressive: boolean;

  /**
   * When true: Defensive mistakes allow extra advancement for batter and/or runners
   * - Batter and/or runners can advance beyond standard positions
   * - No RBIs awarded for runs scored due to fielding errors
   * - Cannot result in additional outs (errors help offense)
   */
  has_fielding_error: boolean;

  /**
   * When true: Offensive mistakes can result in additional outs or modified advancement
   * - Runners may be thrown out attempting advancement
   * - Can result in unusual advancement patterns
   * - May affect both runners and batter positioning
   */
  has_running_error: boolean;
}

/**
 * Factory for creating standard outcome parameters (all false)
 */
export class OutcomeParametersFactory {
  /**
   * Standard outcome - no aggressive running, no errors
   */
  static standard(): OutcomeParameters {
    return {
      runner_is_aggressive: false,
      has_fielding_error: false,
      has_running_error: false,
    };
  }

  /**
   * Aggressive running only
   */
  static aggressive(): OutcomeParameters {
    return {
      runner_is_aggressive: true,
      has_fielding_error: false,
      has_running_error: false,
    };
  }

  /**
   * Fielding error only
   */
  static fieldingError(): OutcomeParameters {
    return {
      runner_is_aggressive: false,
      has_fielding_error: true,
      has_running_error: false,
    };
  }

  /**
   * Running error only
   */
  static runningError(): OutcomeParameters {
    return {
      runner_is_aggressive: false,
      has_fielding_error: false,
      has_running_error: true,
    };
  }

  /**
   * Create custom parameter combination
   */
  static custom(
    runner_is_aggressive: boolean,
    has_fielding_error: boolean,
    has_running_error: boolean
  ): OutcomeParameters {
    return {
      runner_is_aggressive,
      has_fielding_error,
      has_running_error,
    };
  }

  /**
   * Get all possible parameter combinations (8 total: 2^3)
   */
  static getAllCombinations(): OutcomeParameters[] {
    const combinations: OutcomeParameters[] = [];
    
    for (let aggressive = 0; aggressive <= 1; aggressive++) {
      for (let fieldingError = 0; fieldingError <= 1; fieldingError++) {
        for (let runningError = 0; runningError <= 1; runningError++) {
          combinations.push({
            runner_is_aggressive: Boolean(aggressive),
            has_fielding_error: Boolean(fieldingError),
            has_running_error: Boolean(runningError),
          });
        }
      }
    }
    
    return combinations;
  }

  /**
   * Get a description of the parameter combination
   */
  static describe(params: OutcomeParameters): string {
    if (!params.runner_is_aggressive && !params.has_fielding_error && !params.has_running_error) {
      return 'Standard';
    }

    const parts: string[] = [];
    if (params.runner_is_aggressive) parts.push('Aggressive Running');
    if (params.has_fielding_error) parts.push('Fielding Error');
    if (params.has_running_error) parts.push('Running Error');

    return parts.join(' + ');
  }
}