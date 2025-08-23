/**
 * Presentation layer value objects and enums
 * These replace direct domain imports in the presentation layer
 */

/**
 * Player positions in presentation layer
 */
export enum PresentationPosition {
  PITCHER = 'P',
  CATCHER = 'C',
  FIRST_BASE = '1B',
  SECOND_BASE = '2B',
  THIRD_BASE = '3B',
  SHORT_STOP = 'SS',
  LEFT_FIELD = 'LF',
  CENTER_FIELD = 'CF',
  RIGHT_FIELD = 'RF',
  SHORT_FIELDER = 'SF',
  EXTRA_PLAYER = 'EP',
  BENCH = 'BENCH',
}

/**
 * Batting result types for presentation layer
 */
export enum PresentationBattingResult {
  SINGLE = '1B',
  DOUBLE = '2B',
  TRIPLE = '3B',
  HOME_RUN = 'HR',
  WALK = 'BB',
  INTENTIONAL_WALK = 'IBB',
  STRIKEOUT = 'SO',
  GROUND_OUT = 'GO',
  AIR_OUT = 'AO',
  SACRIFICE_FLY = 'SF',
  FIELDERS_CHOICE = 'FC',
  ERROR = 'E',
  DOUBLE_PLAY = 'DP',
  TRIPLE_PLAY = 'TP',
}

/**
 * Game status for presentation layer
 */
export enum PresentationGameStatus {
  SETUP = 'setup',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
}

/**
 * Base runner state for presentation layer
 */
export interface PresentationBaserunnerState {
  first: { playerId: string; playerName: string } | null;
  second: { playerId: string; playerName: string } | null;
  third: { playerId: string; playerName: string } | null;
}

/**
 * Utility functions for presentation value operations
 */
export class PresentationBattingHelper {
  /**
   * Check if a batting result results in the batter reaching base
   */
  public static reachesBase(result: PresentationBattingResult): boolean {
    return [
      PresentationBattingResult.SINGLE,
      PresentationBattingResult.DOUBLE,
      PresentationBattingResult.TRIPLE,
      PresentationBattingResult.HOME_RUN,
      PresentationBattingResult.WALK,
      PresentationBattingResult.INTENTIONAL_WALK,
      PresentationBattingResult.ERROR,
      PresentationBattingResult.FIELDERS_CHOICE,
    ].includes(result);
  }

  /**
   * Check if a batting result is a hit (excludes walks, errors, etc.)
   */
  public static isHit(result: PresentationBattingResult): boolean {
    return [
      PresentationBattingResult.SINGLE,
      PresentationBattingResult.DOUBLE,
      PresentationBattingResult.TRIPLE,
      PresentationBattingResult.HOME_RUN,
    ].includes(result);
  }

  /**
   * Check if a batting result results in an out
   */
  public static isOut(result: PresentationBattingResult): boolean {
    return [
      PresentationBattingResult.STRIKEOUT,
      PresentationBattingResult.GROUND_OUT,
      PresentationBattingResult.AIR_OUT,
      PresentationBattingResult.SACRIFICE_FLY,
      PresentationBattingResult.DOUBLE_PLAY,
      PresentationBattingResult.TRIPLE_PLAY,
    ].includes(result);
  }
}

/**
 * Utility functions for presentation value conversion
 */
export class PresentationValueConverter {
  /**
   * Convert domain Position to PresentationPosition
   */
  public static toPresentationPosition(
    domainPosition: string
  ): PresentationPosition {
    return domainPosition as PresentationPosition;
  }

  /**
   * Convert PresentationPosition to domain position string
   */
  public static toDomainPosition(
    presentationPosition: PresentationPosition
  ): string {
    return presentationPosition;
  }

  /**
   * Convert domain BattingResult to PresentationBattingResult
   */
  public static toPresentationBattingResult(
    domainResult: string
  ): PresentationBattingResult {
    return domainResult as PresentationBattingResult;
  }

  /**
   * Convert PresentationBattingResult to domain batting result string
   */
  public static toDomainBattingResult(
    presentationResult: PresentationBattingResult
  ): string {
    return presentationResult;
  }

  /**
   * Convert domain GameStatus to PresentationGameStatus
   */
  public static toPresentationGameStatus(
    domainStatus: string
  ): PresentationGameStatus {
    return domainStatus as PresentationGameStatus;
  }

  /**
   * Convert PresentationGameStatus to domain status string
   */
  public static toDomainGameStatus(
    presentationStatus: PresentationGameStatus
  ): string {
    return presentationStatus;
  }
}
