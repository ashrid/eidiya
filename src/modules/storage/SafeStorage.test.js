import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafeStorage } from './SafeStorage.js';

describe('SafeStorage', () => {
  let storage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new SafeStorage();
  });

  describe('initialization', () => {
    it('should detect localStorage availability', () => {
      expect(storage.isAvailable()).toBe(true);
    });

    it('should not use fallback initially when localStorage works', () => {
      expect(storage.isUsingFallback()).toBe(false);
    });
  });

  describe('setItem', () => {
    it('should store string values', () => {
      const result = storage.setItem('key1', 'value1');
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(false);
    });

    it('should store object values as JSON', () => {
      const obj = { name: 'test', value: 123 };
      storage.setItem('key1', obj);
      const retrieved = storage.getItem('key1');
      expect(retrieved).toEqual(obj);
    });

    it('should store array values as JSON', () => {
      const arr = [1, 2, 3];
      storage.setItem('key1', arr);
      const retrieved = storage.getItem('key1');
      expect(retrieved).toEqual(arr);
    });

    it('should work in fallback mode when forced', () => {
      // Create storage and manually enable fallback
      const fallbackStorage = new SafeStorage();
      fallbackStorage._usingFallback = true;

      const result = fallbackStorage.setItem('key1', 'value1');

      // When using fallback, operations succeed
      expect(result.fallback).toBe(true);
      expect(result.success).toBe(true);
      expect(fallbackStorage.getItem('key1')).toBe('value1');
    });
  });

  describe('getItem', () => {
    it('should retrieve stored values', () => {
      storage.setItem('key1', 'value1');
      const retrieved = storage.getItem('key1');
      expect(retrieved).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      const retrieved = storage.getItem('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should return null for corrupted JSON', () => {
      // Manually set invalid JSON in localStorage
      localStorage.setItem('corrupted', 'not valid json');
      const corruptedStorage = new SafeStorage();
      const retrieved = corruptedStorage.getItem('corrupted');
      expect(retrieved).toBeNull();
    });

    it('should retrieve from fallback when using fallback', () => {
      // Force fallback mode
      storage._usingFallback = true;
      storage.setItem('key1', 'fallback_value');
      const retrieved = storage.getItem('key1');
      expect(retrieved).toBe('fallback_value');
    });
  });

  describe('removeItem', () => {
    it('should remove stored items', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      const retrieved = storage.getItem('key1');
      expect(retrieved).toBeNull();
    });

    it('should handle removing non-existent keys gracefully', () => {
      expect(() => storage.removeItem('nonexistent')).not.toThrow();
    });

    it('should remove from fallback when using fallback', () => {
      storage._usingFallback = true;
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      const retrieved = storage.getItem('key1');
      expect(retrieved).toBeNull();
    });
  });

  describe('fallback behavior', () => {
    it('should detect quota exceeded errors correctly', () => {
      // Test the internal _isQuotaError method
      const quotaError1 = new Error('Quota exceeded');
      quotaError1.name = 'QuotaExceededError';
      expect(storage._isQuotaError(quotaError1)).toBe(true);

      const quotaError2 = new Error('Quota exceeded');
      quotaError2.code = 22;
      expect(storage._isQuotaError(quotaError2)).toBe(true);

      const quotaError3 = new Error('Quota exceeded');
      quotaError3.code = 1014;
      expect(storage._isQuotaError(quotaError3)).toBe(true);

      const quotaError4 = new Error('Quota exceeded');
      quotaError4.name = 'NS_ERROR_DOM_QUOTA_REACHED';
      expect(storage._isQuotaError(quotaError4)).toBe(true);

      const otherError = new Error('Some other error');
      expect(storage._isQuotaError(otherError)).toBe(false);
    });

    it('should persist data in fallback after switching to fallback', () => {
      // Force storage into fallback mode
      storage._usingFallback = true;

      storage.setItem('key1', 'value1');
      const retrieved = storage.getItem('key1');
      expect(retrieved).toBe('value1');
    });
  });

  describe('clear', () => {
    it('should clear all stored items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });

    it('should clear fallback storage', () => {
      storage._usingFallback = true;
      storage.setItem('key1', 'value1');
      storage.clear();
      expect(storage.getItem('key1')).toBeNull();
    });
  });

  describe('complex data types', () => {
    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        items: [1, 2, 3]
      };
      storage.setItem('complex', data);
      const retrieved = storage.getItem('complex');
      expect(retrieved).toEqual(data);
    });

    it('should handle null and undefined', () => {
      storage.setItem('nullKey', null);
      storage.setItem('undefinedKey', undefined);
      expect(storage.getItem('nullKey')).toBeNull();
      expect(storage.getItem('undefinedKey')).toBeNull();
    });

    it('should handle numbers', () => {
      storage.setItem('number', 42);
      expect(storage.getItem('number')).toBe(42);
    });

    it('should handle booleans', () => {
      storage.setItem('boolTrue', true);
      storage.setItem('boolFalse', false);
      expect(storage.getItem('boolTrue')).toBe(true);
      expect(storage.getItem('boolFalse')).toBe(false);
    });
  });
});
