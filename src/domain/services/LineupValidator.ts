import { Lineup } from '../entities/Lineup';
import { Player } from '../entities/Player';
import { LineupValidationResult } from './LineupValidationResult';

/**
 * LineupValidator
 *
 * Domain service that validates lineup configurations according to softball rules.
 * Ensures lineups meet minimum requirements, position constraints, and team membership.
 */
export class LineupValidator {
  /**
   * Validate a complete lineup configuration
   */
  public validate(
    lineup: Lineup,
    availablePlayers: Player[]
  ): LineupValidationResult {
    const errors: string[] = [];

    // Check for null/undefined lineup positions
    if (!lineup.battingOrder || lineup.battingOrder.length === 0) {
      errors.push('LINEUP_INCOMPLETE');
      return new LineupValidationResult(errors);
    }

    // Check if players are available
    if (!availablePlayers || availablePlayers.length === 0) {
      errors.push('NO_PLAYERS_AVAILABLE');
      return new LineupValidationResult(errors);
    }

    // Check if team has enough players
    if (availablePlayers.length < 9) {
      errors.push('INSUFFICIENT_PLAYERS');
    }

    // Validate minimum batting positions
    if (lineup.battingOrder.length < 9) {
      errors.push('LINEUP_INCOMPLETE');
    }

    // Validate batting order sequence
    if (!this.isValidBattingOrderSequence(lineup)) {
      errors.push('BATTING_ORDER_INVALID');
    }

    // Validate unique defensive positions
    if (!this.hasUniqueDefensivePositions(lineup)) {
      errors.push('POSITION_DUPLICATE');
    }

    // Validate player team membership
    if (!this.allPlayersOnTeam(lineup, availablePlayers)) {
      errors.push('PLAYER_NOT_ON_TEAM');
    }

    // Validate essential positions
    if (!this.hasEssentialPositions(lineup)) {
      errors.push('MISSING_ESSENTIAL_POSITIONS');
    }

    return new LineupValidationResult(errors);
  }

  /**
   * Check if batting order is sequential starting from 1
   */
  private isValidBattingOrderSequence(lineup: Lineup): boolean {
    const battingOrders = lineup.battingOrder
      .map((position) => position.battingOrder)
      .sort((a, b) => a - b);

    if (battingOrders.length === 0) {
      return false;
    }

    // Must start from 1
    if (battingOrders[0] !== 1) {
      return false;
    }

    // Must be sequential
    for (let i = 1; i < battingOrders.length; i++) {
      if (battingOrders[i] !== battingOrders[i - 1] + 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if defensive positions are unique (EP can have duplicates)
   */
  private hasUniqueDefensivePositions(lineup: Lineup): boolean {
    const positionCounts = new Map<string, number>();

    lineup.battingOrder.forEach((position) => {
      const pos = position.defensivePosition;
      positionCounts.set(pos, (positionCounts.get(pos) || 0) + 1);
    });

    // All positions except Extra Player must be unique
    const uniquePositions = [
      'Pitcher',
      'Catcher',
      'First Base',
      'Second Base',
      'Third Base',
      'Shortstop',
      'Left Field',
      'Center Field',
      'Right Field',
      'Short Fielder',
    ];

    for (const position of uniquePositions) {
      const count = positionCounts.get(position) || 0;
      if (count > 1) {
        return false;
      }
    }

    // Extra Player (EP) is allowed to have duplicates
    return true;
  }

  /**
   * Check if all players in lineup are on the provided team
   */
  private allPlayersOnTeam(
    lineup: Lineup,
    availablePlayers: Player[]
  ): boolean {
    const availablePlayerIds = new Set(
      availablePlayers.map((player) => player.id)
    );

    for (const position of lineup.battingOrder) {
      if (!availablePlayerIds.has(position.playerId)) {
        return false;
      }
    }

    for (const substituteId of lineup.substitutes) {
      if (!availablePlayerIds.has(substituteId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if lineup has essential positions (pitcher and catcher)
   */
  private hasEssentialPositions(lineup: Lineup): boolean {
    const positions = lineup.battingOrder.map(
      (position) => position.defensivePosition
    );
    return positions.includes('Pitcher') && positions.includes('Catcher');
  }

  /**
   * Validate a partial lineup (for real-time validation during setup)
   */
  public validatePartial(
    battingPositions: Array<{
      battingOrder: number;
      playerId: string | null;
      defensivePosition: string | null;
    }>,
    availablePlayers: Player[]
  ): LineupValidationResult {
    const errors: string[] = [];

    // Check player availability
    if (!availablePlayers || availablePlayers.length === 0) {
      errors.push('NO_PLAYERS_AVAILABLE');
      return new LineupValidationResult(errors);
    }

    if (availablePlayers.length < 9) {
      errors.push('INSUFFICIENT_PLAYERS');
    }

    // Filter out empty positions
    const filledPositions = battingPositions.filter(
      (pos) => pos.playerId && pos.defensivePosition
    );

    if (filledPositions.length === 0) {
      return new LineupValidationResult([]); // No errors for empty partial lineup
    }

    // Check for duplicate defensive positions in filled positions
    const positionCounts = new Map<string, number>();
    filledPositions.forEach((pos) => {
      if (pos.defensivePosition) {
        const count = positionCounts.get(pos.defensivePosition) || 0;
        positionCounts.set(pos.defensivePosition, count + 1);
      }
    });

    // Only check for duplicates in unique positions (EP can have duplicates)
    const uniquePositions = [
      'Pitcher',
      'Catcher',
      'First Base',
      'Second Base',
      'Third Base',
      'Shortstop',
      'Left Field',
      'Center Field',
      'Right Field',
      'Short Fielder',
    ];
    for (const position of uniquePositions) {
      if ((positionCounts.get(position) || 0) > 1) {
        errors.push('POSITION_DUPLICATE');
        break;
      }
    }
    // Extra Player (EP) is allowed to have duplicates, so it's not included above

    // Check player team membership
    const availablePlayerIds = new Set(
      availablePlayers.map((player) => player.id)
    );
    for (const pos of filledPositions) {
      if (pos.playerId && !availablePlayerIds.has(pos.playerId)) {
        errors.push('PLAYER_NOT_ON_TEAM');
        break;
      }
    }

    return new LineupValidationResult(errors);
  }
}
