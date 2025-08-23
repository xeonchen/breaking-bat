export interface InningScore {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

/**
 * Scoreboard value object that encapsulates game scoring logic
 * Immutable representation of the game score state
 */
export class Scoreboard {
  public readonly homeScore: number;
  public readonly awayScore: number;
  public readonly inningScores: readonly InningScore[];

  constructor(
    homeScore: number = 0,
    awayScore: number = 0,
    inningScores: InningScore[] = []
  ) {
    if (homeScore < 0 || awayScore < 0) {
      throw new Error('Scores cannot be negative');
    }

    if (
      homeScore !== Math.floor(homeScore) ||
      awayScore !== Math.floor(awayScore)
    ) {
      throw new Error('Scores must be whole numbers');
    }

    // Validate inning scores consistency only if inning scores are provided
    if (inningScores.length > 0) {
      const totalHomeRuns = inningScores.reduce(
        (sum, inning) => sum + inning.homeRuns,
        0
      );
      const totalAwayRuns = inningScores.reduce(
        (sum, inning) => sum + inning.awayRuns,
        0
      );

      if (totalHomeRuns !== homeScore) {
        throw new Error(
          `Home score (${homeScore}) does not match sum of inning scores (${totalHomeRuns})`
        );
      }

      if (totalAwayRuns !== awayScore) {
        throw new Error(
          `Away score (${awayScore}) does not match sum of inning scores (${totalAwayRuns})`
        );
      }
    }

    this.homeScore = homeScore;
    this.awayScore = awayScore;
    this.inningScores = Object.freeze([...inningScores]);
  }

  /**
   * Create an empty scoreboard
   */
  public static empty(): Scoreboard {
    return new Scoreboard(0, 0, []);
  }

  /**
   * Add runs to home team score
   */
  public addHomeRuns(runs: number, inning: number): Scoreboard {
    if (runs < 0) {
      throw new Error('Cannot add negative runs');
    }

    if (inning < 1) {
      throw new Error('Inning must be positive');
    }

    const newInningScores = [...this.inningScores];
    const existingInningIndex = newInningScores.findIndex(
      (score) => score.inning === inning
    );

    if (existingInningIndex >= 0) {
      // Update existing inning
      newInningScores[existingInningIndex] = {
        ...newInningScores[existingInningIndex],
        homeRuns: newInningScores[existingInningIndex].homeRuns + runs,
      };
    } else {
      // Add new inning
      newInningScores.push({
        inning,
        homeRuns: runs,
        awayRuns: 0,
      });
    }

    // Sort innings by inning number
    newInningScores.sort((a, b) => a.inning - b.inning);

    return new Scoreboard(
      this.homeScore + runs,
      this.awayScore,
      newInningScores
    );
  }

  /**
   * Add runs to away team score
   */
  public addAwayRuns(runs: number, inning: number): Scoreboard {
    if (runs < 0) {
      throw new Error('Cannot add negative runs');
    }

    if (inning < 1) {
      throw new Error('Inning must be positive');
    }

    const newInningScores = [...this.inningScores];
    const existingInningIndex = newInningScores.findIndex(
      (score) => score.inning === inning
    );

    if (existingInningIndex >= 0) {
      // Update existing inning
      newInningScores[existingInningIndex] = {
        ...newInningScores[existingInningIndex],
        awayRuns: newInningScores[existingInningIndex].awayRuns + runs,
      };
    } else {
      // Add new inning
      newInningScores.push({
        inning,
        homeRuns: 0,
        awayRuns: runs,
      });
    }

    // Sort innings by inning number
    newInningScores.sort((a, b) => a.inning - b.inning);

    return new Scoreboard(
      this.homeScore,
      this.awayScore + runs,
      newInningScores
    );
  }

  /**
   * Get the run differential (absolute difference)
   */
  public getRunDifferential(): number {
    return Math.abs(this.homeScore - this.awayScore);
  }

  /**
   * Get the winning team
   */
  public getWinner(): 'home' | 'away' | 'tied' {
    if (this.homeScore > this.awayScore) return 'home';
    if (this.awayScore > this.homeScore) return 'away';
    return 'tied';
  }

  /**
   * Check if the mercy rule applies (run differential >= threshold)
   */
  public isMercyRule(threshold: number = 10): boolean {
    return this.getRunDifferential() >= threshold;
  }

  /**
   * Get the score for a specific inning
   */
  public getInningScore(inning: number): InningScore | null {
    return this.inningScores.find((score) => score.inning === inning) || null;
  }

  /**
   * Get the total number of innings played
   */
  public getInningsPlayed(): number {
    return this.inningScores.length;
  }

  /**
   * Get display text for the score
   */
  public getScoreDisplay(): string {
    return `${this.homeScore}-${this.awayScore}`;
  }

  /**
   * Get detailed score summary
   */
  public getSummary(): {
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away' | 'tied';
    runDifferential: number;
    inningsPlayed: number;
    isMercyRule: boolean;
  } {
    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      winner: this.getWinner(),
      runDifferential: this.getRunDifferential(),
      inningsPlayed: this.getInningsPlayed(),
      isMercyRule: this.isMercyRule(),
    };
  }

  /**
   * Convert to the legacy GameScore format (for backward compatibility)
   */
  public toGameScore(): {
    homeScore: number;
    awayScore: number;
    inningScores: InningScore[];
  } {
    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      inningScores: [...this.inningScores],
    };
  }

  /**
   * Create from legacy GameScore format
   */
  public static fromGameScore(gameScore: {
    homeScore: number;
    awayScore: number;
    inningScores: InningScore[];
  }): Scoreboard {
    return new Scoreboard(
      gameScore.homeScore,
      gameScore.awayScore,
      gameScore.inningScores
    );
  }

  /**
   * Check equality with another scoreboard
   */
  public equals(other: Scoreboard): boolean {
    if (
      this.homeScore !== other.homeScore ||
      this.awayScore !== other.awayScore
    ) {
      return false;
    }

    if (this.inningScores.length !== other.inningScores.length) {
      return false;
    }

    return this.inningScores.every((inning, index) => {
      const otherInning = other.inningScores[index];
      return (
        inning.inning === otherInning.inning &&
        inning.homeRuns === otherInning.homeRuns &&
        inning.awayRuns === otherInning.awayRuns
      );
    });
  }

  /**
   * Create a string representation for debugging
   */
  public toString(): string {
    const inningDetails = this.inningScores
      .map(
        (inning) =>
          `${inning.inning}:(H:${inning.homeRuns},A:${inning.awayRuns})`
      )
      .join(' ');

    return `Scoreboard(${this.homeScore}-${this.awayScore}) [${inningDetails}]`;
  }
}
