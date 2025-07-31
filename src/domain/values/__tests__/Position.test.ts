import { Position } from '../Position';

describe('Position', () => {
  describe('construction', () => {
    it('should create valid positions', () => {
      const pitcher = new Position('pitcher');
      expect(pitcher.value).toBe('pitcher');
    });

    it('should throw error for invalid position', () => {
      expect(() => {
        new Position('invalid-position');
      }).toThrow('Invalid position: invalid-position');
    });
  });

  describe('static factory methods', () => {
    it('should create all defensive positions', () => {
      expect(Position.pitcher().value).toBe('pitcher');
      expect(Position.catcher().value).toBe('catcher');
      expect(Position.firstBase().value).toBe('first-base');
      expect(Position.secondBase().value).toBe('second-base');
      expect(Position.thirdBase().value).toBe('third-base');
      expect(Position.shortstop().value).toBe('shortstop');
      expect(Position.leftField().value).toBe('left-field');
      expect(Position.centerField().value).toBe('center-field');
      expect(Position.rightField().value).toBe('right-field');
    });

    it('should create slowpitch specific positions', () => {
      expect(Position.shortFielder().value).toBe('short-fielder');
      expect(Position.extraPlayer().value).toBe('extra-player');
    });
  });

  describe('position validation', () => {
    it('should validate known positions', () => {
      expect(Position.isValid('pitcher')).toBe(true);
      expect(Position.isValid('short-fielder')).toBe(true);
      expect(Position.isValid('extra-player')).toBe(true);
      expect(Position.isValid('invalid')).toBe(false);
    });
  });

  describe('position numbering', () => {
    it('should return correct position numbers', () => {
      expect(Position.pitcher().getPositionNumber()).toBe(1);
      expect(Position.catcher().getPositionNumber()).toBe(2);
      expect(Position.firstBase().getPositionNumber()).toBe(3);
      expect(Position.secondBase().getPositionNumber()).toBe(4);
      expect(Position.thirdBase().getPositionNumber()).toBe(5);
      expect(Position.shortstop().getPositionNumber()).toBe(6);
      expect(Position.leftField().getPositionNumber()).toBe(7);
      expect(Position.centerField().getPositionNumber()).toBe(8);
      expect(Position.rightField().getPositionNumber()).toBe(9);
      expect(Position.shortFielder().getPositionNumber()).toBe(10);
      expect(Position.extraPlayer().getPositionNumber()).toBe(11);
    });
  });

  describe('defensive position check', () => {
    it('should identify defensive positions', () => {
      expect(Position.pitcher().isDefensivePosition()).toBe(true);
      expect(Position.shortFielder().isDefensivePosition()).toBe(true);
      expect(Position.extraPlayer().isDefensivePosition()).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should get all positions in conventional order', () => {
      const positions = Position.getAllPositions();
      expect(positions).toHaveLength(11);
      expect(positions[0].value).toBe('pitcher');
      expect(positions[9].value).toBe('short-fielder');
      expect(positions[10].value).toBe('extra-player');
    });

    it('should create from value', () => {
      const position = Position.fromValue('pitcher');
      expect(position.value).toBe('pitcher');
    });

    it('should handle equality correctly', () => {
      const pos1 = Position.pitcher();
      const pos2 = Position.pitcher();
      const pos3 = Position.catcher();

      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });

    it('should convert to string', () => {
      const position = Position.pitcher();
      expect(position.toString()).toBe('pitcher');
    });
  });
});
