/**
 * Tests for ThemeToggle - theme toggle UI component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeToggle } from './ThemeToggle.js';
import { ThemeManager } from '../modules/theme/ThemeManager.js';

// Mock ThemeManager module
vi.mock('../modules/theme/ThemeManager.js', () => ({
  ThemeManager: {
    get: vi.fn(),
    set: vi.fn(),
    toggle: vi.fn(),
  },
}));

describe('ThemeToggle', () => {
  let toggle;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default to light theme
    ThemeManager.get.mockReturnValue('light');

    // Create new toggle instance
    toggle = new ThemeToggle();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('render()', () => {
    it('should create button element', () => {
      const button = toggle.render();

      expect(button.tagName).toBe('BUTTON');
    });

    it('should have correct aria-label for accessibility', () => {
      const button = toggle.render();

      expect(button.getAttribute('aria-label')).toBe('Toggle dark mode');
    });

    it('should display moon icon (🌙) when in light mode', () => {
      ThemeManager.get.mockReturnValue('light');
      toggle = new ThemeToggle();

      const button = toggle.render();

      expect(button.textContent).toContain('🌙');
    });

    it('should display sun icon (☀️) when in dark mode', () => {
      ThemeManager.get.mockReturnValue('dark');
      toggle = new ThemeToggle();

      const button = toggle.render();

      expect(button.textContent).toContain('☀️');
    });

    it('should apply theme-toggle class to button', () => {
      const button = toggle.render();

      expect(button.classList.contains('theme-toggle')).toBe(true);
    });

    it('should have type button to prevent form submission', () => {
      const button = toggle.render();

      expect(button.getAttribute('type')).toBe('button');
    });
  });

  describe('click handler', () => {
    it('should call ThemeManager.toggle() when clicked', () => {
      ThemeManager.toggle.mockReturnValue('dark');

      const button = toggle.render();
      button.click();

      expect(ThemeManager.toggle).toHaveBeenCalledTimes(1);
    });

    it('should update icon from moon to sun when toggling to dark', () => {
      ThemeManager.get.mockReturnValue('light');
      ThemeManager.toggle.mockReturnValue('dark');
      toggle = new ThemeToggle();

      const button = toggle.render();
      expect(button.textContent).toContain('🌙');

      button.click();

      // After click, button should re-render with new icon
      const updatedButton = toggle.render();
      expect(updatedButton.textContent).toContain('☀️');
    });

    it('should update icon from sun to moon when toggling to light', () => {
      ThemeManager.get.mockReturnValue('dark');
      ThemeManager.toggle.mockReturnValue('light');
      toggle = new ThemeToggle();

      const button = toggle.render();
      expect(button.textContent).toContain('☀️');

      button.click();

      // After click, button should re-render with new icon
      const updatedButton = toggle.render();
      expect(updatedButton.textContent).toContain('🌙');
    });

    it('should update aria-label after toggle', () => {
      ThemeManager.get.mockReturnValue('light');
      ThemeManager.toggle.mockReturnValue('dark');
      toggle = new ThemeToggle();

      const button = toggle.render();
      expect(button.getAttribute('aria-label')).toBe('Toggle dark mode');

      button.click();

      const updatedButton = toggle.render();
      expect(updatedButton.getAttribute('aria-label')).toBe('Toggle light mode');
    });
  });

  describe('destroy()', () => {
    it('should remove event listeners when destroyed', () => {
      const button = toggle.render();
      document.body.appendChild(button);

      toggle.destroy();

      // Clicking after destroy should not call toggle
      button.click();
      expect(ThemeManager.toggle).not.toHaveBeenCalled();
    });

    it('should not throw if destroy called multiple times', () => {
      toggle.render();

      expect(() => {
        toggle.destroy();
        toggle.destroy();
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should render correctly when appended to DOM', () => {
      const button = toggle.render();
      document.body.appendChild(button);

      expect(document.querySelector('button.theme-toggle')).toBe(button);
    });

    it('should maintain state across multiple renders', () => {
      ThemeManager.get.mockReturnValue('dark');
      toggle = new ThemeToggle();

      const button1 = toggle.render();
      expect(button1.textContent).toContain('☀️');

      // Simulate theme change by destroying and recreating
      toggle.destroy();
      ThemeManager.get.mockReturnValue('light');
      toggle = new ThemeToggle();

      const button2 = toggle.render();
      expect(button2.textContent).toContain('🌙');
    });
  });
});
