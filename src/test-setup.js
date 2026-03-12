/**
 * Test setup file for Vitest
 * Adds mocks for browser APIs not supported in jsdom
 */

// Mock HTMLDialogElement methods
if (!window.HTMLDialogElement) {
  window.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
    constructor() {
      super();
      this.open = false;
    }

    showModal() {
      this.open = true;
    }

    show() {
      this.open = true;
    }

    close() {
      this.open = false;
    }
  };
}

// Ensure dialog elements have showModal method
Object.defineProperty(window.HTMLDialogElement.prototype, 'showModal', {
  value: function() {
    this.open = true;
  },
  writable: true,
});

Object.defineProperty(window.HTMLDialogElement.prototype, 'close', {
  value: function() {
    this.open = false;
  },
  writable: true,
});
