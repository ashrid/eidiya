/**
 * Tests for SummaryPanel component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummaryPanel } from './SummaryPanel.js';

// Mock formatAED
vi.mock('@modules/money/formatters.js', () => ({
  formatAED: (fils) => `AED ${(fils / 100).toFixed(2)}`,
}));

// Mock calculateSummary
vi.mock('@modules/state/selectors.js', () => ({
  calculateSummary: (contributors) => {
    if (!contributors || contributors.length === 0) {
      return {
        grandTotalFils: 0,
        contributorCount: 0,
        totalNotes: 0,
        notes: {
          five: 0, ten: 0, twenty: 0, fifty: 0,
          hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0,
        },
      };
    }

    const grandTotalFils = contributors.reduce((sum, c) => sum + (c.amountInFils || 0), 0);
    const contributorCount = contributors.length;

    // Simple aggregation for test
    const notes = contributors.reduce((acc, c) => {
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

    const totalNotes = Object.values(notes).reduce((a, b) => a + b, 0);

    return { grandTotalFils, contributorCount, totalNotes, notes };
  },
}));

describe('SummaryPanel', () => {
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

  describe('render', () => {
    it('should render with grand total, contributor count, total notes', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', amountInFils: 10000, breakdown: { fifty: 2 } },
        ],
      });

      panel = new SummaryPanel(store);
      const element = panel.render();

      expect(element.className).toContain('summary-panel');
      expect(element.querySelector('h2').textContent).toBe('Bank Summary');
      expect(element.querySelector('.grand-total').textContent).toBe('AED 100.00');

      const statValues = element.querySelectorAll('.stat-value');
      expect(statValues[0].textContent).toBe('1'); // contributor count
      expect(statValues[1].textContent).toBe('2'); // total notes
    });

    it('should render denomination table with counts and subtotals', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', amountInFils: 10000, breakdown: { fifty: 2 } },
        ],
      });

      panel = new SummaryPanel(store);
      const element = panel.render();

      const table = element.querySelector('.denomination-table');
      expect(table).toBeTruthy();

      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1); // Only 50 AED notes

      const cells = rows[0].querySelectorAll('td');
      expect(cells[0].textContent).toContain('50 AED');
      expect(cells[1].textContent).toBe('2');
      expect(cells[2].textContent).toBe('AED 100.00');
    });

    it('should only show denominations with count > 0', () => {
      store.getState.mockReturnValue({
        contributors: [
          { id: '1', name: 'Alice', amountInFils: 60000, breakdown: { thousand: 1, hundred: 5 } },
        ],
      });

      panel = new SummaryPanel(store);
      const element = panel.render();

      const table = element.querySelector('.denomination-table');
      const rows = table.querySelectorAll('tbody tr');

      expect(rows.length).toBe(2); // Only 1000 and 100 AED

      const labels = Array.from(rows).map(r => r.querySelector('td').textContent);
      expect(labels).toContain('1,000 AED');
      expect(labels).toContain('100 AED');
      expect(labels).not.toContain('5 AED');
    });

    it('should not show denomination table when no notes', () => {
      store.getState.mockReturnValue({
        contributors: [],
      });

      panel = new SummaryPanel(store);
      const element = panel.render();

      const table = element.querySelector('.denomination-table');
      expect(table).toBeFalsy();
    });

    it('should show zeros for empty contributors', () => {
      store.getState.mockReturnValue({
        contributors: [],
      });

      panel = new SummaryPanel(store);
      const element = panel.render();

      expect(element.querySelector('.grand-total').textContent).toBe('AED 0.00');

      const statValues = element.querySelectorAll('.stat-value');
      expect(statValues[0].textContent).toBe('0');
      expect(statValues[1].textContent).toBe('0');
    });

    it('should have aria-label for accessibility', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);
      const element = panel.render();

      expect(element.getAttribute('aria-label')).toBe('Bank Summary');
    });
  });

  describe('subscribe', () => {
    it('should register listener with store', () => {
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(vi.fn());

      panel = new SummaryPanel(store);
      panel.render();
      panel.subscribe();

      expect(store.subscribe).toHaveBeenCalledTimes(1);
      expect(typeof store.subscribe.mock.calls[0][0]).toBe('function');
    });

    it('should not register multiple listeners', () => {
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(vi.fn());

      panel = new SummaryPanel(store);
      panel.render();
      panel.subscribe();
      panel.subscribe(); // Second call should be ignored

      expect(store.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should re-render when state changes', () => {
      let listener = null;
      store.getState
        .mockReturnValueOnce({ contributors: [] })
        .mockReturnValue({
          contributors: [{ id: '1', name: 'Alice', amountInFils: 10000, breakdown: { fifty: 2 } }],
        });
      store.subscribe.mockImplementation((l) => {
        listener = l;
        return vi.fn();
      });

      panel = new SummaryPanel(store);
      const container = document.createElement('div');
      container.appendChild(panel.render());
      panel.subscribe();

      // Simulate state change
      listener({ contributors: [{ id: '1', name: 'Alice', amountInFils: 10000, breakdown: { fifty: 2 } }] });

      // Panel should have re-rendered with new data
      expect(panel.getElement().querySelector('.grand-total').textContent).toBe('AED 100.00');
    });
  });

  describe('unsubscribe', () => {
    it('should remove listener from store', () => {
      const unsubscribeFn = vi.fn();
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(unsubscribeFn);

      panel = new SummaryPanel(store);
      panel.render();
      panel.subscribe();
      panel.unsubscribe();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe when not subscribed', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);
      panel.render();

      expect(() => panel.unsubscribe()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up DOM element', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);
      const container = document.createElement('div');
      const element = panel.render();
      container.appendChild(element);

      expect(container.contains(element)).toBe(true);

      panel.destroy();

      expect(container.contains(element)).toBe(false);
    });

    it('should unsubscribe from store', () => {
      const unsubscribeFn = vi.fn();
      store.getState.mockReturnValue({ contributors: [] });
      store.subscribe.mockReturnValue(unsubscribeFn);

      panel = new SummaryPanel(store);
      panel.render();
      panel.subscribe();
      panel.destroy();

      expect(unsubscribeFn).toHaveBeenCalledTimes(1);
    });

    it('should handle destroy when not rendered', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);

      expect(() => panel.destroy()).not.toThrow();
    });
  });

  describe('getElement', () => {
    it('should return the DOM element', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);
      const rendered = panel.render();

      expect(panel.getElement()).toBe(rendered);
    });

    it('should return null before render', () => {
      store.getState.mockReturnValue({ contributors: [] });

      panel = new SummaryPanel(store);

      expect(panel.getElement()).toBeNull();
    });
  });
});
