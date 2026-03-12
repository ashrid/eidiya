/**
 * Tests for state schema validation and migrations
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_STATE,
  validateState,
  migrateState,
} from './schema.js';

describe('schema', () => {
  describe('CURRENT_SCHEMA_VERSION', () => {
    it('should be "1.1.0"', () => {
      expect(CURRENT_SCHEMA_VERSION).toBe('1.1.0');
    });
  });

  describe('DEFAULT_STATE', () => {
    it('should have schema version', () => {
      expect(DEFAULT_STATE.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should have empty contributors array', () => {
      expect(DEFAULT_STATE.contributors).toEqual([]);
    });

    it('should have createdAt timestamp', () => {
      expect(typeof DEFAULT_STATE.createdAt).toBe('string');
      expect(DEFAULT_STATE.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should have updatedAt timestamp', () => {
      expect(typeof DEFAULT_STATE.updatedAt).toBe('string');
      expect(DEFAULT_STATE.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('validateState', () => {
    it('should reject non-objects', () => {
      const result = validateState(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('object');
    });

    it('should reject arrays', () => {
      const result = validateState([]);
      expect(result.valid).toBe(false);
    });

    it('should reject non-array contributors', () => {
      const result = validateState({ contributors: 'not-an-array' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contributors');
    });

    it('should accept valid state with empty contributors', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject contributor without id', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ name: 'Test', amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('id');
    });

    it('should reject contributor with non-string id', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 123, name: 'Test', amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('id');
    });

    it('should reject contributor without name', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject contributor with non-string name', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 123, amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject contributor without date', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('date');
    });

    it('should reject contributor with non-string date', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', date: 123, amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('date');
    });

    it('should reject contributor without amountInFils', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', date: '2024-01-01' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('amountInFils');
    });

    it('should reject contributor with non-integer amountInFils', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', date: '2024-01-01', amountInFils: 10.5 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('amountInFils');
    });

    it('should reject contributor without breakdown', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', date: '2024-01-01', amountInFils: 1000 }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('breakdown');
    });

    it('should reject contributor with non-object breakdown', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{ id: 'abc', name: 'Test', date: '2024-01-01', amountInFils: 1000, breakdown: 'invalid' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('breakdown');
    });

    it('should reject contributor with invalid breakdown properties', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{
          id: 'abc',
          name: 'Test',
          date: '2024-01-01',
          amountInFils: 1000,
          breakdown: { five: 'not-a-number' }
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('breakdown');
    });

    it('should accept valid contributor with complete breakdown', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{
          id: 'abc123',
          name: 'Ahmed',
          date: '2024-01-01',
          amountInFils: 5500,
          breakdown: {
            five: 1,
            ten: 0,
            twenty: 0,
            fifty: 1,
            hundred: 0,
            twoHundred: 0,
            fiveHundred: 0,
            thousand: 5,
          },
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept valid contributor with partial breakdown', () => {
      const result = validateState({
        version: '1.0.0',
        contributors: [{
          id: 'abc123',
          name: 'Ahmed',
          date: '2024-01-01',
          amountInFils: 5000,
          breakdown: {
            five: 0,
            ten: 0,
            twenty: 0,
            fifty: 0,
            hundred: 0,
            twoHundred: 0,
            fiveHundred: 0,
            thousand: 5,
          },
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept contributor with received field', () => {
      const result = validateState({
        version: '1.1.0',
        contributors: [{
          id: 'abc123',
          name: 'Ahmed',
          date: '2024-01-01',
          amountInFils: 5000,
          received: true,
          breakdown: {
            five: 0,
            ten: 0,
            twenty: 0,
            fifty: 0,
            hundred: 0,
            twoHundred: 0,
            fiveHundred: 0,
            thousand: 5,
          },
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject contributor with non-boolean received field', () => {
      const result = validateState({
        version: '1.1.0',
        contributors: [{
          id: 'abc123',
          name: 'Ahmed',
          date: '2024-01-01',
          amountInFils: 5000,
          received: 'yes',
          breakdown: {
            five: 0,
            ten: 0,
            twenty: 0,
            fifty: 0,
            hundred: 0,
            twoHundred: 0,
            fiveHundred: 0,
            thousand: 5,
          },
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('received');
    });
  });

  describe('migrateState', () => {
    it('should add version if missing', () => {
      const data = { contributors: [] };
      const migrated = migrateState(data);
      expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should preserve existing version', () => {
      const data = { version: '0.9.0', contributors: [] };
      const migrated = migrateState(data);
      expect(migrated.version).toBe('0.9.0');
    });

    it('should add createdAt if missing', () => {
      const data = { version: '1.0.0', contributors: [] };
      const migrated = migrateState(data);
      expect(typeof migrated.createdAt).toBe('string');
      expect(migrated.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should preserve existing createdAt', () => {
      const data = { version: '1.0.0', contributors: [], createdAt: '2024-01-01T00:00:00Z' };
      const migrated = migrateState(data);
      expect(migrated.createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should add updatedAt if missing', () => {
      const data = { version: '1.0.0', contributors: [] };
      const migrated = migrateState(data);
      expect(typeof migrated.updatedAt).toBe('string');
      expect(migrated.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should update updatedAt on migration', () => {
      const data = { version: '1.0.0', contributors: [], updatedAt: '2024-01-01T00:00:00Z' };
      const migrated = migrateState(data);
      expect(migrated.updatedAt).not.toBe('2024-01-01T00:00:00Z');
    });

    it('should add contributors array if missing', () => {
      const data = { version: '1.0.0' };
      const migrated = migrateState(data);
      expect(migrated.contributors).toEqual([]);
    });

    it('should not mutate original data', () => {
      const data = { version: '1.0.0', contributors: [] };
      const migrated = migrateState(data);
      expect(migrated).not.toBe(data);
    });

    it('should default received to false for existing contributors without received field', () => {
      const data = {
        version: '1.0.0',
        contributors: [
          { id: '1', name: 'Alice', date: '2024-01-01', amountInFils: 10000, breakdown: { thousand: 10 } },
          { id: '2', name: 'Bob', date: '2024-01-02', amountInFils: 5000, breakdown: { fiveHundred: 10 } },
        ],
      };
      const migrated = migrateState(data);
      expect(migrated.contributors[0].received).toBe(false);
      expect(migrated.contributors[1].received).toBe(false);
    });

    it('should preserve existing received values during migration', () => {
      const data = {
        version: '1.0.0',
        contributors: [
          { id: '1', name: 'Alice', date: '2024-01-01', amountInFils: 10000, received: true, breakdown: { thousand: 10 } },
          { id: '2', name: 'Bob', date: '2024-01-02', amountInFils: 5000, received: false, breakdown: { fiveHundred: 10 } },
        ],
      };
      const migrated = migrateState(data);
      expect(migrated.contributors[0].received).toBe(true);
      expect(migrated.contributors[1].received).toBe(false);
    });
  });
});
