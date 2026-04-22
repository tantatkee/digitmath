import { describe, it, expect } from 'vitest';
import { evaluateExpression, generatePuzzle, verifyUserExpression } from './engine';

describe('engine', () => {
  describe('evaluateExpression', () => {
    it('should evaluate simple expressions', () => {
      expect(evaluateExpression('2+2')).toBe(4);
      expect(evaluateExpression('10-4')).toBe(6);
      expect(evaluateExpression('3*4')).toBe(12);
      expect(evaluateExpression('12/3')).toBe(4);
    });

    it('should handle floating point results', () => {
      expect(evaluateExpression('1/3')).toBeCloseTo(0.333333, 5);
    });

    it('should return NaN for invalid characters', () => {
      expect(evaluateExpression('2+2; alert(1)')).toBe(NaN);
    });

    it('should return NaN for malformed expressions', () => {
      expect(evaluateExpression('2++2')).toBe(NaN);
    });
  });

  describe('generatePuzzle', () => {
    it('should generate a solvable puzzle for easy difficulty', () => {
      const puzzle = generatePuzzle('easy');
      expect(puzzle).toHaveLength(4);
    });

    it('should generate a solvable puzzle for medium difficulty', () => {
      const puzzle = generatePuzzle('medium');
      expect(puzzle).toHaveLength(5);
    });

    it('should generate a solvable puzzle for hard difficulty', () => {
      const puzzle = generatePuzzle('hard');
      expect(puzzle).toHaveLength(6);
    });
  });

  describe('verifyUserExpression', () => {
    it('should verify 7 - 4 = 3 with digits [3, 4, 7]', () => {
      const puzzle = [3, 4, 7];
      const expr = [7, '-', 4, '=', 3];
      const result = verifyUserExpression(expr, puzzle);
      expect(result.valid).toBe(true);
    });

    it('should fail if not all digits are used', () => {
      const puzzle = [3, 4, 7, 9];
      const expr = [7, '-', 4, '=', 3];
      const result = verifyUserExpression(expr, puzzle);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('all given numbers');
    });

    it('should fail if wrong digits are used', () => {
      const puzzle = [3, 4, 7];
      const expr = [8, '-', 5, '=', 3];
      const result = verifyUserExpression(expr, puzzle);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid numbers used');
    });

    it('should verify (7 - 4) * 3 = 9 with digits [3, 4, 7, 9]', () => {
      const puzzle = [3, 4, 7, 9];
      const expr = ['(', 7, '-', 4, ')', '*', 3, '=', 9];
      const result = verifyUserExpression(expr, puzzle);
      expect(result.valid).toBe(true);
    });

    it('should fail if mathematically incorrect with parentheses', () => {
      const puzzle = [3, 4, 7, 9];
      const expr = ['(', 7, '-', 4, ')', '+', 3, '=', 9];
      const result = verifyUserExpression(expr, puzzle);
      expect(result.valid).toBe(false);
    });
  });
});
