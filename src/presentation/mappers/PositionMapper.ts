/**
 * Position Mapper - Clean Architecture Type Bridge
 *
 * Maps between Domain Position types and Presentation Position types
 * following Clean Architecture dependency direction (Presentation → Application → Domain)
 */

import { Position } from '@/domain/values/Position';
import { PresentationPosition } from '@/presentation/types/presentation-values';

/**
 * Bidirectional mapper between Domain and Presentation position types
 */
export class PositionMapper {
  /**
   * Domain position string to PresentationPosition enum mapping
   */
  private static readonly DOMAIN_TO_PRESENTATION_MAP: Record<
    string,
    PresentationPosition
  > = {
    pitcher: PresentationPosition.PITCHER,
    catcher: PresentationPosition.CATCHER,
    'first-base': PresentationPosition.FIRST_BASE,
    'second-base': PresentationPosition.SECOND_BASE,
    'third-base': PresentationPosition.THIRD_BASE,
    shortstop: PresentationPosition.SHORT_STOP,
    'left-field': PresentationPosition.LEFT_FIELD,
    'center-field': PresentationPosition.CENTER_FIELD,
    'right-field': PresentationPosition.RIGHT_FIELD,
    'short-fielder': PresentationPosition.SHORT_FIELDER,
    'extra-player': PresentationPosition.EXTRA_PLAYER,
  };

  /**
   * PresentationPosition enum to Domain position string mapping
   */
  private static readonly PRESENTATION_TO_DOMAIN_MAP: Record<
    PresentationPosition,
    string
  > = {
    [PresentationPosition.PITCHER]: 'pitcher',
    [PresentationPosition.CATCHER]: 'catcher',
    [PresentationPosition.FIRST_BASE]: 'first-base',
    [PresentationPosition.SECOND_BASE]: 'second-base',
    [PresentationPosition.THIRD_BASE]: 'third-base',
    [PresentationPosition.SHORT_STOP]: 'shortstop',
    [PresentationPosition.LEFT_FIELD]: 'left-field',
    [PresentationPosition.CENTER_FIELD]: 'center-field',
    [PresentationPosition.RIGHT_FIELD]: 'right-field',
    [PresentationPosition.SHORT_FIELDER]: 'short-fielder',
    [PresentationPosition.EXTRA_PLAYER]: 'extra-player',
    [PresentationPosition.BENCH]: 'extra-player', // Map BENCH to extra-player for domain compatibility
  };

  /**
   * Convert Domain Position object to PresentationPosition enum
   */
  public static domainToPresentation(
    domainPosition: Position
  ): PresentationPosition {
    const presentationPosition =
      this.DOMAIN_TO_PRESENTATION_MAP[domainPosition.value];
    if (!presentationPosition) {
      throw new Error(`Unknown domain position: ${domainPosition.value}`);
    }
    return presentationPosition;
  }

  /**
   * Convert Domain position string to PresentationPosition enum
   */
  public static domainStringToPresentation(
    domainPositionString: string
  ): PresentationPosition {
    const presentationPosition =
      this.DOMAIN_TO_PRESENTATION_MAP[domainPositionString];
    if (!presentationPosition) {
      throw new Error(
        `Unknown domain position string: ${domainPositionString}`
      );
    }
    return presentationPosition;
  }

  /**
   * Convert PresentationPosition enum to Domain Position object
   */
  public static presentationToDomain(
    presentationPosition: PresentationPosition
  ): Position {
    const domainPositionString =
      this.PRESENTATION_TO_DOMAIN_MAP[presentationPosition];
    if (!domainPositionString) {
      throw new Error(`Unknown presentation position: ${presentationPosition}`);
    }
    return new Position(domainPositionString);
  }

  /**
   * Convert PresentationPosition enum to Domain position string
   */
  public static presentationToDomainString(
    presentationPosition: PresentationPosition
  ): string {
    const domainPositionString =
      this.PRESENTATION_TO_DOMAIN_MAP[presentationPosition];
    if (!domainPositionString) {
      throw new Error(`Unknown presentation position: ${presentationPosition}`);
    }
    return domainPositionString;
  }

  /**
   * Convert array of Domain Positions to PresentationPosition array
   */
  public static domainArrayToPresentation(
    domainPositions: Position[]
  ): PresentationPosition[] {
    return domainPositions.map((pos) => this.domainToPresentation(pos));
  }

  /**
   * Convert array of Domain position strings to PresentationPosition array
   */
  public static domainStringArrayToPresentation(
    domainPositionStrings: string[]
  ): PresentationPosition[] {
    return domainPositionStrings.map((pos) =>
      this.domainStringToPresentation(pos)
    );
  }

  /**
   * Convert array of PresentationPositions to Domain Position array
   */
  public static presentationArrayToDomain(
    presentationPositions: PresentationPosition[]
  ): Position[] {
    return presentationPositions.map((pos) => this.presentationToDomain(pos));
  }

  /**
   * Convert array of PresentationPositions to Domain position string array
   */
  public static presentationArrayToDomainStrings(
    presentationPositions: PresentationPosition[]
  ): string[] {
    return presentationPositions.map((pos) =>
      this.presentationToDomainString(pos)
    );
  }

  /**
   * Check if a string is a valid domain position
   */
  public static isValidDomainPosition(positionString: string): boolean {
    return positionString in this.DOMAIN_TO_PRESENTATION_MAP;
  }

  /**
   * Check if a value is a valid PresentationPosition
   */
  public static isValidPresentationPosition(
    position: any
  ): position is PresentationPosition {
    return Object.values(PresentationPosition).includes(position);
  }

  /**
   * Get all available PresentationPositions
   */
  public static getAllPresentationPositions(): PresentationPosition[] {
    return Object.values(PresentationPosition);
  }

  /**
   * Get all available domain position strings
   */
  public static getAllDomainPositionStrings(): string[] {
    return Object.keys(this.DOMAIN_TO_PRESENTATION_MAP);
  }
}
