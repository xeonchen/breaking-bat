import { Game } from '@/domain';
import { IGamePersistencePort } from '@/application/ports/secondary/IPersistencePorts';
import { GameStatus, GameScore } from '@/domain/entities/Game';
import { Scoreboard } from '@/domain/values/Scoreboard';
import { getDatabase } from '../database/connection';
import { GameRecord } from '../database/types';
import Dexie from 'dexie';

export class IndexedDBGameRepository implements IGamePersistencePort {
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

  public async save(game: Game): Promise<Game> {
    // Convert domain entity to database record
    const gameRecord = {
      id: game.id,
      name: game.name,
      opponent: game.opponent,
      date: game.date,
      seasonId: game.seasonId,
      gameTypeId: game.gameTypeId,
      homeAway: game.homeAway,
      teamId: game.teamId,
      status: game.status,
      lineupId: game.lineupId,
      inningIds: game.inningIds,
      finalScore: game.scoreboard ? game.scoreboard.toGameScore() : null,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    await this.db.table('games').put(gameRecord);
    return game;
  }

  public async findById(id: string): Promise<Game | null> {
    const record = await this.db.table('games').get(id);

    if (!record) {
      return null;
    }

    return this.recordToGame(record);
  }

  public async findAll(): Promise<Game[]> {
    const records = await this.db.table('games').toArray();
    return records.map((record) => this.recordToGame(record));
  }

  public async findCurrent(): Promise<Game | null> {
    const records = await this.db
      .table('games')
      .where('status')
      .equals('in_progress')
      .first();

    if (!records) {
      return null;
    }

    return this.recordToGame(records);
  }

  public async getLineup(lineupId: string): Promise<string[]> {
    if (!lineupId) {
      return [];
    }

    // Find the lineup record by ID
    const lineupRecord = await this.db.table('lineups').get(lineupId);
    if (!lineupRecord) {
      return [];
    }

    return lineupRecord.playerIds;
  }

  public async saveLineup(
    gameId: string,
    lineupData: any,
    ...rest: any[]
  ): Promise<void> {
    // Handle both old signature (for backward compatibility) and new interface
    if (typeof lineupData === 'string') {
      // Old signature: saveLineup(gameId, lineupId, playerIds, defensivePositions)
      const lineupId = lineupData as string;
      const playerIds = rest[0] as string[];
      const defensivePositions = rest[1] as string[];

      const lineupRecord = {
        id: lineupId,
        gameId,
        playerIds,
        defensivePositions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.db.table('lineups').put(lineupRecord);
    } else {
      // New signature: saveLineup(gameId, lineupData)
      const { lineupId, playerIds, defensivePositions } = lineupData;
      const lineupRecord = {
        id: lineupId,
        gameId,
        playerIds,
        defensivePositions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.db.table('lineups').put(lineupRecord);
    }
  }

  public async findByTeamId(teamId: string): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  public async findBySeasonId(seasonId: string): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('seasonId')
      .equals(seasonId)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  public async findByStatus(status: GameStatus): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('status')
      .equals(status)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  public async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .filter((record: GameRecord) => {
        const gameDate = new Date(record.date);
        return gameDate >= startDate && gameDate <= endDate;
      })
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  public async findActiveGames(): Promise<Game[]> {
    return await this.findByStatus('in_progress');
  }

  public async delete(id: string): Promise<void> {
    await this.db.table('games').delete(id);
  }

  public async addInning(gameId: string, inningId: string): Promise<Game> {
    const game = await this.findById(gameId);

    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    if (game.status !== 'in_progress') {
      throw new Error('Can only add innings to in-progress games');
    }

    const updatedGame = game.addInning(inningId);
    return await this.save(updatedGame);
  }

  public async updateScore(gameId: string, score: GameScore): Promise<Game> {
    const game = await this.findById(gameId);

    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    // Create a new game instance with updated score
    const scoreboard = Scoreboard.fromGameScore(score);
    const updatedGame = new Game(
      game.id,
      game.name,
      game.opponent,
      game.date,
      game.seasonId,
      game.gameTypeId,
      game.homeAway,
      game.teamId,
      game.status,
      game.lineupId,
      game.inningIds,
      scoreboard,
      game.createdAt,
      new Date()
    );

    return await this.save(updatedGame);
  }

  public async search(query: string): Promise<Game[]> {
    const lowerQuery = query.toLowerCase();

    const records = await this.db
      .table('games')
      .filter(
        (record) =>
          record.name.toLowerCase().includes(lowerQuery) ||
          record.opponent.toLowerCase().includes(lowerQuery)
      )
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  public async getGameStatistics(gameId: string): Promise<{
    totalRuns: number;
    ourScore: number;
    opponentScore: number;
    result: 'W' | 'L' | 'T';
    inningsPlayed: number;
  }> {
    const game = await this.findById(gameId);

    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    const finalScore = game.scoreboard ? game.scoreboard.toGameScore() : null;
    if (!finalScore) {
      return {
        totalRuns: 0,
        ourScore: 0,
        opponentScore: 0,
        result: 'T',
        inningsPlayed: game.inningIds.length,
      };
    }

    const ourScore =
      game.homeAway === 'home' ? finalScore.homeScore : finalScore.awayScore;
    const opponentScore =
      game.homeAway === 'home' ? finalScore.awayScore : finalScore.homeScore;

    let result: 'W' | 'L' | 'T' = 'T';
    if (ourScore > opponentScore) {
      result = 'W';
    } else if (ourScore < opponentScore) {
      result = 'L';
    }

    return {
      totalRuns: finalScore.homeScore + finalScore.awayScore,
      ourScore,
      opponentScore,
      result,
      inningsPlayed: finalScore.inningScores.length,
    };
  }

  private recordToGame(record: GameRecord): Game {
    const scoreboard = record.finalScore
      ? Scoreboard.fromGameScore(record.finalScore)
      : null;

    return new Game(
      record.id,
      record.name,
      record.opponent,
      record.date,
      record.seasonId,
      record.gameTypeId,
      record.homeAway,
      record.teamId,
      record.status,
      record.lineupId,
      record.inningIds,
      scoreboard,
      record.createdAt,
      record.updatedAt
    );
  }

  // Required by IRepository interface
  public async exists(id: string): Promise<boolean> {
    const record = await this.db.table('games').get(id);
    return record !== undefined;
  }
}
