/**
 * Tests for state selectors - aggregation functions
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { calculateBankNotes, calculateSummary } from './selectors.js';

describe('calculateBankNotes', () => {
  it('should return all zero counts for empty array', () => {
    const result = calculateBankNotes([]);

    expect(result).toEqual({
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    });
  });

  it('should return all zero counts for null/undefined', () => {
    expect(calculateBankNotes(null)).toEqual({
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    });

    expect(calculateBankNotes(undefined)).toEqual({
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    });
  });

  it('should calculate correct sums for single contributor', () => {
    const contributors = [
      {
        id: '1',
        name: 'Test',
        breakdown: { five: 2, ten: 1, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
    ];

    const result = calculateBankNotes(contributors);

    expect(result.five).toBe(2);
    expect(result.ten).toBe(1);
    expect(result.twenty).toBe(0);
  });

  it('should sum across multiple contributors', () => {
    const contributors = [
      {
        id: '1',
        name: 'Alice',
        breakdown: { five: 2, ten: 1, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
      {
        id: '2',
        name: 'Bob',
        breakdown: { five: 1, ten: 2, twenty: 1, fifty: 0, hundred: 1, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
    ];

    const result = calculateBankNotes(contributors);

    expect(result.five).toBe(3);
    expect(result.ten).toBe(3);
    expect(result.twenty).toBe(1);
    expect(result.fifty).toBe(1);
    expect(result.hundred).toBe(1);
  });

  it('should handle missing breakdown fields', () => {
    const contributors = [
      {
        id: '1',
        name: 'Test',
        breakdown: { five: 1 },
      },
    ];

    const result = calculateBankNotes(contributors);

    expect(result.five).toBe(1);
    expect(result.ten).toBe(0);
  });

  it('should handle missing breakdown object', () => {
    const contributors = [
      {
        id: '1',
        name: 'Test',
      },
    ];

    const result = calculateBankNotes(contributors);

    expect(result).toEqual({
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    });
  });

  it('should handle all denominations correctly', () => {
    const contributors = [
      {
        id: '1',
        name: 'Full',
        breakdown: {
          five: 1,
          ten: 2,
          twenty: 3,
          fifty: 4,
          hundred: 5,
          twoHundred: 6,
          fiveHundred: 7,
          thousand: 8,
        },
      },
    ];

    const result = calculateBankNotes(contributors);

    expect(result.five).toBe(1);
    expect(result.ten).toBe(2);
    expect(result.twenty).toBe(3);
    expect(result.fifty).toBe(4);
    expect(result.hundred).toBe(5);
    expect(result.twoHundred).toBe(6);
    expect(result.fiveHundred).toBe(7);
    expect(result.thousand).toBe(8);
  });
});

describe('calculateSummary', () => {
  it('should return zeros for empty array', () => {
    const result = calculateSummary([]);

    expect(result.grandTotalFils).toBe(0);
    expect(result.contributorCount).toBe(0);
    expect(result.totalNotes).toBe(0);
    expect(result.notes).toEqual({
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    });
  });

  it('should return zeros for null/undefined', () => {
    const result = calculateSummary(null);

    expect(result.grandTotalFils).toBe(0);
    expect(result.contributorCount).toBe(0);
    expect(result.totalNotes).toBe(0);
  });

  it('should calculate correct summary for single contributor', () => {
    const contributors = [
      {
        id: '1',
        name: 'Test',
        amountInFils: 10000, // 100 AED
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
    ];

    const result = calculateSummary(contributors);

    expect(result.grandTotalFils).toBe(10000);
    expect(result.contributorCount).toBe(1);
    expect(result.totalNotes).toBe(2);
    expect(result.notes.fifty).toBe(2);
  });

  it('should calculate correct summary for multiple contributors', () => {
    const contributors = [
      {
        id: '1',
        name: 'Alice',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
      {
        id: '2',
        name: 'Bob',
        amountInFils: 50000, // 500 AED
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 1, thousand: 0 },
      },
    ];

    const result = calculateSummary(contributors);

    expect(result.grandTotalFils).toBe(60000);
    expect(result.contributorCount).toBe(2);
    expect(result.totalNotes).toBe(3);
    expect(result.notes.fifty).toBe(2);
    expect(result.notes.fiveHundred).toBe(1);
  });

  it('should calculate total notes across all denominations', () => {
    const contributors = [
      {
        id: '1',
        name: 'Test',
        amountInFils: 188500, // 1,885 AED = 8 notes
        breakdown: { five: 1, ten: 1, twenty: 1, fifty: 1, hundred: 1, twoHundred: 1, fiveHundred: 1, thousand: 1 },
      },
    ];

    const result = calculateSummary(contributors);

    expect(result.totalNotes).toBe(8);
  });

  it('should handle contributors with zero amounts', () => {
    const contributors = [
      {
        id: '1',
        name: 'Zero',
        amountInFils: 0,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
    ];

    const result = calculateSummary(contributors);

    expect(result.grandTotalFils).toBe(0);
    expect(result.contributorCount).toBe(1);
    expect(result.totalNotes).toBe(0);
  });

  it('should handle missing amountInFils', () => {
    const contributors = [
      {
        id: '1',
        name: 'NoAmount',
        breakdown: { five: 1, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      },
    ];

    const result = calculateSummary(contributors);

    expect(result.grandTotalFils).toBe(0);
    expect(result.totalNotes).toBe(1);
  });
});
