import { Season } from '@/domain/entities';
import { SeasonRepository } from '@/domain/repositories';
import { getDatabase } from '../database/connection';
import { BreakingBatDatabase } from '../database/types';

export class IndexedDBSeasonRepository implements SeasonRepository {
  async save(season: Season): Promise<Season> {
    const db = getDatabase() as BreakingBatDatabase;

    const seasonData = {
      id: season.id,
      name: season.name,
      year: season.year,
      startDate: season.startDate,
      endDate: season.endDate,
      teamIds: season.teamIds,
      createdAt: season.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await db.seasons.put(seasonData);

    return new Season(
      seasonData.id,
      seasonData.name,
      seasonData.year,
      seasonData.startDate,
      seasonData.endDate,
      seasonData.teamIds,
      seasonData.createdAt,
      seasonData.updatedAt
    );
  }

  async findById(id: string): Promise<Season | null> {
    const db = getDatabase() as BreakingBatDatabase;
    const seasonData = await db.seasons.get(id);

    if (!seasonData) {
      return null;
    }

    return new Season(
      seasonData.id,
      seasonData.name,
      seasonData.year,
      seasonData.startDate,
      seasonData.endDate,
      seasonData.teamIds || [],
      seasonData.createdAt,
      seasonData.updatedAt
    );
  }

  async findAll(): Promise<Season[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const seasonsData = await db.seasons.orderBy('year').reverse().toArray();

    return seasonsData.map(
      (seasonData) =>
        new Season(
          seasonData.id,
          seasonData.name,
          seasonData.year,
          seasonData.startDate,
          seasonData.endDate,
          seasonData.teamIds || [],
          seasonData.createdAt,
          seasonData.updatedAt
        )
    );
  }

  async findByYear(year: number): Promise<Season[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const seasonsData = await db.seasons.where('year').equals(year).toArray();

    return seasonsData.map(
      (seasonData) =>
        new Season(
          seasonData.id,
          seasonData.name,
          seasonData.year,
          seasonData.startDate,
          seasonData.endDate,
          seasonData.teamIds || [],
          seasonData.createdAt,
          seasonData.updatedAt
        )
    );
  }

  async findActiveSeason(): Promise<Season | null> {
    const db = getDatabase() as BreakingBatDatabase;
    const now = new Date();

    const seasonsData = await db.seasons.toArray();
    const activeSeason = seasonsData.find((season) => {
      const startDate = new Date(season.startDate);
      const endDate = new Date(season.endDate);
      return now >= startDate && now <= endDate;
    });

    if (!activeSeason) {
      return null;
    }

    return new Season(
      activeSeason.id,
      activeSeason.name,
      activeSeason.year,
      activeSeason.startDate,
      activeSeason.endDate,
      activeSeason.teamIds || [],
      activeSeason.createdAt,
      activeSeason.updatedAt
    );
  }

  async findByTeamId(teamId: string): Promise<Season[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const seasonsData = await db.seasons.toArray();

    const filteredSeasons = seasonsData.filter(
      (season) => season.teamIds && season.teamIds.includes(teamId)
    );

    return filteredSeasons.map(
      (seasonData) =>
        new Season(
          seasonData.id,
          seasonData.name,
          seasonData.year,
          seasonData.startDate,
          seasonData.endDate,
          seasonData.teamIds || [],
          seasonData.createdAt,
          seasonData.updatedAt
        )
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase() as BreakingBatDatabase;
    await db.seasons.delete(id);
  }

  async existsByNameAndYear(name: string, year: number): Promise<boolean> {
    const db = getDatabase() as BreakingBatDatabase;
    const season = await db.seasons
      .where(['name', 'year'])
      .equals([name, year])
      .first();

    return !!season;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Season[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const seasonsData = await db.seasons.toArray();

    const filteredSeasons = seasonsData.filter((season) => {
      const seasonStart = new Date(season.startDate);
      const seasonEnd = new Date(season.endDate);

      // Season overlaps with the date range
      return seasonStart <= endDate && seasonEnd >= startDate;
    });

    return filteredSeasons.map(
      (seasonData) =>
        new Season(
          seasonData.id,
          seasonData.name,
          seasonData.year,
          seasonData.startDate,
          seasonData.endDate,
          seasonData.teamIds || [],
          seasonData.createdAt,
          seasonData.updatedAt
        )
    );
  }

  async addTeamToSeason(seasonId: string, teamId: string): Promise<Season> {
    const season = await this.findById(seasonId);
    if (!season) {
      throw new Error(`Season with ID ${seasonId} not found`);
    }

    const updatedSeason = season.addTeam(teamId);
    return await this.save(updatedSeason);
  }

  async removeTeamFromSeason(
    seasonId: string,
    teamId: string
  ): Promise<Season> {
    const season = await this.findById(seasonId);
    if (!season) {
      throw new Error(`Season with ID ${seasonId} not found`);
    }

    const updatedSeason = season.removeTeam(teamId);
    return await this.save(updatedSeason);
  }
}
