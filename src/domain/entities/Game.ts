import { BaseEntity } from './BaseEntity';
import { HomeAway } from './Inning';

export type GameStatus = 'setup' | 'in_progress' | 'completed' | 'suspended';

export interface GameScore {
  homeScore: number;
  awayScore: number;
  inningScores: InningScore[];
}

export interface InningScore {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

/**
 * Game domain entity representing a softball game
 */
export class Game extends BaseEntity {
  public readonly name: string;
  public readonly opponent: string;
  public readonly date: Date;
  public readonly seasonId: string;
  public readonly gameTypeId: string;
  public readonly homeAway: HomeAway;
  public readonly teamId: string;
  public readonly status: GameStatus;
  public readonly lineupId: string | null;
  public readonly inningIds: string[];
  public readonly finalScore: GameScore | null;

  constructor(
    id: string,
    name: string,
    opponent: string,
    date: Date,
    seasonId: string,
    gameTypeId: string,
    homeAway: HomeAway,
    teamId: string,
    status: GameStatus = 'setup',
    lineupId: string | null = null,
    inningIds: string[] = [],
    finalScore: GameScore | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    
    if (!name.trim()) {
      throw new Error('Game name cannot be empty');
    }

    if (!opponent.trim()) {
      throw new Error('Opponent name cannot be empty');
    }

    if (date > new Date()) {
      // Allow future games for scheduling
    }

    this.name = name.trim();
    this.opponent = opponent.trim();
    this.date = new Date(date);
    this.seasonId = seasonId;
    this.gameTypeId = gameTypeId;
    this.homeAway = homeAway;
    this.teamId = teamId;
    this.status = status;
    this.lineupId = lineupId;
    this.inningIds = [...inningIds];
    this.finalScore = finalScore;
  }

  /**
   * Start the game (requires lineup to be set)
   */
  public start(lineupId: string): Game {
    if (this.status !== 'setup') {
      throw new Error('Game can only be started from setup status');
    }

    return new Game(
      this.id,
      this.name,
      this.opponent,
      this.date,
      this.seasonId,
      this.gameTypeId,
      this.homeAway,
      this.teamId,
      'in_progress',
      lineupId,
      this.inningIds,
      this.finalScore,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Complete the game with final score
   */
  public complete(finalScore: GameScore): Game {
    if (this.status !== 'in_progress') {
      throw new Error('Game can only be completed from in_progress status');
    }

    return new Game(
      this.id,
      this.name,
      this.opponent,
      this.date,
      this.seasonId,
      this.gameTypeId,
      this.homeAway,
      this.teamId,
      'completed',
      this.lineupId,
      this.inningIds,
      finalScore,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Suspend the game
   */
  public suspend(): Game {
    if (this.status !== 'in_progress') {
      throw new Error('Only in-progress games can be suspended');
    }

    return new Game(
      this.id,
      this.name,
      this.opponent,
      this.date,
      this.seasonId,
      this.gameTypeId,
      this.homeAway,
      this.teamId,
      'suspended',
      this.lineupId,
      this.inningIds,
      this.finalScore,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Resume a suspended game
   */
  public resume(): Game {
    if (this.status !== 'suspended') {
      throw new Error('Only suspended games can be resumed');
    }

    return new Game(
      this.id,
      this.name,
      this.opponent,
      this.date,
      this.seasonId,
      this.gameTypeId,
      this.homeAway,
      this.teamId,
      'in_progress',
      this.lineupId,
      this.inningIds,
      this.finalScore,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Add an inning to the game
   */
  public addInning(inningId: string): Game {
    if (this.status !== 'in_progress') {
      throw new Error('Can only add innings to in-progress games');
    }

    return new Game(
      this.id,
      this.name,
      this.opponent,
      this.date,
      this.seasonId,
      this.gameTypeId,
      this.homeAway,
      this.teamId,
      this.status,
      this.lineupId,
      [...this.inningIds, inningId],
      this.finalScore,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Check if the game is finished
   */
  public isFinished(): boolean {
    return this.status === 'completed';
  }

  /**
   * Check if the game is in progress
   */
  public isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  /**
   * Check if the game needs a lineup
   */
  public needsLineup(): boolean {
    return this.status === 'setup' && !this.lineupId;
  }

  /**
   * Get the current inning count
   */
  public getInningCount(): number {
    return this.inningIds.length;
  }

  /**
   * Check if this is a home game
   */
  public isHomeGame(): boolean {
    return this.homeAway === 'home';
  }

  /**
   * Check if this is an away game
   */
  public isAwayGame(): boolean {
    return this.homeAway === 'away';
  }

  /**
   * Get display text for home/away
   */
  public getVenueText(): string {
    return this.homeAway === 'home' ? 'vs' : '@';
  }

  /**
   * Get game summary for display
   */
  public getSummary(): string {
    const venueText = this.getVenueText();
    const dateText = this.date.toLocaleDateString();
    
    if (this.finalScore) {
      const { homeScore, awayScore } = this.finalScore;
      const ourScore = this.homeAway === 'home' ? homeScore : awayScore;
      const theirScore = this.homeAway === 'home' ? awayScore : homeScore;
      const result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'T';
      
      return `${result} ${ourScore}-${theirScore} ${venueText} ${this.opponent} (${dateText})`;
    }
    
    return `${venueText} ${this.opponent} (${dateText}) - ${this.status}`;
  }
}