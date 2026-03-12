/**
 * Tests for DeleteConfirmation modal component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeleteConfirmation } from './DeleteConfirmation.js';

// Mock HTMLDialogElement for jsdom - dialog element is not supported in jsdom
beforeAll(() => {
  // Define a mock dialog element
  if (!window.HTMLDialogElement) {
    window.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
      constructor() {
        super();
        this.open = false;
      }
      showModal() { this.open = true; }
      show() { this.open = true; }
      close() { this.open = false; }
    };
  }
});

describe('DeleteConfirmation', () => {
  let onConfirm;
  let onCancel;
  let confirmation;

  beforeEach(() => {
    onConfirm = vi.fn();
    onCancel = vi.fn();
    confirmation = new DeleteConfirmation(onConfirm, onCancel);
  });

  afterEach(() => {
    confirmation.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should store onConfirm and onCancel callbacks', () => {
      expect(confirmation._onConfirm).toBe(onConfirm);
      expect(confirmation._onCancel).toBe(onCancel);
    });
  });

  describe('show', () => {
    const mockContributor = {
      id: 'test-id-123',
      name: 'John Doe',
      amountInFils: 50000, // 500 AED
      breakdown: {
        five: 0,
        ten: 0,
        twenty: 0,
        fifty: 0,
        hundred: 5,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      },
    };

    it('should render dialog with contributor details', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      expect(dialog).not.toBeNull();
      expect(dialog.textContent).toContain('John Doe');
      // formatAED uses non-breaking space, so check for amount without space
      expect(dialog.textContent).toContain('500.00');
    });

    it('should show denomination breakdown', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      expect(dialog.textContent).toContain('100 AED x 5');
    });

    it('should use native dialog element with showModal', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      expect(dialog).not.toBeNull();
      expect(dialog.open).toBe(true);
    });

    it('should have aria-labelledby for accessibility', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      expect(dialog.getAttribute('aria-labelledby')).toBe('delete-title');
    });

    it('should have Cancel and Delete buttons', () => {
      confirmation.show(mockContributor);

      const cancelBtn = document.querySelector('[data-action="cancel"]');
      const confirmBtn = document.querySelector('[data-action="confirm"]');

      expect(cancelBtn).not.toBeNull();
      expect(confirmBtn).not.toBeNull();
      expect(cancelBtn.textContent).toBe('Cancel');
      expect(confirmBtn.textContent).toBe('Delete');
    });

    it('should escape HTML in contributor name', () => {
      const maliciousContributor = {
        ...mockContributor,
        name: '<script>alert("xss")</script>',
      };

      confirmation.show(maliciousContributor);

      const dialog = document.querySelector('dialog');
      expect(dialog.innerHTML).not.toContain('<script>');
      expect(dialog.textContent).toContain('<script>alert("xss")');
    });
  });

  describe('confirm action', () => {
    const mockContributor = {
      id: 'test-id-123',
      name: 'John Doe',
      amountInFils: 50000,
      breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 5, twoHundred: 0, fiveHundred: 0, thousand: 0 },
    };

    it('should call onConfirm with contributor ID when Delete clicked', () => {
      confirmation.show(mockContributor);

      const confirmBtn = document.querySelector('[data-action="confirm"]');
      confirmBtn.click();

      expect(onConfirm).toHaveBeenCalledWith('test-id-123');
    });

    it('should close dialog after confirm', () => {
      confirmation.show(mockContributor);

      const confirmBtn = document.querySelector('[data-action="confirm"]');
      confirmBtn.click();

      const dialog = document.querySelector('dialog');
      expect(dialog).toBeNull();
    });
  });

  describe('cancel action', () => {
    const mockContributor = {
      id: 'test-id-123',
      name: 'John Doe',
      amountInFils: 50000,
      breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 5, twoHundred: 0, fiveHundred: 0, thousand: 0 },
    };

    it('should call onCancel when Cancel clicked', () => {
      confirmation.show(mockContributor);

      const cancelBtn = document.querySelector('[data-action="cancel"]');
      cancelBtn.click();

      expect(onCancel).toHaveBeenCalled();
    });

    it('should close dialog after cancel', () => {
      confirmation.show(mockContributor);

      const cancelBtn = document.querySelector('[data-action="cancel"]');
      cancelBtn.click();

      const dialog = document.querySelector('dialog');
      expect(dialog).toBeNull();
    });

    it('should call onCancel when backdrop clicked', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      dialog.click();

      expect(onCancel).toHaveBeenCalled();
    });

    it('should close dialog on backdrop click', () => {
      confirmation.show(mockContributor);

      const dialog = document.querySelector('dialog');
      dialog.click();

      expect(document.querySelector('dialog')).toBeNull();
    });
  });

  describe('destroy', () => {
    const mockContributor = {
      id: 'test-id-123',
      name: 'John Doe',
      amountInFils: 50000,
      breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 5, twoHundred: 0, fiveHundred: 0, thousand: 0 },
    };

    it('should remove dialog from DOM', () => {
      confirmation.show(mockContributor);
      expect(document.querySelector('dialog')).not.toBeNull();

      confirmation.destroy();

      expect(document.querySelector('dialog')).toBeNull();
    });

    it('should not throw if called without show', () => {
      expect(() => confirmation.destroy()).not.toThrow();
    });
  });

  describe('_formatNotes', () => {
    it('should format notes with count > 0', () => {
      const breakdown = {
        five: 0,
        ten: 1,
        twenty: 0,
        fifty: 2,
        hundred: 0,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      };

      const result = confirmation._formatNotes(breakdown);
      expect(result).toBe('10 AED x 1, 50 AED x 2');
    });

    it('should return message when no notes', () => {
      const breakdown = {
        five: 0,
        ten: 0,
        twenty: 0,
        fifty: 0,
        hundred: 0,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      };

      const result = confirmation._formatNotes(breakdown);
      expect(result).toBe('No denomination breakdown');
    });

    it('should handle null breakdown', () => {
      const result = confirmation._formatNotes(null);
      expect(result).toBe('No denomination breakdown');
    });
  });
});
