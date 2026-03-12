/**
 * DataManager Component Tests
 * Tests for export functionality and UI rendering
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataManager } from './DataManager.js';
import * as schema from '../modules/state/schema.js';

describe('DataManager', () => {
  let mockStore;
  let dataManager;
  let mockCreateObjectURL;
  let mockRevokeObjectURL;

  beforeEach(() => {
    // Mock URL methods
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock store with getState and setState methods
    mockStore = {
      getState: vi.fn(() => ({
        version: '1.1.0',
        contributors: [
          {
            id: 'test-uuid-1',
            name: 'Ahmed',
            date: '2024-03-15',
            amountInFils: 100000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 1, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
        createdAt: '2024-03-15T10:00:00Z',
        updatedAt: '2024-03-15T10:00:00Z'
      })),
      setState: vi.fn()
    };

    // Create DataManager instance
    dataManager = new DataManager(mockStore);
  });

  afterEach(() => {
    if (dataManager) {
      dataManager.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('exportData()', () => {
    it('should return success when export completes', () => {
      const result = dataManager.exportData();
      expect(result.success).toBe(true);
    });

    it('should get current state from store', () => {
      dataManager.exportData();
      expect(mockStore.getState).toHaveBeenCalledTimes(1);
    });

    it('should create object URL for blob', () => {
      dataManager.exportData();
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      dataManager.exportData();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should include exportedAt metadata in ISO format', () => {
      const beforeExport = new Date().toISOString();
      dataManager.exportData();
      const afterExport = new Date().toISOString();

      // Verify blob was created with JSON content
      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    it('should include appVersion metadata', () => {
      dataManager.exportData();
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('render()', () => {
    it('should return a container element', () => {
      const element = dataManager.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.classList.contains('data-manager')).toBe(true);
    });

    it('should contain an export button', () => {
      const element = dataManager.render();
      const button = element.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Export');
    });

    it('should have aria-label on export button for accessibility', () => {
      const element = dataManager.render();
      const button = element.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Export data as JSON backup file');
    });

    it('should use secondary outline button style', () => {
      const element = dataManager.render();
      const button = element.querySelector('button');
      expect(button.classList.contains('secondary')).toBe(true);
      expect(button.classList.contains('outline')).toBe(true);
    });
  });

  describe('filename generation', () => {
    it('should generate filename with eidiya-backup prefix and current date', () => {
      // Create a real anchor element to use as base
      const realAnchor = document.createElement('a');

      // Mock document.createElement to return the real anchor for 'a' tags
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          // Return the real anchor but spy on its properties
          return realAnchor;
        }
        return originalCreateElement(tag);
      });

      dataManager.exportData();

      const today = new Date().toISOString().split('T')[0];
      expect(realAnchor.download).toBe(`eidiya-backup-${today}.json`);

      // Restore original
      document.createElement = originalCreateElement;
    });
  });

  describe('importData()', () => {
    it('should return success for valid JSON file', async () => {
      const validData = {
        version: '1.1.0',
        contributors: [
          {
            id: 'import-uuid-1',
            name: 'Imported User',
            date: '2024-03-20',
            amountInFils: 50000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
        createdAt: '2024-03-20T10:00:00Z',
        updatedAt: '2024-03-20T10:00:00Z'
      };

      const file = new File([JSON.stringify(validData)], 'backup.json', { type: 'application/json' });
      const result = await dataManager.importData(file);

      expect(result.success).toBe(true);
    });

    it('should return error for invalid JSON format', async () => {
      const file = new File(['not valid json'], 'invalid.json', { type: 'application/json' });
      const result = await dataManager.importData(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should return error for data failing schema validation', async () => {
      const invalidData = {
        version: '1.1.0',
        contributors: 'not an array' // Invalid: should be array
      };

      const file = new File([JSON.stringify(invalidData)], 'invalid.json', { type: 'application/json' });
      const result = await dataManager.importData(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data');
    });

    it('should call setState with migrated data on successful import', async () => {
      const validData = {
        version: '1.1.0',
        contributors: [
          {
            id: 'import-uuid-1',
            name: 'Imported User',
            date: '2024-03-20',
            amountInFils: 50000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
        createdAt: '2024-03-20T10:00:00Z',
        updatedAt: '2024-03-20T10:00:00Z'
      };

      const file = new File([JSON.stringify(validData)], 'backup.json', { type: 'application/json' });
      await dataManager.importData(file);

      expect(mockStore.setState).toHaveBeenCalledTimes(1);
    });

    it('should return error for file read failure', async () => {
      // Create a mock FileReader that fails immediately
      global.FileReader = vi.fn(() => ({
        readAsText: vi.fn(function() {
          // Simulate immediate error
          setTimeout(() => this.onerror(), 0);
        }),
        onerror: null,
        onload: null
      }));

      const file = new File(['test'], 'test.json', { type: 'application/json' });
      const result = await dataManager.importData(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read file');
    });
  });

  describe('render() import button', () => {
    it('should contain both export and import buttons', () => {
      const element = dataManager.render();
      const buttons = element.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map(b => b.textContent);

      expect(buttonTexts.some(text => text.includes('Export'))).toBe(true);
      expect(buttonTexts.some(text => text.includes('Import'))).toBe(true);
    });

    it('should have hidden file input with accept=".json"', () => {
      const element = dataManager.render();
      const fileInput = element.querySelector('input[type="file"]');

      expect(fileInput).not.toBeNull();
      expect(fileInput.getAttribute('accept')).toBe('.json');
    });

    it('should have aria-label on import button for accessibility', () => {
      const element = dataManager.render();
      const buttons = element.querySelectorAll('button');
      const importButton = Array.from(buttons).find(b => b.textContent.includes('Import'));

      expect(importButton).not.toBeNull();
      expect(importButton.getAttribute('aria-label')).toContain('Import');
    });
  });
});
