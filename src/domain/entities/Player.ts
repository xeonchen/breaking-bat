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
  public readonly position: Position | null;
  public readonly teamId: string;
  public readonly isActive: boolean;
  public readonly statistics: PlayerStatistics;

  constructor(
    id: string,
    name: string,
    jerseyNumber: number,
    teamId: string,
    position: Position | null = null,
    isActive: boolean = true,
    statistics: PlayerStatistics | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!name.trim()) {
      throw new Error('Player name cannot be empty');
    }

    if (jerseyNumber < 1 || jerseyNumber > 99) {
      throw new Error('Jersey number must be between 1 and 99');
    }

    this.name = name.trim();
    this.jerseyNumber = jerseyNumber;
    this.position = position;
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
   * Change player's position
   */
  public changePosition(newPosition: Position | null): Player {
    return new Player(
      this.id,
      this.name,
      this.jerseyNumber,
      this.teamId,
      newPosition,
      this.isActive,
      this.statistics,
      this.createdAt,
      new Date()
    );
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
      this.position,
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
      this.position,
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
  public canPlayPosition(_position: Position): boolean {
    // In softball, players can generally play any position
    // This could be extended with position-specific logic
    return true;
  }
}
