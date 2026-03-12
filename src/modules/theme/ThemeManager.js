/**
 * ThemeManager - singleton for managing theme preferences
 * Handles theme switching, persistence, and system preference detection
 */

const STORAGE_KEY = 'eidiya:theme';

/**
 * ThemeManager singleton object
 * @typedef {Object} ThemeManager
 * @property {function(): string} get - Get current theme preference
 * @property {function(string): void} set - Set theme ('light' or 'dark')
 * @property {function(): string} toggle - Toggle between light and dark
 * @property {function(): void} init - Initialize theme on page load
 */
export const ThemeManager = {
  /**
   * Get the current theme preference
   * Returns stored preference, or system preference, or 'light' as default
   * @returns {string} 'light' or 'dark'
   */
  get() {
    // Check localStorage first (handle unavailable localStorage)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // localStorage unavailable, continue to system preference
    }

    // Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  },

  /**
   * Set the theme and persist to localStorage
   * @param {string} theme - 'light' or 'dark'
   */
  set(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme);
      return;
    }

    // Apply to document
    document.documentElement.setAttribute('data-theme', theme);

    // Persist to localStorage (handle unavailable localStorage)
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable, theme will not persist
    }
  },

  /**
   * Toggle between light and dark themes
   * @returns {string} The new theme after toggling
   */
  toggle() {
    const current = this.get();
    const next = current === 'light' ? 'dark' : 'light';
    this.set(next);
    return next;
  },

  /**
   * Initialize theme on page load
   * Applies stored or system preference without animation
   */
  init() {
    const theme = this.get();
    document.documentElement.setAttribute('data-theme', theme);
  },
};
