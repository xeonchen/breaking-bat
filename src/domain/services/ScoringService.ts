import { BattingResult, BaserunnerState } from '../values';
import { Player, AtBat } from '../entities';
import {
  IScoringService,
  BaserunnerAdvancementCalculation,
} from '../interfaces/IScoringService';
import { IStatisticsCalculationService } from '../interfaces/IStatisticsCalculationService';

/**
 * Domain service for core softball scoring logic
 * Implements IScoringService interface and delegates to specialized services
 */
export class ScoringService implements IScoringService {
  constructor(private statisticsService: IStatisticsCalculationService) {}

  /**
   * Record an at-bat result and calculate consequences
   */
  public recordAtBat(
    _gameId: string,
    _playerId: string,
    _result: BattingResult,
    _currentState: BaserunnerState
  ): Promise<AtBat> {
    // This is a placeholder implementation
    // In reality, this would create an AtBat entity and persist it
    throw new Error('recordAtBat method not fully implemented');
  }
  /**
   * Calculate automatic baserunner advancement based on batting result
   */
  public calculateBaserunnerAdvancement(
    result: BattingResult,
    currentState: BaserunnerState,
    batterId: string
  ): BaserunnerAdvancementCalculation {
    let newState: BaserunnerState;
    let runsScored: string[] = [];
    let battingAdvancement: number;

    switch (result.value) {
      case 'HR': // Home Run - all runners score, batter scores
        runsScored = currentState.getRunners();
        runsScored.push(batterId);
        newState = BaserunnerState.empty();
        battingAdvancement = 4;
        break;

      case '3B': // Triple - all runners score, batter to third
        runsScored = currentState.getRunners();
        newState = new BaserunnerState(null, null, batterId);
        battingAdvancement = 3;
        break;

      case '2B': // Double - runners from second and third score, first base runner to third, batter to second
        if (currentState.secondBase) runsScored.push(currentState.secondBase);
        if (currentState.thirdBase) runsScored.push(currentState.thirdBase);
        newState = new BaserunnerState(null, batterId, currentState.firstBase);
        battingAdvancement = 2;
        break;

      case '1B': // Single - runner from third scores, others advance one base
        if (currentState.thirdBase) runsScored.push(currentState.thirdBase);
        newState = new BaserunnerState(
          batterId,
          currentState.firstBase,
          currentState.secondBase
        );
        battingAdvancement = 1;
        break;

      case 'BB':
      case 'IBB': {
        // Walk - forced advancement only
        const walkResult = currentState.advanceForced();
        newState = walkResult.newState.addRunnerToFirst(batterId);
        runsScored = walkResult.runsScored;
        battingAdvancement = 1;
        break;
      }

      case 'SF': // Sacrifice Fly - runner from third scores if present
        if (currentState.thirdBase) {
          runsScored.push(currentState.thirdBase);
          newState = new BaserunnerState(
            currentState.firstBase,
            currentState.secondBase,
            null
          );
        } else {
          newState = currentState;
        }
        battingAdvancement = 0;
        break;

      case 'E': // Error - batter reaches first, runners may advance
        newState = currentState.addRunnerToFirst(batterId);
        battingAdvancement = 1;
        break;

      case 'FC': // Fielder's Choice - batter reaches first, lead runner may be out
        newState = currentState.addRunnerToFirst(batterId);
        battingAdvancement = 1;
        break;

      default: // Outs - no advancement
        newState = currentState;
        battingAdvancement = 0;
        break;
    }

    return {
      newState,
      runsScored,
      battingAdvancement,
      automaticAdvancement: true,
    };
  }

  /**
   * Calculate RBIs based on batting result and baserunner advancement
   * Delegates to StatisticsCalculationService
   */
  public calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    _baserunnersAfter: BaserunnerState,
    runsScored: string[]
  ): number {
    const batterId = ''; // Not needed for RBI calculation
    const rbiResult = this.statisticsService.calculateRBIs(
      result,
      baserunnersBefore,
      runsScored,
      batterId
    );
    return rbiResult.rbis;
  }

  /**
   * Update player statistics based on an at-bat
   * Delegates to StatisticsCalculationService
   */
  public updatePlayerStatistics(
    player: Player,
    atBat: AtBat
  ): Player['statistics'] {
    return this.statisticsService.updatePlayerStatistics(player, atBat);
  }

  /**
   * Calculate batting average - delegates to StatisticsCalculationService
   */
  public calculateBattingAverage(hits: number, atBats: number): number {
    return this.statisticsService.calculateBattingAverage(hits, atBats);
  }

  /**
   * Calculate on-base percentage - delegates to StatisticsCalculationService
   */
  public calculateOnBasePercentage(
    hits: number,
    walks: number,
    hitByPitch: number,
    atBats: number,
    sacrificeFlies: number
  ): number {
    return this.statisticsService.calculateOnBasePercentage(
      hits,
      walks,
      hitByPitch,
      atBats,
      sacrificeFlies
    );
  }

  /**
   * Calculate slugging percentage - delegates to StatisticsCalculationService
   */
  public calculateSluggingPercentage(
    singles: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    atBats: number
  ): number {
    return this.statisticsService.calculateSluggingPercentage(
      singles,
      doubles,
      triples,
      homeRuns,
      atBats
    );
  }

  /**
   * Validate that a batting result is legal
   */
  public isValidBattingResult(result: BattingResult): boolean {
    return BattingResult.isValid(result.value);
  }

  /**
   * Calculate the number of outs produced by a batting result
   */
  public calculateOuts(result: BattingResult): number {
    switch (result.value) {
      case 'DP':
        return 2; // Double play
      case 'SO':
      case 'GO':
      case 'AO':
      case 'SF':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Determine if an inning should end based on outs
   */
  public shouldEndInning(totalOuts: number): boolean {
    return totalOuts >= 3;
  }

  /**
   * Calculate team batting average for multiple players
   * Delegates to StatisticsCalculationService
   */
  public calculateTeamBattingAverage(players: Player[]): number {
    return this.statisticsService.calculateTeamBattingAverage(players);
  }
}
