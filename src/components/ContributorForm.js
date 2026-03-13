/**
 * ContributorForm - Form component for adding contributors
 * Handles input validation, denomination breakdown, and form submission
 */

import { validateContributorForm } from '@modules/validation/contributor.js';

export class ContributorForm {
  /**
   * @param {Function} onSubmit - Callback(contributorData) => void
   * @param {Object} options - Optional configuration
   * @param {boolean} options.initiallyCollapsed - Start with form collapsed
   * @param {boolean} options.hasContributors - Whether contributors exist (enables toggle)
   * @param {Function} options.onToggle - Callback(collapsed) => void when toggle clicked
   */
  constructor(onSubmit, options = {}) {
    this._onSubmit = onSubmit;
    this._isCollapsed = options.initiallyCollapsed || false;
    this._hasContributors = options.hasContributors || false;
    this._onToggle = options.onToggle || null;
    this._element = null;
    this._errorElements = new Map();
    this._resetValues();
  }

  /**
   * Reset form values to defaults
   * @private
   */
  _resetValues() {
    this._values = {
      name: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      totalAmount: '',
      breakdown: {
        five: 0,
        ten: 0,
        twenty: 0,
        fifty: 0,
        hundred: 0,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      },
    };
  }

  /**
   * Render the form and return the DOM element
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement('div');
    container.className = 'form-section';

    // Show toggle button when contributors exist
    if (this._hasContributors) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'form-toggle outline';
      toggle.textContent = this._isCollapsed ? 'Show Add Contributor Form' : 'Hide Form';
      toggle.addEventListener('click', () => this._toggle());
      container.appendChild(toggle);

      if (this._isCollapsed) {
        this._element = container;
        return this._element;
      }
    }

    this._element = document.createElement('article');
    this._element.className = 'form-card';

    const header = document.createElement('header');
    const title = document.createElement('h2');
    title.textContent = 'Add Contributor';
    header.appendChild(title);
    this._element.appendChild(header);

    const form = document.createElement('form');
    form.setAttribute('novalidate', '');

    // Name field
    form.appendChild(this._createTextField('name', 'Name', { required: true }));

    // Date field
    form.appendChild(this._createDateField('date', 'Date', { required: true }));

    // Total Amount field
    form.appendChild(
      this._createNumberField('totalAmount', 'Total Amount (AED)', {
        required: true,
        min: '0.01',
        step: '0.01',
      })
    );

    // Denomination breakdown fieldset
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Denomination Breakdown';
    fieldset.appendChild(legend);

    const grid = document.createElement('div');
    grid.className = 'denomination-grid';

    // Add denomination inputs (ordered smallest to largest)
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

    for (const { key, label, value } of denominations) {
      grid.appendChild(this._createDenominationField(key, label, value));
    }

    fieldset.appendChild(grid);

    // Add remaining indicator
    const remainingEl = document.createElement('div');
    remainingEl.className = 'breakdown-remaining';
    remainingEl.id = 'form-breakdown-remaining';
    remainingEl.textContent = 'Enter total amount to see remaining';
    fieldset.appendChild(remainingEl);

    form.appendChild(fieldset);

    // Submit button
    const footer = document.createElement('footer');
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Add Contributor';
    footer.appendChild(submitBtn);
    form.appendChild(footer);

    this._element.appendChild(form);

    this._attachListeners();

    container.appendChild(this._element);
    return container;
  }

  /**
   * Create a text input field
   * @private
   */
  _createTextField(name, label, attrs = {}) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `contributor-${name}`;
    labelEl.textContent = label;
    if (attrs.required) {
      const required = document.createElement('span');
      required.textContent = ' *';
      required.setAttribute('aria-hidden', 'true');
      labelEl.appendChild(required);
    }
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `contributor-${name}`;
    input.name = name;
    input.value = this._values[name] || '';
    if (attrs.required) input.required = true;
    group.appendChild(input);

    const errorEl = document.createElement('small');
    errorEl.id = `contributor-${name}-error`;
    errorEl.className = 'error-message';
    errorEl.setAttribute('aria-live', 'polite');
    group.appendChild(errorEl);

    this._errorElements.set(name, { input, error: errorEl });

    return group;
  }

  /**
   * Create a date input field
   * @private
   */
  _createDateField(name, label, attrs = {}) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `contributor-${name}`;
    labelEl.textContent = label;
    if (attrs.required) {
      const required = document.createElement('span');
      required.textContent = ' *';
      required.setAttribute('aria-hidden', 'true');
      labelEl.appendChild(required);
    }
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'date';
    input.id = `contributor-${name}`;
    input.name = name;
    input.value = this._values[name] || '';
    if (attrs.required) input.required = true;
    group.appendChild(input);

    const errorEl = document.createElement('small');
    errorEl.id = `contributor-${name}-error`;
    errorEl.className = 'error-message';
    errorEl.setAttribute('aria-live', 'polite');
    group.appendChild(errorEl);

    this._errorElements.set(name, { input, error: errorEl });

    return group;
  }

  /**
   * Create a number input field
   * @private
   */
  _createNumberField(name, label, attrs = {}) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `contributor-${name}`;
    labelEl.textContent = label;
    if (attrs.required) {
      const required = document.createElement('span');
      required.textContent = ' *';
      required.setAttribute('aria-hidden', 'true');
      labelEl.appendChild(required);
    }
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `contributor-${name}`;
    input.name = name;
    input.value = this._values[name] || '';
    if (attrs.required) input.required = true;
    if (attrs.min !== undefined) input.min = attrs.min;
    if (attrs.step !== undefined) input.step = attrs.step;
    group.appendChild(input);

    const errorEl = document.createElement('small');
    errorEl.id = `contributor-${name}-error`;
    errorEl.className = 'error-message';
    errorEl.setAttribute('aria-live', 'polite');
    group.appendChild(errorEl);

    this._errorElements.set(name, { input, error: errorEl });

    return group;
  }

  /**
   * Create a denomination count field
   * @private
   */
  _createDenominationField(key, label, denomValue) {
    const group = document.createElement('div');
    group.className = 'denomination-field';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `denomination-${key}`;
    labelEl.textContent = label;
    group.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `denomination-${key}`;
    input.name = key;
    input.min = '0';
    input.step = '1';
    input.placeholder = '0';
    input.value = this._values.breakdown[key]?.toString() || '0';
    input.dataset.denomValue = denomValue;
    input.addEventListener('input', () => this._updateRemainingIndicator());
    group.appendChild(input);

    // Denomination fields don't show inline errors, but we need the entry for consistency
    this._errorElements.set(key, { input, error: null });

    return group;
  }

  /**
   * Attach event listeners to form elements
   * @private
   */
  _attachListeners() {
    const form = this._element.querySelector('form');

    // Blur validation for text/date/number fields
    for (const [fieldName, { input }] of this._errorElements) {
      if (fieldName === 'breakdown') continue;

      input.addEventListener('blur', () => {
        this._values[fieldName] = input.value;
        this._validateField(fieldName);
      });

      input.addEventListener('input', () => {
        this._values[fieldName] = input.value;
        // Update remaining indicator when total amount changes
        if (fieldName === 'totalAmount') {
          this._updateRemainingIndicator();
        }
        // Clear error on input after validation
        if (input.getAttribute('aria-invalid') === 'true') {
          this._validateField(fieldName);
        }
      });
    }

    // Form submission
    form.addEventListener('submit', (e) => this._handleSubmit(e));
  }

  /**
   * Update the remaining indicator for breakdown
   * @private
   */
  _updateRemainingIndicator() {
    const remainingEl = this._element?.querySelector('#form-breakdown-remaining');
    if (!remainingEl) return;

    // Get total amount
    const totalAmountInput = this._element?.querySelector('[name="totalAmount"]');
    const totalAmount = parseFloat(totalAmountInput?.value) || 0;
    const totalFils = Math.round(totalAmount * 100);

    if (totalFils === 0) {
      remainingEl.className = 'breakdown-remaining';
      remainingEl.textContent = 'Enter total amount to see remaining';
      return;
    }

    // Calculate breakdown total
    const grid = this._element?.querySelector('.denomination-grid');
    if (!grid) return;

    const inputs = grid.querySelectorAll('input');
    let breakdownFils = 0;

    for (const input of inputs) {
      const count = parseInt(input.value, 10) || 0;
      const value = parseInt(input.dataset.denomValue, 10) || 0;
      breakdownFils += count * value * 100;
    }

    const remainingFils = totalFils - breakdownFils;
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
   * Validate a single field
   * @private
   */
  _validateField(fieldName) {
    const validation = validateContributorForm(this._values);

    if (validation.errors.has(fieldName)) {
      this._displayFieldError(fieldName, validation.errors.get(fieldName));
      return false;
    } else {
      this._clearFieldError(fieldName);
      return true;
    }
  }

  /**
   * Display error for a specific field
   * @private
   */
  _displayFieldError(fieldName, message) {
    const elements = this._errorElements.get(fieldName);
    if (!elements) return;

    if (fieldName === 'breakdown') {
      // Show error on the fieldset
      const fieldset = this._element.querySelector('fieldset');
      if (fieldset) {
        fieldset.classList.add('error');
        let errorEl = fieldset.querySelector('.error-message');
        if (!errorEl) {
          errorEl = document.createElement('small');
          errorEl.className = 'error-message';
          fieldset.appendChild(errorEl);
        }
        errorEl.textContent = message;
      }
      return;
    }

    const { input, error } = elements;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `contributor-${fieldName}-error`);
    error.textContent = message;
  }

  /**
   * Clear error for a specific field
   * @private
   */
  _clearFieldError(fieldName) {
    const elements = this._errorElements.get(fieldName);
    if (!elements) return;

    if (fieldName === 'breakdown') {
      const fieldset = this._element.querySelector('fieldset');
      if (fieldset) {
        fieldset.classList.remove('error');
        const errorEl = fieldset.querySelector('.error-message');
        if (errorEl) errorEl.remove();
      }
      return;
    }

    const { input, error } = elements;
    if (!error) return; // Denomination fields don't have error elements

    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    error.textContent = '';
  }

  /**
   * Clear all errors
   * @private
   */
  _clearErrors() {
    for (const fieldName of this._errorElements.keys()) {
      this._clearFieldError(fieldName);
    }
  }

  /**
   * Handle form submission
   * @private
   */
  _handleSubmit(event) {
    event.preventDefault();

    // Update values from form
    const form = event.target;
    const formData = new FormData(form);

    this._values.name = formData.get('name') || '';
    this._values.date = formData.get('date') || '';
    this._values.totalAmount = formData.get('totalAmount') || '';

    // Update breakdown values
    const breakdownKeys = ['five', 'ten', 'twenty', 'fifty', 'hundred', 'twoHundred', 'fiveHundred', 'thousand'];
    for (const key of breakdownKeys) {
      const value = formData.get(key);
      this._values.breakdown[key] = value ? parseInt(value, 10) : 0;
    }

    // Validate all fields
    const validation = validateContributorForm(this._values);

    if (!validation.valid) {
      this._displayErrors(validation.errors);
      return;
    }

    // Clear errors and submit
    this._clearErrors();

    const contributorData = this._getContributorData();
    this._onSubmit(contributorData);

    // Reset form
    this._resetValues();
    this._updateFormValues();
  }

  /**
   * Display validation errors
   * @private
   */
  _displayErrors(errors) {
    for (const [fieldName, message] of errors) {
      this._displayFieldError(fieldName, message);
    }

    // Focus first error field
    const firstError = this._element.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.focus();
    }
  }

  /**
   * Get formatted contributor data for submission
   * @private
   */
  _getContributorData() {
    const amount = parseFloat(this._values.totalAmount);
    const amountInFils = Math.round(amount * 100);

    return {
      name: this._values.name.trim(),
      date: this._values.date,
      amountInFils,
      breakdown: { ...this._values.breakdown },
    };
  }

  /**
   * Update form inputs to match current values
   * @private
   */
  _updateFormValues() {
    const form = this._element.querySelector('form');
    if (!form) return;

    form.querySelector('[name="name"]').value = this._values.name;
    form.querySelector('[name="date"]').value = this._values.date;
    form.querySelector('[name="totalAmount"]').value = this._values.totalAmount;

    const breakdownKeys = ['five', 'ten', 'twenty', 'fifty', 'hundred', 'twoHundred', 'fiveHundred', 'thousand'];
    for (const key of breakdownKeys) {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this._values.breakdown[key];
      }
    }
  }

  /**
   * Toggle form collapsed state
   * @private
   */
  _toggle() {
    this._isCollapsed = !this._isCollapsed;
    if (this._onToggle) {
      this._onToggle(this._isCollapsed);
    }
  }

  /**
   * Update form options (for external state changes)
   * @param {Object} options
   * @param {boolean} options.hasContributors - Whether contributors exist
   * @param {boolean} options.isCollapsed - Whether form should be collapsed
   */
  update(options) {
    if (options.hasContributors !== undefined) {
      this._hasContributors = options.hasContributors;
    }
    if (options.isCollapsed !== undefined) {
      this._isCollapsed = options.isCollapsed;
    }
  }
}
