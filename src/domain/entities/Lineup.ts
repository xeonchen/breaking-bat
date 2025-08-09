import { BaseEntity } from './BaseEntity';
import { LineupPosition } from './LineupPosition';

/**
 * Lineup domain entity representing a game's starting lineup and substitutes
 */
export class Lineup extends BaseEntity {
  public readonly gameId: string;
  public readonly battingOrder: LineupPosition[];
  public readonly substitutes: string[]; // Player IDs

  constructor(
    id: string,
    gameId: string,
    battingOrder: LineupPosition[],
    substitutes: string[] = [],
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!gameId.trim()) {
      throw new Error('Game ID cannot be empty');
    }

    if (!Array.isArray(battingOrder)) {
      throw new Error('Batting order must be an array');
    }

    this.gameId = gameId.trim();
    this.battingOrder = [...(battingOrder || [])];
    this.substitutes = [...(substitutes || [])];
  }

  /**
   * Get the number of batting positions filled
   */
  public getBattingPositionCount(): number {
    return this.battingOrder.length;
  }

  /**
   * Get starting players (excluding substitutes)
   */
  public getStartingPlayers(): LineupPosition[] {
    return this.battingOrder.filter((position) => position.isStarting);
  }

  /**
   * Get all defensive positions in the lineup
   */
  public getDefensivePositions(): string[] {
    return this.battingOrder.map((position) => position.defensivePosition);
  }

  /**
   * Get player in specific batting position
   */
  public getPlayerInPosition(battingOrder: number): LineupPosition | null {
    return (
      this.battingOrder.find(
        (position) => position.battingOrder === battingOrder
      ) || null
    );
  }

  /**
   * Check if lineup has minimum required positions
   */
  public hasMinimumPositions(): boolean {
    return this.getStartingPlayers().length >= 9;
  }

  /**
   * Check if lineup has essential positions (pitcher and catcher)
   */
  public hasEssentialPositions(): boolean {
    const positions = this.getDefensivePositions();
    return positions.includes('Pitcher') && positions.includes('Catcher');
  }

  /**
   * Get all player IDs in batting order
   */
  public getAllPlayerIds(): string[] {
    const battingPlayerIds = this.battingOrder.map(
      (position) => position.playerId
    );
    return [...battingPlayerIds, ...this.substitutes];
  }

  /**
   * Update batting order with new positions
   */
  public updateBattingOrder(newBattingOrder: LineupPosition[]): Lineup {
    return new Lineup(
      this.id,
      this.gameId,
      newBattingOrder,
      this.substitutes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Add substitute player
   */
  public addSubstitute(playerId: string): Lineup {
    if (this.substitutes.includes(playerId)) {
      throw new Error('Player is already a substitute');
    }

    return new Lineup(
      this.id,
      this.gameId,
      this.battingOrder,
      [...this.substitutes, playerId],
      this.createdAt,
      new Date()
    );
  }

  /**
   * Remove substitute player
   */
  public removeSubstitute(playerId: string): Lineup {
    const newSubstitutes = this.substitutes.filter((id) => id !== playerId);

    return new Lineup(
      this.id,
      this.gameId,
      this.battingOrder,
      newSubstitutes,
      this.createdAt,
      new Date()
    );
  }
}
