import { describe, expect, test } from '@jest/globals';
import { LineupValidationResult } from '../../../../src/domain/services/LineupValidationResult';

/**
 * TDD Unit Tests for LineupValidationResult
 *
 * These tests are written BEFORE implementation and will initially fail.
 * They define the expected behavior for lineup validation result handling.
 */

describe('LineupValidationResult - TDD Tests', () => {
  describe('Construction and Basic Properties', () => {
    test('should create valid result when no errors provided', () => {
      const result = new LineupValidationResult([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.hasErrors()).toBe(false);
    });

    test('should create invalid result when errors provided', () => {
      const errors = ['LINEUP_INCOMPLETE', 'BATTING_ORDER_INVALID'];
      const result = new LineupValidationResult(errors);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(result.hasErrors()).toBe(true);
    });

    test('should handle null or undefined errors array', () => {
      const result1 = new LineupValidationResult(null as any);
      const result2 = new LineupValidationResult(undefined as any);

      expect(result1.isValid).toBe(true);
      expect(result1.errors).toEqual([]);

      expect(result2.isValid).toBe(true);
      expect(result2.errors).toEqual([]);
    });
  });

  describe('Error Message Retrieval', () => {
    test('should return correct error message for known error codes', () => {
      const errors = [
        'LINEUP_INCOMPLETE',
        'BATTING_ORDER_INVALID',
        'POSITION_DUPLICATE',
      ];
      const result = new LineupValidationResult(errors);

      expect(result.getErrorMessage('LINEUP_INCOMPLETE')).toBe(
        'Lineup must have at least 9 batting positions and all defensive positions assigned'
      );
      expect(result.getErrorMessage('BATTING_ORDER_INVALID')).toBe(
        'Batting order must be sequential starting from 1'
      );
      expect(result.getErrorMessage('POSITION_DUPLICATE')).toBe(
        'Each defensive position can only be assigned to one player'
      );
    });

    test('should return correct error message for player validation errors', () => {
      const errors = ['PLAYER_NOT_ON_TEAM', 'NO_PLAYERS_AVAILABLE'];
      const result = new LineupValidationResult(errors);

      expect(result.getErrorMessage('PLAYER_NOT_ON_TEAM')).toBe(
        'Selected player is not on the chosen team'
      );
      expect(result.getErrorMessage('NO_PLAYERS_AVAILABLE')).toBe(
        'Selected team has no active players available for lineup'
      );
    });

    test('should return correct error message for essential positions', () => {
      const errors = ['MISSING_ESSENTIAL_POSITIONS', 'INSUFFICIENT_PLAYERS'];
      const result = new LineupValidationResult(errors);

      expect(result.getErrorMessage('MISSING_ESSENTIAL_POSITIONS')).toBe(
        'Lineup must include pitcher and catcher positions'
      );
      expect(result.getErrorMessage('INSUFFICIENT_PLAYERS')).toBe(
        'Team needs at least 9 active players to create a complete lineup'
      );
    });

    test('should return generic message for unknown error codes', () => {
      const errors = ['UNKNOWN_ERROR_CODE'];
      const result = new LineupValidationResult(errors);

      expect(result.getErrorMessage('UNKNOWN_ERROR_CODE')).toBe(
        'Unknown validation error occurred'
      );
    });

    test('should return empty string for error code not in result', () => {
      const errors = ['LINEUP_INCOMPLETE'];
      const result = new LineupValidationResult(errors);

      expect(result.getErrorMessage('BATTING_ORDER_INVALID')).toBe('');
    });
  });

  describe('Error Checking Methods', () => {
    test('should correctly identify specific errors', () => {
      const errors = ['LINEUP_INCOMPLETE', 'POSITION_DUPLICATE'];
      const result = new LineupValidationResult(errors);

      expect(result.hasError('LINEUP_INCOMPLETE')).toBe(true);
      expect(result.hasError('POSITION_DUPLICATE')).toBe(true);
      expect(result.hasError('BATTING_ORDER_INVALID')).toBe(false);
    });

    test('should handle case-sensitive error codes', () => {
      const errors = ['LINEUP_INCOMPLETE'];
      const result = new LineupValidationResult(errors);

      expect(result.hasError('LINEUP_INCOMPLETE')).toBe(true);
      expect(result.hasError('lineup_incomplete')).toBe(false);
      expect(result.hasError('Lineup_Incomplete')).toBe(false);
    });
  });

  describe('Error Summary and Reporting', () => {
    test('should provide accurate validation summary for single error', () => {
      const errors = ['LINEUP_INCOMPLETE'];
      const result = new LineupValidationResult(errors);

      expect(result.getValidationSummary()).toBe(
        'Lineup has 1 validation error that must be resolved'
      );
    });

    test('should provide accurate validation summary for multiple errors', () => {
      const errors = [
        'LINEUP_INCOMPLETE',
        'BATTING_ORDER_INVALID',
        'POSITION_DUPLICATE',
      ];
      const result = new LineupValidationResult(errors);

      expect(result.getValidationSummary()).toBe(
        'Lineup has 3 validation errors that must be resolved'
      );
    });

    test('should provide success summary for valid lineup', () => {
      const result = new LineupValidationResult([]);

      expect(result.getValidationSummary()).toBe(
        'Lineup is valid and ready to use'
      );
    });

    test('should return all error messages as formatted list', () => {
      const errors = ['LINEUP_INCOMPLETE', 'BATTING_ORDER_INVALID'];
      const result = new LineupValidationResult(errors);

      const allErrors = result.getAllErrorMessages();
      expect(allErrors).toContain(
        'Lineup must have at least 9 batting positions and all defensive positions assigned'
      );
      expect(allErrors).toContain(
        'Batting order must be sequential starting from 1'
      );
      expect(allErrors.length).toBe(2);
    });

    test('should return empty array for valid lineup error messages', () => {
      const result = new LineupValidationResult([]);

      expect(result.getAllErrorMessages()).toEqual([]);
    });
  });

  describe('Error Priority and Categorization', () => {
    test('should identify critical errors that block game start', () => {
      const errors = [
        'LINEUP_INCOMPLETE',
        'NO_PLAYERS_AVAILABLE',
        'MISSING_ESSENTIAL_POSITIONS',
      ];
      const result = new LineupValidationResult(errors);

      expect(result.hasCriticalErrors()).toBe(true);

      const criticalErrors = result.getCriticalErrors();
      expect(criticalErrors).toContain('LINEUP_INCOMPLETE');
      expect(criticalErrors).toContain('NO_PLAYERS_AVAILABLE');
      expect(criticalErrors).toContain('MISSING_ESSENTIAL_POSITIONS');
    });

    test('should identify non-critical warnings', () => {
      const errors = ['POSITION_DUPLICATE', 'BATTING_ORDER_INVALID'];
      const result = new LineupValidationResult(errors);

      expect(result.hasCriticalErrors()).toBe(true); // These are still critical for game play
      expect(result.hasWarnings()).toBe(false); // These specific errors are not warnings
    });

    test('should handle mixed critical and warning errors', () => {
      // Note: This test assumes future implementation of warning-level validations
      const errors = ['LINEUP_INCOMPLETE', 'PLAYER_POSITION_MISMATCH']; // Assuming second is a warning
      const result = new LineupValidationResult(errors);

      expect(result.hasCriticalErrors()).toBe(true);
      expect(result.hasWarnings()).toBe(false); // Currently all errors are critical
    });
  });

  describe('JSON Serialization and API Response Format', () => {
    test('should serialize to API response format', () => {
      const errors = ['LINEUP_INCOMPLETE', 'BATTING_ORDER_INVALID'];
      const result = new LineupValidationResult(errors);

      const apiResponse = result.toApiResponse();

      expect(apiResponse).toEqual({
        isValid: false,
        errors: [
          {
            code: 'LINEUP_INCOMPLETE',
            message:
              'Lineup must have at least 9 batting positions and all defensive positions assigned',
          },
          {
            code: 'BATTING_ORDER_INVALID',
            message: 'Batting order must be sequential starting from 1',
          },
        ],
        summary: 'Lineup has 2 validation errors that must be resolved',
      });
    });

    test('should serialize valid result to API response format', () => {
      const result = new LineupValidationResult([]);

      const apiResponse = result.toApiResponse();

      expect(apiResponse).toEqual({
        isValid: true,
        errors: [],
        summary: 'Lineup is valid and ready to use',
      });
    });
  });

  describe('Immutability and Thread Safety', () => {
    test('should not allow modification of errors array', () => {
      const originalErrors = ['LINEUP_INCOMPLETE'];
      const result = new LineupValidationResult(originalErrors);

      // Attempting to modify the errors array should not affect the result
      originalErrors.push('BATTING_ORDER_INVALID');
      result.errors.push('POSITION_DUPLICATE');

      expect(result.errors).toEqual(['LINEUP_INCOMPLETE']);
      expect(result.hasError('BATTING_ORDER_INVALID')).toBe(false);
      expect(result.hasError('POSITION_DUPLICATE')).toBe(false);
    });

    test('should return new array instances for error collections', () => {
      const errors = ['LINEUP_INCOMPLETE', 'BATTING_ORDER_INVALID'];
      const result = new LineupValidationResult(errors);

      const errors1 = result.getAllErrorMessages();
      const errors2 = result.getAllErrorMessages();

      expect(errors1).toEqual(errors2);
      expect(errors1).not.toBe(errors2); // Different array instances
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty string error codes', () => {
      const errors = ['', 'LINEUP_INCOMPLETE', ''];
      const result = new LineupValidationResult(errors);

      expect(result.errors.length).toBe(1); // Empty strings should be filtered out
      expect(result.hasError('LINEUP_INCOMPLETE')).toBe(true);
      expect(result.hasError('')).toBe(false);
    });

    test('should handle duplicate error codes', () => {
      const errors = [
        'LINEUP_INCOMPLETE',
        'LINEUP_INCOMPLETE',
        'BATTING_ORDER_INVALID',
      ];
      const result = new LineupValidationResult(errors);

      expect(result.errors.length).toBe(2); // Duplicates should be removed
      expect(result.hasError('LINEUP_INCOMPLETE')).toBe(true);
      expect(result.hasError('BATTING_ORDER_INVALID')).toBe(true);
    });

    test('should handle extremely long error lists', () => {
      const manyErrors = Array(1000).fill('LINEUP_INCOMPLETE');
      const result = new LineupValidationResult(manyErrors);

      expect(result.errors.length).toBe(1); // Should deduplicate
      expect(result.isValid).toBe(false);
      expect(result.getValidationSummary()).toBe(
        'Lineup has 1 validation error that must be resolved'
      );
    });
  });
});
