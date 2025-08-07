import { BaserunnerState } from './BaserunnerState';
import { OutcomeParameters } from './OutcomeParameters';

/**
 * Represents a valid outcome for a specific baserunner state and hit type
 */
export class ValidOutcome {
  constructor(
    public readonly afterState: BaserunnerState,
    public readonly rbis: number,
    public readonly outs: number,
    public readonly runsScored: readonly string[],
    public readonly runsEarnedByHit: readonly string[],
    public readonly description: string,
    public readonly requiredParameters: OutcomeParameters
  ) {
    if (rbis < 0) {
      throw new Error('RBIs cannot be negative');
    }
    if (outs < 0 || outs > 3) {
      throw new Error('Outs must be between 0 and 3');
    }
    if (rbis > runsEarnedByHit.length) {
      throw new Error('RBI count cannot exceed runs earned by hit');
    }
    if (runsEarnedByHit.length > runsScored.length) {
      throw new Error('Runs earned by hit cannot exceed total runs scored');
    }
  }

  /**
   * Creates a standard outcome with no outs
   */
  public static standard(
    afterState: BaserunnerState,
    rbis: number,
    runsScored: readonly string[],
    description: string
  ): ValidOutcome {
    return new ValidOutcome(
      afterState,
      rbis,
      0,
      runsScored,
      runsScored, // All runs earned by hit in standard case
      description,
      {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: false,
      }
    );
  }

  /**
   * Creates an outcome that results in outs
   */
  public static withOuts(
    afterState: BaserunnerState,
    rbis: number,
    outs: number,
    runsScored: readonly string[],
    description: string
  ): ValidOutcome {
    return new ValidOutcome(
      afterState,
      rbis,
      outs,
      runsScored,
      runsScored, // All runs earned by hit in standard case
      description,
      {
        runner_is_aggressive: false,
        has_fielding_error: false,
        has_running_error: false,
      }
    );
  }

  /**
   * Creates an outcome that requires specific parameters
   */
  public static withParameters(
    afterState: BaserunnerState,
    rbis: number,
    outs: number,
    runsScored: readonly string[],
    runsEarnedByHit: readonly string[],
    description: string,
    requiredParameters: OutcomeParameters
  ): ValidOutcome {
    return new ValidOutcome(
      afterState,
      rbis,
      outs,
      runsScored,
      runsEarnedByHit,
      description,
      requiredParameters
    );
  }

  public equals(other: ValidOutcome): boolean {
    return (
      this.afterState.equals(other.afterState) &&
      this.rbis === other.rbis &&
      this.outs === other.outs &&
      this.runsScored.length === other.runsScored.length &&
      this.runsScored.every(
        (runner, index) => runner === other.runsScored[index]
      ) &&
      this.runsEarnedByHit.length === other.runsEarnedByHit.length &&
      this.runsEarnedByHit.every(
        (runner, index) => runner === other.runsEarnedByHit[index]
      ) &&
      this.description === other.description &&
      this.requiredParameters.runner_is_aggressive ===
        other.requiredParameters.runner_is_aggressive &&
      this.requiredParameters.has_fielding_error ===
        other.requiredParameters.has_fielding_error &&
      this.requiredParameters.has_running_error ===
        other.requiredParameters.has_running_error
    );
  }

  public toString(): string {
    const rbiText = this.rbis === 1 ? '1 RBI' : `${this.rbis} RBIs`;
    const outText =
      this.outs === 0 ? '' : `, ${this.outs} out${this.outs > 1 ? 's' : ''}`;

    const parameterParts: string[] = [];
    if (this.requiredParameters.runner_is_aggressive)
      parameterParts.push('Aggressive');
    if (this.requiredParameters.has_fielding_error)
      parameterParts.push('Error');
    if (this.requiredParameters.has_running_error)
      parameterParts.push('Running Error');

    const parameterText =
      parameterParts.length > 0 ? ` [${parameterParts.join(', ')}]` : '';

    return `${this.description} (${rbiText}${outText})${parameterText}`;
  }

  /**
   * Checks if this outcome is valid given the provided parameters
   */
  public isValidWithParameters(providedParameters: OutcomeParameters): boolean {
    // All required parameters must be enabled in the provided parameters
    if (
      this.requiredParameters.runner_is_aggressive &&
      !providedParameters.runner_is_aggressive
    ) {
      return false;
    }
    if (
      this.requiredParameters.has_fielding_error &&
      !providedParameters.has_fielding_error
    ) {
      return false;
    }
    if (
      this.requiredParameters.has_running_error &&
      !providedParameters.has_running_error
    ) {
      return false;
    }

    return true;
  }
}
