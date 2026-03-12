/**
 * SummaryPanel - Dashboard showing grand totals and bank notes needed
 */

import { formatAED } from '@modules/money/formatters.js';
import { calculateSummary } from '@modules/state/selectors.js';

/**
 * SummaryPanel component for displaying aggregated contribution data
 */
export class SummaryPanel {
  /**
   * @param {Object} store - Store instance for state access
   */
  constructor(store) {
    this._store = store;
    this._element = null;
    this._unsubscribe = null;
    this._previousSummary = null;
  }

  /**
   * Render the summary panel
   * @returns {HTMLElement}
   */
  render() {
    const state = this._store.getState();
    const summary = calculateSummary(state.contributors);

    // Create container
    this._element = document.createElement('aside');
    this._element.className = 'summary-panel';
    this._element.setAttribute('aria-label', 'Bank Summary');

    // Header section
    const header = document.createElement('header');
    const title = document.createElement('h2');
    title.textContent = 'Bank Summary';
    header.appendChild(title);
    this._element.appendChild(header);

    // Grand total section
    const grandTotalSection = document.createElement('div');
    grandTotalSection.className = 'grand-total-section';

    const grandTotalLabel = document.createElement('p');
    grandTotalLabel.className = 'label';
    grandTotalLabel.textContent = 'Grand Total';

    const grandTotal = document.createElement('p');
    grandTotal.className = 'grand-total';
    grandTotal.textContent = formatAED(summary.grandTotalFils);

    grandTotalSection.appendChild(grandTotalLabel);
    grandTotalSection.appendChild(grandTotal);
    this._element.appendChild(grandTotalSection);

    // Stats row
    const statsRow = document.createElement('div');
    statsRow.className = 'stats-row';

    const contributorStat = this._createStat('Contributors', summary.contributorCount.toString());
    const notesStat = this._createStat('Total Notes', summary.totalNotes.toString());

    statsRow.appendChild(contributorStat);
    statsRow.appendChild(notesStat);
    this._element.appendChild(statsRow);

    // Denomination table (only if there are notes)
    if (summary.totalNotes > 0) {
      const tableSection = document.createElement('div');
      tableSection.className = 'denomination-section';

      const tableTitle = document.createElement('h3');
      tableTitle.textContent = 'Notes Needed';
      tableSection.appendChild(tableTitle);

      const table = this._renderDenominationTable(summary.notes);
      tableSection.appendChild(table);
      this._element.appendChild(tableSection);
    }

    // Store previous summary for change detection
    this._previousSummary = summary;

    return this._element;
  }

  /**
   * Create a stat item
   * @param {string} label - Stat label
   * @param {string} value - Stat value
   * @returns {HTMLElement}
   * @private
   */
  _createStat(label, value) {
    const stat = document.createElement('div');
    stat.className = 'stat-item';

    const statValue = document.createElement('p');
    statValue.className = 'stat-value';
    statValue.textContent = value;

    const statLabel = document.createElement('p');
    statLabel.className = 'stat-label';
    statLabel.textContent = label;

    stat.appendChild(statValue);
    stat.appendChild(statLabel);

    return stat;
  }

  /**
   * Render denomination table
   * @param {Object} notes - Notes object with denomination counts
   * @returns {HTMLTableElement}
   * @private
   */
  _renderDenominationTable(notes) {
    const table = document.createElement('table');
    table.className = 'denomination-table';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thDenom = document.createElement('th');
    thDenom.textContent = 'Denomination';

    const thCount = document.createElement('th');
    thCount.textContent = 'Count';
    thCount.className = 'numeric';

    const thSubtotal = document.createElement('th');
    thSubtotal.textContent = 'Subtotal';
    thSubtotal.className = 'numeric';

    headerRow.appendChild(thDenom);
    headerRow.appendChild(thCount);
    headerRow.appendChild(thSubtotal);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body - only show denominations with count > 0
    const tbody = document.createElement('tbody');

    const denominations = [
      { key: 'thousand', value: 1000, label: '1,000 AED' },
      { key: 'fiveHundred', value: 500, label: '500 AED' },
      { key: 'twoHundred', value: 200, label: '200 AED' },
      { key: 'hundred', value: 100, label: '100 AED' },
      { key: 'fifty', value: 50, label: '50 AED' },
      { key: 'twenty', value: 20, label: '20 AED' },
      { key: 'ten', value: 10, label: '10 AED' },
      { key: 'five', value: 5, label: '5 AED' },
    ];

    for (const denom of denominations) {
      const count = notes[denom.key] || 0;
      if (count > 0) {
        const row = document.createElement('tr');

        const tdDenom = document.createElement('td');
        tdDenom.textContent = denom.label;

        const tdCount = document.createElement('td');
        tdCount.textContent = count.toString();
        tdCount.className = 'numeric';

        const tdSubtotal = document.createElement('td');
        const subtotal = count * denom.value * 100; // Convert to fils
        tdSubtotal.textContent = formatAED(subtotal);
        tdSubtotal.className = 'numeric';

        row.appendChild(tdDenom);
        row.appendChild(tdCount);
        row.appendChild(tdSubtotal);
        tbody.appendChild(row);
      }
    }

    table.appendChild(tbody);
    return table;
  }

  /**
   * Subscribe to store updates for live refresh
   */
  subscribe() {
    if (this._unsubscribe) {
      return;
    }

    this._unsubscribe = this._store.subscribe((newState, prevState) => {
      this._handleStateChange(newState);
    });
  }

  /**
   * Handle state change - re-render with flash animation
   * @param {Object} state - New state
   * @private
   */
  _handleStateChange(state) {
    const newSummary = calculateSummary(state.contributors);

    // Check if summary changed
    if (this._hasSummaryChanged(newSummary)) {
      // Re-render
      const newElement = this.render();

      // Replace in DOM if mounted
      if (this._element && this._element.parentNode) {
        this._element.parentNode.replaceChild(newElement, this._element);
        this._element = newElement;

        // Add flash animation
        this._element.classList.add('updated');
        setTimeout(() => {
          if (this._element) {
            this._element.classList.remove('updated');
          }
        }, 500);
      }
    }
  }

  /**
   * Check if summary values have changed
   * @param {Object} newSummary - New summary
   * @returns {boolean}
   * @private
   */
  _hasSummaryChanged(newSummary) {
    if (!this._previousSummary) {
      return true;
    }

    return (
      newSummary.grandTotalFils !== this._previousSummary.grandTotalFils ||
      newSummary.contributorCount !== this._previousSummary.contributorCount ||
      newSummary.totalNotes !== this._previousSummary.totalNotes
    );
  }

  /**
   * Unsubscribe from store updates
   */
  unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.unsubscribe();

    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }

    this._element = null;
    this._previousSummary = null;
  }

  /**
   * Get the DOM element
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._element;
  }
}
