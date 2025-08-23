import { Player } from '@/domain/entities/Player';
import { Position } from '@/domain/values/Position';
import { PresentationPlayer } from '@/presentation/interfaces/IPresentationServices';

/**
 * Mapper utility for converting between Domain Player and PresentationPlayer
 *
 * Domain Player has: teamId, statistics, methods (updatePositions, addPosition, etc.)
 * PresentationPlayer has: simplified interface for UI display
 */
export class PlayerMapper {
  /**
   * Convert Domain Player to PresentationPlayer for UI display
   */
  public static domainToPresentation(domainPlayer: Player): PresentationPlayer {
    return {
      id: domainPlayer.id,
      name: domainPlayer.name,
      jerseyNumber: domainPlayer.jerseyNumber.toString(), // number -> string
      positions: domainPlayer.positions.map((position) => position.value), // Convert to string[]
      isActive: domainPlayer.isActive,
    };
  }

  /**
   * Convert PresentationPlayer to Domain Player data (for creating new Player)
   * Note: teamId must be provided separately as it's not part of PresentationPlayer
   */
  public static presentationToDomainData(
    presentationPlayer: PresentationPlayer,
    teamId: string
  ): {
    id: string;
    name: string;
    jerseyNumber: number;
    teamId: string;
    positions: Position[];
    isActive: boolean;
  } {
    return {
      id: presentationPlayer.id,
      name: presentationPlayer.name,
      jerseyNumber: parseInt(presentationPlayer.jerseyNumber, 10), // string -> number
      teamId,
      positions: presentationPlayer.positions.map(
        (position) => new Position(position)
      ),
      isActive: presentationPlayer.isActive,
    };
  }

  /**
   * Validate jersey number conversion
   */
  public static validateJerseyNumber(jerseyNumberString: string): number {
    const num = parseInt(jerseyNumberString, 10);
    if (isNaN(num) || num < 0 || num > 999) {
      throw new Error('Jersey number must be between 0 and 999');
    }
    return num;
  }

  /**
   * Safe jersey number conversion with default
   */
  public static parseJerseyNumber(
    jerseyNumberString: string,
    defaultValue: number = 0
  ): number {
    try {
      return PlayerMapper.validateJerseyNumber(jerseyNumberString);
    } catch {
      return defaultValue;
    }
  }
}
