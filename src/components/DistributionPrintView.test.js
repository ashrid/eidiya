/**
 * Tests for DistributionPrintView component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistributionPrintView } from './DistributionPrintView.js';

// Mock formatAED
vi.mock('@modules/money/formatters.js', () => ({
  formatAED: (fils) => `AED ${(fils / 100).toFixed(2)}`,
}));

describe('DistributionPrintView', () => {
  let mockContributors;
  let view;

  beforeEach(() => {
    mockContributors = [
      {
        id: '1',
        name: 'Alice',
        amountInFils: 50000, // 500 AED
        breakdown: {
          five: 0,
          ten: 0,
          twenty: 0,
          fifty: 0,
          hundred: 5,
          twoHundred: 0,
          fiveHundred: 0,
          thousand: 0,
        },
        received: false,
      },
      {
        id: '2',
        name: 'Bob',
        amountInFils: 100000, // 1000 AED
        breakdown: {
          five: 0,
          ten: 0,
          twenty: 0,
          fifty: 0,
          hundred: 0,
          twoHundred: 0,
          fiveHundred: 2,
          thousand: 0,
        },
        received: true,
      },
    ];
  });

  afterEach(() => {
    if (view) {
      view.destroy();
      view = null;
    }
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should accept contributors array', () => {
      view = new DistributionPrintView(mockContributors);

      expect(view).toBeDefined();
      expect(view.contributors).toBe(mockContributors);
    });

    it('should handle empty contributors array', () => {
      view = new DistributionPrintView([]);

      expect(view).toBeDefined();
      expect(view.contributors).toEqual([]);
    });
  });

  describe('render', () => {
    it('should return HTMLElement with print-view class', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toContain('print-view');
    });

    it('should include header with title', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const header = element.querySelector('.print-header');
      expect(header).toBeTruthy();
      expect(header.textContent).toMatch(/distribution|eidiya/i);
    });

    it('should include date in header', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const dateEl = element.querySelector('.print-date');
      expect(dateEl).toBeTruthy();
      expect(dateEl.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
    });

    it('should create per-person distribution cards', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const cards = element.querySelectorAll('.distribution-card');
      expect(cards.length).toBe(2);
    });

    it('should show name on each card', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const cards = element.querySelectorAll('.distribution-card');
      expect(cards[0].textContent).toContain('Alice');
      expect(cards[1].textContent).toContain('Bob');
    });

    it('should show amount on each card', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const cards = element.querySelectorAll('.distribution-card');
      expect(cards[0].textContent).toContain('500');
      expect(cards[1].textContent).toContain('1000');
    });

    it('should show breakdown list on each card', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const cards = element.querySelectorAll('.distribution-card');

      // Alice's card should show 100 AED x 5
      expect(cards[0].textContent).toContain('100');
      expect(cards[0].textContent).toContain('5');

      // Bob's card should show 500 AED x 2
      expect(cards[1].textContent).toContain('500');
      expect(cards[1].textContent).toContain('2');
    });

    it('should have blank checkbox for physical marking', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const checkboxes = element.querySelectorAll('.distribution-card input[type="checkbox"]');
      expect(checkboxes.length).toBe(2);

      // Checkboxes should be unchecked
      checkboxes.forEach(cb => {
        expect(cb.checked).toBe(false);
      });
    });

    it('should handle empty contributors array gracefully', () => {
      view = new DistributionPrintView([]);
      const element = view.render();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.textContent).toMatch(/no contributors|empty/i);

      const cards = element.querySelectorAll('.distribution-card');
      expect(cards.length).toBe(0);
    });

    it('should show received status on cards', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      const cards = element.querySelectorAll('.distribution-card');

      // Bob is received, so his card should indicate that
      expect(cards[1].textContent.toLowerCase()).toMatch(/received|done|✓/);
    });

    it('should have print-optimized styling classes', () => {
      view = new DistributionPrintView(mockContributors);
      const element = view.render();

      expect(element.classList.contains('print-optimized')).toBe(true);
    });
  });

  describe('print', () => {
    it('should call window.print', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      view = new DistributionPrintView(mockContributors);
      view.render();
      view.print();

      expect(printSpy).toHaveBeenCalledTimes(1);

      printSpy.mockRestore();
    });

    it('should handle print when not rendered', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      view = new DistributionPrintView(mockContributors);

      // Should not throw
      expect(() => view.print()).not.toThrow();

      printSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('should clean up DOM element', () => {
      view = new DistributionPrintView(mockContributors);
      const container = document.createElement('div');
      const element = view.render();
      container.appendChild(element);

      expect(container.contains(element)).toBe(true);

      view.destroy();

      expect(container.contains(element)).toBe(false);
    });

    it('should handle destroy when not rendered', () => {
      view = new DistributionPrintView(mockContributors);

      expect(() => view.destroy()).not.toThrow();
    });
  });

  describe('getElement', () => {
    it('should return the DOM element', () => {
      view = new DistributionPrintView(mockContributors);
      const rendered = view.render();

      expect(view.getElement()).toBe(rendered);
    });

    it('should return null before render', () => {
      view = new DistributionPrintView(mockContributors);

      expect(view.getElement()).toBeNull();
    });
  });
});
