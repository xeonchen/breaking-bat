/**
 * IndexedDB Persistence Adapter
 *
 * This adapter implements the persistence ports using IndexedDB.
 * It translates between the application's persistence needs and
 * the specific IndexedDB storage mechanism.
 */

import {
  ITeamPersistencePort,
  IPlayerPersistencePort,
  IGamePersistencePort,
  LineupData,
} from '@/application/ports/secondary/IPersistencePorts';

import { Team, Player, Game } from '@/domain/entities';
import { getDatabase } from '@/infrastructure/database/connection';
import Dexie from 'dexie';

/**
 * Base Repository Adapter
 * Provides common functionality for all IndexedDB repositories
 */
abstract class BaseIndexedDBAdapter<TEntity, TRecord> {
  protected db: Dexie;
  protected abstract tableName: string;

  constructor(database?: Dexie) {
    if (database) {
      this.db = database;
    } else if (process.env.NODE_ENV === 'test') {
      try {
        const { getTestDatabase } = eval('require')(
          '../../../../tests/test-helpers/database'
        );
        this.db = getTestDatabase();
      } catch {
        this.db = getDatabase();
      }
    } else {
      this.db = getDatabase();
    }
  }

  public async findById(id: string): Promise<TEntity | null> {
    const record = await this.db.table(this.tableName).get(id);
    return record ? this.recordToEntity(record) : null;
  }

  public async save(entity: TEntity): Promise<TEntity> {
    const record = this.entityToRecord(entity);
    await this.db.table(this.tableName).put(record);
    return entity;
  }

  public async delete(id: string): Promise<void> {
    await this.db.table(this.tableName).delete(id);
  }

  public async findAll(): Promise<TEntity[]> {
    const records = await this.db.table(this.tableName).toArray();
    return records.map((record) => this.recordToEntity(record));
  }

  public async exists(id: string): Promise<boolean> {
    const record = await this.db.table(this.tableName).get(id);
    return record !== undefined;
  }

  protected abstract entityToRecord(entity: TEntity): TRecord;
  protected abstract recordToEntity(record: TRecord): TEntity;
}

/**
 * Team Persistence Adapter
 */
export class TeamPersistenceAdapter
  extends BaseIndexedDBAdapter<Team, any>
  implements ITeamPersistencePort
{
  protected tableName = 'teams';

  public async findBySeasonId(seasonId: string): Promise<Team[]> {
    const records = await this.db
      .table(this.tableName)
      .filter((record) => record.seasonIds.includes(seasonId))
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async findByName(name: string): Promise<Team | null> {
    const record = await this.db
      .table(this.tableName)
      .filter((record) => record.name.toLowerCase() === name.toLowerCase())
      .first();

    return record ? this.recordToEntity(record) : null;
  }

  public async searchByName(query: string): Promise<Team[]> {
    const lowerQuery = query.toLowerCase();
    const records = await this.db
      .table(this.tableName)
      .filter((record) => record.name.toLowerCase().includes(lowerQuery))
      .toArray();

    return records.map((record) => this.recordToEntity(record));
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

    return excludeTeamId === existingTeam.id;
  }

  public async findByOrganization(_organizationId: string): Promise<Team[]> {
    // For now, return all teams as we don't have organization structure
    return await this.findAll();
  }

  protected entityToRecord(team: Team): any {
    return {
      id: team.id,
      name: team.name,
      seasonIds: team.seasonIds,
      playerIds: team.playerIds,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  protected recordToEntity(record: any): Team {
    return new Team(
      record.id,
      record.name,
      record.seasonIds,
      record.playerIds,
      record.createdAt,
      record.updatedAt
    );
  }
}

/**
 * Player Persistence Adapter
 */
export class PlayerPersistenceAdapter
  extends BaseIndexedDBAdapter<Player, any>
  implements IPlayerPersistencePort
{
  protected tableName = 'players';

  public async findByTeamId(teamId: string): Promise<Player[]> {
    const records = await this.db
      .table(this.tableName)
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async findByPosition(position: string): Promise<Player[]> {
    const records = await this.db
      .table(this.tableName)
      .filter((record) => record.positions.includes(position))
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async findByJerseyNumber(
    teamId: string,
    jerseyNumber: number
  ): Promise<Player | null> {
    const record = await this.db
      .table(this.tableName)
      .where(['teamId', 'jerseyNumber'])
      .equals([teamId, jerseyNumber])
      .first();

    return record ? this.recordToEntity(record) : null;
  }

  public async searchByName(query: string): Promise<Player[]> {
    const lowerQuery = query.toLowerCase();
    const records = await this.db
      .table(this.tableName)
      .filter((record) => record.name.toLowerCase().includes(lowerQuery))
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async isJerseyNumberAvailable(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean> {
    return await this.isJerseyNumberUnique(
      teamId,
      jerseyNumber,
      excludePlayerId
    );
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

    return excludePlayerId ? existingPlayer.id === excludePlayerId : false;
  }

  public async create(player: Player): Promise<Player> {
    return await this.save(player);
  }

  public async update(player: Player): Promise<Player> {
    return await this.save(player);
  }

  public async findActiveByTeamId(teamId: string): Promise<Player[]> {
    const players = await this.findByTeamId(teamId);
    return players.filter((player) => player.isActive);
  }

  protected entityToRecord(player: Player): any {
    return {
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
  }

  protected recordToEntity(record: any): Player {
    // This will need to be implemented based on the Player constructor
    // For now, providing a placeholder that matches the expected interface
    return record as Player;
  }
}

// Similar pattern for other adapters...
// (Keeping this focused on the key architectural concepts)

/**
 * Game Persistence Adapter - Simplified
 */
export class GamePersistenceAdapter
  extends BaseIndexedDBAdapter<Game, any>
  implements IGamePersistencePort
{
  protected tableName = 'games';

  public async findCurrent(): Promise<Game | null> {
    const record = await this.db
      .table(this.tableName)
      .where('status')
      .equals('in_progress')
      .first();

    return record ? this.recordToEntity(record) : null;
  }

  public async findByTeamId(teamId: string): Promise<Game[]> {
    const records = await this.db
      .table(this.tableName)
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async findBySeasonId(seasonId: string): Promise<Game[]> {
    const records = await this.db
      .table(this.tableName)
      .where('seasonId')
      .equals(seasonId)
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async findByStatus(status: string): Promise<Game[]> {
    const records = await this.db
      .table(this.tableName)
      .where('status')
      .equals(status)
      .toArray();

    return records.map((record) => this.recordToEntity(record));
  }

  public async getLineup(lineupId: string): Promise<string[]> {
    const lineupRecord = await this.db.table('lineups').get(lineupId);
    return lineupRecord ? lineupRecord.playerIds : [];
  }

  public async saveLineup(
    gameId: string,
    lineupData: LineupData
  ): Promise<void> {
    const lineupRecord = {
      id: lineupData.lineupId,
      gameId,
      playerIds: lineupData.playerIds,
      defensivePositions: lineupData.defensivePositions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.table('lineups').put(lineupRecord);
  }

  protected entityToRecord(game: Game): any {
    return {
      id: game.id,
      name: game.name,
      teamId: game.teamId,
      opponent: game.opponent,
      date: game.date,
      status: game.status,
      // Add other game properties as needed
    };
  }

  protected recordToEntity(record: any): Game {
    // Placeholder - implement based on Game constructor
    return record as Game;
  }
}
