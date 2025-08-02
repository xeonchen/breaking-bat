import { BaserunnerState } from './BaserunnerState';

/**
 * Likelihood of an outcome scenario
 */
export enum OutcomeLikelihood {
  STANDARD = 'standard', // Normal, expected outcome
  AGGRESSIVE = 'aggressive', // Requires aggressive baserunning
  ERROR = 'error', // Requires fielding error
}

/**
 * Represents a valid outcome for a specific baserunner state and hit type
 */
export class ValidOutcome {
  constructor(
    public readonly afterState: BaserunnerState,
    public readonly rbis: number,
    public readonly outs: number,
    public readonly runsScored: readonly string[],
    public readonly description: string,
    public readonly likelihood: OutcomeLikelihood = OutcomeLikelihood.STANDARD
  ) {
    if (rbis < 0) {
      throw new Error('RBIs cannot be negative');
    }
    if (outs < 0 || outs > 3) {
      throw new Error('Outs must be between 0 and 3');
    }
    if (rbis !== runsScored.length) {
      throw new Error('RBI count must match number of runs scored');
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
      description,
      OutcomeLikelihood.STANDARD
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
      description,
      OutcomeLikelihood.STANDARD
    );
  }

  /**
   * Creates an aggressive advancement outcome
   */
  public static aggressive(
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
      description,
      OutcomeLikelihood.AGGRESSIVE
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
      this.description === other.description &&
      this.likelihood === other.likelihood
    );
  }

  public toString(): string {
    const rbiText = this.rbis === 1 ? '1 RBI' : `${this.rbis} RBIs`;
    const outText =
      this.outs === 0 ? '' : `, ${this.outs} out${this.outs > 1 ? 's' : ''}`;
    return `${this.description} (${rbiText}${outText})`;
  }
}
