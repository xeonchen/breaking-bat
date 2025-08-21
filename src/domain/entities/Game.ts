import { BaseEntity } from './BaseEntity';
import { HomeAway } from './Inning';
import { Scoreboard } from '../values/Scoreboard';

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
 * Immutable entity focused solely on game metadata and state transitions
 * Live game state is managed by the GameSession aggregate
 */
export class Game extends BaseEntity {
  public readonly name: string;
  public readonly opponent: string;
  public readonly date: Date;
  public readonly seasonId: string | null;
  public readonly gameTypeId: string | null;
  public readonly homeAway: HomeAway;
  public readonly teamId: string;
  public readonly status: GameStatus;
  public readonly lineupId: string | null;
  public readonly inningIds: string[];
  public readonly scoreboard: Scoreboard | null;

  constructor(
    id: string,
    name: string,
    opponent: string,
    date: Date,
    seasonId: string | null,
    gameTypeId: string | null,
    homeAway: HomeAway,
    teamId: string,
    status: GameStatus = 'setup',
    lineupId: string | null = null,
    inningIds: string[] = [],
    scoreboard: Scoreboard | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    // Validation
    if (!name.trim()) {
      throw new Error('Game name cannot be empty');
    }

    if (!opponent.trim()) {
      throw new Error('Opponent name cannot be empty');
    }

    if (!teamId.trim()) {
      throw new Error('Team ID cannot be empty');
    }

    // Business rule validations
    if (status === 'in_progress' && !lineupId) {
      throw new Error('In-progress games must have a lineup');
    }

    if (status === 'completed' && !scoreboard) {
      throw new Error('Completed games must have a final score');
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
    this.scoreboard = scoreboard;
  }

  /**
   * Start the game (requires lineup to be set)
   */
  public start(lineupId: string): Game {
    if (this.status !== 'setup') {
      throw new Error('Game can only be started from setup status');
    }

    if (!lineupId.trim()) {
      throw new Error('Lineup ID is required to start game');
    }

    // Initialize empty scoreboard when starting the game
    const initialScoreboard = this.scoreboard || Scoreboard.empty();

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
      initialScoreboard,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Complete the game with final scoreboard
   */
  public complete(finalScoreboard: Scoreboard): Game {
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
      finalScoreboard,
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
      this.scoreboard,
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
      this.scoreboard,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update the game scoreboard
   */
  public updateScoreboard(newScoreboard: Scoreboard): Game {
    if (this.status !== 'in_progress') {
      throw new Error('Can only update scoreboard for in-progress games');
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
      this.inningIds,
      newScoreboard,
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

    if (!inningId.trim()) {
      throw new Error('Inning ID cannot be empty');
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
      this.scoreboard,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Set the lineup for this game
   */
  public setLineup(lineupId: string): Game {
    if (this.status !== 'setup') {
      throw new Error('Lineup can only be set for games in setup status');
    }

    if (!lineupId.trim()) {
      throw new Error('Lineup ID cannot be empty');
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
      lineupId,
      this.inningIds,
      this.scoreboard,
      this.createdAt,
      new Date()
    );
  }

  // ========== Query Methods ==========

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
   * Check if the game is suspended
   */
  public isSuspended(): boolean {
    return this.status === 'suspended';
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

    if (this.scoreboard) {
      const { homeScore, awayScore } = this.scoreboard;
      const ourScore = this.homeAway === 'home' ? homeScore : awayScore;
      const theirScore = this.homeAway === 'home' ? awayScore : homeScore;
      const result =
        ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'T';

      return `${result} ${ourScore}-${theirScore} ${venueText} ${this.opponent} (${dateText})`;
    }

    return `${venueText} ${this.opponent} (${dateText}) - ${this.status}`;
  }

  /**
   * Get current score display
   */
  public getScoreDisplay(): string {
    return this.scoreboard ? this.scoreboard.getScoreDisplay() : '0-0';
  }

  /**
   * Check if mercy rule applies
   */
  public isMercyRule(): boolean {
    return this.scoreboard ? this.scoreboard.isMercyRule() : false;
  }

  /**
   * Get the winning team
   */
  public getWinner(): 'home' | 'away' | 'tied' | null {
    if (!this.scoreboard || !this.isFinished()) {
      return null;
    }
    return this.scoreboard.getWinner();
  }

  /**
   * Convert to legacy Game format for backward compatibility
   */
  public toLegacyFormat(): {
    id: string;
    name: string;
    opponent: string;
    date: Date;
    seasonId: string | null;
    gameTypeId: string | null;
    homeAway: HomeAway;
    teamId: string;
    status: GameStatus;
    lineupId: string | null;
    inningIds: string[];
    finalScore: {
      homeScore: number;
      awayScore: number;
      inningScores: Array<{
        inning: number;
        homeRuns: number;
        awayRuns: number;
      }>;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;
  } {
    return {
      id: this.id,
      name: this.name,
      opponent: this.opponent,
      date: this.date,
      seasonId: this.seasonId,
      gameTypeId: this.gameTypeId,
      homeAway: this.homeAway,
      teamId: this.teamId,
      status: this.status,
      lineupId: this.lineupId,
      inningIds: [...this.inningIds],
      finalScore: this.scoreboard ? this.scoreboard.toGameScore() : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create from legacy Game format
   */
  public static fromLegacy(legacyGame: {
    id: string;
    name: string;
    opponent: string;
    date: Date;
    seasonId: string | null;
    gameTypeId: string | null;
    homeAway: HomeAway;
    teamId: string;
    status: GameStatus;
    lineupId: string | null;
    inningIds: string[];
    finalScore: {
      homeScore: number;
      awayScore: number;
      inningScores: Array<{
        inning: number;
        homeRuns: number;
        awayRuns: number;
      }>;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Game {
    const scoreboard = legacyGame.finalScore
      ? Scoreboard.fromGameScore(legacyGame.finalScore)
      : null;

    return new Game(
      legacyGame.id,
      legacyGame.name,
      legacyGame.opponent,
      legacyGame.date,
      legacyGame.seasonId,
      legacyGame.gameTypeId,
      legacyGame.homeAway,
      legacyGame.teamId,
      legacyGame.status,
      legacyGame.lineupId,
      legacyGame.inningIds,
      scoreboard,
      legacyGame.createdAt,
      legacyGame.updatedAt
    );
  }

  // ========== Game Session Methods (for compatibility) ==========

  /**
   * Advance to next batter in lineup (for compatibility with gameStore)
   */
  public advanceToNextBatter(
    _lineup: Array<{ playerId: string; playerName: string }>
  ): void {
    // This method exists for backward compatibility
    // The actual game session logic should be handled by GameSession aggregate
    // This is a temporary implementation during the transition
    console.warn(
      'advanceToNextBatter called on Game entity - this should be handled by GameSession'
    );
  }

  /**
   * Get current batter (for compatibility with gameStore)
   */
  public getCurrentBatter(): { playerId: string; playerName: string } | null {
    // This method exists for backward compatibility
    // The actual game session logic should be handled by GameSession aggregate
    // This is a temporary implementation during the transition
    console.warn(
      'getCurrentBatter called on Game entity - this should be handled by GameSession'
    );
    return null;
  }
}
