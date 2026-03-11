/**
 * Eidiya - Application Entry Point
 * Initializes storage, state, and mounts the application
 */

import './styles/main.css';
import { SafeStorage } from '@modules/storage/SafeStorage.js';
import { Store } from '@modules/state/Store.js';
import { DEFAULT_STATE } from '@modules/state/schema.js';
import { App } from './app.js';

/**
 * Initialize the application
 */
async function init() {
  try {
    // Create storage instance with fallback support
    const storage = new SafeStorage();

    // Create store with default state and storage
    const store = new Store(DEFAULT_STATE, storage);

    // Load persisted data from storage
    store.load();

    // Get the app mount point
    const appElement = document.getElementById('app');

    if (!appElement) {
      console.error('App mount point not found: #app element is missing');
      return;
    }

    // Create and initialize the app
    const app = new App(appElement, store);
    app.init();

    // Store app instance globally for debugging (remove in production)
    window.__eidiya__ = { app, store, storage };

  } catch (error) {
    console.error('Failed to initialize application:', error);

    // Display user-friendly error message
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div class="empty-state">
          <h2>Unable to Load App</h2>
          <p>Something went wrong while starting the application.</p>
          <p><small>Please refresh the page or try again later.</small></p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded
  init();
}
