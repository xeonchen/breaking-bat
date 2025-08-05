import { BattingResult, BaserunnerState } from '../values';
import { Player, AtBat } from '../entities';

export interface BaserunnerAdvancementCalculation {
  newState: BaserunnerState;
  runsScored: string[]; // player IDs
  battingAdvancement: number; // bases advanced by batter
  automaticAdvancement: boolean; // true if calculated automatically
}

/**
 * Domain service for softball scoring logic and calculations
 */
export class ScoringService {
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

      case '2B': // Double - runners from second and third score, batter to second
        if (currentState.secondBase) runsScored.push(currentState.secondBase);
        if (currentState.thirdBase) runsScored.push(currentState.thirdBase);
        newState = new BaserunnerState(currentState.firstBase, batterId, null);
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
   */
  public calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    _baserunnersAfter: BaserunnerState,
    runsScored: string[]
  ): number {
    // No RBIs for walks (unless bases loaded) or errors
    if (
      (result.value === 'BB' || result.value === 'IBB') &&
      !baserunnersBefore.isLoaded()
    ) {
      return 0;
    }

    if (result.value === 'E') {
      return 0;
    }

    // RBIs equal the number of runs that scored due to the at-bat
    let rbis = runsScored.length;

    // For home runs, batter also gets RBI for themselves
    if (result.value === 'HR') {
      // Already included in runsScored
    }

    // For sacrifice flies, batter gets RBI even though they're out
    if (result.value === 'SF' && runsScored.length > 0) {
      rbis = runsScored.length;
    }

    return Math.min(rbis, 4); // Maximum 4 RBIs per at-bat
  }

  /**
   * Update player statistics based on an at-bat
   */
  public updatePlayerStatistics(
    player: Player,
    atBat: AtBat
  ): Player['statistics'] {
    const stats = { ...player.statistics };

    // Increment at-bats (except for walks and sacrifice flies)
    if (!['BB', 'IBB', 'SF'].includes(atBat.result.value)) {
      stats.atBats++;
    }

    // Update hit statistics
    if (atBat.isHit()) {
      stats.hits++;

      switch (atBat.result.value) {
        case '1B':
          stats.singles++;
          break;
        case '2B':
          stats.doubles++;
          break;
        case '3B':
          stats.triples++;
          break;
        case 'HR':
          stats.homeRuns++;
          break;
      }
    }

    // Update RBIs
    stats.rbis += atBat.rbis;

    // Update walks
    if (['BB', 'IBB'].includes(atBat.result.value)) {
      stats.walks++;
    }

    // Update strikeouts
    if (atBat.result.value === 'SO') {
      stats.strikeouts++;
    }

    // Check if player scored (their ID is in runsScored)
    if (atBat.runsScored.includes(player.id)) {
      stats.runs++;
    }

    // Recalculate derived statistics
    stats.battingAverage = this.calculateBattingAverage(
      stats.hits,
      stats.atBats
    );
    stats.onBasePercentage = this.calculateOnBasePercentage(
      stats.hits,
      stats.walks,
      0, // hit by pitch (not implemented)
      stats.atBats,
      0 // sacrifice flies as separate stat
    );
    stats.sluggingPercentage = this.calculateSluggingPercentage(
      stats.singles,
      stats.doubles,
      stats.triples,
      stats.homeRuns,
      stats.atBats
    );

    return stats;
  }

  /**
   * Calculate batting average
   */
  public calculateBattingAverage(hits: number, atBats: number): number {
    return atBats > 0 ? hits / atBats : 0;
  }

  /**
   * Calculate on-base percentage
   */
  public calculateOnBasePercentage(
    hits: number,
    walks: number,
    hitByPitch: number,
    atBats: number,
    sacrificeFlies: number
  ): number {
    const totalPlateAppearances = atBats + walks + hitByPitch + sacrificeFlies;
    if (totalPlateAppearances === 0) return 0;

    const timesOnBase = hits + walks + hitByPitch;
    return timesOnBase / totalPlateAppearances;
  }

  /**
   * Calculate slugging percentage
   */
  public calculateSluggingPercentage(
    singles: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    atBats: number
  ): number {
    if (atBats === 0) return 0;

    const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
    return totalBases / atBats;
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
   */
  public calculateTeamBattingAverage(players: Player[]): number {
    const totalHits = players.reduce(
      (sum, player) => sum + player.statistics.hits,
      0
    );
    const totalAtBats = players.reduce(
      (sum, player) => sum + player.statistics.atBats,
      0
    );

    return this.calculateBattingAverage(totalHits, totalAtBats);
  }
}
