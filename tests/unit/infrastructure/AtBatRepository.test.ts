import { AtBat, AtBatRepository } from '@/domain';
import { BattingResult, BaserunnerState } from '@/domain/values';
import { IndexedDBAtBatRepository } from '@/infrastructure/repositories/IndexedDBAtBatRepository';
import {
  clearTestDatabase,
  createTestDatabase,
} from '../../test-helpers/database';

describe('AtBatRepository', () => {
  let repository: AtBatRepository;
  let testAtBat: AtBat;
  let baserunnersBefore: BaserunnerState;
  let baserunnersAfter: BaserunnerState;

  beforeEach(async () => {
    await createTestDatabase();
    repository = new IndexedDBAtBatRepository();

    baserunnersBefore = new BaserunnerState('player1', null, 'player3');
    baserunnersAfter = new BaserunnerState('batter', 'player1', null);

    testAtBat = new AtBat(
      'atbat1',
      'game1',
      'inning1',
      'batter1',
      1,
      BattingResult.double(),
      2,
      ['player3'],
      baserunnersBefore,
      baserunnersAfter
    );
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  describe('save', () => {
    it('should save a new at-bat', async () => {
      const savedAtBat = await repository.save(testAtBat);

      expect(savedAtBat.id).toBe(testAtBat.id);
      expect(savedAtBat.batterId).toBe('batter1');
      expect(savedAtBat.result.value).toBe('2B');
      expect(savedAtBat.rbis).toBe(2);
      expect(savedAtBat.runsScored).toEqual(['player3']);
    });

    it('should update an existing at-bat', async () => {
      await repository.save(testAtBat);

      const correctedAtBat = testAtBat.updateResult(
        BattingResult.triple(),
        3,
        ['player3', 'player1'],
        new BaserunnerState('batter', null, null)
      );
      const savedAtBat = await repository.save(correctedAtBat);

      expect(savedAtBat.result.value).toBe('3B');
      expect(savedAtBat.rbis).toBe(3);
      expect(savedAtBat.runsScored).toEqual(['player3', 'player1']);
      expect(savedAtBat.updatedAt).not.toBe(testAtBat.updatedAt);
    });
  });

  describe('findById', () => {
    it('should find at-bat by id', async () => {
      await repository.save(testAtBat);

      const foundAtBat = await repository.findById('atbat1');

      expect(foundAtBat).not.toBeNull();
      expect(foundAtBat?.batterId).toBe('batter1');
    });

    it('should return null when at-bat not found', async () => {
      const foundAtBat = await repository.findById('nonexistent');

      expect(foundAtBat).toBeNull();
    });
  });

  describe('findByGameId', () => {
    it('should find all at-bats for a game', async () => {
      const atBat2 = new AtBat(
        'atbat2',
        'game1',
        'inning2',
        'batter2',
        2,
        BattingResult.single(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter2', null, null)
      );
      const atBat3 = new AtBat(
        'atbat3',
        'game2',
        'inning1',
        'batter3',
        1,
        BattingResult.homeRun(),
        1,
        ['batter3'],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );

      await repository.save(testAtBat);
      await repository.save(atBat2);
      await repository.save(atBat3);

      const game1AtBats = await repository.findByGameId('game1');

      expect(game1AtBats).toHaveLength(2);
      expect(game1AtBats.map((ab) => ab.batterId)).toContain('batter1');
      expect(game1AtBats.map((ab) => ab.batterId)).toContain('batter2');
    });

    it('should return empty array when no at-bats found for game', async () => {
      const atBats = await repository.findByGameId('nonexistent');

      expect(atBats).toEqual([]);
    });
  });

  describe('findByInningId', () => {
    it('should find all at-bats for an inning', async () => {
      const atBat2 = new AtBat(
        'atbat2',
        'game1',
        'inning1',
        'batter2',
        2,
        BattingResult.strikeout(),
        0,
        [],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );
      const atBat3 = new AtBat(
        'atbat3',
        'game1',
        'inning2',
        'batter3',
        3,
        BattingResult.walk(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter3', null, null)
      );

      await repository.save(testAtBat);
      await repository.save(atBat2);
      await repository.save(atBat3);

      const inning1AtBats = await repository.findByInningId('inning1');

      expect(inning1AtBats).toHaveLength(2);
      expect(inning1AtBats.map((ab) => ab.batterId)).toContain('batter1');
      expect(inning1AtBats.map((ab) => ab.batterId)).toContain('batter2');
    });
  });

  describe('findByBatterId', () => {
    it('should find all at-bats for a batter', async () => {
      const atBat2 = new AtBat(
        'atbat2',
        'game2',
        'inning1',
        'batter1',
        1,
        BattingResult.single(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter1', null, null)
      );
      const atBat3 = new AtBat(
        'atbat3',
        'game1',
        'inning2',
        'batter2',
        2,
        BattingResult.homeRun(),
        1,
        ['batter2'],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );

      await repository.save(testAtBat);
      await repository.save(atBat2);
      await repository.save(atBat3);

      const batter1AtBats = await repository.findByBatterId('batter1');

      expect(batter1AtBats).toHaveLength(2);
      expect(batter1AtBats.map((ab) => ab.result.value)).toContain('2B');
      expect(batter1AtBats.map((ab) => ab.result.value)).toContain('1B');
    });
  });

  describe('findByBattingPosition', () => {
    it('should find at-bats by batting position in game', async () => {
      const atBat2 = new AtBat(
        'atbat2',
        'game1',
        'inning2',
        'batter2',
        1,
        BattingResult.walk(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter2', null, null)
      );
      const atBat3 = new AtBat(
        'atbat3',
        'game1',
        'inning3',
        'batter3',
        2,
        BattingResult.single(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter3', null, null)
      );

      await repository.save(testAtBat); // position 1
      await repository.save(atBat2); // position 1
      await repository.save(atBat3); // position 2

      const position1AtBats = await repository.findByBattingPosition(
        'game1',
        1
      );

      expect(position1AtBats).toHaveLength(2);
      expect(position1AtBats.map((ab) => ab.batterId)).toContain('batter1');
      expect(position1AtBats.map((ab) => ab.batterId)).toContain('batter2');
    });
  });

  describe('delete', () => {
    it('should delete at-bat by id', async () => {
      await repository.save(testAtBat);

      await repository.delete('atbat1');

      const foundAtBat = await repository.findById('atbat1');
      expect(foundAtBat).toBeNull();
    });

    it('should not throw error when deleting nonexistent at-bat', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('getPlayerStatistics', () => {
    it('should calculate player statistics from at-bats', async () => {
      const homeRun = new AtBat(
        'atbat2',
        'game1',
        'inning2',
        'batter1',
        1,
        BattingResult.homeRun(),
        4,
        ['batter1'],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );
      const strikeout = new AtBat(
        'atbat3',
        'game1',
        'inning3',
        'batter1',
        1,
        BattingResult.strikeout(),
        0,
        [],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );

      await repository.save(testAtBat); // double, 2 RBIs
      await repository.save(homeRun); // home run, 4 RBIs
      await repository.save(strikeout); // strikeout, 0 RBIs

      const stats = await repository.getPlayerStatistics('batter1');

      expect(stats.atBats).toBe(3);
      expect(stats.hits).toBe(2);
      expect(stats.doubles).toBe(1);
      expect(stats.homeRuns).toBe(1);
      expect(stats.rbis).toBe(6);
      expect(stats.strikeouts).toBe(1);
      expect(stats.battingAverage).toBeCloseTo(0.667);
    });

    it('should return empty statistics when no at-bats found', async () => {
      const stats = await repository.getPlayerStatistics('nonexistent');

      expect(stats.atBats).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.battingAverage).toBe(0);
    });
  });

  describe('getGameStatistics', () => {
    it('should calculate game-wide statistics', async () => {
      const single = new AtBat(
        'atbat2',
        'game1',
        'inning1',
        'batter2',
        2,
        BattingResult.single(),
        1,
        ['player1'],
        new BaserunnerState('player1', null, null),
        new BaserunnerState('batter2', null, null)
      );
      const walk = new AtBat(
        'atbat3',
        'game1',
        'inning2',
        'batter3',
        3,
        BattingResult.walk(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter3', null, null)
      );

      await repository.save(testAtBat); // double, 2 RBIs, 1 run scored
      await repository.save(single); // single, 1 RBI, 1 run scored
      await repository.save(walk); // walk, 0 RBIs, 0 runs scored

      const stats = await repository.getGameStatistics('game1');

      expect(stats.totalAtBats).toBe(2); // walks don't count as at-bats
      expect(stats.totalHits).toBe(2);
      expect(stats.totalRuns).toBe(2);
      expect(stats.totalRBIs).toBe(3);
      expect(stats.teamBattingAverage).toBe(1.0); // 2 hits / 2 at-bats
    });

    it('should return zero statistics for nonexistent game', async () => {
      const stats = await repository.getGameStatistics('nonexistent');

      expect(stats.totalAtBats).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.teamBattingAverage).toBe(0);
    });
  });

  describe('findHitsOnly', () => {
    it('should find only at-bats that resulted in hits', async () => {
      const single = new AtBat(
        'atbat2',
        'game1',
        'inning2',
        'batter2',
        2,
        BattingResult.single(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter2', null, null)
      );
      const strikeout = new AtBat(
        'atbat3',
        'game1',
        'inning3',
        'batter3',
        3,
        BattingResult.strikeout(),
        0,
        [],
        BaserunnerState.empty(),
        BaserunnerState.empty()
      );

      await repository.save(testAtBat); // double (hit)
      await repository.save(single); // single (hit)
      await repository.save(strikeout); // strikeout (not hit)

      const hits = await repository.findHitsOnly('game1');

      expect(hits).toHaveLength(2);
      expect(hits.map((ab) => ab.result.value)).toContain('2B');
      expect(hits.map((ab) => ab.result.value)).toContain('1B');
    });
  });

  describe('findWithRBIs', () => {
    it('should find at-bats that produced RBIs', async () => {
      const walk = new AtBat(
        'atbat2',
        'game1',
        'inning2',
        'batter2',
        2,
        BattingResult.walk(),
        0,
        [],
        BaserunnerState.empty(),
        new BaserunnerState('batter2', null, null)
      );

      await repository.save(testAtBat); // 2 RBIs
      await repository.save(walk); // 0 RBIs

      const rbiAtBats = await repository.findWithRBIs('game1');

      expect(rbiAtBats).toHaveLength(1);
      expect(rbiAtBats[0].rbis).toBe(2);
    });
  });
});
