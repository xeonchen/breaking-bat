import { Team } from '@/domain';
import { ITeamPersistencePort } from '@/application/ports/secondary/IPersistencePorts';
import { getDatabase } from '../database/connection';
import Dexie from 'dexie';

export class IndexedDBTeamRepository implements ITeamPersistencePort {
  private db: Dexie;

  constructor(database?: Dexie) {
    if (database) {
      this.db = database;
    } else if (process.env.NODE_ENV === 'test') {
      // In test environment, try to get test database
      try {
        const { getTestDatabase } = eval('require')(
          '../../../tests/test-helpers/database'
        );
        this.db = getTestDatabase();
      } catch {
        this.db = getDatabase();
      }
    } else {
      this.db = getDatabase();
    }
  }

  public async save(team: Team): Promise<Team> {
    // Check for duplicate team name
    const existingTeam = await this.findByName(team.name);

    if (existingTeam && existingTeam.id !== team.id) {
      throw new Error(`Team name ${team.name} already exists`);
    }

    // Convert domain entity to database record
    const teamRecord = {
      id: team.id,
      name: team.name,
      seasonIds: team.seasonIds,
      playerIds: team.playerIds,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };

    await this.db.table('teams').put(teamRecord);
    return team;
  }

  public async findById(id: string): Promise<Team | null> {
    const record = await this.db.table('teams').get(id);

    if (!record) {
      return null;
    }

    return this.recordToTeam(record);
  }

  public async findAll(): Promise<Team[]> {
    const records = await this.db.table('teams').toArray();

    return records.map((record) => this.recordToTeam(record));
  }

  public async findBySeasonId(seasonId: string): Promise<Team[]> {
    const records = await this.db
      .table('teams')
      .filter((record) => record.seasonIds.includes(seasonId))
      .toArray();

    return records.map((record) => this.recordToTeam(record));
  }

  public async findByName(name: string): Promise<Team | null> {
    const record = await this.db
      .table('teams')
      .filter((record) => record.name.toLowerCase() === name.toLowerCase())
      .first();

    if (!record) {
      return null;
    }

    return this.recordToTeam(record);
  }

  public async delete(id: string): Promise<void> {
    await this.db.table('teams').delete(id);
  }

  public async addPlayer(teamId: string, playerId: string): Promise<Team> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }

    const updatedTeam = team.addPlayer(playerId);
    return await this.save(updatedTeam);
  }

  public async removePlayer(teamId: string, playerId: string): Promise<Team> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }

    const updatedTeam = team.removePlayer(playerId);
    return await this.save(updatedTeam);
  }

  public async addSeason(teamId: string, seasonId: string): Promise<Team> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }

    const updatedTeam = team.addSeason(seasonId);
    return await this.save(updatedTeam);
  }

  public async removeSeason(teamId: string, seasonId: string): Promise<Team> {
    const team = await this.findById(teamId);

    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }

    const updatedTeam = team.removeSeason(seasonId);
    return await this.save(updatedTeam);
  }

  public async findByOrganization(_organizationId: string): Promise<Team[]> {
    // For now, return all teams as we don't have organization structure yet
    // TODO: Implement organization filtering when organizations are added
    return await this.findAll();
  }

  public async searchByName(query: string): Promise<Team[]> {
    const lowerQuery = query.toLowerCase();

    const records = await this.db
      .table('teams')
      .filter((record) => record.name.toLowerCase().includes(lowerQuery))
      .toArray();

    return records.map((record) => this.recordToTeam(record));
  }

  public async isNameAvailable(
    _organizationId: string,
    name: string,
    excludeTeamId?: string
  ): Promise<boolean> {
    const existingTeam = await this.findByName(name);

    if (!existingTeam) {
      return true;
    }

    // If excludeTeamId is provided and matches the existing team, name is available
    return excludeTeamId === existingTeam.id;
  }

  public async search(query: string): Promise<Team[]> {
    // Delegate to searchByName for consistency
    return await this.searchByName(query);
  }

  // Required by IRepository interface
  public async exists(id: string): Promise<boolean> {
    const record = await this.db.table('teams').get(id);
    return record !== undefined;
  }

  private recordToTeam(record: {
    id: string;
    name: string;
    seasonIds: string[];
    playerIds: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
  }): Team {
    return new Team(
      record.id,
      record.name,
      record.seasonIds,
      record.playerIds,
      record.createdAt instanceof Date
        ? record.createdAt
        : new Date(record.createdAt),
      record.updatedAt instanceof Date
        ? record.updatedAt
        : new Date(record.updatedAt)
    );
  }
}
