import { HitType, HitTypeInfo } from '@/domain/values/HitType';

describe('HitType', () => {
  describe('Enum Values', () => {
    it('should have correct string values for each hit type', () => {
      expect(HitType.SINGLE).toBe('1B');
      expect(HitType.DOUBLE).toBe('2B');
      expect(HitType.TRIPLE).toBe('3B');
      expect(HitType.HOME_RUN).toBe('HR');
      expect(HitType.WALK).toBe('BB');
      expect(HitType.INTENTIONAL_WALK).toBe('IBB');
      expect(HitType.SACRIFICE_FLY).toBe('SF');
      expect(HitType.ERROR).toBe('E');
      expect(HitType.FIELDERS_CHOICE).toBe('FC');
      expect(HitType.STRIKEOUT).toBe('SO');
      expect(HitType.GROUND_OUT).toBe('GO');
      expect(HitType.AIR_OUT).toBe('AO');
      expect(HitType.DOUBLE_PLAY).toBe('DP');
    });
  });
});

describe('HitTypeInfo', () => {
  describe('Constructor', () => {
    it('should create HitTypeInfo with correct properties', () => {
      const info = new HitTypeInfo(HitType.SINGLE, true, false, 1, true);

      expect(info.type).toBe(HitType.SINGLE);
      expect(info.isHit).toBe(true);
      expect(info.isOut).toBe(false);
      expect(info.batterAdvancement).toBe(1);
      expect(info.forcesRunnerAdvancement).toBe(true);
    });

    it('should create HitTypeInfo with home advancement', () => {
      const info = new HitTypeInfo(HitType.HOME_RUN, true, false, 'home', true);

      expect(info.type).toBe(HitType.HOME_RUN);
      expect(info.batterAdvancement).toBe('home');
    });
  });

  describe('getInfo method', () => {
    describe('Hits', () => {
      it('should return correct info for SINGLE', () => {
        const info = HitTypeInfo.getInfo(HitType.SINGLE);

        expect(info.type).toBe(HitType.SINGLE);
        expect(info.isHit).toBe(true);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(1);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });

      it('should return correct info for DOUBLE', () => {
        const info = HitTypeInfo.getInfo(HitType.DOUBLE);

        expect(info.type).toBe(HitType.DOUBLE);
        expect(info.isHit).toBe(true);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(2);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });

      it('should return correct info for TRIPLE', () => {
        const info = HitTypeInfo.getInfo(HitType.TRIPLE);

        expect(info.type).toBe(HitType.TRIPLE);
        expect(info.isHit).toBe(true);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(3);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });

      it('should return correct info for HOME_RUN', () => {
        const info = HitTypeInfo.getInfo(HitType.HOME_RUN);

        expect(info.type).toBe(HitType.HOME_RUN);
        expect(info.isHit).toBe(true);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe('home');
        expect(info.forcesRunnerAdvancement).toBe(true);
      });
    });

    describe('Walks', () => {
      it('should return correct info for WALK', () => {
        const info = HitTypeInfo.getInfo(HitType.WALK);

        expect(info.type).toBe(HitType.WALK);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(1);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });

      it('should return correct info for INTENTIONAL_WALK', () => {
        const info = HitTypeInfo.getInfo(HitType.INTENTIONAL_WALK);

        expect(info.type).toBe(HitType.INTENTIONAL_WALK);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(1);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });
    });

    describe('Outs', () => {
      it('should return correct info for SACRIFICE_FLY', () => {
        const info = HitTypeInfo.getInfo(HitType.SACRIFICE_FLY);

        expect(info.type).toBe(HitType.SACRIFICE_FLY);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(true);
        expect(info.batterAdvancement).toBe(0);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });

      it('should return correct info for STRIKEOUT', () => {
        const info = HitTypeInfo.getInfo(HitType.STRIKEOUT);

        expect(info.type).toBe(HitType.STRIKEOUT);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(true);
        expect(info.batterAdvancement).toBe(0);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });

      it('should return correct info for GROUND_OUT', () => {
        const info = HitTypeInfo.getInfo(HitType.GROUND_OUT);

        expect(info.type).toBe(HitType.GROUND_OUT);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(true);
        expect(info.batterAdvancement).toBe(0);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });

      it('should return correct info for AIR_OUT', () => {
        const info = HitTypeInfo.getInfo(HitType.AIR_OUT);

        expect(info.type).toBe(HitType.AIR_OUT);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(true);
        expect(info.batterAdvancement).toBe(0);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });

      it('should return correct info for DOUBLE_PLAY', () => {
        const info = HitTypeInfo.getInfo(HitType.DOUBLE_PLAY);

        expect(info.type).toBe(HitType.DOUBLE_PLAY);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(true);
        expect(info.batterAdvancement).toBe(0);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });
    });

    describe('Special Cases', () => {
      it('should return correct info for ERROR', () => {
        const info = HitTypeInfo.getInfo(HitType.ERROR);

        expect(info.type).toBe(HitType.ERROR);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(1);
        expect(info.forcesRunnerAdvancement).toBe(false);
      });

      it('should return correct info for FIELDERS_CHOICE', () => {
        const info = HitTypeInfo.getInfo(HitType.FIELDERS_CHOICE);

        expect(info.type).toBe(HitType.FIELDERS_CHOICE);
        expect(info.isHit).toBe(false);
        expect(info.isOut).toBe(false);
        expect(info.batterAdvancement).toBe(1);
        expect(info.forcesRunnerAdvancement).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for unknown hit type', () => {
        const unknownHitType = 'UNKNOWN' as HitType;

        expect(() => HitTypeInfo.getInfo(unknownHitType)).toThrow(
          'Unknown hit type: UNKNOWN'
        );
      });

      it('should throw error for null hit type', () => {
        const nullHitType = null as any;

        expect(() => HitTypeInfo.getInfo(nullHitType)).toThrow(
          'Unknown hit type: null'
        );
      });

      it('should throw error for undefined hit type', () => {
        const undefinedHitType = undefined as any;

        expect(() => HitTypeInfo.getInfo(undefinedHitType)).toThrow(
          'Unknown hit type: undefined'
        );
      });
    });
  });

  describe('isHitForStatistics method', () => {
    it('should return true for actual hits', () => {
      expect(HitTypeInfo.getInfo(HitType.SINGLE).isHitForStatistics()).toBe(
        true
      );
      expect(HitTypeInfo.getInfo(HitType.DOUBLE).isHitForStatistics()).toBe(
        true
      );
      expect(HitTypeInfo.getInfo(HitType.TRIPLE).isHitForStatistics()).toBe(
        true
      );
      expect(HitTypeInfo.getInfo(HitType.HOME_RUN).isHitForStatistics()).toBe(
        true
      );
    });

    it('should return false for non-hits', () => {
      expect(HitTypeInfo.getInfo(HitType.WALK).isHitForStatistics()).toBe(
        false
      );
      expect(
        HitTypeInfo.getInfo(HitType.INTENTIONAL_WALK).isHitForStatistics()
      ).toBe(false);
      expect(
        HitTypeInfo.getInfo(HitType.SACRIFICE_FLY).isHitForStatistics()
      ).toBe(false);
      expect(HitTypeInfo.getInfo(HitType.ERROR).isHitForStatistics()).toBe(
        false
      );
      expect(
        HitTypeInfo.getInfo(HitType.FIELDERS_CHOICE).isHitForStatistics()
      ).toBe(false);
      expect(HitTypeInfo.getInfo(HitType.STRIKEOUT).isHitForStatistics()).toBe(
        false
      );
      expect(HitTypeInfo.getInfo(HitType.GROUND_OUT).isHitForStatistics()).toBe(
        false
      );
      expect(HitTypeInfo.getInfo(HitType.AIR_OUT).isHitForStatistics()).toBe(
        false
      );
      expect(
        HitTypeInfo.getInfo(HitType.DOUBLE_PLAY).isHitForStatistics()
      ).toBe(false);
    });
  });

  describe('countsAsAtBat method', () => {
    it('should return true for results that count as at-bats', () => {
      expect(HitTypeInfo.getInfo(HitType.SINGLE).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.DOUBLE).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.TRIPLE).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.HOME_RUN).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.ERROR).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.FIELDERS_CHOICE).countsAsAtBat()).toBe(
        true
      );
      expect(HitTypeInfo.getInfo(HitType.STRIKEOUT).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.GROUND_OUT).countsAsAtBat()).toBe(
        true
      );
      expect(HitTypeInfo.getInfo(HitType.AIR_OUT).countsAsAtBat()).toBe(true);
      expect(HitTypeInfo.getInfo(HitType.DOUBLE_PLAY).countsAsAtBat()).toBe(
        true
      );
    });

    it('should return false for results that do not count as at-bats', () => {
      expect(HitTypeInfo.getInfo(HitType.WALK).countsAsAtBat()).toBe(false);
      expect(
        HitTypeInfo.getInfo(HitType.INTENTIONAL_WALK).countsAsAtBat()
      ).toBe(false);
      expect(HitTypeInfo.getInfo(HitType.SACRIFICE_FLY).countsAsAtBat()).toBe(
        false
      );
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle all hit types in switch statement', () => {
      // Test that all enum values are handled
      const allHitTypes = Object.values(HitType);

      for (const hitType of allHitTypes) {
        expect(() => HitTypeInfo.getInfo(hitType)).not.toThrow();
        const info = HitTypeInfo.getInfo(hitType);
        expect(info).toBeInstanceOf(HitTypeInfo);
        expect(info.type).toBe(hitType);
      }
    });

    it('should provide consistent behavior for similar hit types', () => {
      // Both walks should behave the same way
      const walkInfo = HitTypeInfo.getInfo(HitType.WALK);
      const intentionalWalkInfo = HitTypeInfo.getInfo(HitType.INTENTIONAL_WALK);

      expect(walkInfo.isHit).toBe(intentionalWalkInfo.isHit);
      expect(walkInfo.isOut).toBe(intentionalWalkInfo.isOut);
      expect(walkInfo.batterAdvancement).toBe(
        intentionalWalkInfo.batterAdvancement
      );
      expect(walkInfo.forcesRunnerAdvancement).toBe(
        intentionalWalkInfo.forcesRunnerAdvancement
      );
      expect(walkInfo.countsAsAtBat()).toBe(
        intentionalWalkInfo.countsAsAtBat()
      );
    });

    it('should provide correct properties for complex scenarios', () => {
      // Test a hit that forces advancement
      const doubleInfo = HitTypeInfo.getInfo(HitType.DOUBLE);
      expect(doubleInfo.isHit && doubleInfo.forcesRunnerAdvancement).toBe(true);

      // Test an out that doesn't force advancement
      const strikeoutInfo = HitTypeInfo.getInfo(HitType.STRIKEOUT);
      expect(
        strikeoutInfo.isOut && !strikeoutInfo.forcesRunnerAdvancement
      ).toBe(true);

      // Test a non-hit that forces advancement (walk)
      const walkInfo = HitTypeInfo.getInfo(HitType.WALK);
      expect(!walkInfo.isHit && walkInfo.forcesRunnerAdvancement).toBe(true);
    });
  });
});
