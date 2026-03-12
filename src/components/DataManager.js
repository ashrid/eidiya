/**
 * DataManager Component
 * Handles data export and import functionality
 */

import { validateState, migrateState } from '../modules/state/schema.js';

/**
 * DataManager class for managing data export/import
 */
export class DataManager {
  /**
   * @param {Object} store - Store instance for state access
   */
  constructor(store) {
    this._store = store;
    this._feedbackTimeout = null;
  }

  /**
   * Export current state as JSON file download
   * @returns {{success: boolean}} Result object
   */
  exportData() {
    const state = this._store.getState();

    // Create export data with metadata
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    // Create blob with formatted JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `eidiya-backup-${date}.json`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL object
    URL.revokeObjectURL(url);

    return { success: true };
  }

  /**
   * Import data from JSON file
   * @param {File} file - JSON file to import
   * @returns {Promise<{success: boolean, error?: string, contributorCount?: number}>} Result object
   */
  async importData(file) {
    // Step 1: Read file
    let text;
    try {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    } catch (error) {
      return { success: false, error: 'Failed to read file' };
    }

    // Step 2: Parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' };
    }

    // Step 3: Validate against schema
    const validation = validateState(data);
    if (!validation.valid) {
      return { success: false, error: `Invalid data: ${validation.error}` };
    }

    // Step 4: Migrate and apply
    const migrated = migrateState(data);
    this._store.setState(migrated);

    return { success: true, contributorCount: migrated.contributors.length };
  }

  /**
   * Handle file selection from file input
   * @param {Event} event - Change event from file input
   * @private
   */
  async _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if there are existing contributors that would be overwritten
    const currentState = this._store.getState();
    const hasExistingData = currentState.contributors && currentState.contributors.length > 0;

    if (hasExistingData) {
      // Show confirmation dialog
      const confirmed = this._showImportConfirm(currentState.contributors.length);
      if (!confirmed) {
        // Clear the file input
        event.target.value = '';
        return;
      }
    }

    // Proceed with import
    const result = await this.importData(file);

    // Show feedback
    this._showImportFeedback(result);

    // Clear the file input
    event.target.value = '';
  }

  /**
   * Show confirmation dialog for import when data exists
   * @param {number} contributorCount - Number of existing contributors
   * @returns {boolean} True if user confirmed, false otherwise
   * @private
   */
  _showImportConfirm(contributorCount) {
    const message = `This will replace ${contributorCount} existing contributor(s) with the imported data. Are you sure?`;
    return confirm(message);
  }

  /**
   * Show import feedback message
   * @param {{success: boolean, error?: string, contributorCount?: number}} result - Import result
   * @private
   */
  _showImportFeedback(result) {
    // Clear any existing feedback timeout
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout);
    }

    // Find or create feedback container
    let feedbackEl = this._container?.querySelector('.import-feedback');
    if (!feedbackEl) return;

    // Clear previous feedback classes
    feedbackEl.className = 'import-feedback';
    feedbackEl.textContent = '';

    if (result.success) {
      feedbackEl.classList.add('success');
      feedbackEl.textContent = `Import successful - ${result.contributorCount} contributor(s) loaded`;
    } else {
      feedbackEl.classList.add('error');
      feedbackEl.textContent = `Import failed - ${result.error}`;
    }

    // Auto-dismiss after 2 seconds
    this._feedbackTimeout = setTimeout(() => {
      if (feedbackEl) {
        feedbackEl.className = 'import-feedback';
        feedbackEl.textContent = '';
      }
    }, 2000);
  }

  /**
   * Render the DataManager UI
   * @returns {HTMLElement} Container element with export and import buttons
   */
  render() {
    const container = document.createElement('div');
    container.className = 'data-manager';
    this._container = container;

    // Button container for layout
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'data-manager-buttons';

    // Export button
    const exportButton = document.createElement('button');
    exportButton.className = 'secondary outline';
    exportButton.textContent = 'Export Data';
    exportButton.setAttribute('aria-label', 'Export data as JSON backup file');
    exportButton.addEventListener('click', () => this.exportData());

    // Import button
    const importButton = document.createElement('button');
    importButton.className = 'secondary outline';
    importButton.textContent = 'Import Data';
    importButton.setAttribute('aria-label', 'Import data from JSON backup file');

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.className = 'import-input';
    fileInput.setAttribute('aria-label', 'Select JSON file to import');
    fileInput.addEventListener('change', (e) => this._handleFileSelect(e));

    // Import button triggers file input
    importButton.addEventListener('click', () => fileInput.click());

    // Feedback container
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'import-feedback';

    // Assemble
    buttonContainer.appendChild(exportButton);
    buttonContainer.appendChild(importButton);
    container.appendChild(buttonContainer);
    container.appendChild(fileInput);
    container.appendChild(feedbackEl);

    return container;
  }

  /**
   * Clean up any resources
   */
  destroy() {
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout);
      this._feedbackTimeout = null;
    }
    this._container = null;
  }
}
