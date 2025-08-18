import { Game } from '../entities/Game';
import { BaserunnerState } from '../types/BaserunnerState';

export interface GameSessionState {
  gameId: string;
  currentInning: number;
  isTopInning: boolean;
  currentOuts: number;
  baserunners: BaserunnerState;
  currentBatterId: string | null;
  currentCount: {
    balls: number;
    strikes: number;
  };
}

export interface InningAdvancementResult {
  newInning: number;
  newIsTopInning: boolean;
  shouldResetBatter: boolean;
  gameCompleted: boolean;
  completionReason?: 'regulation' | 'mercy-rule';
}

/**
 * Domain service interface for managing live game session state
 * Defines the contract for game session operations
 */
export interface IGameSessionService {
  /**
   * Advance to the next inning
   */
  advanceInning(
    currentState: GameSessionState,
    currentGame: Game
  ): InningAdvancementResult;

  /**
   * Advance to the next batter in the lineup
   */
  advanceToNextBatter(
    currentBatterId: string | null,
    lineup: Array<{ playerId: string }>
  ): string | null;

  /**
   * Update the current count (balls/strikes)
   */
  updateCount(
    currentCount: { balls: number; strikes: number },
    pitch: 'ball' | 'strike' | 'foul'
  ): {
    newCount: { balls: number; strikes: number };
    atBatComplete: boolean;
    result?: import('../values/BattingResult').BattingResult;
  };

  /**
   * Reset game session state for a new inning
   */
  resetForNewInning(
    currentState: GameSessionState,
    newInning: number,
    newIsTopInning: boolean,
    firstBatterId?: string
  ): GameSessionState;

  /**
   * Reset count and advance outs after an at-bat
   */
  updateAfterAtBat(
    currentState: GameSessionState,
    outsProduced: number,
    newBaserunners: BaserunnerState,
    nextBatterId?: string
  ): GameSessionState;
}
