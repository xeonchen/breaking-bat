import { Player, PlayerRepository, PlayerStatistics } from '@/domain';
import { Position } from '@/domain/values';
import { getDatabase } from '../database/connection';
import Dexie from 'dexie';

export class IndexedDBPlayerRepository implements PlayerRepository {
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

  async save(player: Player): Promise<Player> {
    // Check for duplicate jersey number within the same team
    const existingPlayer = await this.findByJerseyNumber(
      player.teamId,
      player.jerseyNumber
    );

    if (existingPlayer && existingPlayer.id !== player.id) {
      throw new Error(
        `Jersey number ${player.jerseyNumber} already exists for team ${player.teamId}`
      );
    }

    // Convert domain entity to database record
    const playerRecord = {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      teamId: player.teamId,
      positions: player.positions.map((p) => p.value),
      isActive: player.isActive,
      statistics: player.statistics,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };

    await this.db.table('players').put(playerRecord);
    return player;
  }

  async findById(id: string): Promise<Player | null> {
    const record = await this.db.table('players').get(id);

    if (!record) {
      return null;
    }

    return this.recordToPlayer(record);
  }

  async findByTeamId(teamId: string): Promise<Player[]> {
    const records = await this.db
      .table('players')
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  async findByJerseyNumber(
    teamId: string,
    jerseyNumber: number
  ): Promise<Player | null> {
    const record = await this.db
      .table('players')
      .where(['teamId', 'jerseyNumber'])
      .equals([teamId, jerseyNumber])
      .first();

    if (!record) {
      return null;
    }

    return this.recordToPlayer(record);
  }

  async findActiveByTeamId(teamId: string): Promise<Player[]> {
    const records = await this.db
      .table('players')
      .where('teamId')
      .equals(teamId)
      .filter((record: any) => record.isActive === true)
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  async findAll(): Promise<Player[]> {
    const records = await this.db.table('players').toArray();
    return records.map((record) => this.recordToPlayer(record));
  }

  async create(player: Player): Promise<Player> {
    return await this.save(player);
  }

  async update(player: Player): Promise<Player> {
    return await this.save(player);
  }

  async exists(id: string): Promise<boolean> {
    const record = await this.db.table('players').get(id);
    return record !== undefined;
  }

  async isJerseyNumberUnique(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean> {
    const existingPlayer = await this.findByJerseyNumber(teamId, jerseyNumber);

    if (!existingPlayer) {
      return true;
    }

    // If we're excluding a specific player (for updates), check if it's the same player
    return excludePlayerId ? existingPlayer.id === excludePlayerId : false;
  }

  async searchByName(query: string, teamId?: string): Promise<Player[]> {
    const lowerQuery = query.toLowerCase();

    let queryBuilder = this.db.table('players');

    if (teamId) {
      queryBuilder = queryBuilder.where('teamId').equals(teamId);
    }

    const records = await queryBuilder
      .filter((record: any) => record.name.toLowerCase().includes(lowerQuery))
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  async getPlayersWithStatistics(
    teamId: string,
    _seasonId?: string
  ): Promise<Player[]> {
    // For now, just return team players with their statistics
    // In the future, this could filter by season-specific statistics
    return await this.findByTeamId(teamId);
  }

  async delete(id: string): Promise<void> {
    await this.db.table('players').delete(id);
  }

  async updateStatistics(
    id: string,
    statistics: PlayerStatistics
  ): Promise<Player> {
    const player = await this.findById(id);

    if (!player) {
      throw new Error(`Player with id ${id} not found`);
    }

    const updatedPlayer = player.updateStatistics(statistics);
    return await this.save(updatedPlayer);
  }

  private recordToPlayer(record: {
    id: string;
    name: string;
    jerseyNumber: number;
    teamId: string;
    positions: string[];
    isActive: boolean;
    statistics: PlayerStatistics;
    createdAt: Date;
    updatedAt: Date;
  }): Player {
    return new Player(
      record.id,
      record.name,
      record.jerseyNumber,
      record.teamId,
      record.positions.map((p) => Position.fromValue(p)),
      record.isActive,
      record.statistics,
      record.createdAt,
      record.updatedAt
    );
  }
}
