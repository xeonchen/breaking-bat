/**
 * Value object representing the result of an at-bat
 */
export class BattingResult {
  private static readonly VALID_RESULTS = [
    '1B', // Single
    '2B', // Double
    '3B', // Triple
    'HR', // Home Run
    'BB', // Base on Balls (Walk)
    'IBB', // Intentional Base on Balls
    'SF', // Sacrifice Fly
    'E', // Error
    'FC', // Fielder's Choice
    'SO', // Strikeout
    'GO', // Ground Out
    'AO', // Air Out
    'DP', // Double Play
  ] as const;

  public readonly value: string;

  constructor(result: string) {
    if (!BattingResult.isValid(result)) {
      throw new Error(`Invalid batting result: ${result}`);
    }
    this.value = result;
  }

  public static isValid(result: string): boolean {
    return BattingResult.VALID_RESULTS.includes(result as any);
  }

  // Hit results
  public static single(): BattingResult {
    return new BattingResult('1B');
  }

  public static double(): BattingResult {
    return new BattingResult('2B');
  }

  public static triple(): BattingResult {
    return new BattingResult('3B');
  }

  public static homeRun(): BattingResult {
    return new BattingResult('HR');
  }

  // Walk results
  public static walk(): BattingResult {
    return new BattingResult('BB');
  }

  public static intentionalWalk(): BattingResult {
    return new BattingResult('IBB');
  }

  // Other results
  public static sacrificeFly(): BattingResult {
    return new BattingResult('SF');
  }

  public static error(): BattingResult {
    return new BattingResult('E');
  }

  public static fieldersChoice(): BattingResult {
    return new BattingResult('FC');
  }

  public static strikeout(): BattingResult {
    return new BattingResult('SO');
  }

  public static groundOut(): BattingResult {
    return new BattingResult('GO');
  }

  public static airOut(): BattingResult {
    return new BattingResult('AO');
  }

  public static doublePlay(): BattingResult {
    return new BattingResult('DP');
  }

  /**
   * Check if this result is a hit
   */
  public isHit(): boolean {
    return ['1B', '2B', '3B', 'HR'].includes(this.value);
  }

  /**
   * Check if this result is an out
   */
  public isOut(): boolean {
    return ['SO', 'GO', 'AO', 'DP'].includes(this.value);
  }

  /**
   * Check if this result allows the batter to reach base
   */
  public reachesBase(): boolean {
    return ['1B', '2B', '3B', 'HR', 'BB', 'IBB', 'E', 'FC'].includes(
      this.value
    );
  }

  /**
   * Get the number of bases advanced by the batter
   */
  public basesAdvanced(): number {
    switch (this.value) {
      case '1B':
        return 1;
      case '2B':
        return 2;
      case '3B':
        return 3;
      case 'HR':
        return 4;
      case 'BB':
      case 'IBB':
      case 'E':
      case 'FC':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Convert to HitType enum for compatibility with legacy code
   */
  public toHitType(): import('./HitType').HitType {
    return this.value as import('./HitType').HitType;
  }

  public equals(other: BattingResult): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
