/**
 * SafeStorage wrapper for localStorage with fallback to in-memory Map.
 * Handles Safari private browsing mode and quota exceeded errors gracefully.
 */
export class SafeStorage {
  constructor() {
    this._fallback = new Map();
    this._usingFallback = false;
    this._available = this._checkAvailability();
  }

  /**
   * Check if localStorage is available and working
   * @returns {boolean}
   * @private
   */
  _checkAvailability() {
    try {
      const testKey = '__safe_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      this._usingFallback = true;
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  isAvailable() {
    return this._available;
  }

  /**
   * Check if currently using fallback storage
   * @returns {boolean}
   */
  isUsingFallback() {
    return this._usingFallback;
  }

  /**
   * Check if error is a quota exceeded error
   * @param {Error} error
   * @returns {boolean}
   * @private
   */
  _isQuotaError(error) {
    return (
      error.name === 'QuotaExceededError' ||
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  /**
   * Store an item
   * @param {string} key
   * @param {*} value - Will be JSON serialized
   * @returns {{success: boolean, fallback: boolean, error?: string}}
   */
  setItem(key, value) {
    const serialized = JSON.stringify(value);

    if (this._usingFallback) {
      this._fallback.set(key, serialized);
      return { success: true, fallback: true };
    }

    try {
      localStorage.setItem(key, serialized);
      return { success: true, fallback: false };
    } catch (error) {
      if (this._isQuotaError(error)) {
        this._usingFallback = true;
        this._fallback.set(key, serialized);
        return { success: false, fallback: true, error: 'quota_exceeded' };
      }
      // For other errors, also fall back
      this._usingFallback = true;
      this._fallback.set(key, serialized);
      return { success: false, fallback: true };
    }
  }

  /**
   * Retrieve an item
   * @param {string} key
   * @returns {*} Parsed JSON value or null
   */
  getItem(key) {
    let serialized;

    if (this._usingFallback) {
      serialized = this._fallback.get(key);
    } else {
      try {
        serialized = localStorage.getItem(key);
      } catch (error) {
        // If localStorage fails, switch to fallback
        this._usingFallback = true;
        serialized = this._fallback.get(key);
      }
    }

    if (serialized === null || serialized === undefined) {
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch (error) {
      // Return null for corrupted data
      return null;
    }
  }

  /**
   * Remove an item
   * @param {string} key
   */
  removeItem(key) {
    if (this._usingFallback) {
      this._fallback.delete(key);
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore errors, also remove from fallback if present
      this._fallback.delete(key);
    }
  }

  /**
   * Clear all items (only from fallback if using fallback)
   */
  clear() {
    if (this._usingFallback) {
      this._fallback.clear();
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      // Ignore errors
    }
    this._fallback.clear();
  }
}
