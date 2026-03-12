/**
 * ThemeToggle - UI component for theme switching
 * Renders a button to toggle between light and dark modes
 */

import { ThemeManager } from '../modules/theme/ThemeManager.js';

export class ThemeToggle {
  /**
   * Create a new ThemeToggle instance
   */
  constructor() {
    this._button = null;
    this._handleClick = this._handleClick.bind(this);
    this._currentTheme = null; // Will be set on first render
  }

  /**
   * Render the theme toggle button
   * @returns {HTMLButtonElement} The toggle button element
   */
  render() {
    // Use ThemeManager on first render, then track internally
    if (this._currentTheme === null) {
      this._currentTheme = ThemeManager.get();
    }

    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.className = 'theme-toggle';
    this._button.setAttribute('aria-label', this._getAriaLabel());
    this._button.textContent = this._getIcon();

    this._button.addEventListener('click', this._handleClick);

    return this._button;
  }

  /**
   * Get the appropriate icon based on current theme
   * @returns {string} Icon emoji (sun or moon)
   * @private
   */
  _getIcon() {
    // Show sun in dark mode (suggests switching to light)
    // Show moon in light mode (suggests switching to dark)
    return this._currentTheme === 'dark' ? '☀️' : '🌙';
  }

  /**
   * Get the appropriate aria-label based on current theme
   * @returns {string} Accessible label for the button
   * @private
   */
  _getAriaLabel() {
    return this._currentTheme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode';
  }

  /**
   * Handle click event - toggle theme and update button
   * @private
   */
  _handleClick() {
    const newTheme = ThemeManager.toggle();
    this._currentTheme = newTheme;

    // Update button appearance
    if (this._button) {
      this._button.textContent = this._getIcon();
      this._button.setAttribute('aria-label', this._getAriaLabel());
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this._button) {
      this._button.removeEventListener('click', this._handleClick);
      this._button = null;
    }
  }
}
