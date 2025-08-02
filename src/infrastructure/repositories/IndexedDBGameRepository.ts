import { Game, GameRepository } from '@/domain';
import { GameStatus, GameScore } from '@/domain/entities/Game';
import { getDatabase } from '../database/connection';
import Dexie from 'dexie';

export class IndexedDBGameRepository implements GameRepository {
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

  async save(game: Game): Promise<Game> {
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
      finalScore: game.finalScore,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    await this.db.table('games').put(gameRecord);
    return game;
  }

  async findById(id: string): Promise<Game | null> {
    const record = await this.db.table('games').get(id);

    if (!record) {
      return null;
    }

    return this.recordToGame(record);
  }

  async findByTeamId(teamId: string): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('teamId')
      .equals(teamId)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  async findBySeasonId(seasonId: string): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('seasonId')
      .equals(seasonId)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  async findByStatus(status: GameStatus): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .where('status')
      .equals(status)
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Game[]> {
    const records = await this.db
      .table('games')
      .filter((record: any) => {
        const gameDate = new Date(record.date);
        return gameDate >= startDate && gameDate <= endDate;
      })
      .toArray();

    return records.map((record) => this.recordToGame(record));
  }

  async findActiveGames(): Promise<Game[]> {
    return await this.findByStatus('in_progress');
  }

  async delete(id: string): Promise<void> {
    await this.db.table('games').delete(id);
  }

  async addInning(gameId: string, inningId: string): Promise<Game> {
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

  async updateScore(gameId: string, score: GameScore): Promise<Game> {
    const game = await this.findById(gameId);

    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    // Create a new game instance with updated score
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
      score,
      game.createdAt,
      new Date()
    );

    return await this.save(updatedGame);
  }

  async search(query: string): Promise<Game[]> {
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

  async getGameStatistics(gameId: string): Promise<{
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

    const finalScore = game.finalScore;
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

  private recordToGame(record: {
    id: string;
    name: string;
    opponent: string;
    date: Date;
    seasonId: string;
    gameTypeId: string;
    homeAway: 'home' | 'away';
    teamId: string;
    status: GameStatus;
    lineupId: string | null;
    inningIds: string[];
    finalScore: GameScore | null;
    createdAt: Date;
    updatedAt: Date;
  }): Game {
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
      record.finalScore,
      record.createdAt,
      record.updatedAt
    );
  }
}
