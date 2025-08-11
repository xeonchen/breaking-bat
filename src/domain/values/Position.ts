/**
 * Value object representing a defensive position in slowpitch softball
 */
export class Position {
  private static readonly VALID_POSITIONS = [
    'pitcher',
    'catcher',
    'first-base',
    'second-base',
    'third-base',
    'shortstop',
    'left-field',
    'center-field',
    'right-field',
    'short-fielder',
    'extra-player',
  ] as const;

  public readonly value: string;

  constructor(position: string) {
    if (!Position.isValid(position)) {
      throw new Error(`Invalid position: ${position}`);
    }
    this.value = position;
  }

  public static isValid(position: string): boolean {
    return Position.VALID_POSITIONS.includes(
      position as (typeof Position.VALID_POSITIONS)[number]
    );
  }

  public static pitcher(): Position {
    return new Position('pitcher');
  }

  public static catcher(): Position {
    return new Position('catcher');
  }

  public static firstBase(): Position {
    return new Position('first-base');
  }

  public static secondBase(): Position {
    return new Position('second-base');
  }

  public static thirdBase(): Position {
    return new Position('third-base');
  }

  public static shortstop(): Position {
    return new Position('shortstop');
  }

  public static leftField(): Position {
    return new Position('left-field');
  }

  public static centerField(): Position {
    return new Position('center-field');
  }

  public static rightField(): Position {
    return new Position('right-field');
  }

  public static shortFielder(): Position {
    return new Position('short-fielder');
  }

  public static extraPlayer(): Position {
    return new Position('extra-player');
  }

  /**
   * Get all valid positions in conventional order
   */
  public static getAllPositions(): Position[] {
    return Position.VALID_POSITIONS.map((pos) => new Position(pos));
  }

  /**
   * Get conventional position number (1-10 for defensive positions, 11 for EP)
   */
  public getPositionNumber(): number {
    const positionMap: Record<string, number> = {
      pitcher: 1,
      catcher: 2,
      'first-base': 3,
      'second-base': 4,
      'third-base': 5,
      shortstop: 6,
      'left-field': 7,
      'center-field': 8,
      'right-field': 9,
      'short-fielder': 10,
      'extra-player': 11,
    };
    return positionMap[this.value] || 0;
  }

  /**
   * Check if this is a defensive position (not EP)
   */
  public isDefensivePosition(): boolean {
    return this.value !== 'extra-player';
  }

  /**
   * Get display name with abbreviation (e.g., "Pitcher (P)")
   */
  public getDisplayName(): string {
    const displayMap: Record<string, string> = {
      pitcher: 'Pitcher (P)',
      catcher: 'Catcher (C)',
      'first-base': 'First Base (1B)',
      'second-base': 'Second Base (2B)',
      'third-base': 'Third Base (3B)',
      shortstop: 'Shortstop (SS)',
      'left-field': 'Left Field (LF)',
      'center-field': 'Center Field (CF)',
      'right-field': 'Right Field (RF)',
      'short-fielder': 'Short Fielder (SF)',
      'extra-player': 'Extra Player (EP)',
    };
    return displayMap[this.value] || this.value;
  }

  /**
   * Get position abbreviation only (e.g., "P", "1B")
   */
  public getAbbreviation(): string {
    const abbreviationMap: Record<string, string> = {
      pitcher: 'P',
      catcher: 'C',
      'first-base': '1B',
      'second-base': '2B',
      'third-base': '3B',
      shortstop: 'SS',
      'left-field': 'LF',
      'center-field': 'CF',
      'right-field': 'RF',
      'short-fielder': 'SF',
      'extra-player': 'EP',
    };
    return abbreviationMap[this.value] || this.value;
  }

  /**
   * Get full position name without abbreviation (e.g., "Pitcher", "First Base")
   */
  public getFullName(): string {
    const nameMap: Record<string, string> = {
      pitcher: 'Pitcher',
      catcher: 'Catcher',
      'first-base': 'First Base',
      'second-base': 'Second Base',
      'third-base': 'Third Base',
      shortstop: 'Shortstop',
      'left-field': 'Left Field',
      'center-field': 'Center Field',
      'right-field': 'Right Field',
      'short-fielder': 'Short Fielder',
      'extra-player': 'Extra Player',
    };
    return nameMap[this.value] || this.value;
  }

  /**
   * Create a Position from a string value (for deserialization)
   */
  public static fromValue(value: string): Position {
    return new Position(value);
  }

  public equals(other: Position): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
