/**
 * Contributor form validation utilities
 * @module validation/contributor
 */

/**
 * Denomination values in fils (1 AED = 100 fils)
 * @type {Object<string, number>}
 */
export const DENOMINATION_FILS = {
  five: 500,
  ten: 1000,
  twenty: 2000,
  fifty: 5000,
  hundred: 10000,
  twoHundred: 20000,
  fiveHundred: 50000,
  thousand: 100000,
};

/**
 * Safely parse a count value, returning 0 for invalid inputs
 * Negative numbers are treated as invalid
 * @param {*} value - Value to parse
 * @returns {number} - Parsed non-negative integer or 0
 */
function safeParseCount(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }
  return 0;
}

/**
 * Calculate total fils from denomination breakdown
 * @param {Object} breakdown - Denomination counts
 * @returns {number} Total amount in fils
 */
export function calculateBreakdownTotal(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') {
    return 0;
  }

  let total = 0;
  for (const [key, fils] of Object.entries(DENOMINATION_FILS)) {
    const count = safeParseCount(breakdown[key]);
    total += count * fils;
  }
  return total;
}

/**
 * Validate that denomination breakdown sum equals total amount
 * @param {number} totalFils - Expected total in fils
 * @param {Object} breakdown - Denomination counts
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateDenominationSum(totalFils, breakdown) {
  const breakdownTotal = calculateBreakdownTotal(breakdown);

  if (breakdownTotal === totalFils) {
    return { valid: true };
  }

  const calculatedAED = breakdownTotal / 100;
  const totalAED = totalFils / 100;
  const diffAED = Math.abs(calculatedAED - totalAED);

  return {
    valid: false,
    error: `Breakdown sum is ${calculatedAED} AED, but total is ${totalAED} AED (difference: ${diffAED} AED)`,
  };
}

/**
 * Validate contributor form data
 * @param {Object} data - Form data
 * @param {string} data.name - Contributor name
 * @param {string} data.date - Date string (YYYY-MM-DD)
 * @param {string} data.totalAmount - Total amount as string (e.g., "1000.50")
 * @param {Object} data.breakdown - Denomination breakdown
 * @returns {{valid: boolean, errors: Map<string, string>}} Validation result with errors per field
 */
export function validateContributorForm(data) {
  const errors = new Map();

  // Validate name
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.set('name', 'Name is required');
  }

  // Validate date
  if (!data.date || typeof data.date !== 'string') {
    errors.set('date', 'Date is required');
  } else {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.set('date', 'Invalid date');
    }
  }

  // Validate totalAmount
  if (!data.totalAmount || typeof data.totalAmount !== 'string' || data.totalAmount.trim() === '') {
    errors.set('totalAmount', 'Total amount is required');
  } else {
    const amount = parseFloat(data.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.set('totalAmount', 'Total amount must be a positive number');
    }
  }

  // Validate breakdown sum matches total
  if (!errors.has('totalAmount')) {
    const amount = parseFloat(data.totalAmount);
    const totalFils = Math.round(amount * 100);
    const breakdownValidation = validateDenominationSum(totalFils, data.breakdown);

    if (!breakdownValidation.valid) {
      errors.set('breakdown', breakdownValidation.error);
    }
  }

  return {
    valid: errors.size === 0,
    errors,
  };
}
