/**
 * Money value object for handling currency without floating-point errors.
 * Stores all amounts as integer fils (1 AED = 100 fils).
 */
export class Money {
  /**
   * @param {number} fils - Integer amount in fils
   */
  constructor(fils) {
    if (!Number.isInteger(fils)) {
      throw new TypeError('Money must be initialized with integer fils');
    }
    this._fils = fils;
  }

  /**
   * Create Money from AED amount (handles rounding)
   * @param {number} aedAmount - Amount in AED
   * @returns {Money}
   */
  static fromAED(aedAmount) {
    return new Money(Math.round(aedAmount * 100));
  }

  /**
   * Get amount in AED
   * @returns {number}
   */
  toAED() {
    return this._fils / 100;
  }

  /**
   * Get raw fils amount
   * @returns {number}
   */
  toFils() {
    return this._fils;
  }

  /**
   * Format as currency string
   * @param {string} locale - Locale for formatting (default: 'en-AE')
   * @returns {string}
   */
  format(locale = 'en-AE') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'AED',
    }).format(this.toAED());
  }

  /**
   * Add another Money amount
   * @param {Money} other
   * @returns {Money}
   */
  add(other) {
    return new Money(this._fils + other._fils);
  }

  /**
   * Subtract another Money amount
   * @param {Money} other
   * @returns {Money}
   */
  subtract(other) {
    return new Money(this._fils - other._fils);
  }

  /**
   * Multiply by a factor
   * @param {number} factor
   * @returns {Money}
   */
  multiply(factor) {
    return new Money(Math.round(this._fils * factor));
  }

  /**
   * Serialize to JSON (returns integer fils)
   * @returns {number}
   */
  toJSON() {
    return this._fils;
  }
}
