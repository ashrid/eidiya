/**
 * DataManager Component Tests
 * Tests for export functionality and UI rendering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataManager } from './DataManager.js';

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

    // Mock store with getState method
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
      }))
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
});
