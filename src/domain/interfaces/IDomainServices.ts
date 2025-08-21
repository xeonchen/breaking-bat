/**
 * Domain Layer Service Interfaces
 *
 * These interfaces define the contracts for domain services that contain
 * business logic. They are used when:
 * 1. Multiple implementations exist
 * 2. Services need to be mocked for testing
 * 3. Services have external dependencies
 */

import { BaserunnerState, BattingResult } from '../values';
import { Player, Game, AtBat } from '../entities';

/**
 * Scoring Service Interface
 * Handles scoring logic and calculations
 */
export interface IScoringService {
  calculateScore(
    atBat: AtBat,
    currentState: BaserunnerState
  ): {
    runs: number;
    newState: BaserunnerState;
  };

  processAtBat(
    battingResult: BattingResult,
    currentState: BaserunnerState,
    battingOrder: number
  ): {
    runs: number;
    newState: BaserunnerState;
    nextBatter: number;
  };
}

/**
 * Game Session Service Interface
 * Manages game session state and transitions
 */
export interface IGameSessionService {
  startGame(game: Game): void;
  endGame(gameId: string): void;
  getCurrentGame(): Game | null;
  isGameActive(): boolean;
  advanceInning(gameId: string): InningAdvancementResult;
}

/**
 * At-Bat Processing Service Interface
 * Processes at-bat events and updates game state
 */
export interface IAtBatProcessingService {
  processAtBat(
    gameId: string,
    batterId: string,
    result: BattingResult,
    description?: string
  ): Promise<AtBatProcessingResult>;
}

/**
 * Statistics Calculation Service Interface
 * Calculates player and team statistics
 */
export interface IStatisticsCalculationService {
  calculatePlayerStats(player: Player, atBats: AtBat[]): PlayerStatistics;
  calculateTeamStats(players: Player[], atBats: AtBat[]): TeamStatistics;
}

/**
 * Score Calculation Service Interface
 * Handles score calculations for games
 */
export interface IScoreCalculationService {
  calculateGameScore(atBats: AtBat[]): GameScore;
  calculateInningScore(atBats: AtBat[]): InningScore;
}

// Result types
export interface AtBatProcessingResult {
  atBat: AtBat;
  gameStateChanged: boolean;
  gameEnded: boolean;
  inningEnded: boolean;
  nextBatter?: string;
}

export interface InningAdvancementResult {
  advancedToNext: boolean;
  gameCompleted: boolean;
  currentInning: number;
  isTopInning: boolean;
}

export interface PlayerStatistics {
  games: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
}

export interface TeamStatistics {
  totalRuns: number;
  totalHits: number;
  totalAtBats: number;
  teamBattingAverage: number;
}

export interface GameScore {
  homeScore: number;
  awayScore: number;
  inningScores: InningScore[];
}

export interface InningScore {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}
