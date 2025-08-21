import { AtBatProcessingService, AtBatData } from '../AtBatProcessingService';
import { ScoringService } from '../ScoringService';
import { GameSessionService } from '../GameSessionService';
import {
  BattingResult,
  BaserunnerState as BaserunnerStateClass,
} from '@/domain';
import type { BaserunnerState } from '@/presentation/types/BaserunnerState';
import { StatisticsCalculationService } from '../StatisticsCalculationService';

describe('AtBatProcessingService', () => {
  let service: AtBatProcessingService;
  let mockScoringService: jest.Mocked<ScoringService>;
  let mockGameSessionService: jest.Mocked<GameSessionService>;

  const mockLineup = [
    { playerId: 'batter-1', playerName: 'Player 1' },
    { playerId: 'batter-2', playerName: 'Player 2' },
    { playerId: 'batter-3', playerName: 'Player 3' },
  ];

  beforeEach(() => {
    const mockStatisticsService = new StatisticsCalculationService();
    mockScoringService = new ScoringService(
      mockStatisticsService
    ) as jest.Mocked<ScoringService>;
    mockGameSessionService =
      new GameSessionService() as jest.Mocked<GameSessionService>;

    // Mock the scoring service methods
    mockScoringService.calculateBaserunnerAdvancement = jest.fn();
    mockScoringService.calculateOuts = jest.fn();

    // Mock the game session service methods
    mockGameSessionService.convertBaserunnerStateToClass = jest.fn();
    mockGameSessionService.convertBaserunnerStateToInterface = jest.fn();
    mockGameSessionService.advanceToNextBatter = jest.fn();

    service = new AtBatProcessingService(
      mockScoringService,
      mockGameSessionService
    );
  });

  describe('processAtBat', () => {
    it('should process a single with automatic advancement', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 1 },
        pitchSequence: ['B', 'S', 'B', 'X'],
      };

      const currentBaserunners: BaserunnerState = {
        first: null,
        second: { playerId: 'runner-2', playerName: 'Runner 2' },
        third: { playerId: 'runner-3', playerName: 'Runner 3' },
      };

      const mockBaserunnerClass = new BaserunnerStateClass(
        null,
        'runner-2',
        'runner-3'
      );
      const mockNewState = new BaserunnerStateClass(
        'batter-1',
        null,
        'runner-2'
      );
      const mockFinalBaserunners: BaserunnerState = {
        first: { playerId: 'batter-1', playerName: 'Batter 1' },
        second: null,
        third: { playerId: 'runner-2', playerName: 'Runner 2' },
      };

      mockGameSessionService.convertBaserunnerStateToClass.mockReturnValue(
        mockBaserunnerClass
      );
      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue({
        newState: mockNewState,
        runsScored: ['runner-3'],
        battingAdvancement: 1,
        automaticAdvancement: true,
      });
      mockScoringService.calculateOuts.mockReturnValue(0);
      mockGameSessionService.convertBaserunnerStateToInterface.mockReturnValue(
        mockFinalBaserunners
      );
      mockGameSessionService.advanceToNextBatter.mockReturnValue('batter-2');

      const result = service.processAtBat(
        atBatData,
        currentBaserunners,
        1,
        mockLineup
      );

      expect(result).toEqual({
        finalBaserunnerState: mockFinalBaserunners,
        runsScored: ['runner-3'],
        outsProduced: 0,
        nextBatterId: 'batter-2',
        shouldAdvanceInning: false,
      });

      expect(
        mockScoringService.calculateBaserunnerAdvancement
      ).toHaveBeenCalledWith(atBatData.result, mockBaserunnerClass, 'batter-1');
    });

    it('should process a strikeout with 2 outs and advance inning', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('SO'),
        finalCount: { balls: 1, strikes: 3 },
      };

      const currentBaserunners: BaserunnerState = {
        first: { playerId: 'runner-1', playerName: 'Runner 1' },
        second: null,
        third: null,
      };

      const mockBaserunnerClass = new BaserunnerStateClass(
        'runner-1',
        null,
        null
      );
      const mockFinalBaserunners: BaserunnerState = {
        first: { playerId: 'runner-1', playerName: 'Runner 1' },
        second: null,
        third: null,
      };

      mockGameSessionService.convertBaserunnerStateToClass.mockReturnValue(
        mockBaserunnerClass
      );
      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue({
        newState: mockBaserunnerClass,
        runsScored: [],
        battingAdvancement: 0,
        automaticAdvancement: true,
      });
      mockScoringService.calculateOuts.mockReturnValue(1);
      mockGameSessionService.convertBaserunnerStateToInterface.mockReturnValue(
        mockFinalBaserunners
      );
      mockGameSessionService.advanceToNextBatter.mockReturnValue('batter-2');

      const result = service.processAtBat(
        atBatData,
        currentBaserunners,
        2,
        mockLineup
      );

      expect(result).toEqual({
        finalBaserunnerState: mockFinalBaserunners,
        runsScored: [],
        outsProduced: 1,
        nextBatterId: 'batter-2',
        shouldAdvanceInning: true, // 2 + 1 = 3 outs
      });
    });

    it('should apply manual baserunner advancement when provided', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 3, strikes: 1 },
        baserunnerAdvancement: {
          first: 'third',
          second: 'home',
        },
      };

      const currentBaserunners: BaserunnerState = {
        first: { playerId: 'runner-1', playerName: 'Runner 1' },
        second: { playerId: 'runner-2', playerName: 'Runner 2' },
        third: null,
      };

      const mockBaserunnerClass = new BaserunnerStateClass(
        'runner-1',
        'runner-2',
        null
      );
      const mockNewState = new BaserunnerStateClass(
        'batter-1',
        null,
        'runner-1'
      );
      const mockFinalBaserunners: BaserunnerState = {
        first: { playerId: 'batter-1', playerName: 'Batter 1' },
        second: null,
        third: { playerId: 'runner-1', playerName: 'Runner 1' },
      };

      mockGameSessionService.convertBaserunnerStateToClass.mockReturnValue(
        mockBaserunnerClass
      );
      // Still need to call automatic advancement first, then override with manual
      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue({
        newState: mockNewState,
        runsScored: [],
        battingAdvancement: 1,
        automaticAdvancement: true,
      });
      mockScoringService.calculateOuts.mockReturnValue(0);
      mockGameSessionService.convertBaserunnerStateToInterface.mockReturnValue(
        mockFinalBaserunners
      );
      mockGameSessionService.advanceToNextBatter.mockReturnValue('batter-2');

      const result = service.processAtBat(
        atBatData,
        currentBaserunners,
        0,
        mockLineup
      );

      expect(result).toEqual({
        finalBaserunnerState: mockFinalBaserunners,
        runsScored: ['runner-2'], // runner-2 advanced home
        outsProduced: 0,
        nextBatterId: 'batter-2',
        shouldAdvanceInning: false,
      });

      // Should still call automatic advancement first
      expect(
        mockScoringService.calculateBaserunnerAdvancement
      ).toHaveBeenCalled();
    });
  });

  describe('processAutoCompletedAtBat', () => {
    it('should process a walk with correct count', () => {
      const result = new BattingResult('BB');
      const currentBaserunners: BaserunnerState = {
        first: null,
        second: null,
        third: null,
      };

      const mockBaserunnerClass = new BaserunnerStateClass(null, null, null);
      const mockNewState = new BaserunnerStateClass('batter-1', null, null);
      const mockFinalBaserunners: BaserunnerState = {
        first: { playerId: 'batter-1', playerName: 'Batter 1' },
        second: null,
        third: null,
      };

      mockGameSessionService.convertBaserunnerStateToClass.mockReturnValue(
        mockBaserunnerClass
      );
      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue({
        newState: mockNewState,
        runsScored: [],
        battingAdvancement: 1,
        automaticAdvancement: true,
      });
      mockScoringService.calculateOuts.mockReturnValue(0);
      mockGameSessionService.convertBaserunnerStateToInterface.mockReturnValue(
        mockFinalBaserunners
      );
      mockGameSessionService.advanceToNextBatter.mockReturnValue('batter-2');

      const processResult = service.processAutoCompletedAtBat(
        result,
        'batter-1',
        currentBaserunners,
        1,
        mockLineup
      );

      expect(processResult).toEqual({
        finalBaserunnerState: mockFinalBaserunners,
        runsScored: [],
        outsProduced: 0,
        nextBatterId: 'batter-2',
        shouldAdvanceInning: false,
      });
    });

    it('should process a strikeout with correct count', () => {
      const result = new BattingResult('SO');
      const currentBaserunners: BaserunnerState = {
        first: null,
        second: null,
        third: null,
      };

      const mockBaserunnerClass = new BaserunnerStateClass(null, null, null);
      const mockFinalBaserunners: BaserunnerState = {
        first: null,
        second: null,
        third: null,
      };

      mockGameSessionService.convertBaserunnerStateToClass.mockReturnValue(
        mockBaserunnerClass
      );
      mockScoringService.calculateBaserunnerAdvancement.mockReturnValue({
        newState: mockBaserunnerClass,
        runsScored: [],
        battingAdvancement: 0,
        automaticAdvancement: true,
      });
      mockScoringService.calculateOuts.mockReturnValue(1);
      mockGameSessionService.convertBaserunnerStateToInterface.mockReturnValue(
        mockFinalBaserunners
      );
      mockGameSessionService.advanceToNextBatter.mockReturnValue('batter-2');

      const processResult = service.processAutoCompletedAtBat(
        result,
        'batter-1',
        currentBaserunners,
        0,
        mockLineup
      );

      expect(processResult).toEqual({
        finalBaserunnerState: mockFinalBaserunners,
        runsScored: [],
        outsProduced: 1,
        nextBatterId: 'batter-2',
        shouldAdvanceInning: false,
      });
    });
  });

  describe('validateAtBatData', () => {
    it('should validate correct at-bat data', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 1 },
        pitchSequence: ['B', 'S', 'B', 'X'],
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty batter ID', () => {
      const atBatData: AtBatData = {
        batterId: '',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 1 },
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Batter ID is required');
    });

    it('should reject invalid ball count', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 5, strikes: 1 },
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ball count must be between 0 and 4');
    });

    it('should reject invalid strike count', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 4 },
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Strike count must be between 0 and 3');
    });

    it('should reject invalid manual advancement options', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 1 },
        baserunnerAdvancement: {
          first: 'invalid-option',
        },
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid advancement option: invalid-option'
      );
    });

    it('should reject invalid baserunner position', () => {
      const atBatData: AtBatData = {
        batterId: 'batter-1',
        result: new BattingResult('1B'),
        finalCount: { balls: 2, strikes: 1 },
        baserunnerAdvancement: {
          'invalid-position': 'home',
        },
      };

      const result = service.validateAtBatData(atBatData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid baserunner position: invalid-position'
      );
    });
  });

  describe('hasManualAdvancement', () => {
    it('should return false for undefined advancement', () => {
      const result = (service as any).hasManualAdvancement(undefined);
      expect(result).toBe(false);
    });

    it('should return false for empty advancement object', () => {
      const result = (service as any).hasManualAdvancement({});
      expect(result).toBe(false);
    });

    it('should return false for advancement with only empty values', () => {
      const result = (service as any).hasManualAdvancement({
        first: '',
        second: '  ',
      });
      expect(result).toBe(false);
    });

    it('should return true for advancement with meaningful values', () => {
      const result = (service as any).hasManualAdvancement({
        first: 'second',
        second: '',
      });
      expect(result).toBe(true);
    });
  });

  describe('applyManualAdvancement', () => {
    it('should advance runners based on manual advancement', () => {
      const currentState = new BaserunnerStateClass(
        'runner-1',
        'runner-2',
        'runner-3'
      );
      const result = new BattingResult('1B');
      const batterId = 'batter-1';
      const manualAdvancement = {
        first: 'second',
        second: 'home',
        third: 'stay',
      };

      const advancementResult = (service as any).applyManualAdvancement(
        currentState,
        result,
        batterId,
        manualAdvancement
      );

      expect(advancementResult.newState.firstBase).toBe('batter-1'); // batter reaches first
      expect(advancementResult.newState.secondBase).toBe('runner-1'); // first to second
      expect(advancementResult.newState.thirdBase).toBe('runner-3'); // third stays
      expect(advancementResult.runsScored).toEqual(['runner-2']); // second scores
    });

    it('should handle outs in manual advancement', () => {
      const currentState = new BaserunnerStateClass(
        'runner-1',
        'runner-2',
        null
      );
      const result = new BattingResult('GO');
      const batterId = 'batter-1';
      const manualAdvancement = {
        first: 'out',
        second: 'third',
      };

      const advancementResult = (service as any).applyManualAdvancement(
        currentState,
        result,
        batterId,
        manualAdvancement
      );

      expect(advancementResult.newState.firstBase).toBe(null); // batter doesn't reach on groundout
      expect(advancementResult.newState.secondBase).toBe(null);
      expect(advancementResult.newState.thirdBase).toBe('runner-2'); // second to third
      expect(advancementResult.runsScored).toEqual([]); // no runs scored
    });
  });
});
