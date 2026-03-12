/**
 * DataManager Component
 * Handles data export and import functionality
 */

/**
 * DataManager class for managing data export/import
 */
export class DataManager {
  /**
   * @param {Object} store - Store instance for state access
   */
  constructor(store) {
    this._store = store;
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
   * Render the DataManager UI
   * @returns {HTMLElement} Container element with export button
   */
  render() {
    const container = document.createElement('div');
    container.className = 'data-manager';

    const exportButton = document.createElement('button');
    exportButton.className = 'secondary outline';
    exportButton.textContent = 'Export Data';
    exportButton.setAttribute('aria-label', 'Export data as JSON backup file');
    exportButton.addEventListener('click', () => this.exportData());

    container.appendChild(exportButton);

    return container;
  }

  /**
   * Clean up any resources
   */
  destroy() {
    // No resources to clean up currently
  }
}
