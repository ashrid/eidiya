/**
 * DeleteConfirmation - Modal dialog for delete confirmation
 * Uses native <dialog> element for accessibility and focus management
 */

import { formatAED } from '@modules/money/formatters.js';

export class DeleteConfirmation {
  /**
   * @param {Function} onConfirm - Callback(id) => void when delete is confirmed
   * @param {Function} onCancel - Callback() => void when delete is cancelled
   */
  constructor(onConfirm, onCancel) {
    this._onConfirm = onConfirm;
    this._onCancel = onCancel;
    this._dialog = null;
  }

  /**
   * Show the confirmation dialog for a contributor
   * @param {Object} contributor - Contributor data to display
   */
  show(contributor) {
    this._dialog = document.createElement('dialog');
    this._dialog.className = 'delete-confirmation';
    this._dialog.setAttribute('aria-labelledby', 'delete-title');

    // Build confirmation content
    const notes = this._formatNotes(contributor.breakdown);
    const amount = formatAED(contributor.amountInFils);

    this._dialog.innerHTML = `
      <article>
        <header>
          <h3 id="delete-title">Delete Contributor?</h3>
        </header>
        <p>Delete <strong>${this._escapeHtml(contributor.name)}</strong> with ${amount}?</p>
        <p><small>${notes}</small></p>
        <footer>
          <button type="button" class="secondary" data-action="cancel">Cancel</button>
          <button type="button" class="contrast" data-action="confirm">Delete</button>
        </footer>
      </article>
    `;

    document.body.appendChild(this._dialog);

    // Event listeners
    this._dialog.querySelector('[data-action="cancel"]')
      .addEventListener('click', () => this._cancel());
    this._dialog.querySelector('[data-action="confirm"]')
      .addEventListener('click', () => this._confirm(contributor.id));

    // Close on backdrop click
    this._dialog.addEventListener('click', (e) => {
      if (e.target === this._dialog) this._cancel();
    });

    // Close on Escape key (native dialog behavior, but ensure cancel callback)
    this._dialog.addEventListener('cancel', () => this._onCancel());

    // Use showModal if available (native dialog), otherwise fall back to making it visible
    if (typeof this._dialog.showModal === 'function') {
      this._dialog.showModal();
    } else {
      // Fallback for environments without native dialog support (tests)
      this._dialog.open = true;
      this._dialog.style.display = 'block';
    }
  }

  /**
   * Format denomination breakdown for display
   * @private
   */
  _formatNotes(breakdown) {
    if (!breakdown) return 'No denomination breakdown';

    const notes = [
      { value: 5, count: breakdown.five || 0 },
      { value: 10, count: breakdown.ten || 0 },
      { value: 20, count: breakdown.twenty || 0 },
      { value: 50, count: breakdown.fifty || 0 },
      { value: 100, count: breakdown.hundred || 0 },
      { value: 200, count: breakdown.twoHundred || 0 },
      { value: 500, count: breakdown.fiveHundred || 0 },
      { value: 1000, count: breakdown.thousand || 0 },
    ].filter(n => n.count > 0);

    if (notes.length === 0) return 'No denomination breakdown';

    return notes.map(n => `${n.value} AED x ${n.count}`).join(', ');
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle confirm action
   * @private
   */
  _confirm(id) {
    this._onConfirm(id);
    this._close();
  }

  /**
   * Handle cancel action
   * @private
   */
  _cancel() {
    this._onCancel();
    this._close();
  }

  /**
   * Close and remove the dialog
   * @private
   */
  _close() {
    if (this._dialog) {
      // Use close() if available (native dialog), otherwise just remove
      if (typeof this._dialog.close === 'function') {
        this._dialog.close();
      }
      this._dialog.remove();
      this._dialog = null;
    }
  }

  /**
   * Destroy the dialog and clean up
   */
  destroy() {
    this._close();
  }
}
