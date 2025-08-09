/**
 * LineupValidationResult
 *
 * Domain service that encapsulates the result of lineup validation operations.
 * Provides structured error reporting and validation status information.
 */

export class LineupValidationResult {
  private readonly _errors: readonly string[];
  private readonly errorMessages: Map<string, string>;

  constructor(errors: string[] | null | undefined) {
    // Filter out empty strings and deduplicate
    const filteredErrors = [
      ...new Set((errors || []).filter((error) => error && error.trim())),
    ];
    this._errors = Object.freeze(filteredErrors);

    this.errorMessages = new Map([
      [
        'LINEUP_INCOMPLETE',
        'Lineup must have at least 9 batting positions and all defensive positions assigned',
      ],
      [
        'BATTING_ORDER_INVALID',
        'Batting order must be sequential starting from 1',
      ],
      [
        'POSITION_DUPLICATE',
        'Each defensive position can only be assigned to one player',
      ],
      ['PLAYER_NOT_ON_TEAM', 'Selected player is not on the chosen team'],
      [
        'NO_PLAYERS_AVAILABLE',
        'Selected team has no active players available for lineup',
      ],
      [
        'MISSING_ESSENTIAL_POSITIONS',
        'Lineup must include pitcher and catcher positions',
      ],
      [
        'INSUFFICIENT_PLAYERS',
        'Team needs at least 9 active players to create a complete lineup',
      ],
    ]);
  }

  public get isValid(): boolean {
    return this._errors.length === 0;
  }

  public get errors(): string[] {
    return [...this._errors]; // Return a copy to maintain immutability
  }

  public hasErrors(): boolean {
    return this._errors.length > 0;
  }

  public hasError(errorCode: string): boolean {
    return this._errors.includes(errorCode);
  }

  public getErrorMessage(errorCode: string): string {
    if (!this.hasError(errorCode)) {
      return '';
    }

    return (
      this.errorMessages.get(errorCode) || 'Unknown validation error occurred'
    );
  }

  public getAllErrorMessages(): string[] {
    return this._errors.map((errorCode) => this.getErrorMessage(errorCode));
  }

  public getValidationSummary(): string {
    if (this.isValid) {
      return 'Lineup is valid and ready to use';
    }

    const errorCount = this._errors.length;
    const errorText = errorCount === 1 ? 'error' : 'errors';
    return `Lineup has ${errorCount} validation ${errorText} that must be resolved`;
  }

  public hasCriticalErrors(): boolean {
    const criticalErrorCodes = [
      'LINEUP_INCOMPLETE',
      'NO_PLAYERS_AVAILABLE',
      'MISSING_ESSENTIAL_POSITIONS',
      'INSUFFICIENT_PLAYERS',
      'BATTING_ORDER_INVALID',
      'POSITION_DUPLICATE',
      'PLAYER_NOT_ON_TEAM',
    ];

    return this._errors.some((error) => criticalErrorCodes.includes(error));
  }

  public getCriticalErrors(): string[] {
    const criticalErrorCodes = [
      'LINEUP_INCOMPLETE',
      'NO_PLAYERS_AVAILABLE',
      'MISSING_ESSENTIAL_POSITIONS',
      'INSUFFICIENT_PLAYERS',
      'BATTING_ORDER_INVALID',
      'POSITION_DUPLICATE',
      'PLAYER_NOT_ON_TEAM',
    ];

    return this._errors.filter((error) => criticalErrorCodes.includes(error));
  }

  public hasWarnings(): boolean {
    // Currently all validation errors are critical for game play
    // Future implementation may add warning-level validations
    return false;
  }

  public toApiResponse(): {
    isValid: boolean;
    errors: Array<{ code: string; message: string }>;
    summary: string;
  } {
    return {
      isValid: this.isValid,
      errors: this._errors.map((errorCode) => ({
        code: errorCode,
        message: this.getErrorMessage(errorCode),
      })),
      summary: this.getValidationSummary(),
    };
  }
}
