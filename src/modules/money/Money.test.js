import { describe, it, expect } from 'vitest';
import { Money } from './Money.js';

describe('Money', () => {
  describe('construction', () => {
    it('should store integer fils', () => {
      const money = new Money(5000);
      expect(money.toFils()).toBe(5000);
    });

    it('should throw TypeError for non-integer input', () => {
      expect(() => new Money(50.5)).toThrow(TypeError);
      expect(() => new Money(50.5)).toThrow('Money must be initialized with integer fils');
    });

    it('should throw TypeError for string input', () => {
      expect(() => new Money('5000')).toThrow(TypeError);
    });
  });

  describe('fromAED', () => {
    it('should convert AED to fils', () => {
      const money = Money.fromAED(50);
      expect(money.toFils()).toBe(5000);
    });

    it('should handle decimal AED amounts', () => {
      const money = Money.fromAED(50.25);
      expect(money.toFils()).toBe(5025);
    });

    it('should round to nearest fils', () => {
      expect(Money.fromAED(50.999).toFils()).toBe(5100);
      expect(Money.fromAED(50.001).toFils()).toBe(5000);
    });
  });

  describe('toAED', () => {
    it('should convert fils to AED', () => {
      const money = new Money(5025);
      expect(money.toAED()).toBe(50.25);
    });

    it('should handle zero', () => {
      const money = new Money(0);
      expect(money.toAED()).toBe(0);
    });
  });

  describe('arithmetic', () => {
    it('should add two Money amounts', () => {
      const a = new Money(5000);
      const b = new Money(2500);
      const result = a.add(b);
      expect(result.toFils()).toBe(7500);
    });

    it('should subtract two Money amounts', () => {
      const a = new Money(5000);
      const b = new Money(2500);
      const result = a.subtract(b);
      expect(result.toFils()).toBe(2500);
    });

    it('should multiply by a factor', () => {
      const money = new Money(5000);
      const result = money.multiply(2);
      expect(result.toFils()).toBe(10000);
    });

    it('should round multiplication results', () => {
      const money = new Money(333);
      const result = money.multiply(1.5);
      expect(result.toFils()).toBe(500);
    });

    it('should avoid floating-point errors', () => {
      // 0.1 + 0.2 !== 0.3 in JavaScript floating point
      const a = Money.fromAED(0.1);
      const b = Money.fromAED(0.2);
      const result = a.add(b);
      expect(result.toFils()).toBe(30); // 30 fils = 0.30 AED
    });
  });

  describe('format', () => {
    it('should format as AED currency', () => {
      const money = new Money(5025);
      const formatted = money.format();
      expect(formatted).toContain('50.25');
      expect(formatted).toContain('AED');
    });

    it('should use en-AE locale by default', () => {
      const money = new Money(5000);
      const formatted = money.format();
      // en-AE uses Western Arabic numerals
      expect(formatted).toMatch(/\d/);
    });
  });

  describe('serialization', () => {
    it('should serialize to integer fils', () => {
      const money = new Money(5025);
      expect(money.toJSON()).toBe(5025);
    });

    it('should work with JSON.stringify', () => {
      const money = new Money(5000);
      const json = JSON.stringify({ amount: money });
      expect(json).toBe('{"amount":5000}');
    });
  });
});
