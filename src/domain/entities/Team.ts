import { BaseEntity } from './BaseEntity';

/**
 * Team domain entity representing a softball team
 */
export class Team extends BaseEntity {
  public readonly name: string;
  public readonly seasonIds: string[];
  public readonly playerIds: string[];

  constructor(
    id: string,
    name: string,
    seasonIds: string[] = [],
    playerIds: string[] = [],
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);

    if (!name.trim()) {
      throw new Error('Team name cannot be empty');
    }

    this.name = name.trim();
    this.seasonIds = [...seasonIds];
    this.playerIds = [...playerIds];
  }

  /**
   * Add a season to the team
   */
  public addSeason(seasonId: string): Team {
    if (this.seasonIds.includes(seasonId)) {
      throw new Error('Season already associated with team');
    }

    return new Team(
      this.id,
      this.name,
      [...this.seasonIds, seasonId],
      this.playerIds,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Remove a season from the team
   */
  public removeSeason(seasonId: string): Team {
    const newSeasonIds = this.seasonIds.filter((id) => id !== seasonId);

    return new Team(
      this.id,
      this.name,
      newSeasonIds,
      this.playerIds,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Add a player to the team
   */
  public addPlayer(playerId: string): Team {
    if (this.playerIds.includes(playerId)) {
      throw new Error('Player already on team');
    }

    if (this.playerIds.length >= 25) {
      throw new Error('Team roster cannot exceed 25 players');
    }

    return new Team(
      this.id,
      this.name,
      this.seasonIds,
      [...this.playerIds, playerId],
      this.createdAt,
      new Date()
    );
  }

  /**
   * Remove a player from the team
   */
  public removePlayer(playerId: string): Team {
    const newPlayerIds = this.playerIds.filter((id) => id !== playerId);

    return new Team(
      this.id,
      this.name,
      this.seasonIds,
      newPlayerIds,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Check if team has a specific player
   */
  public hasPlayer(playerId: string): boolean {
    return this.playerIds.includes(playerId);
  }

  /**
   * Get the number of players on the team
   */
  public getPlayerCount(): number {
    return this.playerIds.length;
  }

  /**
   * Check if team can add more players
   */
  public canAddPlayer(): boolean {
    return this.playerIds.length < 25;
  }

  /**
   * Change team name
   */
  public changeName(newName: string): Team {
    if (!newName.trim()) {
      throw new Error('Team name cannot be empty');
    }

    return new Team(
      this.id,
      newName.trim(),
      this.seasonIds,
      this.playerIds,
      this.createdAt,
      new Date()
    );
  }
}
