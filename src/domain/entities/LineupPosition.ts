/**
 * LineupPosition represents a player's position in the batting order and defensive assignment
 */
export class LineupPosition {
  public readonly battingOrder: number;
  public readonly playerId: string;
  public readonly defensivePosition: string;
  public readonly isStarting: boolean;

  constructor(
    battingOrder: number,
    playerId: string,
    defensivePosition: string,
    isStarting: boolean = true
  ) {
    if (battingOrder < 1 || battingOrder > 15) {
      throw new Error('Batting order must be between 1 and 15');
    }

    if (!playerId.trim()) {
      throw new Error('Player ID cannot be empty');
    }

    if (!defensivePosition.trim()) {
      throw new Error('Defensive position cannot be empty');
    }

    this.battingOrder = battingOrder;
    this.playerId = playerId.trim();
    this.defensivePosition = defensivePosition.trim();
    this.isStarting = isStarting;
  }

  /**
   * Create a copy with updated defensive position
   */
  public withDefensivePosition(position: string): LineupPosition {
    return new LineupPosition(
      this.battingOrder,
      this.playerId,
      position,
      this.isStarting
    );
  }

  /**
   * Create a copy with updated batting order
   */
  public withBattingOrder(order: number): LineupPosition {
    return new LineupPosition(
      order,
      this.playerId,
      this.defensivePosition,
      this.isStarting
    );
  }

  /**
   * Create a copy with updated starting status
   */
  public withStartingStatus(starting: boolean): LineupPosition {
    return new LineupPosition(
      this.battingOrder,
      this.playerId,
      this.defensivePosition,
      starting
    );
  }

  /**
   * Check if this is an essential position (pitcher or catcher)
   */
  public isEssentialPosition(): boolean {
    return (
      this.defensivePosition === 'Pitcher' ||
      this.defensivePosition === 'Catcher'
    );
  }

  /**
   * Get display text for this position
   */
  public getDisplayText(): string {
    return `${this.battingOrder}. ${this.defensivePosition}`;
  }
}
