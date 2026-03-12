/**
 * Tests for DataManager - export/import functionality
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataManager } from './DataManager.js';
import { validateState } from '../modules/state/schema.js';

// Mock schema validation
vi.mock('../modules/state/schema.js', () => ({
  validateState: vi.fn(),
  CURRENT_SCHEMA_VERSION: '1.1.0',
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('DataManager', () => {
  let mockStore;
  let mockStorage;

  beforeEach(() => {
    // Mock store with getState method
    mockStore = {
      getState: vi.fn().mockReturnValue({
        version: '1.1.0',
        contributors: [
          {
            id: 'test-1',
            name: 'John Doe',
            date: '2024-03-15',
            amountInFils: 10000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-03-15T10:30:00Z',
      }),
      setState: vi.fn(),
    };

    // Mock storage
    mockStorage = {
      data: new Map(),
      setItem: vi.fn(function(key, value) {
        this.data.set(key, value);
        return { success: true };
      }),
      getItem: vi.fn(function(key) {
        return this.data.get(key) || null;
      }),
    };

    // Reset mocks
    vi.clearAllMocks();
    validateState.mockReturnValue({ valid: true });

    // Mock document.createElement for anchor tag
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor;
      return document.createElement(tag);
    });

    // Mock FileReader
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsText: vi.fn(),
      onload: null,
      onerror: null,
      result: null,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportData', () => {
    it('should return success true and generate filename with date pattern', () => {
      const dataManager = new DataManager(mockStore, mockStorage);
      const result = dataManager.exportData();

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/^eidiya-backup-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should include metadata (exportedAt, appVersion) in export', () => {
      const dataManager = new DataManager(mockStore, mockStorage);
      const result = dataManager.exportData();

      expect(result.data).toHaveProperty('exportedAt');
      expect(result.data).toHaveProperty('appVersion', '1.1.0');
      expect(result.data).toHaveProperty('contributors');
    });

    it('should include all contributors in exported data', () => {
      const dataManager = new DataManager(mockStore, mockStorage);
      const result = dataManager.exportData();

      expect(result.data.contributors).toHaveLength(1);
      expect(result.data.contributors[0].name).toBe('John Doe');
    });

    it('should trigger file download via anchor element', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      const dataManager = new DataManager(mockStore, mockStorage);
      dataManager.exportData();

      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('importData', () => {
    it('should parse valid JSON file and validate against schema', async () => {
      const validData = {
        version: '1.1.0',
        contributors: [
          {
            id: 'imported-1',
            name: 'Jane Smith',
            date: '2024-03-20',
            amountInFils: 5000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
        createdAt: '2024-03-20T00:00:00Z',
        updatedAt: '2024-03-20T12:00:00Z',
      };

      validateState.mockReturnValue({ valid: true });

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validData)], 'backup.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(validateState).toHaveBeenCalledWith(expect.objectContaining(validData));
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON with appropriate error', async () => {
      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File(['not valid json'], 'invalid.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    it('should reject data failing schema validation', async () => {
      const invalidData = {
        version: '1.1.0',
        contributors: 'not an array', // Invalid: should be array
      };

      validateState.mockReturnValue({ valid: false, error: 'contributors must be an array' });

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(invalidData)], 'invalid.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('contributors must be an array');
    });

    it('should show confirmation when data exists (has contributors)', async () => {
      const existingData = {
        version: '1.1.0',
        contributors: [
          { id: 'existing', name: 'Existing User', date: '2024-01-01', amountInFils: 1000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 } }
        ],
      };

      mockStore.getState.mockReturnValue({
        version: '1.1.0',
        contributors: existingData.contributors,
      });

      const validImportData = {
        version: '1.1.0',
        contributors: [
          { id: 'new', name: 'New User', date: '2024-03-20', amountInFils: 2000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 2 } }
        ],
      };

      validateState.mockReturnValue({ valid: true });

      // Mock confirm to return true (user confirms)
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validImportData)], 'backup.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(window.confirm).toHaveBeenCalled();
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should not show confirmation when no existing data', async () => {
      mockStore.getState.mockReturnValue({
        version: '1.1.0',
        contributors: [],
      });

      const validImportData = {
        version: '1.1.0',
        contributors: [
          { id: 'new', name: 'New User', date: '2024-03-20', amountInFils: 2000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 2 } }
        ],
      };

      validateState.mockReturnValue({ valid: true });
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validImportData)], 'backup.json', { type: 'application/json' });

      await dataManager.importData(mockFile);

      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('should apply valid data to store via setState', async () => {
      const validImportData = {
        version: '1.1.0',
        contributors: [
          { id: 'imported', name: 'Imported User', date: '2024-03-20', amountInFils: 3000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 3 } }
        ],
        createdAt: '2024-03-20T00:00:00Z',
        updatedAt: '2024-03-20T12:00:00Z',
      };

      mockStore.getState.mockReturnValue({
        version: '1.1.0',
        contributors: [],
      });

      validateState.mockReturnValue({ valid: true });

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validImportData)], 'backup.json', { type: 'application/json' });

      await dataManager.importData(mockFile);

      expect(mockStore.setState).toHaveBeenCalledWith(
        expect.objectContaining({
          contributors: validImportData.contributors,
        })
      );
    });

    it('should return imported contributor count on success', async () => {
      const validImportData = {
        version: '1.1.0',
        contributors: [
          { id: '1', name: 'User 1', date: '2024-03-20', amountInFils: 1000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 } },
          { id: '2', name: 'User 2', date: '2024-03-21', amountInFils: 2000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 2 } },
        ],
      };

      mockStore.getState.mockReturnValue({
        version: '1.1.0',
        contributors: [],
      });

      validateState.mockReturnValue({ valid: true });

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validImportData)], 'backup.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should cancel import if user declines confirmation', async () => {
      mockStore.getState.mockReturnValue({
        version: '1.1.0',
        contributors: [{ id: 'existing', name: 'Existing', date: '2024-01-01', amountInFils: 1000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 } }],
      });

      const validImportData = {
        version: '1.1.0',
        contributors: [{ id: 'new', name: 'New', date: '2024-03-20', amountInFils: 2000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 2 } }],
      };

      validateState.mockReturnValue({ valid: true });
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

      const dataManager = new DataManager(mockStore, mockStorage);
      const mockFile = new File([JSON.stringify(validImportData)], 'backup.json', { type: 'application/json' });

      const result = await dataManager.importData(mockFile);

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockStore.setState).not.toHaveBeenCalled();
    });
  });
});
