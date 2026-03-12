/**
 * AppContainer - Root UI Component
 * Renders the application based on current state
 */

import { formatAED } from '@modules/money/formatters.js';
import { ContributorForm } from './ContributorForm.js';
import { SummaryPanel } from './SummaryPanel.js';
import { DistributionPanel } from './DistributionPanel.js';
import { DataManager } from './DataManager.js';
import { ContributorCard } from './ContributorCard.js';
import { DeleteConfirmation } from './DeleteConfirmation.js';
import { DistributionPrintView } from './DistributionPrintView.js';

export class AppContainer {
  /**
   * @param {HTMLElement} containerElement - DOM element to render into
   * @param {Object} store - Store instance for state access
   * @param {Object} options - Optional configuration
   * @param {Function} options.onAddContributor - Callback when contributor is added
   */
  constructor(containerElement, store, options = {}) {
    this._container = containerElement;
    this._store = store;
    this._onAddContributor = options.onAddContributor || (() => {});
    this._form = null;
    this._summaryPanel = null;
    this._distributionPanel = null;
    this._dataManager = null;
    this._deleteConfirmation = null;
    this._editingContributorId = null;
    this._contributorCards = new Map();
    this._isFormCollapsed = false; // Track form collapsed state across re-renders
    this._printView = null;

    // Bind event handlers
    this._handlePrintRequest = this._handlePrintRequest.bind(this);

    // Listen for print distribution event
    window.addEventListener('eidiya:print-distribution', this._handlePrintRequest);
  }

  /**
   * Render the application based on current state
   */
  render() {
    const state = this._store.getState();

    // Clear current content and clean up old components
    this._container.innerHTML = '';
    if (this._summaryPanel) {
      this._summaryPanel.destroy();
      this._summaryPanel = null;
    }
    if (this._distributionPanel) {
      this._distributionPanel.destroy();
      this._distributionPanel = null;
    }
    if (this._dataManager) {
      this._dataManager.destroy();
      this._dataManager = null;
    }
    // Clean up old contributor cards
    for (const card of this._contributorCards.values()) {
      card.destroy();
    }
    this._contributorCards.clear();

    // Render storage warning if using fallback
    if (this._store._storage && this._store._storage.isUsingFallback()) {
      this._container.appendChild(this._renderStorageWarning());
    }

    // Create responsive layout wrapper
    const layoutWrapper = document.createElement('div');
    layoutWrapper.className = 'app-layout';

    // Create main content area (form + contributors)
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Render form (always at top of main content)
    const hasContributors = state.contributors.length > 0;
    // Default to collapsed only on first render when contributors exist
    if (hasContributors && !this._form) {
      this._isFormCollapsed = true;
    }
    this._form = new ContributorForm(
      (data) => this._handleFormSubmit(data),
      {
        initiallyCollapsed: this._isFormCollapsed,
        hasContributors: hasContributors,
        onToggle: (collapsed) => {
          this._isFormCollapsed = collapsed;
          this.render();
        }
      }
    );
    mainContent.appendChild(this._form.render());

    // Render main content based on state
    if (state.contributors.length === 0) {
      mainContent.appendChild(this._renderEmptyState());
    } else {
      mainContent.appendChild(this._renderContributorsList(state));
    }

    // Create sidebar container for panels
    const sidebarContainer = document.createElement('div');
    sidebarContainer.className = 'sidebar-container';

    // Create summary panel (sidebar on desktop, top card on mobile)
    this._summaryPanel = new SummaryPanel(this._store);
    const summaryElement = this._summaryPanel.render();
    sidebarContainer.appendChild(summaryElement);

    // Create distribution panel (below summary)
    this._distributionPanel = new DistributionPanel(this._store);
    const distributionElement = this._distributionPanel.render();
    sidebarContainer.appendChild(distributionElement);

    // Create data manager panel (below distribution)
    this._dataManager = new DataManager(this._store);
    const dataManagerElement = this._dataManager.render();
    sidebarContainer.appendChild(dataManagerElement);

    // Assemble layout: sidebar first in DOM for mobile (top cards),
    // but will be repositioned via CSS on desktop
    layoutWrapper.appendChild(sidebarContainer);
    layoutWrapper.appendChild(mainContent);

    this._container.appendChild(layoutWrapper);

    // Subscribe panels to store updates
    this._summaryPanel.subscribe();
    this._distributionPanel.subscribe();

    // Initialize delete confirmation modal
    this._initDeleteConfirmation();
  }

  /**
   * Initialize the delete confirmation modal
   * @private
   */
  _initDeleteConfirmation() {
    this._deleteConfirmation = new DeleteConfirmation(
      (id) => this._handleDeleteConfirm(id),
      () => {} // No action on cancel
    );
  }

  /**
   * Handle delete confirmation
   * @private
   */
  _handleDeleteConfirm(id) {
    // Delete from store
    this._store.deleteContributor(id);

    // Show deleted status on the card (if it still exists briefly)
    const card = this._contributorCards.get(id);
    if (card) {
      card._showStatus?.('Deleted', 'success');
    }
  }

  /**
   * Handle contributor update
   * @private
   */
  _handleContributorUpdate(id, updates) {
    this._store.updateContributor(id, updates);
  }

  /**
   * Handle delete request from a card
   * @private
   */
  _handleDeleteRequest(contributor) {
    this._deleteConfirmation.show(contributor);
  }

  /**
   * Handle edit start - dim other cards
   * @private
   */
  _handleEditStart(id) {
    this._editingContributorId = id;
    // Dim all other cards
    for (const [cardId, card] of this._contributorCards) {
      if (cardId !== id) {
        card.setDimmed(true);
      }
    }
  }

  /**
   * Handle edit end - remove dimming
   * @private
   */
  _handleEditEnd() {
    this._editingContributorId = null;
    // Remove dimming from all cards
    for (const card of this._contributorCards.values()) {
      card.setDimmed(false);
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
   * Render contributors list with ContributorCard components
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

    // Render each contributor using ContributorCard
    state.contributors.forEach(contributor => {
      const isDimmed = this._editingContributorId && this._editingContributorId !== contributor.id;
      const card = new ContributorCard(contributor, {
        onUpdate: (id, updates) => this._handleContributorUpdate(id, updates),
        onDeleteRequest: (c) => this._handleDeleteRequest(c),
        onEditStart: (id) => this._handleEditStart(id),
        onEditEnd: () => this._handleEditEnd(),
        isDimmed,
      });

      this._contributorCards.set(contributor.id, card);
      list.appendChild(card.render());
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
   * Handle print request from DistributionPanel
   * Creates print view, appends to body, triggers print, then cleans up
   * @private
   */
  _handlePrintRequest() {
    const state = this._store.getState();

    // Don't print if no contributors
    if (state.contributors.length === 0) {
      return;
    }

    // Clean up any existing print view
    if (this._printView) {
      this._printView.destroy();
      this._printView = null;
    }

    // Create print view with current contributors
    this._printView = new DistributionPrintView(state.contributors);
    const printElement = this._printView.render();

    // Append to body
    document.body.appendChild(printElement);

    // Trigger print dialog
    window.print();

    // Clean up after print dialog closes (small delay to allow print dialog to appear)
    setTimeout(() => {
      if (this._printView) {
        this._printView.destroy();
        this._printView = null;
      }
    }, 100);
  }

  /**
   * Clean up event listeners and components
   */
  destroy() {
    window.removeEventListener('eidiya:print-distribution', this._handlePrintRequest);

    if (this._printView) {
      this._printView.destroy();
      this._printView = null;
    }

    if (this._summaryPanel) {
      this._summaryPanel.destroy();
    }

    if (this._distributionPanel) {
      this._distributionPanel.destroy();
    }

    if (this._dataManager) {
      this._dataManager.destroy();
    }

    for (const card of this._contributorCards.values()) {
      card.destroy();
    }
    this._contributorCards.clear();
  }

  /**
   * Handle form submission and add contributor to store
   * @param {Object} contributorData - Data from the form
   * @private
   */
  _handleFormSubmit(contributorData) {
    // Dispatch to store
    this._store.addContributor({
      name: contributorData.name,
      date: contributorData.date,
      amountInFils: contributorData.amountInFils,
      breakdown: contributorData.breakdown
    });

    // Keep form collapsed after adding (user can click to show again)
    this._isFormCollapsed = true;

    // Notify parent (for any additional handling)
    this._onAddContributor(contributorData);
  }
}
