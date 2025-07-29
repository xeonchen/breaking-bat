import { BattingResult } from '../BattingResult';

describe('BattingResult', () => {
  describe('construction', () => {
    it('should create valid batting results', () => {
      expect(() => BattingResult.single()).not.toThrow();
      expect(() => BattingResult.homeRun()).not.toThrow();
      expect(() => BattingResult.strikeout()).not.toThrow();
    });

    it('should throw error for invalid results', () => {
      expect(() => new BattingResult('INVALID')).toThrow('Invalid batting result: INVALID');
    });
  });

  describe('hit detection', () => {
    it('should identify hits correctly', () => {
      expect(BattingResult.single().isHit()).toBe(true);
      expect(BattingResult.double().isHit()).toBe(true);
      expect(BattingResult.triple().isHit()).toBe(true);
      expect(BattingResult.homeRun().isHit()).toBe(true);
      
      expect(BattingResult.walk().isHit()).toBe(false);
      expect(BattingResult.strikeout().isHit()).toBe(false);
    });

    it('should identify outs correctly', () => {
      expect(BattingResult.strikeout().isOut()).toBe(true);
      expect(BattingResult.groundOut().isOut()).toBe(true);
      expect(BattingResult.airOut().isOut()).toBe(true);
      expect(BattingResult.doublePlay().isOut()).toBe(true);
      
      expect(BattingResult.single().isOut()).toBe(false);
      expect(BattingResult.walk().isOut()).toBe(false);
    });
  });

  describe('base advancement', () => {
    it('should calculate bases advanced correctly', () => {
      expect(BattingResult.single().basesAdvanced()).toBe(1);
      expect(BattingResult.double().basesAdvanced()).toBe(2);
      expect(BattingResult.triple().basesAdvanced()).toBe(3);
      expect(BattingResult.homeRun().basesAdvanced()).toBe(4);
      expect(BattingResult.walk().basesAdvanced()).toBe(1);
      expect(BattingResult.strikeout().basesAdvanced()).toBe(0);
    });

    it('should identify when batter reaches base', () => {
      expect(BattingResult.single().reachesBase()).toBe(true);
      expect(BattingResult.walk().reachesBase()).toBe(true);
      expect(BattingResult.error().reachesBase()).toBe(true);
      
      expect(BattingResult.strikeout().reachesBase()).toBe(false);
      expect(BattingResult.groundOut().reachesBase()).toBe(false);
    });
  });

  describe('equality', () => {
    it('should compare results correctly', () => {
      const single1 = BattingResult.single();
      const single2 = BattingResult.single();
      const double1 = BattingResult.double();

      expect(single1.equals(single2)).toBe(true);
      expect(single1.equals(double1)).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should return correct string values', () => {
      expect(BattingResult.single().toString()).toBe('1B');
      expect(BattingResult.homeRun().toString()).toBe('HR');
      expect(BattingResult.strikeout().toString()).toBe('SO');
    });
  });
});