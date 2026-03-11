/**
 * State schema definitions, validation, and migrations
 * @module schema
 */

/**
 * @typedef {Object} DenominationBreakdown
 * @property {number} five - Count of 5 AED notes
 * @property {number} ten - Count of 10 AED notes
 * @property {number} twenty - Count of 20 AED notes
 * @property {number} fifty - Count of 50 AED notes
 * @property {number} hundred - Count of 100 AED notes
 * @property {number} twoHundred - Count of 200 AED notes
 * @property {number} fiveHundred - Count of 500 AED notes
 * @property {number} thousand - Count of 1000 AED notes
 */

/**
 * @typedef {Object} Contributor
 * @property {string} id - Unique identifier
 * @property {string} name - Contributor name
 * @property {string} date - ISO date string
 * @property {number} amountInFils - Amount in integer fils
 * @property {DenominationBreakdown} breakdown - Note breakdown
 */

/**
 * @typedef {Object} AppState
 * @property {string} version - Schema version
 * @property {Contributor[]} contributors - List of contributors
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/** Current schema version for migrations */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/** Valid denomination keys */
const DENOMINATION_KEYS = ['five', 'ten', 'twenty', 'fifty', 'hundred', 'twoHundred', 'fiveHundred', 'thousand'];

/**
 * Get current ISO timestamp
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Default application state
 * @type {AppState}
 */
export const DEFAULT_STATE = {
  version: CURRENT_SCHEMA_VERSION,
  contributors: [],
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};

/**
 * Validate a denomination breakdown object
 * @param {*} breakdown
 * @returns {{valid: boolean, error?: string}}
 */
function validateBreakdown(breakdown) {
  if (typeof breakdown !== 'object' || breakdown === null) {
    return { valid: false, error: 'breakdown must be an object' };
  }

  for (const key of DENOMINATION_KEYS) {
    const value = breakdown[key];
    if (value !== undefined && !Number.isInteger(value)) {
      return { valid: false, error: `breakdown.${key} must be an integer` };
    }
  }

  return { valid: true };
}

/**
 * Validate a contributor object
 * @param {*} contributor
 * @param {number} index
 * @returns {{valid: boolean, error?: string}}
 */
function validateContributor(contributor, index) {
  if (typeof contributor !== 'object' || contributor === null) {
    return { valid: false, error: `contributor[${index}] must be an object` };
  }

  if (typeof contributor.id !== 'string') {
    return { valid: false, error: `contributor[${index}].id must be a string` };
  }

  if (typeof contributor.name !== 'string') {
    return { valid: false, error: `contributor[${index}].name must be a string` };
  }

  if (typeof contributor.date !== 'string') {
    return { valid: false, error: `contributor[${index}].date must be a string` };
  }

  if (!Number.isInteger(contributor.amountInFils)) {
    return { valid: false, error: `contributor[${index}].amountInFils must be an integer` };
  }

  if (!('breakdown' in contributor)) {
    return { valid: false, error: `contributor[${index}].breakdown is required` };
  }

  const breakdownValidation = validateBreakdown(contributor.breakdown);
  if (!breakdownValidation.valid) {
    return { valid: false, error: `contributor[${index}].${breakdownValidation.error}` };
  }

  return { valid: true };
}

/**
 * Validate state data structure
 * @param {*} data
 * @returns {{valid: boolean, error?: string}}
 */
export function validateState(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, error: 'state must be an object' };
  }

  if (!Array.isArray(data.contributors)) {
    return { valid: false, error: 'contributors must be an array' };
  }

  for (let i = 0; i < data.contributors.length; i++) {
    const contributorValidation = validateContributor(data.contributors[i], i);
    if (!contributorValidation.valid) {
      return contributorValidation;
    }
  }

  return { valid: true };
}

/**
 * Migrate state to current schema version
 * @param {*} data
 * @returns {AppState}
 */
export function migrateState(data) {
  const timestamp = getTimestamp();

  return {
    version: data.version || CURRENT_SCHEMA_VERSION,
    contributors: Array.isArray(data.contributors) ? data.contributors : [],
    createdAt: data.createdAt || timestamp,
    updatedAt: timestamp,
  };
}
