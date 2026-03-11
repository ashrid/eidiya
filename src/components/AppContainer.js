/**
 * AppContainer - Root UI Component
 * Renders the application based on current state
 */

import { formatAED } from '@modules/money/formatters.js';

export class AppContainer {
  /**
   * @param {HTMLElement} containerElement - DOM element to render into
   * @param {Object} store - Store instance for state access
   */
  constructor(containerElement, store) {
    this._container = containerElement;
    this._store = store;
  }

  /**
   * Render the application based on current state
   */
  render() {
    const state = this._store.getState();

    // Clear current content
    this._container.innerHTML = '';

    // Render storage warning if using fallback
    if (this._store._storage && this._store._storage.isUsingFallback()) {
      this._container.appendChild(this._renderStorageWarning());
    }

    // Render main content based on state
    if (state.contributors.length === 0) {
      this._container.appendChild(this._renderEmptyState());
    } else {
      this._container.appendChild(this._renderContributorsList(state));
    }
  }

  /**
   * Render storage warning banner
   * @returns {HTMLElement}
   * @private
   */
  _renderStorageWarning() {
    const warning = document.createElement('div');
    warning.className = 'storage-warning';
    warning.setAttribute('role', 'alert');
    warning.textContent = 'Data will not persist: Private browsing mode detected';
    return warning;
  }

  /**
   * Render empty state when no contributors exist
   * @returns {HTMLElement}
   * @private
   */
  _renderEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const heading = document.createElement('h2');
    heading.textContent = 'Welcome to Eidiya';

    const description = document.createElement('p');
    description.textContent = 'Start by adding your first contributor to track Eid money contributions.';

    const hint = document.createElement('p');
    hint.innerHTML = '<small>Use the form below to add contributors and manage AED denominations.</small>';

    emptyState.appendChild(heading);
    emptyState.appendChild(description);
    emptyState.appendChild(hint);

    return emptyState;
  }

  /**
   * Render contributors list (placeholder for future implementation)
   * @param {Object} state - Current app state
   * @returns {HTMLElement}
   * @private
   */
  _renderContributorsList(state) {
    const container = document.createElement('div');
    container.className = 'contributors-section';

    const heading = document.createElement('h2');
    heading.textContent = 'Contributors';
    container.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'contributors-list';

    // Calculate total
    const totalFils = state.contributors.reduce(
      (sum, c) => sum + c.amountInFils,
      0
    );

    // Render each contributor
    state.contributors.forEach(contributor => {
      const card = this._renderContributorCard(contributor);
      list.appendChild(card);
    });

    container.appendChild(list);

    // Render total
    const totalSection = document.createElement('div');
    totalSection.className = 'total-section mt-3';

    const totalLabel = document.createElement('h3');
    totalLabel.textContent = 'Total Contributions';

    const totalAmount = document.createElement('p');
    totalAmount.className = 'total-amount';
    totalAmount.style.fontSize = '1.5rem';
    totalAmount.style.fontWeight = 'bold';
    totalAmount.textContent = formatAED(totalFils);

    totalSection.appendChild(totalLabel);
    totalSection.appendChild(totalAmount);
    container.appendChild(totalSection);

    return container;
  }

  /**
   * Render a single contributor card
   * @param {Object} contributor - Contributor data
   * @returns {HTMLElement}
   * @private
   */
  _renderContributorCard(contributor) {
    const article = document.createElement('article');
    article.className = 'contributor-card';

    const header = document.createElement('header');

    const name = document.createElement('h3');
    name.textContent = contributor.name;

    const date = document.createElement('small');
    date.textContent = new Date(contributor.date).toLocaleDateString();

    header.appendChild(name);
    header.appendChild(date);

    const amount = document.createElement('p');
    amount.className = 'amount';
    amount.style.fontSize = '1.25rem';
    amount.style.fontWeight = '600';
    amount.textContent = formatAED(contributor.amountInFils);

    article.appendChild(header);
    article.appendChild(amount);

    return article;
  }
}
