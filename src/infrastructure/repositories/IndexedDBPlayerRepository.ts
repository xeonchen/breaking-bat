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
      position: player.position?.value || null,
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
      .where(['teamId', 'isActive'])
      .equals([teamId, true])
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
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

  async search(query: string): Promise<Player[]> {
    const lowerQuery = query.toLowerCase();

    const records = await this.db
      .table('players')
      .filter((record) => record.name.toLowerCase().includes(lowerQuery))
      .toArray();

    return records.map((record) => this.recordToPlayer(record));
  }

  private recordToPlayer(record: {
    id: string;
    name: string;
    jerseyNumber: number;
    teamId: string;
    position: string | null;
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
      record.position ? Position.fromValue(record.position) : null,
      record.isActive,
      record.statistics,
      record.createdAt,
      record.updatedAt
    );
  }
}
