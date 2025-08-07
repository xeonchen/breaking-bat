import { BaseEntity } from './BaseEntity';

/**
 * Season domain entity representing a softball season
 */
export class Season extends BaseEntity {
  public readonly name: string;
  public readonly year: number;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly teamIds: string[];

  constructor(
    id: string,
    name: string,
    year: number,
    startDate: Date,
    endDate: Date,
    teamIds: string[] = [],
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!name.trim()) {
      throw new Error('Season name cannot be empty');
    }

    if (year < 1900 || year > 2100) {
      throw new Error('Season year must be between 1900 and 2100');
    }

    if (startDate >= endDate) {
      throw new Error('Season start date must be before end date');
    }

    this.name = name.trim();
    this.year = year;
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
    this.teamIds = [...teamIds];
  }

  /**
   * Check if the season is currently active
   */
  public isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Check if the season has started
   */
  public hasStarted(): boolean {
    return new Date() >= this.startDate;
  }

  /**
   * Check if the season has ended
   */
  public hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  /**
   * Get the duration of the season in days
   */
  public getDurationInDays(): number {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Add a team to the season
   */
  public addTeam(teamId: string): Season {
    if (this.teamIds.includes(teamId)) {
      throw new Error('Team already in season');
    }

    return new Season(
      this.id,
      this.name,
      this.year,
      this.startDate,
      this.endDate,
      [...this.teamIds, teamId],
      this.createdAt,
      new Date()
    );
  }

  /**
   * Remove a team from the season
   */
  public removeTeam(teamId: string): Season {
    const newTeamIds = this.teamIds.filter((id) => id !== teamId);

    return new Season(
      this.id,
      this.name,
      this.year,
      this.startDate,
      this.endDate,
      newTeamIds,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Check if season contains a specific team
   */
  public hasTeam(teamId: string): boolean {
    return this.teamIds.includes(teamId);
  }

  /**
   * Update season dates
   */
  public updateDates(startDate: Date, endDate: Date): Season {
    if (startDate >= endDate) {
      throw new Error('Season start date must be before end date');
    }

    return new Season(
      this.id,
      this.name,
      this.year,
      startDate,
      endDate,
      this.teamIds,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Check if a date falls within the season
   */
  public containsDate(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }
}
