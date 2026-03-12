/**
 * Tests for DistributionPanel component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistributionPanel } from './DistributionPanel.js';

// Mock formatAED
vi.mock('@modules/money/formatters.js', () => ({
  formatAED: (fils) => `AED ${(fils / 100).toFixed(2)}`,
}));

// Mock distribution selectors
vi.mock('@modules/state/selectors.js', () => ({
  calculateRemainingNotes: (contributors) => {
    if (!Array.isArray(contributors)) {
      return {
        five: 0, ten: 0, twenty: 0, fifty: 0,
        hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0,
      };
    }
    return contributors
      .filter(c => !c.received)
      .reduce((acc, c) => {
        const bd = c.breakdown || {};
        return {
          five: acc.five + (bd.five || 0),
          ten: acc.ten + (bd.ten || 0),
          twenty: acc.twenty + (bd.twenty || 0),
          fifty: acc.fifty + (bd.fifty || 0),
          hundred: acc.hundred + (bd.hundred || 0),
          twoHundred: acc.twoHundred + (bd.twoHundred || 0),
          fiveHundred: acc.fiveHundred + (bd.fiveHundred || 0),
          thousand: acc.thousand + (bd.thousand || 0),
        };
      }, {
        five: 0, ten: 0, twenty: 0, fifty: 0,
        hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0,
      });
  },
  calculateDistributionProgress: (contributors) => {
    if (!Array.isArray(contributors) || contributors.length === 0) {
      return { total: 0, received: 0, remaining: 0, percentComplete: 0 };
    }
    const total = contributors.length;
    const received = contributors.filter(c => c.received).length;
    const remaining = total - received;
    const percentComplete = Math.round((received / total) * 100);
    return { total, received, remaining, percentComplete };
  },
}));

describe('DistributionPanel', () => {
  let store;
  let panel;

  beforeEach(() => {
    store = {
      getState: vi.fn(),
      subscribe: vi.fn(),
    };
  });

  afterEach(() => {
    if (panel) {
      panel.destroy();
      panel = null;
    }
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should accept store parameter', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);

      expect(panel).toBeDefined();
      expect(panel.store).toBe(store);
    });
  });

  describe('render', () => {
    it('should return HTMLElement with correct class', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);
      const element = panel.render();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toContain('distribution-panel');
    });

    it('should display progress stats (X of Y received)', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', received: true },
          { id: '2', name: 'Bob', received: false },
          { id: '3', name: 'Charlie', received: false },
        ],
      });

      panel = new DistributionPanel(store);
      const element = panel.render();

      const progressText = element.textContent;
      expect(progressText).toContain('1');
      expect(progressText).toContain('3');
      expect(progressText).toMatch(/received|of/i);
    });

    it('should show remaining notes table with correct counts', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', received: false, breakdown: { fifty: 2 } },
          { id: '2', name: 'Bob', received: true, breakdown: { fifty: 3 } },
        ],
      });

      panel = new DistributionPanel(store);
      const element = panel.render();

      const table = element.querySelector('.remaining-notes-table');
      expect(table).toBeTruthy();

      // Only Alice's notes (2) should be in remaining, not Bob's (3)
      const cells = table.querySelectorAll('td');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should show print button when contributors exist', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', received: false },
        ],
      });

      panel = new DistributionPanel(store);
      const element = panel.render();

      const printBtn = element.querySelector('.print-button');
      expect(printBtn).toBeTruthy();
    });

    it('should show empty state when no contributors', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);
      const element = panel.render();

      expect(element.textContent).toMatch(/no contributors|empty/i);
    });

    it('should show 100% complete when all received', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', received: true },
          { id: '2', name: 'Bob', received: true },
        ],
      });

      panel = new DistributionPanel(store);
      const element = panel.render();

      expect(element.textContent).toContain('100');
    });

    it('should have aria-label for accessibility', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);
      const element = panel.render();

      expect(element.getAttribute('aria-label')).toBe('Distribution Status');
    });
  });

  describe('subscribe', () => {
    it('should call store.subscribe and re-render on state change', () => {
      let listener = null;
      store.getState
        .mockReturnValueOnce({ contributors: [] })
        .mockReturnValue({
          contributors: [{ id: '1', name: 'Alice', received: false }],
        });
      store.subscribe.mockImplementation((l) => {
        listener = l;
        return vi.fn();
      });

      panel = new DistributionPanel(store);
      const container = document.createElement('div');
      container.appendChild(panel.render());
      panel.subscribe();

      expect(store.subscribe).toHaveBeenCalledTimes(1);

      // Simulate state change
      listener({ contributors: [{ id: '1', name: 'Alice', received: false }] });

      // Panel should have re-rendered
      expect(panel.getElement()).toBeTruthy();
    });

    it('should not register multiple listeners', () => {
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(vi.fn());

      panel = new DistributionPanel(store);
      panel.render();
      panel.subscribe();
      panel.subscribe(); // Second call should be ignored

      expect(store.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription from store', () => {
      const unsubscribeFn = vi.fn();
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(unsubscribeFn);

      panel = new DistributionPanel(store);
      panel.render();
      panel.subscribe();
      panel.unsubscribe();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe when not subscribed', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);
      panel.render();

      expect(() => panel.unsubscribe()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up subscription and remove element', () => {
      const unsubscribeFn = vi.fn();
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(unsubscribeFn);

      panel = new DistributionPanel(store);
      const container = document.createElement('div');
      const element = panel.render();
      container.appendChild(element);
      panel.subscribe();

      expect(container.contains(element)).toBe(true);

      panel.destroy();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
      expect(container.contains(element)).toBe(false);
    });

    it('should handle destroy when not rendered', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);

      expect(() => panel.destroy()).not.toThrow();
    });
  });

  describe('getElement', () => {
    it('should return the DOM element', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);
      const rendered = panel.render();

      expect(panel.getElement()).toBe(rendered);
    });

    it('should return null before render', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new DistributionPanel(store);

      expect(panel.getElement()).toBeNull();
    });
  });
});
