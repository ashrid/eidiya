/**
 * Tests for ThemeManager - theme management and persistence
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeManager } from './ThemeManager.js';

describe('ThemeManager', () => {
  let localStorageMock;
  let matchMediaMock;

  beforeEach(() => {
    // Mock localStorage
    let storage = {};
    localStorageMock = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock matchMedia
    matchMediaMock = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });

    // Reset document theme attribute
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get()', () => {
    it('should return stored theme preference from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const theme = ThemeManager.get();

      expect(theme).toBe('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('eidiya:theme');
    });

    it('should return light when stored preference is light', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const theme = ThemeManager.get();

      expect(theme).toBe('light');
    });

    it('should return dark when system prefers dark scheme and no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const theme = ThemeManager.get();

      expect(theme).toBe('dark');
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should return light when system prefers light scheme and no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const theme = ThemeManager.get();

      expect(theme).toBe('light');
    });

    it('should return light as default when no preference stored or system preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const theme = ThemeManager.get();

      expect(theme).toBe('light');
    });

    it('should ignore invalid stored values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const theme = ThemeManager.get();

      expect(theme).toBe('light');
    });
  });

  describe('set(theme)', () => {
    it('should set data-theme attribute on document.documentElement', () => {
      ThemeManager.set('dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should persist theme to localStorage', () => {
      ThemeManager.set('dark');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('eidiya:theme', 'dark');
    });

    it('should set light theme correctly', () => {
      ThemeManager.set('light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('eidiya:theme', 'light');
    });

    it('should warn and not set invalid theme values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      ThemeManager.set('invalid');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid theme:', 'invalid');
      expect(document.documentElement.getAttribute('data-theme')).not.toBe('invalid');
    });

    it('should not persist invalid theme values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      ThemeManager.set('purple');

      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('eidiya:theme', 'purple');
    });
  });

  describe('toggle()', () => {
    it('should switch from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const newTheme = ThemeManager.toggle();

      expect(newTheme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should switch from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const newTheme = ThemeManager.toggle();

      expect(newTheme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should persist toggled theme to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');

      ThemeManager.toggle();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('eidiya:theme', 'dark');
    });

    it('should return the new theme after toggling', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const result = ThemeManager.toggle();

      expect(result).toBe('light');
    });
  });

  describe('init()', () => {
    it('should apply stored preference on page load', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      ThemeManager.init();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should apply system preference when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      ThemeManager.init();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should apply light theme as default', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      ThemeManager.init();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should not throw if localStorage is unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      });

      expect(() => ThemeManager.init()).not.toThrow();
    });
  });
});
