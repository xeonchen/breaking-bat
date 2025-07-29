/**
 * Value object representing the state of baserunners
 */
export class BaserunnerState {
  public readonly firstBase: string | null;
  public readonly secondBase: string | null;
  public readonly thirdBase: string | null;

  constructor(
    firstBase: string | null = null,
    secondBase: string | null = null,
    thirdBase: string | null = null
  ) {
    this.firstBase = firstBase;
    this.secondBase = secondBase;
    this.thirdBase = thirdBase;
  }

  /**
   * Create an empty baserunner state (no runners on base)
   */
  public static empty(): BaserunnerState {
    return new BaserunnerState();
  }

  /**
   * Check if bases are empty
   */
  public isEmpty(): boolean {
    return !this.firstBase && !this.secondBase && !this.thirdBase;
  }

  /**
   * Check if bases are loaded (runners on all bases)
   */
  public isLoaded(): boolean {
    return !!this.firstBase && !!this.secondBase && !!this.thirdBase;
  }

  /**
   * Get all runners currently on base
   */
  public getRunners(): string[] {
    const runners: string[] = [];
    if (this.firstBase) runners.push(this.firstBase);
    if (this.secondBase) runners.push(this.secondBase);
    if (this.thirdBase) runners.push(this.thirdBase);
    return runners;
  }

  /**
   * Get the number of runners on base
   */
  public runnerCount(): number {
    return this.getRunners().length;
  }

  /**
   * Check if a specific runner is on base
   */
  public hasRunner(playerId: string): boolean {
    return this.firstBase === playerId || 
           this.secondBase === playerId || 
           this.thirdBase === playerId;
  }

  /**
   * Get the base position of a specific runner
   */
  public getRunnerBase(playerId: string): 'first' | 'second' | 'third' | null {
    if (this.firstBase === playerId) return 'first';
    if (this.secondBase === playerId) return 'second';
    if (this.thirdBase === playerId) return 'third';
    return null;
  }

  /**
   * Add a runner to first base
   */
  public addRunnerToFirst(playerId: string): BaserunnerState {
    return new BaserunnerState(playerId, this.secondBase, this.thirdBase);
  }

  /**
   * Move all runners one base forward
   */
  public advanceAll(): { newState: BaserunnerState; runsScored: string[] } {
    const runsScored: string[] = [];
    
    // Runner on third scores
    if (this.thirdBase) {
      runsScored.push(this.thirdBase);
    }

    return {
      newState: new BaserunnerState(
        null,           // First base empty after advancement
        this.firstBase, // Runner from first to second
        this.secondBase // Runner from second to third
      ),
      runsScored
    };
  }

  /**
   * Move runners based on forced advancement
   */
  public advanceForced(): { newState: BaserunnerState; runsScored: string[] } {
    const runsScored: string[] = [];
    let newFirst = this.firstBase;
    let newSecond = this.secondBase;
    let newThird = this.thirdBase;

    // If there's a runner on first, they must advance
    if (this.firstBase) {
      if (this.secondBase) {
        // Runner on second must advance to third
        if (this.thirdBase) {
          // Runner on third scores
          runsScored.push(this.thirdBase);
        }
        newThird = this.secondBase;
      }
      newSecond = this.firstBase;
      newFirst = null; // First base will be occupied by new batter
    }

    return {
      newState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored
    };
  }

  /**
   * Apply custom runner advancement
   */
  public withAdvancement(
    firstToSecond: boolean = false,
    secondToThird: boolean = false,
    thirdToHome: boolean = false
  ): { newState: BaserunnerState; runsScored: string[] } {
    const runsScored: string[] = [];
    let newFirst = this.firstBase;
    let newSecond = this.secondBase;
    let newThird = this.thirdBase;

    // Apply third to home advancement
    if (thirdToHome && this.thirdBase) {
      runsScored.push(this.thirdBase);
      newThird = null;
    }

    // Apply second to third advancement  
    if (secondToThird && this.secondBase) {
      if (!thirdToHome && this.thirdBase) {
        throw new Error('Cannot advance runner to occupied third base');
      }
      newThird = this.secondBase;
      newSecond = null;
    }

    // Apply first to second advancement
    if (firstToSecond && this.firstBase) {
      if (!secondToThird && this.secondBase) {
        throw new Error('Cannot advance runner to occupied second base');
      }
      newSecond = this.firstBase;
      newFirst = null;
    }

    return {
      newState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored
    };
  }

  public equals(other: BaserunnerState): boolean {
    return this.firstBase === other.firstBase &&
           this.secondBase === other.secondBase &&
           this.thirdBase === other.thirdBase;
  }

  public toString(): string {
    const bases = [];
    if (this.firstBase) bases.push(`1B: ${this.firstBase}`);
    if (this.secondBase) bases.push(`2B: ${this.secondBase}`);
    if (this.thirdBase) bases.push(`3B: ${this.thirdBase}`);
    return bases.length > 0 ? bases.join(', ') : 'Bases empty';
  }
}