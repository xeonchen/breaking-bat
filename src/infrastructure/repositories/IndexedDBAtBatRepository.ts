import { AtBat, AtBatRepository, PlayerStatistics, Player } from '@/domain';
import { BattingResult, BaserunnerState } from '@/domain/values';
import { getDatabase } from '../database/connection';
import { AtBatRecord } from '../database/types';
import Dexie from 'dexie';

export class IndexedDBAtBatRepository implements AtBatRepository {
  private db: Dexie;

  constructor(database?: Dexie) {
    if (database) {
      this.db = database;
    } else if (process.env.NODE_ENV === 'test') {
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

  public async save(atBat: AtBat): Promise<AtBat> {
    const atBatRecord = {
      id: atBat.id,
      gameId: atBat.gameId,
      inningId: atBat.inningId,
      batterId: atBat.batterId,
      battingPosition: atBat.battingPosition,
      result: atBat.result.value,
      rbis: atBat.rbis,
      runsScored: atBat.runsScored,
      baserunnersBefore: this.baserunnerStateToRecord(atBat.baserunnersBefore),
      baserunnersAfter: this.baserunnerStateToRecord(atBat.baserunnersAfter),
      createdAt: atBat.createdAt,
      updatedAt: atBat.updatedAt,
    };

    await this.db.table('atBats').put(atBatRecord);
    return atBat;
  }

  public async findById(id: string): Promise<AtBat | null> {
    const record = await this.db.table('atBats').get(id);

    if (!record) {
      return null;
    }

    return this.recordToAtBat(record);
  }

  public async findByGameId(gameId: string): Promise<AtBat[]> {
    const records = await this.db
      .table('atBats')
      .where('gameId')
      .equals(gameId)
      .toArray();

    return records.map((record) => this.recordToAtBat(record));
  }

  public async findByInningId(inningId: string): Promise<AtBat[]> {
    const records = await this.db
      .table('atBats')
      .where('inningId')
      .equals(inningId)
      .toArray();

    return records.map((record) => this.recordToAtBat(record));
  }

  public async findByBatterId(batterId: string): Promise<AtBat[]> {
    const records = await this.db
      .table('atBats')
      .where('batterId')
      .equals(batterId)
      .toArray();

    return records.map((record) => this.recordToAtBat(record));
  }

  public async findByBattingPosition(
    gameId: string,
    position: number
  ): Promise<AtBat[]> {
    const records = await this.db
      .table('atBats')
      .where('gameId')
      .equals(gameId)
      .and((record: AtBatRecord) => record.battingPosition === position)
      .toArray();

    return records.map((record) => this.recordToAtBat(record));
  }

  public async delete(id: string): Promise<void> {
    await this.db.table('atBats').delete(id);
  }

  public async getPlayerStatistics(
    batterId: string
  ): Promise<PlayerStatistics> {
    const atBats = await this.findByBatterId(batterId);

    if (atBats.length === 0) {
      return Player.createEmptyStatistics();
    }

    let atBatCount = 0;
    let hits = 0;
    let runs = 0;
    let rbis = 0;
    let singles = 0;
    let doubles = 0;
    let triples = 0;
    let homeRuns = 0;
    let walks = 0;
    let strikeouts = 0;

    atBats.forEach((atBat) => {
      // Count runs if this batter scored
      if (atBat.runsScored.includes(batterId)) {
        runs++;
      }

      rbis += atBat.rbis;

      const result = atBat.result.value;

      // Count walks separately (not at-bats)
      if (result === 'BB' || result === 'IBB') {
        walks++;
        return;
      }

      // Count at-bats (excludes walks and sacrifices)
      if (result !== 'SF') {
        atBatCount++;
      }

      // Count hits
      if (atBat.result.isHit()) {
        hits++;

        switch (result) {
          case '1B':
            singles++;
            break;
          case '2B':
            doubles++;
            break;
          case '3B':
            triples++;
            break;
          case 'HR':
            homeRuns++;
            break;
        }
      }

      // Count strikeouts
      if (result === 'SO') {
        strikeouts++;
      }
    });

    const battingAverage = atBatCount > 0 ? hits / atBatCount : 0;
    const onBasePercentage =
      atBatCount + walks > 0 ? (hits + walks) / (atBatCount + walks) : 0;
    const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
    const sluggingPercentage = atBatCount > 0 ? totalBases / atBatCount : 0;

    return {
      games: 0, // Would need game-level tracking
      atBats: atBatCount,
      hits,
      runs,
      rbis,
      singles,
      doubles,
      triples,
      homeRuns,
      walks,
      strikeouts,
      battingAverage,
      onBasePercentage,
      sluggingPercentage,
    };
  }

  public async getGameStatistics(gameId: string): Promise<{
    totalAtBats: number;
    totalHits: number;
    totalRuns: number;
    totalRBIs: number;
    teamBattingAverage: number;
  }> {
    const atBats = await this.findByGameId(gameId);

    if (atBats.length === 0) {
      return {
        totalAtBats: 0,
        totalHits: 0,
        totalRuns: 0,
        totalRBIs: 0,
        teamBattingAverage: 0,
      };
    }

    let totalAtBats = 0;
    let totalHits = 0;
    let totalRuns = 0;
    let totalRBIs = 0;

    atBats.forEach((atBat) => {
      totalRuns += atBat.runsScored.length;
      totalRBIs += atBat.rbis;

      // Don't count walks as at-bats
      if (
        atBat.result.value !== 'BB' &&
        atBat.result.value !== 'IBB' &&
        atBat.result.value !== 'SF'
      ) {
        totalAtBats++;
      }

      if (atBat.result.isHit()) {
        totalHits++;
      }
    });

    const teamBattingAverage = totalAtBats > 0 ? totalHits / totalAtBats : 0;

    return {
      totalAtBats,
      totalHits,
      totalRuns,
      totalRBIs,
      teamBattingAverage,
    };
  }

  public async findHitsOnly(gameId: string): Promise<AtBat[]> {
    const atBats = await this.findByGameId(gameId);
    return atBats.filter((atBat) => atBat.result.isHit());
  }

  public async findWithRBIs(gameId: string): Promise<AtBat[]> {
    const atBats = await this.findByGameId(gameId);
    return atBats.filter((atBat) => atBat.rbis > 0);
  }

  private baserunnerStateToRecord(state: BaserunnerState): {
    firstBase: string | null;
    secondBase: string | null;
    thirdBase: string | null;
  } {
    return {
      firstBase: state.firstBase,
      secondBase: state.secondBase,
      thirdBase: state.thirdBase,
    };
  }

  private recordToBaserunnerState(record: {
    firstBase: string | null;
    secondBase: string | null;
    thirdBase: string | null;
  }): BaserunnerState {
    return new BaserunnerState(
      record.firstBase,
      record.secondBase,
      record.thirdBase
    );
  }

  private recordToAtBat(record: {
    id: string;
    gameId: string;
    inningId: string;
    batterId: string;
    battingPosition: number;
    result: string;
    description?: string;
    rbis: number;
    runsScored: string[];
    runningErrors?: string[];
    baserunnersBefore: {
      firstBase: string | null;
      secondBase: string | null;
      thirdBase: string | null;
    };
    baserunnersAfter: {
      firstBase: string | null;
      secondBase: string | null;
      thirdBase: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
  }): AtBat {
    return new AtBat(
      record.id,
      record.gameId,
      record.inningId,
      record.batterId,
      record.battingPosition,
      new BattingResult(record.result),
      record.description || '', // Default empty description for backward compatibility
      record.rbis,
      record.runsScored,
      record.runningErrors || [], // Default empty array for backward compatibility
      this.recordToBaserunnerState(record.baserunnersBefore),
      this.recordToBaserunnerState(record.baserunnersAfter),
      record.createdAt,
      record.updatedAt
    );
  }

  public async findWithRunningErrors(gameId: string): Promise<AtBat[]> {
    const records = await this.db
      .table('atBats')
      .where('gameId')
      .equals(gameId)
      .filter(
        (record) => record.runningErrors && record.runningErrors.length > 0
      )
      .toArray();

    return records.map((record) => this.recordToAtBat(record));
  }

  public async getPlayerRunningErrorStats(batterId: string): Promise<{
    totalRunningErrors: number;
    gamesWithRunningErrors: number;
    atBatsWithRunningErrors: number;
  }> {
    const atBats = await this.db
      .table('atBats')
      .where('batterId')
      .equals(batterId)
      .toArray();

    let totalRunningErrors = 0;
    let atBatsWithRunningErrors = 0;
    const gamesWithErrors = new Set<string>();

    atBats.forEach((atBat) => {
      if (atBat.runningErrors && atBat.runningErrors.length > 0) {
        totalRunningErrors += atBat.runningErrors.length;
        atBatsWithRunningErrors++;
        gamesWithErrors.add(atBat.gameId);
      }
    });

    return {
      totalRunningErrors,
      gamesWithRunningErrors: gamesWithErrors.size,
      atBatsWithRunningErrors,
    };
  }
}
