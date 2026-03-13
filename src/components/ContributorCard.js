/**
 * ContributorCard - Card component for displaying and editing a contributor
 * Supports inline editing with blur validation and status feedback
 */

import { formatAED } from '@modules/money/formatters.js';
import { validateContributorForm } from '@modules/validation/contributor.js';

export class ContributorCard {
  /**
   * @param {Object} contributor - Contributor data
   * @param {Object} options - Configuration options
   * @param {Function} options.onUpdate - Callback(id, updates) => void when contributor is updated
   * @param {Function} options.onDeleteRequest - Callback(contributor) => void when delete is requested
   * @param {Function} options.onEditStart - Callback(id) => void when edit mode starts
   * @param {Function} options.onEditEnd - Callback() => void when edit mode ends
   * @param {boolean} options.isDimmed - Whether to show dimmed styling
   */
  constructor(contributor, options = {}) {
    this._contributor = { ...contributor };
    this._onUpdate = options.onUpdate || (() => {});
    this._onDeleteRequest = options.onDeleteRequest || (() => {});
    this._onEditStart = options.onEditStart || (() => {});
    this._onEditEnd = options.onEditEnd || (() => {});
    this._isDimmed = options.isDimmed || false;

    this._element = null;
    this._isEditing = false;
    this._statusTimeout = null;
    this._menuOpen = false;
    // Track breakdown during editing
    this._editingBreakdown = null;
    this._editingAmountFils = null;
  }

  /**
   * Render the card and return the DOM element
   * @returns {HTMLElement}
   */
  render() {
    this._element = document.createElement('article');
    this._element.className = `contributor-card ${this._isEditing ? 'editing' : ''} ${this._isDimmed ? 'dimmed' : ''}`;
    this._element.dataset.contributorId = this._contributor.id;

    // Header with name, date, and menu
    const header = document.createElement('header');
    header.className = 'card-header';

    const nameSection = document.createElement('div');
    nameSection.className = 'name-section';

    const name = document.createElement('h3');
    name.className = 'contributor-name';
    name.dataset.field = 'name';
    name.textContent = this._contributor.name;
    name.addEventListener('click', () => this._enterEditMode('name'));

    const date = document.createElement('small');
    date.className = 'contributor-date';
    date.textContent = new Date(this._contributor.date).toLocaleDateString();

    nameSection.appendChild(name);
    nameSection.appendChild(date);

    // Menu button
    const menuButton = this._createMenuButton();

    header.appendChild(nameSection);
    header.appendChild(menuButton);

    // Amount section
    const amountSection = document.createElement('div');
    amountSection.className = 'amount-section';

    const amount = document.createElement('p');
    amount.className = 'contributor-amount';
    amount.dataset.field = 'amount';
    amount.textContent = formatAED(this._contributor.amountInFils);
    amount.addEventListener('click', () => this._enterEditMode('amount'));

    amountSection.appendChild(amount);

    // Breakdown section
    const breakdownSection = document.createElement('div');
    breakdownSection.className = 'breakdown-section';

    const breakdownLabel = document.createElement('small');
    breakdownLabel.textContent = 'Breakdown:';

    const breakdownText = document.createElement('p');
    breakdownText.className = 'breakdown-text';
    breakdownText.dataset.field = 'breakdown';
    breakdownText.textContent = this._formatBreakdown(this._contributor.breakdown);
    breakdownText.addEventListener('click', () => this._enterEditMode('breakdown'));

    breakdownSection.appendChild(breakdownLabel);
    breakdownSection.appendChild(breakdownText);

    // Status container
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-container';

    // Received section (always visible)
    const receivedSection = document.createElement('div');
    receivedSection.className = 'received-section';
    receivedSection.dataset.field = 'received';

    const receivedCheckbox = document.createElement('input');
    receivedCheckbox.type = 'checkbox';
    receivedCheckbox.id = `received-${this._contributor.id}`;
    receivedCheckbox.checked = this._contributor.received || false;
    receivedCheckbox.setAttribute('aria-label', `Mark ${this._contributor.name} as received`);
    receivedCheckbox.addEventListener('change', (e) => {
      this._onUpdate(this._contributor.id, { received: e.target.checked });
    });

    const receivedLabel = document.createElement('label');
    receivedLabel.htmlFor = `received-${this._contributor.id}`;
    receivedLabel.textContent = 'Received';

    receivedSection.appendChild(receivedCheckbox);
    receivedSection.appendChild(receivedLabel);

    // Add 'received' class to card if contributor is marked as received
    if (this._contributor.received) {
      this._element.classList.add('received');
    }

    this._element.appendChild(header);
    this._element.appendChild(amountSection);
    this._element.appendChild(breakdownSection);
    this._element.appendChild(receivedSection);
    this._element.appendChild(statusContainer);

    return this._element;
  }

  /**
   * Create the three-dot menu button
   * @private
   */
  _createMenuButton() {
    const container = document.createElement('div');
    container.className = 'menu-container';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-button';
    button.innerHTML = '&#x22EE;'; // Vertical ellipsis
    button.setAttribute('aria-label', 'Actions');
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMenu();
    });

    const menu = document.createElement('div');
    menu.className = 'action-menu';
    menu.hidden = true;

    menu.innerHTML = `
      <button type="button" class="menu-item" data-action="edit">Edit</button>
      <button type="button" class="menu-item contrast" data-action="delete">Delete</button>
    `;

    menu.querySelector('[data-action="edit"]').addEventListener('click', () => {
      this._closeMenu();
      this._enterEditMode('name');
    });

    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this._closeMenu();
      this._onDeleteRequest(this._contributor);
    });

    container.appendChild(button);
    container.appendChild(menu);

    return container;
  }

  /**
   * Toggle the action menu
   * @private
   */
  _toggleMenu() {
    this._menuOpen = !this._menuOpen;
    const menu = this._element.querySelector('.action-menu');
    menu.hidden = !this._menuOpen;

    if (this._menuOpen) {
      // Close menu on outside click
      setTimeout(() => {
        document.addEventListener('click', () => this._closeMenu(), { once: true });
      }, 0);
    }
  }

  /**
   * Close the action menu
   * @private
   */
  _closeMenu() {
    this._menuOpen = false;
    const menu = this._element?.querySelector('.action-menu');
    if (menu) menu.hidden = true;
  }

  /**
   * Format denomination breakdown for display
   * @private
   */
  _formatBreakdown(breakdown) {
    if (!breakdown) return 'No breakdown';

    const notes = [
      { value: 5, count: breakdown.five || 0 },
      { value: 10, count: breakdown.ten || 0 },
      { value: 20, count: breakdown.twenty || 0 },
      { value: 50, count: breakdown.fifty || 0 },
      { value: 100, count: breakdown.hundred || 0 },
      { value: 200, count: breakdown.twoHundred || 0 },
      { value: 500, count: breakdown.fiveHundred || 0 },
      { value: 1000, count: breakdown.thousand || 0 },
    ].filter(n => n.count > 0);

    if (notes.length === 0) return 'No breakdown';

    return notes.map(n => `${n.value} AED x ${n.count}`).join(', ');
  }

  /**
   * Enter edit mode for a field
   * @private
   */
  _enterEditMode(field) {
    if (this._isEditing) return;
    this._isEditing = true;

    this._onEditStart(this._contributor.id);

    const fieldEl = this._element.querySelector(`[data-field="${field}"]`);

    // Special handling for breakdown - show denomination grid
    if (field === 'breakdown') {
      this._enterBreakdownEditMode(fieldEl);
      return;
    }

    const currentValue = this._getFieldValue(field);

    // Create container for edit mode
    const editContainer = document.createElement('div');
    editContainer.className = 'inline-edit-container';

    const input = document.createElement('input');
    input.type = this._getInputType(field);
    input.value = currentValue;
    input.className = 'inline-edit-input';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'inline-edit-buttons';
    buttonsContainer.style.marginTop = 'var(--spacing-xs)';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = 'var(--spacing-sm)';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'save-edit-btn';
    saveBtn.textContent = 'Save';
    saveBtn.style.fontSize = '0.875rem';
    saveBtn.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    saveBtn.style.marginBottom = '0';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-edit-btn outline';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.fontSize = '0.875rem';
    cancelBtn.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    cancelBtn.style.marginBottom = '0';

    // Button event handlers
    saveBtn.addEventListener('click', () => {
      this._saveEdit(field, input.value);
    });

    cancelBtn.addEventListener('click', () => {
      this._cancelEdit(field, currentValue);
    });

    // Prevent blur when clicking buttons (let buttons handle it)
    buttonsContainer.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent blur on input
    });

    buttonsContainer.appendChild(saveBtn);
    buttonsContainer.appendChild(cancelBtn);

    // Replace text with edit container
    fieldEl.innerHTML = '';
    editContainer.appendChild(input);
    editContainer.appendChild(buttonsContainer);
    fieldEl.appendChild(editContainer);
    input.focus();

    // Keep blur handler as fallback, but check if buttons were clicked
    let isButtonClick = false;
    saveBtn.addEventListener('mousedown', () => { isButtonClick = true; });
    cancelBtn.addEventListener('mousedown', () => { isButtonClick = true; });

    input.addEventListener('blur', () => {
      // Small delay to let button click handler run first
      setTimeout(() => {
        if (!isButtonClick) {
          this._saveEdit(field, input.value);
        }
        isButtonClick = false;
      }, 150);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._saveEdit(field, input.value);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this._cancelEdit(field, currentValue);
      }
    });

    // Update card styling
    this._element.classList.add('editing');
  }

  /**
   * Enter edit mode for breakdown with denomination grid
   * @private
   */
  _enterBreakdownEditMode(fieldEl) {
    // Initialize editing state
    this._editingBreakdown = { ...this._contributor.breakdown };
    this._editingAmountFils = this._contributor.amountInFils;

    // Clear field and create edit container
    fieldEl.innerHTML = '';
    fieldEl.classList.add('breakdown-edit-mode');

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'breakdown-edit-grid';

    // Create inputs for each denomination
    const denominations = [
      { key: 'five', label: '5 AED', value: 5 },
      { key: 'ten', label: '10 AED', value: 10 },
      { key: 'twenty', label: '20 AED', value: 20 },
      { key: 'fifty', label: '50 AED', value: 50 },
      { key: 'hundred', label: '100 AED', value: 100 },
      { key: 'twoHundred', label: '200 AED', value: 200 },
      { key: 'fiveHundred', label: '500 AED', value: 500 },
      { key: 'thousand', label: '1000 AED', value: 1000 },
    ];

    for (const denom of denominations) {
      const field = document.createElement('div');
      field.className = 'breakdown-edit-field';

      const label = document.createElement('label');
      label.textContent = denom.label;
      label.htmlFor = `breakdown-${denom.key}-${this._contributor.id}`;

      const input = document.createElement('input');
      input.type = 'number';
      input.id = `breakdown-${denom.key}-${this._contributor.id}`;
      input.min = '0';
      input.step = '1';
      input.value = this._editingBreakdown[denom.key] || 0;
      input.dataset.denomKey = denom.key;
      input.dataset.denomValue = denom.value;

      // Update remaining indicator on input
      input.addEventListener('input', () => this._updateBreakdownRemaining());

      field.appendChild(label);
      field.appendChild(input);
      grid.appendChild(field);
    }

    // Create remaining indicator
    const remainingEl = document.createElement('div');
    remainingEl.className = 'breakdown-remaining';
    remainingEl.dataset.remainingIndicator = 'true';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'breakdown-edit-buttons';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'save-breakdown-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => this._saveBreakdownEdit());

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-breakdown-btn outline';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this._cancelBreakdownEdit());

    buttonsContainer.appendChild(saveBtn);
    buttonsContainer.appendChild(cancelBtn);

    fieldEl.appendChild(grid);
    fieldEl.appendChild(remainingEl);
    fieldEl.appendChild(buttonsContainer);

    // Update remaining indicator initially
    this._updateBreakdownRemaining();

    // Focus first input
    const firstInput = grid.querySelector('input');
    if (firstInput) firstInput.focus();

    // Update card styling
    this._element.classList.add('editing');
  }

  /**
   * Update the remaining indicator for breakdown editing
   * @private
   */
  _updateBreakdownRemaining() {
    const remainingEl = this._element?.querySelector('[data-remaining-indicator]');
    if (!remainingEl) return;

    // Get current values from inputs
    const grid = this._element.querySelector('.breakdown-edit-grid');
    if (!grid) return;

    const inputs = grid.querySelectorAll('input');
    let totalFils = 0;

    for (const input of inputs) {
      const count = parseInt(input.value, 10) || 0;
      const value = parseInt(input.dataset.denomValue, 10) || 0;
      totalFils += count * value * 100; // Convert to fils
    }

    const targetFils = this._editingAmountFils;
    const remainingFils = targetFils - totalFils;

    // Update display
    const remainingAED = Math.abs(remainingFils) / 100;
    const formattedRemaining = remainingAED.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (remainingFils === 0) {
      remainingEl.className = 'breakdown-remaining balanced';
      remainingEl.textContent = '✓ Breakdown matches total';
    } else if (remainingFils > 0) {
      remainingEl.className = 'breakdown-remaining remaining';
      remainingEl.textContent = `${formattedRemaining} AED remaining to allocate`;
    } else {
      remainingEl.className = 'breakdown-remaining excess';
      remainingEl.textContent = `${formattedRemaining} AED over allocated`;
    }
  }

  /**
   * Save breakdown edit
   * @private
   */
  _saveBreakdownEdit() {
    // Collect values from inputs
    const grid = this._element?.querySelector('.breakdown-edit-grid');
    if (!grid) {
      this._cancelBreakdownEdit();
      return;
    }

    const inputs = grid.querySelectorAll('input');
    const newBreakdown = {};
    let totalFils = 0;

    for (const input of inputs) {
      const key = input.dataset.denomKey;
      const count = parseInt(input.value, 10) || 0;
      const value = parseInt(input.dataset.denomValue, 10) || 0;
      newBreakdown[key] = count;
      totalFils += count * value * 100;
    }

    // Validate that breakdown matches amount
    if (totalFils !== this._editingAmountFils) {
      this._showBreakdownError(`Breakdown (${formatAED(totalFils)}) doesn't match amount (${formatAED(this._editingAmountFils)})`);
      return;
    }

    // Build update
    const updates = { breakdown: newBreakdown };

    // Update local contributor data
    this._contributor = { ...this._contributor, ...updates };

    // Clear editing state
    this._editingBreakdown = null;
    this._editingAmountFils = null;

    // Show success feedback
    this._showStatus('Updated', 'success');

    // Exit edit mode and re-render
    this._exitEditMode();
    this._renderField('breakdown');

    // Dispatch to store after delay
    setTimeout(() => {
      this._onUpdate(this._contributor.id, updates);
    }, 500);
  }

  /**
   * Show breakdown validation error
   * @private
   */
  _showBreakdownError(message) {
    const remainingEl = this._element?.querySelector('[data-remaining-indicator]');
    if (remainingEl) {
      remainingEl.className = 'breakdown-remaining error';
      remainingEl.textContent = message;
    }
  }

  /**
   * Cancel breakdown edit
   * @private
   */
  _cancelBreakdownEdit() {
    this._editingBreakdown = null;
    this._editingAmountFils = null;
    this._exitEditMode();
    this._renderField('breakdown');
  }

  /**
   * Get current value for a field
   * @private
   */
  _getFieldValue(field) {
    switch (field) {
      case 'name':
        return this._contributor.name;
      case 'amount':
        return (this._contributor.amountInFils / 100).toString();
      case 'breakdown':
        return JSON.stringify(this._contributor.breakdown);
      default:
        return '';
    }
  }

  /**
   * Get input type for a field
   * @private
   */
  _getInputType(field) {
    switch (field) {
      case 'name':
        return 'text';
      case 'amount':
        return 'number';
      default:
        return 'text';
    }
  }

  /**
   * Save edit and exit edit mode
   * @private
   */
  _saveEdit(field, value) {
    // Validate
    const validation = this._validateField(field, value);
    if (!validation.valid) {
      this._showFieldError(field, validation.error);
      // Stay in edit mode, re-focus input
      const input = this._element.querySelector('.inline-edit-input');
      if (input) input.focus();
      return;
    }

    // Build update object
    const updates = this._buildUpdateObject(field, value);

    // Update local contributor data
    this._contributor = { ...this._contributor, ...updates };

    // Show success feedback
    this._showStatus('Updated', 'success');

    // Exit edit mode and re-render field immediately
    this._exitEditMode();
    this._renderField(field);

    // Dispatch to store after a delay to allow badge to be seen
    // The store update will trigger re-render, but user will have seen the feedback
    setTimeout(() => {
      this._onUpdate(this._contributor.id, updates);
    }, 500);
  }

  /**
   * Cancel edit and restore original value
   * @private
   */
  _cancelEdit(field, originalValue) {
    this._exitEditMode();
    this._renderField(field);
  }

  /**
   * Exit edit mode
   * @private
   */
  _exitEditMode() {
    this._isEditing = false;
    this._onEditEnd();
    // Guard: element may be null if store re-render destroyed the card
    if (this._element) {
      this._element.classList.remove('editing');
    }
  }

  /**
   * Render a field's display value
   * @private
   */
  _renderField(field) {
    // Guard: element may be null if store re-render destroyed the card
    if (!this._element) return;

    const fieldEl = this._element.querySelector(`[data-field="${field}"]`);
    if (!fieldEl) return;

    // Remove edit mode styling if present
    fieldEl.classList.remove('breakdown-edit-mode');

    switch (field) {
      case 'name':
        fieldEl.textContent = this._contributor.name;
        break;
      case 'amount':
        fieldEl.textContent = formatAED(this._contributor.amountInFils);
        break;
      case 'breakdown':
        fieldEl.textContent = this._formatBreakdown(this._contributor.breakdown);
        break;
    }
  }

  /**
   * Validate a field value
   * @private
   */
  _validateField(field, value) {
    // Build a mock form data object for validation
    const mockData = {
      name: this._contributor.name,
      date: this._contributor.date,
      totalAmount: (this._contributor.amountInFils / 100).toString(),
      breakdown: { ...this._contributor.breakdown },
    };

    // Update with the new value
    switch (field) {
      case 'name':
        mockData.name = value;
        break;
      case 'amount':
        mockData.totalAmount = value;
        break;
    }

    const validation = validateContributorForm(mockData);

    if (!validation.valid && validation.errors.has(field)) {
      return { valid: false, error: validation.errors.get(field) };
    }

    return { valid: true };
  }

  /**
   * Build update object from field and value
   * @private
   */
  _buildUpdateObject(field, value) {
    switch (field) {
      case 'name':
        return { name: value.trim() };
      case 'amount': {
        const amount = parseFloat(value);
        const amountInFils = Math.round(amount * 100);
        return { amountInFils };
      }
      default:
        return {};
    }
  }

  /**
   * Show field error
   * @private
   */
  _showFieldError(field, message) {
    const fieldEl = this._element.querySelector(`[data-field="${field}"]`);
    if (!fieldEl) return;

    // Remove existing error
    this._clearFieldError(field);

    const errorEl = document.createElement('small');
    errorEl.className = 'inline-error';
    errorEl.textContent = message;
    fieldEl.appendChild(errorEl);
  }

  /**
   * Clear field error
   * @private
   */
  _clearFieldError(field) {
    const fieldEl = this._element.querySelector(`[data-field="${field}"]`);
    if (!fieldEl) return;

    const errorEl = fieldEl.querySelector('.inline-error');
    if (errorEl) errorEl.remove();
  }

  /**
   * Show status badge
   * @private
   */
  _showStatus(message, type = 'success') {
    this._clearStatus();

    const container = this._element.querySelector('.status-container');
    if (!container) return;

    const badge = document.createElement('span');
    badge.className = `status-badge ${type}`;
    badge.textContent = message;
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');

    container.appendChild(badge);

    // Auto-remove after 2 seconds
    this._statusTimeout = setTimeout(() => this._clearStatus(), 2000);
  }

  /**
   * Clear status badge
   * @private
   */
  _clearStatus() {
    if (this._statusTimeout) {
      clearTimeout(this._statusTimeout);
      this._statusTimeout = null;
    }

    const container = this._element?.querySelector('.status-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Update the card's dimmed state
   * @param {boolean} isDimmed
   */
  setDimmed(isDimmed) {
    this._isDimmed = isDimmed;
    if (this._element) {
      this._element.classList.toggle('dimmed', isDimmed);
    }
  }

  /**
   * Get the card's DOM element
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._element;
  }

  /**
   * Get the contributor ID
   * @returns {string}
   */
  getId() {
    return this._contributor.id;
  }

  /**
   * Destroy the card and clean up
   */
  destroy() {
    this._clearStatus();
    this._closeMenu();
    this._element = null;
  }
}
