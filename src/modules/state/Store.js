/**
 * Observable state store with auto-persistence
 * @module Store
 */

import { DEFAULT_STATE, validateState, migrateState } from './schema.js';

/**
 * Store class implementing observer pattern with automatic persistence
 */
export class Store {
  /**
   * @param {Object|null} initialState - Initial state object
   * @param {Object} storage - Storage instance (e.g., SafeStorage)
   */
  constructor(initialState = null, storage = null) {
    this._state = initialState || { ...DEFAULT_STATE };
    this._storage = storage;
    this._listeners = new Set();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback(newState, prevState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Get current state (deep immutable copy)
   * @returns {Object}
   */
  getState() {
    return JSON.parse(JSON.stringify(this._state));
  }

  /**
   * Update state and notify subscribers
   * @param {Object|Function} updater - Partial state object or updater function(prevState)
   */
  setState(updater) {
    const prevState = this._state;

    // Handle function updater
    const partial = typeof updater === 'function' ? updater(prevState) : updater;

    // Merge immutably
    this._state = { ...prevState, ...partial };

    // Notify subscribers
    this._notify(prevState);

    // Persist to storage
    this._persist();
  }

  /**
   * Notify all subscribers of state change
   * @param {Object} prevState - Previous state
   * @private
   */
  _notify(prevState) {
    for (const listener of this._listeners) {
      listener(this._state, prevState);
    }
  }

  /**
   * Persist current state to storage
   * @private
   */
  _persist() {
    if (!this._storage) return;

    const result = this._storage.setItem('eidiya:state', this._state);

    // Handle quota exceeded error
    if (result.error === 'quota_exceeded') {
      window.dispatchEvent(
        new CustomEvent('eidiya:quota-exceeded', {
          detail: { error: 'quota_exceeded' },
        })
      );
    }
  }

  /**
   * Load state from storage
   */
  load() {
    if (!this._storage) return;

    const data = this._storage.getItem('eidiya:state');

    if (data === null) {
      // No saved data, use defaults
      return;
    }

    // Validate loaded data
    const validation = validateState(data);

    if (!validation.valid) {
      console.warn('Invalid state loaded from storage:', validation.error);
      // Keep default state
      return;
    }

    // Migrate and set state
    const migrated = migrateState(data);
    const prevState = this._state;
    this._state = migrated;

    // Notify subscribers of loaded state
    this._notify(prevState);
  }
}
