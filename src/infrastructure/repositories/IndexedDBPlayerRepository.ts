import { Player, PlayerRepository, PlayerStatistics } from '@/domain';
import { Position } from '@/domain/values';
import { getDatabase } from '../database/connection';
import { PlayerRecord } from '../database/types';
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

  public async save(player: Player): Promise<Player> {
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

  public async findById(id: string): Promise<Player | null> {
    const record = await this.db.table('players').get(id);

    if (!record) {
      return null;
    }

    return this.recordToPlayer(record);
  }

  public async findByTeamId(teamId: string): Promise<Player[]> {
    const records = await this.db
      .table('players')
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  public async findByJerseyNumber(
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

  public async findActiveByTeamId(teamId: string): Promise<Player[]> {
    const records = await this.db
      .table('players')
      .where('teamId')
      .equals(teamId)
      .filter((record: PlayerRecord) => record.isActive === true)
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  public async findAll(): Promise<Player[]> {
    const records = await this.db.table('players').toArray();
    return records.map((record) => this.recordToPlayer(record));
  }

  public async create(player: Player): Promise<Player> {
    return await this.save(player);
  }

  public async update(player: Player): Promise<Player> {
    return await this.save(player);
  }

  public async exists(id: string): Promise<boolean> {
    const record = await this.db.table('players').get(id);
    return record !== undefined;
  }

  public async isJerseyNumberUnique(
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

  public async searchByName(query: string, teamId?: string): Promise<Player[]> {
    const lowerQuery = query.toLowerCase();

    const records = await this.db
      .table('players')
      .filter((record: PlayerRecord) => {
        const nameMatches = record.name.toLowerCase().includes(lowerQuery);
        const teamMatches = !teamId || record.teamId === teamId;
        return nameMatches && teamMatches;
      })
      .toArray();

    return records.map((record: PlayerRecord) => this.recordToPlayer(record));
  }

  public async getPlayersWithStatistics(
    teamId: string,
    _seasonId?: string
  ): Promise<Player[]> {
    // For now, just return team players with their statistics
    // In the future, this could filter by season-specific statistics
    return await this.findByTeamId(teamId);
  }

  public async delete(id: string): Promise<void> {
    await this.db.table('players').delete(id);
  }

  public async updateStatistics(
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

  private recordToPlayer(record: PlayerRecord): Player {
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
