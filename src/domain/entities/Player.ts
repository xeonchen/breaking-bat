import { BaseEntity } from './BaseEntity';
import { Position } from '../values';

export interface PlayerStatistics {
  games: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
}

/**
 * Player domain entity representing a softball player
 */
export class Player extends BaseEntity {
  public readonly name: string;
  public readonly jerseyNumber: number;
  public readonly positions: Position[];
  public readonly teamId: string;
  public readonly isActive: boolean;
  public readonly statistics: PlayerStatistics;

  constructor(
    id: string,
    name: string,
    jerseyNumber: number,
    teamId: string,
    positions: Position[] = [Position.extraPlayer()],
    isActive: boolean = true,
    statistics: PlayerStatistics | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!name.trim()) {
      throw new Error('Player name cannot be empty');
    }

    if (jerseyNumber < 0 || jerseyNumber > 999) {
      throw new Error('Jersey number must be between 0 and 999');
    }

    this.name = name.trim();
    this.jerseyNumber = jerseyNumber;
    this.positions = positions;
    this.teamId = teamId;
    this.isActive = isActive;
    this.statistics = statistics || Player.createEmptyStatistics();
  }

  /**
   * Create empty statistics for a new player
   */
  public static createEmptyStatistics(): PlayerStatistics {
    return {
      games: 0,
      atBats: 0,
      hits: 0,
      runs: 0,
      rbis: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      walks: 0,
      strikeouts: 0,
      battingAverage: 0,
      onBasePercentage: 0,
      sluggingPercentage: 0,
    };
  }

  /**
   * Update player's positions
   */
  public updatePositions(newPositions: Position[]): Player {
    return new Player(
      this.id,
      this.name,
      this.jerseyNumber,
      this.teamId,
      newPositions,
      this.isActive,
      this.statistics,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Add a position to the player
   */
  public addPosition(position: Position): Player {
    if (this.positions.some((p) => p.equals(position))) {
      return this; // Position already exists
    }
    return this.updatePositions([...this.positions, position]);
  }

  /**
   * Remove a position from the player
   */
  public removePosition(position: Position): Player {
    const filteredPositions = this.positions.filter((p) => !p.equals(position));
    return this.updatePositions(filteredPositions);
  }

  /**
   * Activate or deactivate player
   */
  public setActive(active: boolean): Player {
    return new Player(
      this.id,
      this.name,
      this.jerseyNumber,
      this.teamId,
      this.positions,
      active,
      this.statistics,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update player statistics
   */
  public updateStatistics(newStatistics: PlayerStatistics): Player {
    // Recalculate derived statistics
    const updatedStats = {
      ...newStatistics,
      battingAverage:
        newStatistics.atBats > 0
          ? newStatistics.hits / newStatistics.atBats
          : 0,
      onBasePercentage: this.calculateOnBasePercentage(newStatistics),
      sluggingPercentage: this.calculateSluggingPercentage(newStatistics),
    };

    return new Player(
      this.id,
      this.name,
      this.jerseyNumber,
      this.teamId,
      this.positions,
      this.isActive,
      updatedStats,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Calculate on-base percentage
   */
  private calculateOnBasePercentage(stats: PlayerStatistics): number {
    const totalPlateAppearances = stats.atBats + stats.walks;
    if (totalPlateAppearances === 0) return 0;

    const timesOnBase = stats.hits + stats.walks;
    return timesOnBase / totalPlateAppearances;
  }

  /**
   * Calculate slugging percentage
   */
  private calculateSluggingPercentage(stats: PlayerStatistics): number {
    if (stats.atBats === 0) return 0;

    const totalBases =
      stats.singles +
      stats.doubles * 2 +
      stats.triples * 3 +
      stats.homeRuns * 4;

    return totalBases / stats.atBats;
  }

  /**
   * Get display name with jersey number
   */
  public getDisplayName(): string {
    return `#${this.jerseyNumber} ${this.name}`;
  }

  /**
   * Check if player can play a specific position
   */
  public canPlayPosition(position: Position): boolean {
    return this.positions.some((p) => p.equals(position));
  }

  /**
   * Get all defensive positions (excluding EP)
   */
  public getDefensivePositions(): Position[] {
    return this.positions.filter((p) => p.isDefensivePosition());
  }

  /**
   * Check if player is designated as Extra Player
   */
  public isExtraPlayer(): boolean {
    return this.positions.some((p) => p.equals(Position.extraPlayer()));
  }
}
