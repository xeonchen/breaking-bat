import { StatisticsCalculationService } from '../StatisticsCalculationService';
import { Player, AtBat, BattingResult, BaserunnerState } from '@/domain';

describe('StatisticsCalculationService', () => {
  let service: StatisticsCalculationService;

  beforeEach(() => {
    service = new StatisticsCalculationService();
  });

  const createMockPlayer = (overrideStats = {}): Player => {
    const defaultStats = {
      games: 10,
      atBats: 20,
      hits: 8,
      runs: 5,
      rbis: 6,
      walks: 3,
      strikeouts: 4,
      singles: 4,
      doubles: 2,
      triples: 1,
      homeRuns: 1,
      battingAverage: 0.4,
      onBasePercentage: 0.478,
      sluggingPercentage: 0.65,
    };

    const finalStats = { ...defaultStats, ...overrideStats };

    return new Player(
      'player-1',
      'Test Player',
      1,
      'team-1',
      [], // positions
      true, // isActive
      finalStats
    );
  };

  const createMockAtBat = (
    result: BattingResult,
    rbis: number = 0,
    runsScored: string[] = []
  ): AtBat => {
    // Ensure runsScored array is adequate for RBI validation
    const finalRunsScored =
      rbis > runsScored.length
        ? [...runsScored, ...Array(rbis - runsScored.length).fill('runner-x')]
        : runsScored;

    const atBat = new AtBat(
      'atbat-1',
      'game-1',
      'inning-1',
      'player-1',
      1,
      result,
      'Test at-bat',
      rbis,
      finalRunsScored,
      [],
      new BaserunnerState(null, null, null),
      new BaserunnerState(null, null, null)
    );

    // Mock the isHit method
    (atBat as any).isHit = jest
      .fn()
      .mockReturnValue(['1B', '2B', '3B', 'HR'].includes(result.value));

    return atBat;
  };

  describe('calculateRBIs', () => {
    const mockBaserunnerState = new BaserunnerState(
      null,
      'runner-2',
      'runner-3'
    );

    it('should calculate RBIs for a single', () => {
      const result = service.calculateRBIs(
        new BattingResult('1B'),
        mockBaserunnerState,
        ['runner-3'],
        'batter-1'
      );

      expect(result.rbis).toBe(1);
      expect(result.explanation).toBe('Single: 1 RBI for runners scored');
    });

    it('should calculate RBIs for a home run', () => {
      const result = service.calculateRBIs(
        new BattingResult('HR'),
        mockBaserunnerState,
        ['runner-2', 'runner-3', 'batter-1'],
        'batter-1'
      );

      expect(result.rbis).toBe(3);
      expect(result.explanation).toBe('Home run: 3 RBIs (including batter)');
    });

    it('should calculate RBIs for a sacrifice fly', () => {
      const result = service.calculateRBIs(
        new BattingResult('SF'),
        mockBaserunnerState,
        ['runner-3'],
        'batter-1'
      );

      expect(result.rbis).toBe(1);
      expect(result.explanation).toBe(
        'Sacrifice fly: 1 RBI even though batter is out'
      );
    });

    it('should not award RBIs for walks unless bases loaded', () => {
      const result = service.calculateRBIs(
        new BattingResult('BB'),
        mockBaserunnerState,
        [],
        'batter-1'
      );

      expect(result.rbis).toBe(0);
      expect(result.explanation).toBe(
        'Walk with bases not loaded produces no RBIs'
      );
    });

    it('should award RBIs for walks with bases loaded', () => {
      const basesLoaded = new BaserunnerState(
        'runner-1',
        'runner-2',
        'runner-3'
      );
      const result = service.calculateRBIs(
        new BattingResult('BB'),
        basesLoaded,
        ['runner-3'],
        'batter-1'
      );

      expect(result.rbis).toBe(1);
      expect(result.explanation).toBe(
        'Walk with bases loaded forces runners home'
      );
    });

    it('should not award RBIs for errors', () => {
      const result = service.calculateRBIs(
        new BattingResult('E'),
        mockBaserunnerState,
        ['runner-3'],
        'batter-1'
      );

      expect(result.rbis).toBe(0);
      expect(result.explanation).toBe(
        'No RBIs awarded for runs scored on errors'
      );
    });

    it('should cap RBIs at 4 per at-bat', () => {
      const result = service.calculateRBIs(
        new BattingResult('HR'),
        mockBaserunnerState,
        ['r1', 'r2', 'r3', 'r4', 'r5'], // 5 runs somehow
        'batter-1'
      );

      expect(result.rbis).toBe(4);
    });
  });

  describe('updatePlayerStatistics', () => {
    it('should update statistics for a single', () => {
      const player = createMockPlayer();
      const atBat = createMockAtBat(new BattingResult('1B'), 1, ['runner-1']);

      const updatedStats = service.updatePlayerStatistics(player, atBat);

      expect(updatedStats.atBats).toBe(21); // 20 + 1
      expect(updatedStats.hits).toBe(9); // 8 + 1
      expect(updatedStats.singles).toBe(5); // 4 + 1
      expect(updatedStats.rbis).toBe(7); // 6 + 1
      expect(updatedStats.runs).toBe(5); // unchanged (player didn't score)
    });

    it('should update statistics for a home run where player scores', () => {
      const player = createMockPlayer();
      // For home run, batter always scores, so include 3 runs: 2 baserunners + batter
      const atBat = createMockAtBat(new BattingResult('HR'), 3, [
        'runner-1',
        'runner-2',
        'player-1',
      ]);

      const updatedStats = service.updatePlayerStatistics(player, atBat);

      expect(updatedStats.hits).toBe(9);
      expect(updatedStats.homeRuns).toBe(2); // 1 + 1
      expect(updatedStats.rbis).toBe(9); // 6 + 3
      expect(updatedStats.runs).toBe(6); // 5 + 1 (player scored)
    });

    it('should not count at-bats for walks and sacrifice flies', () => {
      const player = createMockPlayer();
      const walkAtBat = createMockAtBat(new BattingResult('BB'), 0);
      const sfAtBat = createMockAtBat(new BattingResult('SF'), 1);

      const afterWalk = service.updatePlayerStatistics(player, walkAtBat);
      expect(afterWalk.atBats).toBe(20); // unchanged

      const afterSF = service.updatePlayerStatistics(player, sfAtBat);
      expect(afterSF.atBats).toBe(20); // unchanged
    });

    it('should update walk and strikeout counts', () => {
      const player = createMockPlayer();
      const walkAtBat = createMockAtBat(new BattingResult('BB'), 0);
      const strikeoutAtBat = createMockAtBat(new BattingResult('SO'), 0);

      const afterWalk = service.updatePlayerStatistics(player, walkAtBat);
      expect(afterWalk.walks).toBe(4); // 3 + 1

      const afterStrikeout = service.updatePlayerStatistics(
        player,
        strikeoutAtBat
      );
      expect(afterStrikeout.strikeouts).toBe(5); // 4 + 1
    });

    it('should recalculate derived statistics', () => {
      const player = createMockPlayer({ atBats: 10, hits: 3, walks: 2 });
      const hitAtBat = createMockAtBat(new BattingResult('2B'), 1);

      const updatedStats = service.updatePlayerStatistics(player, hitAtBat);

      expect(updatedStats.battingAverage).toBe(0.364); // 4/11 = 0.364
      expect(updatedStats.onBasePercentage).toBeCloseTo(0.462, 3); // (4+2)/(11+2+0) = 6/13 ≈ 0.462
    });
  });

  describe('calculateBattingAverage', () => {
    it('should calculate batting average correctly', () => {
      const avg = service.calculateBattingAverage(15, 50);
      expect(avg).toBe(0.3);
    });

    it('should return 0 for no at-bats', () => {
      const avg = service.calculateBattingAverage(0, 0);
      expect(avg).toBe(0);
    });

    it('should round to 3 decimal places', () => {
      const avg = service.calculateBattingAverage(1, 3);
      expect(avg).toBe(0.333);
    });
  });

  describe('calculateOnBasePercentage', () => {
    it('should calculate OBP correctly', () => {
      const obp = service.calculateOnBasePercentage(15, 8, 2, 50, 3);
      // (15 + 8 + 2) / (50 + 8 + 2 + 3) = 25/63 ≈ 0.397
      expect(obp).toBe(0.397);
    });

    it('should return 0 for no plate appearances', () => {
      const obp = service.calculateOnBasePercentage(0, 0, 0, 0, 0);
      expect(obp).toBe(0);
    });
  });

  describe('calculateSluggingPercentage', () => {
    it('should calculate slugging percentage correctly', () => {
      const slg = service.calculateSluggingPercentage(10, 5, 2, 3, 50);
      // (10*1 + 5*2 + 2*3 + 3*4) / 50 = (10 + 10 + 6 + 12) / 50 = 38/50 = 0.760
      expect(slg).toBe(0.76);
    });

    it('should return 0 for no at-bats', () => {
      const slg = service.calculateSluggingPercentage(0, 0, 0, 0, 0);
      expect(slg).toBe(0);
    });
  });

  describe('calculateOPS', () => {
    it('should calculate OPS correctly', () => {
      const ops = service.calculateOPS(0.35, 0.45);
      expect(ops).toBe(0.8);
    });

    it('should round to 3 decimal places', () => {
      const ops = service.calculateOPS(0.3333, 0.4444);
      expect(ops).toBe(0.778);
    });
  });

  describe('calculateTeamBattingAverage', () => {
    it('should calculate team average from multiple players', () => {
      const players = [
        createMockPlayer({ hits: 10, atBats: 30 }),
        createMockPlayer({ hits: 15, atBats: 40 }),
        createMockPlayer({ hits: 5, atBats: 20 }),
      ];

      const teamAvg = service.calculateTeamBattingAverage(players);
      // (10 + 15 + 5) / (30 + 40 + 20) = 30/90 = 0.333
      expect(teamAvg).toBe(0.333);
    });

    it('should handle empty team', () => {
      const teamAvg = service.calculateTeamBattingAverage([]);
      expect(teamAvg).toBe(0);
    });
  });

  describe('calculateTeamStatistics', () => {
    it('should calculate comprehensive team statistics', () => {
      const players = [
        createMockPlayer({
          atBats: 30,
          hits: 12,
          runs: 8,
          rbis: 10,
          walks: 5,
          strikeouts: 6,
          singles: 8,
          doubles: 2,
          triples: 1,
          homeRuns: 1,
        }),
        createMockPlayer({
          atBats: 40,
          hits: 16,
          runs: 12,
          rbis: 15,
          walks: 8,
          strikeouts: 10,
          singles: 10,
          doubles: 4,
          triples: 1,
          homeRuns: 1,
        }),
      ];

      const teamStats = service.calculateTeamStatistics(players);

      expect(teamStats.totalAtBats).toBe(70);
      expect(teamStats.totalHits).toBe(28);
      expect(teamStats.totalRuns).toBe(20);
      expect(teamStats.totalRBIs).toBe(25);
      expect(teamStats.totalWalks).toBe(13);
      expect(teamStats.totalStrikeouts).toBe(16);
      expect(teamStats.teamBattingAverage).toBe(0.4); // 28/70
      expect(teamStats.teamOnBasePercentage).toBeCloseTo(0.494, 3); // (28+13)/(70+13) ≈ 0.494
      expect(teamStats.teamSluggingPercentage).toBeCloseTo(0.629, 3); // Calculate actual: (18*1 + 6*2 + 2*3 + 2*4)/70 = 44/70 = 0.629
      expect(teamStats.teamOPS).toBeCloseTo(1.123, 3); // 0.494 + 0.629 = 1.123
    });
  });

  describe('validateStatistics', () => {
    it('should validate correct statistics', () => {
      const stats = {
        games: 10,
        atBats: 50,
        hits: 20,
        battingAverage: 0.4,
        onBasePercentage: 0.45,
        sluggingPercentage: 0.6,
        singles: 12,
        doubles: 4,
        triples: 2,
        homeRuns: 2,
        runs: 15,
        rbis: 18,
        walks: 8,
        strikeouts: 12,
      };

      const result = service.validateStatistics(stats);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject hits exceeding at-bats', () => {
      const stats = {
        games: 10,
        atBats: 50,
        hits: 55, // More hits than at-bats
        battingAverage: 0.4,
        onBasePercentage: 0.45,
        sluggingPercentage: 0.6,
        singles: 12,
        doubles: 4,
        triples: 2,
        homeRuns: 2,
        runs: 15,
        rbis: 18,
        walks: 8,
        strikeouts: 12,
      };

      const result = service.validateStatistics(stats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hits cannot exceed at-bats');
    });

    it('should reject impossible batting averages', () => {
      const stats = {
        games: 10,
        atBats: 50,
        hits: 20,
        battingAverage: 1.5, // Impossible
        onBasePercentage: 0.45,
        sluggingPercentage: 0.6,
        singles: 12,
        doubles: 4,
        triples: 2,
        homeRuns: 2,
        runs: 15,
        rbis: 18,
        walks: 8,
        strikeouts: 12,
      };

      const result = service.validateStatistics(stats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Batting average cannot exceed 1.000');
    });

    it('should reject mismatched hit types', () => {
      const stats = {
        games: 10,
        atBats: 50,
        hits: 20,
        battingAverage: 0.4,
        onBasePercentage: 0.45,
        sluggingPercentage: 0.6,
        singles: 12,
        doubles: 4,
        triples: 2,
        homeRuns: 1, // Total = 19, but hits = 20
        runs: 15,
        rbis: 18,
        walks: 8,
        strikeouts: 12,
      };

      const result = service.validateStatistics(stats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sum of hit types must equal total hits');
    });

    it('should reject impossible slugging percentage', () => {
      const stats = {
        games: 10,
        atBats: 50,
        hits: 20,
        battingAverage: 0.4,
        onBasePercentage: 0.45,
        sluggingPercentage: 5.0, // Impossible
        singles: 12,
        doubles: 4,
        triples: 2,
        homeRuns: 2,
        runs: 15,
        rbis: 18,
        walks: 8,
        strikeouts: 12,
      };

      const result = service.validateStatistics(stats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Slugging percentage cannot exceed 4.000'
      );
    });
  });
});
