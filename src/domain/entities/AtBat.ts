import { BaseEntity } from './BaseEntity';
import { BattingResult, BaserunnerState } from '../values';

/**
 * AtBat domain entity representing a single at-bat in a softball game
 */
export class AtBat extends BaseEntity {
  public readonly gameId: string;
  public readonly inningId: string;
  public readonly batterId: string;
  public readonly battingPosition: number;
  public readonly result: BattingResult;
  public readonly description: string;
  public readonly rbis: number;
  public readonly runsScored: string[]; // player IDs who scored
  public readonly runningErrors: string[]; // player IDs who made running errors
  public readonly baserunnersBefore: BaserunnerState;
  public readonly baserunnersAfter: BaserunnerState;

  constructor(
    id: string,
    gameId: string,
    inningId: string,
    batterId: string,
    battingPosition: number,
    result: BattingResult,
    description: string,
    rbis: number,
    runsScored: string[],
    runningErrors: string[],
    baserunnersBefore: BaserunnerState,
    baserunnersAfter: BaserunnerState,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (battingPosition < 1 || battingPosition > 15) {
      throw new Error('Batting position must be between 1 and 15');
    }

    if (rbis < 0 || rbis > 4) {
      throw new Error('RBIs must be between 0 and 4');
    }

    // Validate that RBIs don't exceed runs scored
    if (rbis > runsScored.length + (result.value === 'HR' ? 1 : 0)) {
      throw new Error('RBIs cannot exceed runs scored');
    }

    this.gameId = gameId;
    this.inningId = inningId;
    this.batterId = batterId;
    this.battingPosition = battingPosition;
    this.result = result;
    this.description = description;
    this.rbis = rbis;
    this.runsScored = [...runsScored];
    this.runningErrors = [...runningErrors];
    this.baserunnersBefore = baserunnersBefore;
    this.baserunnersAfter = baserunnersAfter;
  }

  /**
   * Check if this at-bat resulted in a hit
   */
  public isHit(): boolean {
    return this.result.isHit();
  }

  /**
   * Check if this at-bat resulted in an out
   */
  public isOut(): boolean {
    return this.result.isOut();
  }

  /**
   * Check if the batter reached base
   */
  public batterReachedBase(): boolean {
    return this.result.reachesBase();
  }

  /**
   * Get the number of outs this at-bat produced
   */
  public getOuts(): number {
    switch (this.result.value) {
      case 'DP':
        return 2; // Double play
      case 'SO':
      case 'GO':
      case 'AO':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Check if this at-bat advanced any runners
   */
  public advancedRunners(): boolean {
    return (
      !this.baserunnersBefore.equals(this.baserunnersAfter) ||
      this.runsScored.length > 0
    );
  }

  /**
   * Get the total bases achieved by this at-bat
   */
  public getTotalBases(): number {
    return this.result.basesAdvanced();
  }

  /**
   * Check if this was a sacrifice (doesn't count as at-bat for average)
   */
  public isSacrifice(): boolean {
    return this.result.value === 'SF';
  }

  /**
   * Check if this at-bat involved running errors
   */
  public hasRunningErrors(): boolean {
    return this.runningErrors.length > 0;
  }

  /**
   * Get the count of running errors in this at-bat
   */
  public getRunningErrorCount(): number {
    return this.runningErrors.length;
  }

  /**
   * Update the at-bat result (for corrections)
   */
  public updateResult(
    newResult: BattingResult,
    newDescription: string,
    newRbis: number,
    newRunsScored: string[],
    newRunningErrors: string[],
    newBaserunnersAfter: BaserunnerState
  ): AtBat {
    return new AtBat(
      this.id,
      this.gameId,
      this.inningId,
      this.batterId,
      this.battingPosition,
      newResult,
      newDescription,
      newRbis,
      newRunsScored,
      newRunningErrors,
      this.baserunnersBefore,
      newBaserunnersAfter,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Get a summary of this at-bat for display
   */
  public getSummary(): string {
    const runsScoredText =
      this.runsScored.length > 0
        ? ` (${this.runsScored.length} run${this.runsScored.length > 1 ? 's' : ''} scored)`
        : '';

    const rbisText =
      this.rbis > 0 ? ` ${this.rbis} RBI${this.rbis > 1 ? 's' : ''}` : '';

    const runningErrorText =
      this.runningErrors.length > 0
        ? ` [${this.runningErrors.length} running error${this.runningErrors.length > 1 ? 's' : ''}]`
        : '';

    return `${this.result.value}${rbisText}${runsScoredText}${runningErrorText}`;
  }
}
