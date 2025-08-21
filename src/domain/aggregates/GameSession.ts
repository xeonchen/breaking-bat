import { Game, GameStatus } from '../entities/Game';
import type { BaserunnerState } from '../../presentation/types/BaserunnerState';

export interface CurrentBatter {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  battingOrder: number;
}

export interface SessionCount {
  balls: number;
  strikes: number;
}

export interface SessionState {
  currentInning: number;
  isTopInning: boolean;
  currentOuts: number;
  baserunners: BaserunnerState;
  currentCount: SessionCount;
  currentBatter: CurrentBatter | null;
  totalRunsScored: number;
  pitchSequence: string[];
}

/**
 * GameSession aggregate root that manages live game state
 * Separates mutable session state from immutable Game entity
 */
export class GameSession {
  private _game: Game;
  private _sessionState: SessionState;
  private _lineup: CurrentBatter[];

  constructor(
    game: Game,
    lineup: CurrentBatter[] = [],
    initialState?: Partial<SessionState>
  ) {
    if (game.status !== 'in_progress' && game.status !== 'setup') {
      throw new Error(
        'GameSession can only be created for setup or in-progress games'
      );
    }

    this._game = game;
    this._lineup = [...lineup];
    this._sessionState = {
      currentInning: 1,
      isTopInning: true,
      currentOuts: 0,
      baserunners: {
        first: null,
        second: null,
        third: null,
      },
      currentCount: { balls: 0, strikes: 0 },
      currentBatter: lineup.length > 0 ? lineup[0] : null,
      totalRunsScored: 0,
      pitchSequence: [],
      ...initialState,
    };
  }

  // ========== Game Properties (Delegated to Game Entity) ==========

  public get gameId(): string {
    return this._game.id;
  }

  public get game(): Game {
    return this._game;
  }

  public get opponent(): string {
    return this._game.opponent;
  }

  public get date(): Date {
    return this._game.date;
  }

  public get status(): GameStatus {
    return this._game.status;
  }

  public get finalScore() {
    return this._game.finalScore;
  }

  public isHomeGame(): boolean {
    return this._game.isHomeGame();
  }

  public isAwayGame(): boolean {
    return this._game.isAwayGame();
  }

  public getVenueText(): string {
    return this._game.getVenueText();
  }

  public getSummary(): string {
    return this._game.getSummary();
  }

  // ========== Session State Properties ==========

  public get currentInning(): number {
    return this._sessionState.currentInning;
  }

  public get isTopInning(): boolean {
    return this._sessionState.isTopInning;
  }

  public get currentOuts(): number {
    return this._sessionState.currentOuts;
  }

  public get baserunners(): BaserunnerState {
    return this._sessionState.baserunners;
  }

  public get currentCount(): SessionCount {
    return this._sessionState.currentCount;
  }

  public get currentBatter(): CurrentBatter | null {
    return this._sessionState.currentBatter;
  }

  public get totalRunsScored(): number {
    return this._sessionState.totalRunsScored;
  }

  public get pitchSequence(): string[] {
    return [...this._sessionState.pitchSequence];
  }

  public get lineup(): CurrentBatter[] {
    return [...this._lineup];
  }

  // ========== Session State Mutations ==========

  /**
   * Start the game session
   */
  public startGame(): void {
    if (this._game.status !== 'setup') {
      throw new Error('Game can only be started from setup status');
    }

    // Update the underlying game to in_progress status
    this._game = this._game.start(this._game.lineupId || 'default-lineup');

    // Initialize session state
    this._sessionState = {
      ...this._sessionState,
      currentInning: 1,
      isTopInning: true,
      currentOuts: 0,
      baserunners: { first: null, second: null, third: null },
      currentCount: { balls: 0, strikes: 0 },
      currentBatter: this._lineup.length > 0 ? this._lineup[0] : null,
      totalRunsScored: 0,
      pitchSequence: [],
    };
  }

  /**
   * Complete the game session
   */
  public completeGame(): void {
    if (this._game.status !== 'in_progress') {
      throw new Error('Game can only be completed from in_progress status');
    }

    if (!this._game.finalScore) {
      throw new Error('Cannot complete game without final score');
    }

    this._game = this._game.complete(this._game.finalScore);
  }

  /**
   * Suspend the game session
   */
  public suspendGame(): void {
    if (this._game.status !== 'in_progress') {
      throw new Error('Only in-progress games can be suspended');
    }

    this._game = this._game.suspend();
  }

  /**
   * Resume a suspended game session
   */
  public resumeGame(): void {
    if (this._game.status !== 'suspended') {
      throw new Error('Only suspended games can be resumed');
    }

    this._game = this._game.resume();
  }

  /**
   * Update the current count
   */
  public updateCount(newCount: SessionCount): void {
    this._sessionState.currentCount = { ...newCount };
  }

  /**
   * Add a pitch to the sequence
   */
  public addPitch(pitch: string): void {
    this._sessionState.pitchSequence.push(pitch);
  }

  /**
   * Clear the pitch sequence (typically after an at-bat)
   */
  public clearPitchSequence(): void {
    this._sessionState.pitchSequence = [];
  }

  /**
   * Update baserunner positions
   */
  public updateBaserunners(baserunners: BaserunnerState): void {
    this._sessionState.baserunners = { ...baserunners };
  }

  /**
   * Add runs to the session total
   */
  public addRuns(runs: number): void {
    if (runs < 0) {
      throw new Error('Cannot add negative runs');
    }
    this._sessionState.totalRunsScored += runs;
  }

  /**
   * Add outs and check if inning should advance
   */
  public addOuts(outs: number): boolean {
    if (outs < 0) {
      throw new Error('Cannot add negative outs');
    }

    this._sessionState.currentOuts += outs;
    return this._sessionState.currentOuts >= 3;
  }

  /**
   * Advance to the next inning
   */
  public advanceInning(): void {
    // Determine new inning values
    const newInning = this._sessionState.isTopInning
      ? this._sessionState.currentInning
      : this._sessionState.currentInning + 1;
    const newIsTopInning = !this._sessionState.isTopInning;

    this._sessionState.currentInning = newInning;
    this._sessionState.isTopInning = newIsTopInning;
    this._sessionState.currentOuts = 0;
    this._sessionState.baserunners = { first: null, second: null, third: null };
    this._sessionState.currentCount = { balls: 0, strikes: 0 };
    this._sessionState.pitchSequence = [];

    // Reset to first batter
    if (this._lineup.length > 0) {
      this._sessionState.currentBatter = this._lineup[0];
    }
  }

  /**
   * Advance to the next batter in the lineup
   */
  public advanceToNextBatter(): void {
    if (!this._sessionState.currentBatter || this._lineup.length === 0) {
      return;
    }

    const currentIndex = this._lineup.findIndex(
      (batter) => batter.playerId === this._sessionState.currentBatter?.playerId
    );

    if (currentIndex === -1) {
      this._sessionState.currentBatter = this._lineup[0];
      return;
    }

    const nextIndex = (currentIndex + 1) % this._lineup.length;
    this._sessionState.currentBatter = this._lineup[nextIndex];

    // Reset count and pitch sequence for new batter
    this._sessionState.currentCount = { balls: 0, strikes: 0 };
    this._sessionState.pitchSequence = [];
  }

  /**
   * Set the current batter (useful for substitutions)
   */
  public setCurrentBatter(batter: CurrentBatter): void {
    this._sessionState.currentBatter = { ...batter };
  }

  /**
   * Update the lineup (useful for substitutions)
   */
  public updateLineup(newLineup: CurrentBatter[]): void {
    this._lineup = [...newLineup];

    // Ensure current batter is still valid
    if (this._sessionState.currentBatter) {
      const isCurrentBatterInLineup = newLineup.some(
        (batter) =>
          batter.playerId === this._sessionState.currentBatter?.playerId
      );

      if (!isCurrentBatterInLineup && newLineup.length > 0) {
        this._sessionState.currentBatter = newLineup[0];
      }
    }
  }

  /**
   * Check if the count represents a walk
   */
  public isWalk(): boolean {
    return this._sessionState.currentCount.balls >= 4;
  }

  /**
   * Check if the count represents a strikeout
   */
  public isStrikeout(): boolean {
    return this._sessionState.currentCount.strikes >= 3;
  }

  /**
   * Check if the count is full (3-2)
   */
  public isFullCount(): boolean {
    return (
      this._sessionState.currentCount.balls === 3 &&
      this._sessionState.currentCount.strikes === 2
    );
  }

  /**
   * Get a snapshot of the current session state
   */
  public getSessionSnapshot(): SessionState {
    return {
      currentInning: this._sessionState.currentInning,
      isTopInning: this._sessionState.isTopInning,
      currentOuts: this._sessionState.currentOuts,
      baserunners: { ...this._sessionState.baserunners },
      currentCount: { ...this._sessionState.currentCount },
      currentBatter: this._sessionState.currentBatter
        ? { ...this._sessionState.currentBatter }
        : null,
      totalRunsScored: this._sessionState.totalRunsScored,
      pitchSequence: [...this._sessionState.pitchSequence],
    };
  }

  /**
   * Restore session state from a snapshot
   */
  public restoreFromSnapshot(snapshot: SessionState): void {
    this._sessionState = {
      ...snapshot,
      baserunners: { ...snapshot.baserunners },
      currentCount: { ...snapshot.currentCount },
      currentBatter: snapshot.currentBatter
        ? { ...snapshot.currentBatter }
        : null,
      pitchSequence: [...snapshot.pitchSequence],
    };
  }

  /**
   * Update the underlying game (for score updates, etc.)
   */
  public updateGame(updatedGame: Game): void {
    if (updatedGame.id !== this._game.id) {
      throw new Error('Cannot update game with different ID');
    }
    this._game = updatedGame;
  }
}
