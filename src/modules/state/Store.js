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

  /**
   * Add a new contributor to the state
   * @param {Object} contributorData - Contributor data
   * @param {string} contributorData.name - Contributor name
   * @param {string} contributorData.date - ISO date string
   * @param {number} contributorData.amountInFils - Amount in integer fils
   * @param {Object} contributorData.breakdown - Denomination breakdown
   * @returns {Object} The created contributor object
   */
  addContributor(contributorData) {
    const contributor = {
      id: crypto.randomUUID(),
      name: contributorData.name.trim(),
      date: contributorData.date,
      amountInFils: contributorData.amountInFils,
      breakdown: { ...contributorData.breakdown },
    };

    this.setState(state => ({
      contributors: [...state.contributors, contributor],
    }));

    return contributor;
  }

  /**
   * Update an existing contributor
   * @param {string} id - Contributor ID
   * @param {Object} updates - Partial contributor data to update
   * @returns {Object|null} Updated contributor or null if not found
   */
  updateContributor(id, updates) {
    const state = this.getState();
    const index = state.contributors.findIndex(c => c.id === id);

    if (index === -1) return null;

    const updated = {
      ...state.contributors[index],
      ...updates,
      id // Preserve ID
    };

    const newContributors = [...state.contributors];
    newContributors[index] = updated;

    this.setState({ contributors: newContributors });
    return updated;
  }

  /**
   * Delete a contributor by ID
   * @param {string} id - Contributor ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteContributor(id) {
    const state = this.getState();
    const index = state.contributors.findIndex(c => c.id === id);

    if (index === -1) return false;

    const newContributors = state.contributors.filter(c => c.id !== id);
    this.setState({ contributors: newContributors });
    return true;
  }
}
