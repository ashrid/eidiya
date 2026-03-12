/**
 * Tests for contributor validation utilities
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  DENOMINATION_FILS,
  calculateBreakdownTotal,
  validateDenominationSum,
  validateContributorForm,
} from './contributor.js';

describe('DENOMINATION_FILS', () => {
  it('should map all 8 denomination keys to fils values', () => {
    expect(DENOMINATION_FILS).toEqual({
      five: 500,
      ten: 1000,
      twenty: 2000,
      fifty: 5000,
      hundred: 10000,
      twoHundred: 20000,
      fiveHundred: 50000,
      thousand: 100000,
    });
  });
});

describe('calculateBreakdownTotal', () => {
  it('should return 0 for empty breakdown', () => {
    const breakdown = {};
    expect(calculateBreakdownTotal(breakdown)).toBe(0);
  });

  it('should return 0 for breakdown with all zeros', () => {
    const breakdown = {
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    };
    expect(calculateBreakdownTotal(breakdown)).toBe(0);
  });

  it('should correctly sum single denomination', () => {
    const breakdown = { thousand: 5 };
    expect(calculateBreakdownTotal(breakdown)).toBe(500000);
  });

  it('should correctly sum multiple denominations', () => {
    const breakdown = {
      five: 2,      // 2 × 500 = 1000 fils
      ten: 1,       // 1 × 1000 = 1000 fils
      twenty: 0,
      fifty: 1,     // 1 × 5000 = 5000 fils
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 1,  // 1 × 100000 = 100000 fils
    };
    expect(calculateBreakdownTotal(breakdown)).toBe(107000);
  });

  it('should handle partial breakdown (missing keys)', () => {
    const breakdown = {
      hundred: 3,
      fiveHundred: 2,
    };
    // 3 × 10000 + 2 × 50000 = 30000 + 100000 = 130000 fils
    expect(calculateBreakdownTotal(breakdown)).toBe(130000);
  });

  it('should use integer calculations (no floating-point)', () => {
    const breakdown = {
      five: 1,
      ten: 1,
    };
    // 500 + 1000 = 1500 fils (exact integer)
    const result = calculateBreakdownTotal(breakdown);
    expect(result).toBe(1500);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should handle string numbers by parsing', () => {
    const breakdown = {
      five: '2',
      ten: '1',
    };
    // Should parse strings to integers: 2 × 500 + 1 × 1000 = 2000 fils
    expect(calculateBreakdownTotal(breakdown)).toBe(2000);
  });

  it('should treat invalid values as 0', () => {
    const breakdown = {
      five: null,
      ten: undefined,
      twenty: 'invalid',
      fifty: -1,
      hundred: 2,
    };
    // Only hundred: 2 × 10000 = 20000 fils
    expect(calculateBreakdownTotal(breakdown)).toBe(20000);
  });
});

describe('validateDenominationSum', () => {
  it('should return valid=true when sums match exactly', () => {
    const totalFils = 500000; // 5000 AED
    const breakdown = { thousand: 5 };
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid=true for zero total with empty breakdown', () => {
    const result = validateDenominationSum(0, {});
    expect(result.valid).toBe(true);
  });

  it('should return valid=false with error when breakdown sum is less than total', () => {
    const totalFils = 100000; // 1000 AED
    const breakdown = { fiveHundred: 1 }; // 500 AED
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('500 AED');
    expect(result.error).toContain('1000 AED');
    expect(result.error).toContain('difference');
    expect(result.error).toContain('500 AED');
  });

  it('should return valid=false with error when breakdown sum exceeds total', () => {
    const totalFils = 50000; // 500 AED
    const breakdown = { thousand: 1 }; // 1000 AED
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('1000 AED');
    expect(result.error).toContain('500 AED');
    expect(result.error).toContain('difference');
    expect(result.error).toContain('500 AED');
  });

  it('should handle negative difference correctly (breakdown < total)', () => {
    const totalFils = 200000; // 2000 AED
    const breakdown = { thousand: 1 }; // 1000 AED
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('1000 AED'); // calculated
    expect(result.error).toContain('2000 AED'); // total
    expect(result.error).toContain('1000 AED'); // difference
  });

  it('should format error message with actual, expected, and difference', () => {
    const totalFils = 150000; // 1500 AED
    const breakdown = { hundred: 10 }; // 1000 AED
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Breakdown sum is.*1000.*AED.*but total is.*1500.*AED.*difference.*500.*AED/i);
  });

  it('should handle complex multi-denomination breakdowns', () => {
    const totalFils = 5500; // 55 AED
    const breakdown = {
      five: 1,   // 5 AED
      ten: 2,    // 20 AED
      fifty: 1,  // 50 AED
    };
    // Total breakdown: 75 AED (7500 fils)
    const result = validateDenominationSum(totalFils, breakdown);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('75 AED');
    expect(result.error).toContain('55 AED');
    expect(result.error).toContain('20 AED'); // difference
  });
});
