import { BaseEntity } from './BaseEntity';

export type HomeAway = 'home' | 'away';

/**
 * Inning domain entity representing an inning in a softball game
 */
export class Inning extends BaseEntity {
  public readonly gameId: string;
  public readonly number: number;
  public readonly teamAtBat: HomeAway;
  public readonly runsScored: number;
  public readonly atBatIds: string[];
  public readonly isComplete: boolean;

  constructor(
    id: string,
    gameId: string,
    number: number,
    teamAtBat: HomeAway,
    runsScored: number = 0,
    atBatIds: string[] = [],
    isComplete: boolean = false,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (number < 1 || number > 15) {
      throw new Error('Inning number must be between 1 and 15');
    }

    if (runsScored < 0) {
      throw new Error('Runs scored cannot be negative');
    }

    this.gameId = gameId;
    this.number = number;
    this.teamAtBat = teamAtBat;
    this.runsScored = runsScored;
    this.atBatIds = [...atBatIds];
    this.isComplete = isComplete;
  }

  /**
   * Add an at-bat to this inning
   */
  public addAtBat(atBatId: string, runsFromAtBat: number = 0): Inning {
    if (this.isComplete) {
      throw new Error('Cannot add at-bat to completed inning');
    }

    return new Inning(
      this.id,
      this.gameId,
      this.number,
      this.teamAtBat,
      this.runsScored + runsFromAtBat,
      [...this.atBatIds, atBatId],
      this.isComplete,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Mark the inning as complete
   */
  public complete(): Inning {
    return new Inning(
      this.id,
      this.gameId,
      this.number,
      this.teamAtBat,
      this.runsScored,
      this.atBatIds,
      true,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Get the number of at-bats in this inning
   */
  public getAtBatCount(): number {
    return this.atBatIds.length;
  }

  /**
   * Check if this is the top or bottom of the inning
   */
  public isTop(): boolean {
    return this.teamAtBat === 'away';
  }

  public isBottom(): boolean {
    return this.teamAtBat === 'home';
  }

  /**
   * Get display text for the inning
   */
  public getDisplayText(): string {
    const half = this.isTop() ? 'Top' : 'Bottom';
    const inningText =
      this.number === 1
        ? '1st'
        : this.number === 2
          ? '2nd'
          : this.number === 3
            ? '3rd'
            : `${this.number}th`;

    return `${half} ${inningText}`;
  }

  /**
   * Check if this is an extra inning (beyond 7th)
   */
  public isExtraInning(): boolean {
    return this.number > 7;
  }

  /**
   * Update runs scored (for corrections)
   */
  public updateRuns(newRunsScored: number): Inning {
    if (newRunsScored < 0) {
      throw new Error('Runs scored cannot be negative');
    }

    return new Inning(
      this.id,
      this.gameId,
      this.number,
      this.teamAtBat,
      newRunsScored,
      this.atBatIds,
      this.isComplete,
      this.createdAt,
      new Date()
    );
  }
}
