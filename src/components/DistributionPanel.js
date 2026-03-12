/**
 * DistributionPanel - Panel showing distribution progress and remaining notes
 */

import { formatAED } from '@modules/money/formatters.js';
import { calculateRemainingNotes, calculateDistributionProgress } from '@modules/state/selectors.js';

/**
 * DistributionPanel component for tracking distribution status
 */
export class DistributionPanel {
  /**
   * @param {Object} store - Store instance for state access
   */
  constructor(store) {
    this._store = store;
    this._element = null;
    this._unsubscribe = null;
    this._previousProgress = null;
  }

  /**
   * Render the distribution panel
   * @returns {HTMLElement}
   */
  render() {
    const state = this._store.getState();
    const progress = calculateDistributionProgress(state.contributors);
    const remainingNotes = calculateRemainingNotes(state.contributors);

    // Create container
    this._element = document.createElement('aside');
    this._element.className = 'distribution-panel';
    this._element.setAttribute('aria-label', 'Distribution Status');

    // Header section
    const header = document.createElement('header');
    const title = document.createElement('h2');
    title.textContent = 'Distribution';
    header.appendChild(title);
    this._element.appendChild(header);

    // Progress section
    const progressSection = document.createElement('div');
    progressSection.className = 'progress-section';

    if (progress.total === 0) {
      // Empty state
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No contributors yet';
      progressSection.appendChild(emptyMessage);
    } else {
      // Progress stats
      const progressStats = document.createElement('div');
      progressStats.className = 'progress-stats';

      const progressText = document.createElement('p');
      progressText.className = 'progress-text';
      progressText.textContent = `${progress.received} of ${progress.total} received (${progress.percentComplete}%)`;

      // Progress bar
      const progressBarContainer = document.createElement('div');
      progressBarContainer.className = 'progress-bar-container';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.style.width = `${progress.percentComplete}%`;
      progressBar.setAttribute('role', 'progressbar');
      progressBar.setAttribute('aria-valuenow', progress.percentComplete);
      progressBar.setAttribute('aria-valuemin', '0');
      progressBar.setAttribute('aria-valuemax', '100');

      progressBarContainer.appendChild(progressBar);
      progressStats.appendChild(progressText);
      progressStats.appendChild(progressBarContainer);
      progressSection.appendChild(progressStats);

      // Remaining notes table (only if there are remaining contributors)
      if (progress.remaining > 0) {
        const remainingSection = document.createElement('div');
        remainingSection.className = 'remaining-section';

        const remainingTitle = document.createElement('h3');
        remainingTitle.textContent = 'Remaining Notes';
        remainingSection.appendChild(remainingTitle);

        const table = this._renderRemainingNotesTable(remainingNotes);
        remainingSection.appendChild(table);
        progressSection.appendChild(remainingSection);
      }

      // Print button
      const printButton = document.createElement('button');
      printButton.type = 'button';
      printButton.className = 'print-button';
      printButton.textContent = 'Print Distribution List';
      printButton.addEventListener('click', () => this._handlePrint());
      progressSection.appendChild(printButton);
    }

    this._element.appendChild(progressSection);

    // Store previous progress for change detection
    this._previousProgress = progress;

    return this._element;
  }

  /**
   * Render remaining notes table
   * @param {Object} notes - Notes object with denomination counts
   * @returns {HTMLTableElement}
   * @private
   */
  _renderRemainingNotesTable(notes) {
    const table = document.createElement('table');
    table.className = 'remaining-notes-table';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thDenom = document.createElement('th');
    thDenom.textContent = 'Denomination';

    const thCount = document.createElement('th');
    thCount.textContent = 'Count';
    thCount.className = 'numeric';

    headerRow.appendChild(thDenom);
    headerRow.appendChild(thCount);
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

        row.appendChild(tdDenom);
        row.appendChild(tdCount);
        tbody.appendChild(row);
      }
    }

    table.appendChild(tbody);
    return table;
  }

  /**
   * Handle print button click
   * @private
   */
  _handlePrint() {
    // Dispatch custom event for print
    window.dispatchEvent(new CustomEvent('eidiya:print-distribution'));
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
    const newProgress = calculateDistributionProgress(state.contributors);

    // Check if progress changed
    if (this._hasProgressChanged(newProgress)) {
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
   * Check if progress values have changed
   * @param {Object} newProgress - New progress
   * @returns {boolean}
   * @private
   */
  _hasProgressChanged(newProgress) {
    if (!this._previousProgress) {
      return true;
    }

    return (
      newProgress.total !== this._previousProgress.total ||
      newProgress.received !== this._previousProgress.received ||
      newProgress.remaining !== this._previousProgress.remaining ||
      newProgress.percentComplete !== this._previousProgress.percentComplete
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
    this._previousProgress = null;
  }

  /**
   * Get the DOM element
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._element;
  }

  /**
   * Get the store (for test compatibility)
   * @returns {Object}
   */
  get store() {
    return this._store;
  }
}
