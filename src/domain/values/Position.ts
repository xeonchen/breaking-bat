/**
 * Value object representing a defensive position in softball
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
