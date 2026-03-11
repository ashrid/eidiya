/**
 * Tests for currency formatting utilities
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { formatAED, formatFils } from './formatters.js';

describe('formatAED', () => {
  // Helper to normalize non-breaking space to regular space for comparison
  const normalizeSpace = (str) => str.replace(/\u00a0/g, ' ');

  it('should format whole AED amounts', () => {
    expect(normalizeSpace(formatAED(5000))).toBe('AED 50.00');
    expect(normalizeSpace(formatAED(10000))).toBe('AED 100.00');
    expect(normalizeSpace(formatAED(100000))).toBe('AED 1,000.00');
  });

  it('should format fractional amounts', () => {
    expect(normalizeSpace(formatAED(5025))).toBe('AED 50.25');
    expect(normalizeSpace(formatAED(5500))).toBe('AED 55.00');
    expect(normalizeSpace(formatAED(5125))).toBe('AED 51.25');
  });

  it('should format zero', () => {
    expect(normalizeSpace(formatAED(0))).toBe('AED 0.00');
  });

  it('should handle negative amounts', () => {
    // Intl.NumberFormat places negative sign before currency symbol
    expect(formatAED(-1000)).toMatch(/-AED/);
    expect(formatAED(-1000)).toMatch(/10\.00/);
    expect(formatAED(-5025)).toMatch(/-AED/);
    expect(formatAED(-5025)).toMatch(/50\.25/);
  });

  it('should format large amounts with thousands separator', () => {
    expect(normalizeSpace(formatAED(125000))).toBe('AED 1,250.00');
    expect(normalizeSpace(formatAED(1250000))).toBe('AED 12,500.00');
    expect(normalizeSpace(formatAED(12500000))).toBe('AED 125,000.00');
  });

  it('should use en-AE locale by default', () => {
    const result = formatAED(125000);
    expect(result).toContain('AED');
    expect(result).toContain('1,250.00');
  });

  it('should support ar-AE locale for Arabic formatting', () => {
    const result = formatAED(125000, 'ar-AE');
    // Arabic locale uses different formatting
    expect(result).toContain('1,250');
    expect(result).toContain('د.إ');
  });

  it('should always show 2 decimal places', () => {
    expect(normalizeSpace(formatAED(100))).toBe('AED 1.00');
    expect(normalizeSpace(formatAED(105))).toBe('AED 1.05');
    expect(normalizeSpace(formatAED(150))).toBe('AED 1.50');
  });

  it('should handle single fils', () => {
    expect(normalizeSpace(formatAED(1))).toBe('AED 0.01');
    expect(normalizeSpace(formatAED(5))).toBe('AED 0.05');
    expect(normalizeSpace(formatAED(10))).toBe('AED 0.10');
  });
});

describe('formatFils', () => {
  it('should format fils with comma separators', () => {
    expect(formatFils(5000)).toBe('5,000 fils');
    expect(formatFils(100000)).toBe('100,000 fils');
  });

  it('should format zero fils', () => {
    expect(formatFils(0)).toBe('0 fils');
  });

  it('should handle negative fils', () => {
    expect(formatFils(-5000)).toBe('-5,000 fils');
  });

  it('should use en-AE locale by default', () => {
    const result = formatFils(1234567);
    expect(result).toBe('1,234,567 fils');
  });

  it('should support custom locale', () => {
    const result = formatFils(1234567, 'de-DE');
    // German locale uses periods for thousands
    expect(result).toBe('1.234.567 fils');
  });
});
