import { Game } from '@/domain';
import { Scoreboard } from '@/domain/values/Scoreboard';
import {
  IScoreCalculationService,
  ScoreUpdate,
  ScoreCalculationResult,
} from '../interfaces/IScoreCalculationService';

/**
 * Domain service responsible for score calculation and game score management
 * Implements IScoreCalculationService interface
 */
export class ScoreCalculationService implements IScoreCalculationService {
  /**
   * Update the game score with runs scored in the current inning
   */
  public updateGameScore(
    game: Game,
    runsScored: number,
    currentInning: number,
    isTopInning: boolean
  ): ScoreCalculationResult {
    if (!game.scoreboard) {
      throw new Error('Game must have an initialized score to update');
    }

    const currentScore = game.scoreboard;

    // Determine which team scored
    const isHomeTeamBatting = game.isHomeGame() && !isTopInning;
    const isAwayTeamBatting = !game.isHomeGame() && isTopInning;

    // Ensure current inning exists in inning scores
    const inningScores = [...currentScore.inningScores];
    const currentInningScore = inningScores.find(
      (score) => score.inning === currentInning
    );

    if (!currentInningScore) {
      // Create new inning score if it doesn't exist
      inningScores.push({
        inning: currentInning,
        homeRuns: 0,
        awayRuns: 0,
      });
    }

    // Update overall scores and inning-by-inning scores
    const newScore: ScoreUpdate = {
      homeScore: isHomeTeamBatting
        ? currentScore.homeScore + runsScored
        : currentScore.homeScore,
      awayScore: isAwayTeamBatting
        ? currentScore.awayScore + runsScored
        : currentScore.awayScore,
      inningScores: inningScores.map((inningScore) => {
        if (inningScore.inning === currentInning) {
          return {
            ...inningScore,
            homeRuns: isHomeTeamBatting
              ? inningScore.homeRuns + runsScored
              : inningScore.homeRuns,
            awayRuns: isAwayTeamBatting
              ? inningScore.awayRuns + runsScored
              : inningScore.awayRuns,
          };
        }
        return inningScore;
      }),
    };

    // Create updated game with new score
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
      new Scoreboard(
        newScore.homeScore,
        newScore.awayScore,
        newScore.inningScores
      ),
      game.createdAt,
      new Date()
    );

    return {
      updatedGame,
      newScore,
    };
  }

  /**
   * Calculate the current run differential
   */
  public calculateRunDifferential(game: Game): number {
    if (!game.scoreboard) return 0;

    const { homeScore, awayScore } = game.scoreboard;
    return Math.abs(homeScore - awayScore);
  }

  /**
   * Determine which team is winning
   */
  public getWinningTeam(game: Game): 'home' | 'away' | 'tied' {
    if (!game.scoreboard) return 'tied';

    const { homeScore, awayScore } = game.scoreboard;

    if (homeScore > awayScore) return 'home';
    if (awayScore > homeScore) return 'away';
    return 'tied';
  }

  /**
   * Check if the mercy rule should be applied
   */
  public shouldApplyMercyRule(
    game: Game,
    currentInning: number,
    mercyRunDifference: number = 10
  ): boolean {
    if (currentInning < 5) return false; // Mercy rule only after 5 innings

    const runDifferential = this.calculateRunDifferential(game);
    return runDifferential >= mercyRunDifference;
  }

  /**
   * Validate a score update is reasonable
   */
  public validateScoreUpdate(
    currentScore: ScoreUpdate,
    runsScored: number,
    maxRunsPerInning: number = 20
  ): { isValid: boolean; error?: string } {
    // Validate runs scored is not negative
    if (runsScored < 0) {
      return { isValid: false, error: 'Runs scored cannot be negative' };
    }

    // Validate reasonable maximum runs per inning
    if (runsScored > maxRunsPerInning) {
      return {
        isValid: false,
        error: `Runs scored (${runsScored}) exceeds maximum per inning (${maxRunsPerInning})`,
      };
    }

    // Validate total scores don't exceed reasonable maximums
    const totalHomeRuns = currentScore.homeScore + runsScored;
    const totalAwayRuns = currentScore.awayScore + runsScored;
    const maxTotalRuns = 100; // Reasonable maximum for a softball game

    if (totalHomeRuns > maxTotalRuns || totalAwayRuns > maxTotalRuns) {
      return {
        isValid: false,
        error: `Total game score would exceed reasonable maximum (${maxTotalRuns})`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get score summary for display
   */
  public getScoreSummary(game: Game): {
    homeScore: number;
    awayScore: number;
    currentLeader: 'home' | 'away' | 'tied';
    runDifferential: number;
    inningByInningScores: Array<{
      inning: number;
      homeRuns: number;
      awayRuns: number;
    }>;
  } {
    if (!game.scoreboard) {
      return {
        homeScore: 0,
        awayScore: 0,
        currentLeader: 'tied',
        runDifferential: 0,
        inningByInningScores: [],
      };
    }

    const { homeScore, awayScore, inningScores } = game.scoreboard;

    return {
      homeScore,
      awayScore,
      currentLeader: this.getWinningTeam(game),
      runDifferential: this.calculateRunDifferential(game),
      inningByInningScores: [...inningScores],
    };
  }
}
