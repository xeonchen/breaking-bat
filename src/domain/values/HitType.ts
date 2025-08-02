/**
 * Extended hit type enumeration for comprehensive rule matrix
 * Supports all 13 standard slow-pitch softball hit types
 */
export enum HitType {
  SINGLE = '1B',
  DOUBLE = '2B',
  TRIPLE = '3B',
  HOME_RUN = 'HR',
  WALK = 'BB',
  INTENTIONAL_WALK = 'IBB',
  SACRIFICE_FLY = 'SF',
  ERROR = 'E',
  FIELDERS_CHOICE = 'FC',
  STRIKEOUT = 'SO',
  GROUND_OUT = 'GO',
  AIR_OUT = 'AO',
  DOUBLE_PLAY = 'DP',
}

/**
 * Hit type classification for rule matrix logic
 */
export class HitTypeInfo {
  constructor(
    public readonly type: HitType,
    public readonly isHit: boolean,
    public readonly isOut: boolean,
    public readonly batterAdvancement: number | 'home',
    public readonly forcesRunnerAdvancement: boolean
  ) {}

  public static getInfo(hitType: HitType): HitTypeInfo {
    switch (hitType) {
      case HitType.SINGLE:
        return new HitTypeInfo(hitType, true, false, 1, true);
      case HitType.DOUBLE:
        return new HitTypeInfo(hitType, true, false, 2, true);
      case HitType.TRIPLE:
        return new HitTypeInfo(hitType, true, false, 3, true);
      case HitType.HOME_RUN:
        return new HitTypeInfo(hitType, true, false, 'home', true);
      case HitType.WALK:
      case HitType.INTENTIONAL_WALK:
        return new HitTypeInfo(hitType, false, false, 1, true);
      case HitType.SACRIFICE_FLY:
        return new HitTypeInfo(hitType, false, true, 0, false);
      case HitType.ERROR:
        return new HitTypeInfo(hitType, false, false, 1, false); // Variable based on error type
      case HitType.FIELDERS_CHOICE:
        return new HitTypeInfo(hitType, false, false, 1, true);
      case HitType.STRIKEOUT:
      case HitType.GROUND_OUT:
      case HitType.AIR_OUT:
        return new HitTypeInfo(hitType, false, true, 0, false);
      case HitType.DOUBLE_PLAY:
        return new HitTypeInfo(hitType, false, true, 0, false);
      default:
        throw new Error(`Unknown hit type: ${hitType}`);
    }
  }

  public isHitForStatistics(): boolean {
    return this.isHit;
  }

  public countsAsAtBat(): boolean {
    // Walks and sacrifice flies don't count as at-bats
    return ![
      HitType.WALK,
      HitType.INTENTIONAL_WALK,
      HitType.SACRIFICE_FLY,
    ].includes(this.type);
  }
}
