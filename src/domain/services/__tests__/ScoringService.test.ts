import { ScoringService } from '../ScoringService';
import { BattingResult, BaserunnerState } from '../../values';
import { Player, AtBat } from '../../entities';

describe('ScoringService', () => {
  let scoringService: ScoringService;
  let mockStatisticsService: any;

  beforeEach(() => {
    mockStatisticsService = {
      calculateRBIs: jest.fn(),
      updatePlayerStatistics: jest.fn(),
      calculateBattingAverage: jest.fn(),
      calculateOnBasePercentage: jest.fn(),
      calculateSluggingPercentage: jest.fn(),
      calculateTeamBattingAverage: jest.fn(),
    };
    scoringService = new ScoringService(mockStatisticsService);
  });

  describe('calculateBaserunnerAdvancement', () => {
    it('should handle home run correctly', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = scoringService.calculateBaserunnerAdvancement(
        BattingResult.homeRun(),
        state,
        'batter'
      );

      expect(result.runsScored).toEqual([
        'player1',
        'player2',
        'player3',
        'batter',
      ]);
      expect(result.newState.isEmpty()).toBe(true);
      expect(result.battingAdvancement).toBe(4);
    });

    it('should handle single correctly', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = scoringService.calculateBaserunnerAdvancement(
        BattingResult.single(),
        state,
        'batter'
      );

      expect(result.runsScored).toEqual(['player3']);
      expect(result.newState.firstBase).toBe('batter');
      expect(result.newState.secondBase).toBe('player1');
      expect(result.newState.thirdBase).toBe('player2');
      expect(result.battingAdvancement).toBe(1);
    });

    it('should handle walk with loaded bases', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = scoringService.calculateBaserunnerAdvancement(
        BattingResult.walk(),
        state,
        'batter'
      );

      expect(result.runsScored).toEqual(['player3']);
      expect(result.newState.firstBase).toBe('batter');
      expect(result.newState.secondBase).toBe('player1');
      expect(result.newState.thirdBase).toBe('player2');
    });

    it('should handle strikeout with no advancement', () => {
      const state = new BaserunnerState('player1', 'player2', 'player3');
      const result = scoringService.calculateBaserunnerAdvancement(
        BattingResult.strikeout(),
        state,
        'batter'
      );

      expect(result.runsScored).toEqual([]);
      expect(result.newState.equals(state)).toBe(true);
      expect(result.battingAdvancement).toBe(0);
    });
  });

  describe('calculateRBIs', () => {
    it('should calculate RBIs for home run', () => {
      const before = new BaserunnerState('player1', 'player2', 'player3');
      const after = BaserunnerState.empty();
      const runsScored = ['player1', 'player2', 'player3', 'batter'];

      mockStatisticsService.calculateRBIs.mockReturnValue({
        rbis: 4,
        explanation: 'Home run with 3 on base',
      });

      const rbis = scoringService.calculateRBIs(
        BattingResult.homeRun(),
        before,
        after,
        runsScored
      );

      expect(rbis).toBe(4);
    });

    it('should not give RBIs for walk unless bases loaded', () => {
      const before = new BaserunnerState('player1', null, null);
      const after = new BaserunnerState('batter', 'player1', null);

      mockStatisticsService.calculateRBIs.mockReturnValue({
        rbis: 0,
        explanation: 'Walk with no runs scored',
      });

      const rbis = scoringService.calculateRBIs(
        BattingResult.walk(),
        before,
        after,
        []
      );

      expect(rbis).toBe(0);
    });

    it('should give RBI for sacrifice fly', () => {
      const before = new BaserunnerState(null, null, 'player1');
      const after = new BaserunnerState(null, null, null);
      const runsScored = ['player1'];

      mockStatisticsService.calculateRBIs.mockReturnValue({
        rbis: 1,
        explanation: 'Sacrifice fly with runner scoring',
      });

      const rbis = scoringService.calculateRBIs(
        BattingResult.sacrificeFly(),
        before,
        after,
        runsScored
      );

      expect(rbis).toBe(1);
    });

    it('should not give RBIs for error', () => {
      const before = new BaserunnerState(null, null, 'player1');
      const after = new BaserunnerState('batter', null, null);
      const runsScored = ['player1'];

      mockStatisticsService.calculateRBIs.mockReturnValue({
        rbis: 0,
        explanation: 'No RBIs on errors',
      });

      const rbis = scoringService.calculateRBIs(
        BattingResult.error(),
        before,
        after,
        runsScored
      );

      expect(rbis).toBe(0);
    });
  });

  describe('statistical calculations', () => {
    it('should calculate batting average', () => {
      mockStatisticsService.calculateBattingAverage
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0);

      expect(scoringService.calculateBattingAverage(3, 10)).toBe(0.3);
      expect(scoringService.calculateBattingAverage(0, 0)).toBe(0);
    });

    it('should calculate on-base percentage', () => {
      mockStatisticsService.calculateOnBasePercentage.mockReturnValue(0.417);

      const obp = scoringService.calculateOnBasePercentage(3, 2, 0, 10, 0);
      expect(obp).toBe(0.417); // (3 hits + 2 walks) / (10 at-bats + 2 walks) rounded to 3 decimal places
    });

    it('should calculate slugging percentage', () => {
      mockStatisticsService.calculateSluggingPercentage.mockReturnValue(1.0);

      const slg = scoringService.calculateSluggingPercentage(1, 1, 1, 1, 10);
      expect(slg).toBe(1.0); // (1 + 2 + 3 + 4) / 10
    });
  });

  describe('updatePlayerStatistics', () => {
    it('should update statistics correctly for a hit', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      const atBat = new AtBat(
        'atbat1',
        'game1',
        'inning1',
        'player1',
        1,
        BattingResult.double(),
        'Double to left field',
        1,
        ['player2'],
        [],
        BaserunnerState.empty(),
        new BaserunnerState(null, 'player1', null)
      );

      const expectedStats = {
        atBats: 1,
        hits: 1,
        doubles: 1,
        rbis: 1,
        battingAverage: 1.0,
      };
      mockStatisticsService.updatePlayerStatistics.mockReturnValue(
        expectedStats
      );

      const newStats = scoringService.updatePlayerStatistics(player, atBat);

      expect(newStats.atBats).toBe(1);
      expect(newStats.hits).toBe(1);
      expect(newStats.doubles).toBe(1);
      expect(newStats.rbis).toBe(1);
      expect(newStats.battingAverage).toBe(1.0);
    });

    it('should not count walks as at-bats', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      const atBat = new AtBat(
        'atbat1',
        'game1',
        'inning1',
        'player1',
        1,
        BattingResult.walk(),
        'Walk on 4 pitches',
        0,
        [],
        [],
        BaserunnerState.empty(),
        new BaserunnerState('player1', null, null)
      );

      const expectedStats = {
        atBats: 0,
        walks: 1,
        hits: 0,
      };
      mockStatisticsService.updatePlayerStatistics.mockReturnValue(
        expectedStats
      );

      const newStats = scoringService.updatePlayerStatistics(player, atBat);

      expect(newStats.atBats).toBe(0);
      expect(newStats.walks).toBe(1);
      expect(newStats.hits).toBe(0);
    });

    it('should count runs when player scores', () => {
      const player = new Player('player1', 'John Doe', 23, 'team1');
      const atBat = new AtBat(
        'atbat1',
        'game1',
        'inning1',
        'player2', // Different batter
        2,
        BattingResult.single(),
        'RBI single to center',
        1,
        ['player1'], // This player scored
        [],
        new BaserunnerState(null, null, 'player1'),
        new BaserunnerState('player2', null, null)
      );

      const expectedStats = {
        runs: 1,
      };
      mockStatisticsService.updatePlayerStatistics.mockReturnValue(
        expectedStats
      );

      const newStats = scoringService.updatePlayerStatistics(player, atBat);

      expect(newStats.runs).toBe(1);
    });
  });

  describe('outs calculation', () => {
    it('should calculate outs correctly', () => {
      expect(scoringService.calculateOuts(BattingResult.strikeout())).toBe(1);
      expect(scoringService.calculateOuts(BattingResult.doublePlay())).toBe(2);
      expect(scoringService.calculateOuts(BattingResult.single())).toBe(0);
    });

    it('should determine inning end', () => {
      expect(scoringService.shouldEndInning(3)).toBe(true);
      expect(scoringService.shouldEndInning(2)).toBe(false);
    });
  });
});
