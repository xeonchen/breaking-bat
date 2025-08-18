import { Player, AtBat, BattingResult, BaserunnerState } from '@/domain';
import {
  IStatisticsCalculationService,
  RBICalculationResult,
} from '../interfaces/IStatisticsCalculationService';

/**
 * Domain service responsible for calculating player and team statistics
 * Implements IStatisticsCalculationService interface
 */
export class StatisticsCalculationService
  implements IStatisticsCalculationService
{
  /**
   * Calculate RBIs based on batting result and baserunner advancement
   */
  public calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    runsScored: string[],
    _batterId: string // Prefix with _ to indicate intentionally unused for now
  ): RBICalculationResult {
    let rbis = 0;
    let explanation = '';

    // No RBIs for walks (unless bases loaded) or errors
    if (result.value === 'BB' || result.value === 'IBB') {
      if (baserunnersBefore.isLoaded()) {
        rbis = runsScored.length;
        explanation = 'Walk with bases loaded forces runners home';
      } else {
        rbis = 0;
        explanation = 'Walk with bases not loaded produces no RBIs';
      }
      return { rbis: Math.min(rbis, 4), explanation };
    }

    if (result.value === 'E') {
      rbis = 0;
      explanation = 'No RBIs awarded for runs scored on errors';
      return { rbis, explanation };
    }

    // Standard RBI calculation - runs that scored due to the at-bat
    rbis = runsScored.length;

    // Special case explanations
    switch (result.value) {
      case 'HR':
        explanation = `Home run: ${rbis} RBI${rbis !== 1 ? 's' : ''} (including batter)`;
        break;
      case 'SF':
        explanation = `Sacrifice fly: ${rbis} RBI${rbis !== 1 ? 's' : ''} even though batter is out`;
        break;
      case '1B':
      case '2B':
      case '3B':
        explanation = `${result.value === '1B' ? 'Single' : result.value === '2B' ? 'Double' : 'Triple'}: ${rbis} RBI${rbis !== 1 ? 's' : ''} for runners scored`;
        break;
      default:
        explanation = `${rbis} RBI${rbis !== 1 ? 's' : ''} for runners scored`;
    }

    return { rbis: Math.min(rbis, 4), explanation }; // Maximum 4 RBIs per at-bat
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
    return atBats > 0 ? Number((hits / atBats).toFixed(3)) : 0;
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
    return Number((timesOnBase / totalPlateAppearances).toFixed(3));
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
    return Number((totalBases / atBats).toFixed(3));
  }

  /**
   * Calculate OPS (On-base Plus Slugging)
   */
  public calculateOPS(
    onBasePercentage: number,
    sluggingPercentage: number
  ): number {
    return Number((onBasePercentage + sluggingPercentage).toFixed(3));
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

  /**
   * Calculate team statistics summary
   */
  public calculateTeamStatistics(players: Player[]): {
    totalAtBats: number;
    totalHits: number;
    totalRuns: number;
    totalRBIs: number;
    totalWalks: number;
    totalStrikeouts: number;
    teamBattingAverage: number;
    teamOnBasePercentage: number;
    teamSluggingPercentage: number;
    teamOPS: number;
  } {
    const totals = players.reduce(
      (acc, player) => {
        const stats = player.statistics;
        return {
          atBats: acc.atBats + stats.atBats,
          hits: acc.hits + stats.hits,
          runs: acc.runs + stats.runs,
          rbis: acc.rbis + stats.rbis,
          walks: acc.walks + stats.walks,
          strikeouts: acc.strikeouts + stats.strikeouts,
          singles: acc.singles + stats.singles,
          doubles: acc.doubles + stats.doubles,
          triples: acc.triples + stats.triples,
          homeRuns: acc.homeRuns + stats.homeRuns,
        };
      },
      {
        atBats: 0,
        hits: 0,
        runs: 0,
        rbis: 0,
        walks: 0,
        strikeouts: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
      }
    );

    const battingAverage = this.calculateBattingAverage(
      totals.hits,
      totals.atBats
    );
    const onBasePercentage = this.calculateOnBasePercentage(
      totals.hits,
      totals.walks,
      0, // hit by pitch
      totals.atBats,
      0 // sacrifice flies
    );
    const sluggingPercentage = this.calculateSluggingPercentage(
      totals.singles,
      totals.doubles,
      totals.triples,
      totals.homeRuns,
      totals.atBats
    );

    return {
      totalAtBats: totals.atBats,
      totalHits: totals.hits,
      totalRuns: totals.runs,
      totalRBIs: totals.rbis,
      totalWalks: totals.walks,
      totalStrikeouts: totals.strikeouts,
      teamBattingAverage: battingAverage,
      teamOnBasePercentage: onBasePercentage,
      teamSluggingPercentage: sluggingPercentage,
      teamOPS: this.calculateOPS(onBasePercentage, sluggingPercentage),
    };
  }

  /**
   * Validate statistics for reasonableness
   */
  public validateStatistics(stats: Player['statistics']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (stats.hits > stats.atBats) {
      errors.push('Hits cannot exceed at-bats');
    }

    if (stats.battingAverage > 1.0) {
      errors.push('Batting average cannot exceed 1.000');
    }

    if (stats.onBasePercentage > 1.0) {
      errors.push('On-base percentage cannot exceed 1.000');
    }

    if (stats.sluggingPercentage > 4.0) {
      errors.push('Slugging percentage cannot exceed 4.000');
    }

    // Hit type validation
    const totalHitTypes =
      stats.singles + stats.doubles + stats.triples + stats.homeRuns;
    if (totalHitTypes !== stats.hits) {
      errors.push('Sum of hit types must equal total hits');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
