/**
 * App - Main Application Controller
 * Orchestrates the UI and state management
 */

import { AppContainer } from './components/AppContainer.js';

export class App {
  /**
   * @param {HTMLElement} rootElement - Root DOM element for mounting
   * @param {Object} store - Store instance for state management
   */
  constructor(rootElement, store) {
    this._root = rootElement;
    this._store = store;
    this._container = null;
    this._unsubscribe = null;
  }

  /**
   * Initialize the application
   * Creates AppContainer, subscribes to state changes, performs initial render
   */
  init() {
    // Create the UI container with callback
    this._container = new AppContainer(this._root, this._store, {
      onAddContributor: (data) => {
        console.log('Contributor added:', data.name);
      }
    });

    // Subscribe to state changes for re-rendering
    this._unsubscribe = this._store.subscribe((newState, prevState) => {
      this._container.render();
    });

    // Perform initial render
    this._container.render();
  }

  /**
   * Destroy the application and cleanup resources
   */
  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    if (this._root) {
      this._root.innerHTML = '';
    }

    this._container = null;
  }
}
