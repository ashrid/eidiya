/**
 * Currency formatting utilities for AED
 * @module formatters
 */

/**
 * Format fils amount as AED currency string
 * @param {number} filsAmount - Amount in integer fils
 * @param {string} locale - Locale for formatting (default: 'en-AE')
 * @returns {string} Formatted currency string like "AED 1,250.00"
 */
export function formatAED(filsAmount, locale = 'en-AE') {
  const aedAmount = filsAmount / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aedAmount);
}

/**
 * Format fils amount as fils string with separators
 * @param {number} filsAmount - Amount in integer fils
 * @param {string} locale - Locale for number formatting (default: 'en-AE')
 * @returns {string} Formatted string like "5,000 fils"
 */
export function formatFils(filsAmount, locale = 'en-AE') {
  const formatted = new Intl.NumberFormat(locale).format(filsAmount);
  return `${formatted} fils`;
}
