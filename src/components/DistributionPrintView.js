/**
 * DistributionPrintView - Print-optimized view for distribution lists
 * Shows per-person distribution cards with breakdown and checkboxes
 */

import { formatAED } from '@modules/money/formatters.js';

/**
 * DistributionPrintView component for generating printable distribution lists
 */
export class DistributionPrintView {
  /**
   * @param {Array} contributors - Array of contributor objects
   */
  constructor(contributors) {
    // Store original reference for test compatibility
    this._contributorsInput = contributors || [];
    // Create sorted copy for rendering (alphabetically by name)
    this._sortedContributors = [...this._contributorsInput].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    this._element = null;
  }

  /**
   * Get the contributors array (for testing)
   * @returns {Array}
   */
  get contributors() {
    return this._contributorsInput;
  }

  /**
   * Render the print view
   * @returns {HTMLElement}
   */
  render() {
    // Create container with print-optimized class
    this._element = document.createElement('div');
    this._element.className = 'print-view print-only print-optimized';

    // Add header with title and date
    this._element.appendChild(this._renderHeader());

    // Create distribution lists container
    const listsContainer = document.createElement('div');
    listsContainer.className = 'distribution-lists';

    // Render each contributor's distribution card
    if (this._sortedContributors.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No contributors to display';
      listsContainer.appendChild(emptyState);
    } else {
      for (const contributor of this._sortedContributors) {
        listsContainer.appendChild(this._renderPersonList(contributor));
      }
    }

    this._element.appendChild(listsContainer);

    return this._element;
  }

  /**
   * Render the print view header
   * @returns {HTMLElement}
   * @private
   */
  _renderHeader() {
    const header = document.createElement('header');
    header.className = 'print-header';

    const title = document.createElement('h1');
    title.textContent = 'Eidiya Distribution List';
    header.appendChild(title);

    const dateEl = document.createElement('p');
    dateEl.className = 'print-date';
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-AE');
    header.appendChild(dateEl);

    return header;
  }

  /**
   * Render a single person's distribution card
   * @param {Object} contributor - Contributor data
   * @returns {HTMLElement}
   * @private
   */
  _renderPersonList(contributor) {
    const card = document.createElement('div');
    card.className = 'distribution-card';

    // Add received class if already received
    if (contributor.received) {
      card.classList.add('received');
    }

    // Name heading
    const nameHeading = document.createElement('h3');
    nameHeading.textContent = contributor.name;
    card.appendChild(nameHeading);

    // Amount
    const amountEl = document.createElement('p');
    amountEl.className = 'amount';
    amountEl.textContent = formatAED(contributor.amountInFils);
    card.appendChild(amountEl);

    // Breakdown list
    const breakdownList = this._renderBreakdownList(contributor.breakdown);
    card.appendChild(breakdownList);

    // Received status indicator
    const statusEl = document.createElement('p');
    statusEl.className = 'received-status';
    statusEl.textContent = contributor.received ? 'Status: Received' : 'Status: Pending';
    card.appendChild(statusEl);

    // Checkbox line for physical marking
    const checkboxLine = document.createElement('div');
    checkboxLine.className = 'checkbox-line';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.textContent = 'Received: ';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.disabled = true; // For physical marking only
    checkbox.checked = false;

    checkboxLabel.appendChild(checkbox);
    checkboxLine.appendChild(checkboxLabel);
    card.appendChild(checkboxLine);

    return card;
  }

  /**
   * Render breakdown list for a contributor
   * @param {Object} breakdown - Denomination breakdown
   * @returns {HTMLElement}
   * @private
   */
  _renderBreakdownList(breakdown) {
    const ul = document.createElement('ul');
    ul.className = 'breakdown-list';

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
      const count = breakdown[denom.key] || 0;
      if (count > 0) {
        const li = document.createElement('li');
        li.textContent = `${denom.label} x ${count}`;
        ul.appendChild(li);
      }
    }

    return ul;
  }

  /**
   * Get the rendered DOM element
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._element;
  }

  /**
   * Trigger browser print dialog
   */
  print() {
    if (this._element) {
      window.print();
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
  }
}
