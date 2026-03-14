/**
 * Tests for ContributorCard component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContributorCard } from './ContributorCard.js';

describe('ContributorCard', () => {
  let mockContributor;
  let onUpdate;
  let onDeleteRequest;
  let onEditStart;
  let onEditEnd;
  let card;

  beforeEach(() => {
    mockContributor = {
      id: 'test-id-123',
      name: 'John Doe',
      date: '2024-03-15',
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

    onUpdate = vi.fn();
    onDeleteRequest = vi.fn();
    onEditStart = vi.fn();
    onEditEnd = vi.fn();

    card = new ContributorCard(mockContributor, {
      onUpdate,
      onDeleteRequest,
      onEditStart,
      onEditEnd,
    });

    document.body.appendChild(card.render());
  });

  afterEach(() => {
    card.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('render', () => {
    it('should render contributor name', () => {
      const nameEl = document.querySelector('[data-field="name"]');
      expect(nameEl.textContent).toBe('John Doe');
    });

    it('should render contributor date', () => {
      const dateEl = document.querySelector('.contributor-date');
      expect(dateEl.textContent).toBe(new Date('2024-03-15').toLocaleDateString());
    });

    it('should render formatted amount', () => {
      const amountEl = document.querySelector('[data-field="amount"]');
      expect(amountEl.textContent).toContain('500');
    });

    it('should render denomination breakdown', () => {
      const breakdownEl = document.querySelector('[data-field="breakdown"]');
      expect(breakdownEl.textContent).toContain('100 AED x 5');
    });

    it('should have menu button', () => {
      const menuBtn = document.querySelector('.menu-button');
      expect(menuBtn).not.toBeNull();
    });

    it('should set contributor ID as data attribute', () => {
      const cardEl = document.querySelector('.contributor-card');
      expect(cardEl.dataset.contributorId).toBe('test-id-123');
    });
  });

  describe('inline editing', () => {
    it('should enter edit mode when name is clicked', () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      expect(input).not.toBeNull();
      expect(input.value).toBe('John Doe');
    });

    it('should enter edit mode when amount is clicked', () => {
      const amountEl = document.querySelector('[data-field="amount"]');
      amountEl.click();

      const input = document.querySelector('.inline-edit-input');
      expect(input).not.toBeNull();
      expect(input.value).toBe('500');
    });

    it('should call onEditStart when entering edit mode', () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      expect(onEditStart).toHaveBeenCalledWith('test-id-123');
    });

    it('should save on blur with valid input', async () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';
      input.blur();

      // Wait for blur delay (150ms) + save
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(onUpdate).toHaveBeenCalledWith('test-id-123', { name: 'Jane Doe' });
    });

    it('should show error and stay in edit mode with invalid input', async () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = ''; // Invalid - empty name
      input.blur();

      // Wait for blur delay (150ms) + error display
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(onUpdate).not.toHaveBeenCalled();
      const errorEl = document.querySelector('.inline-error');
      expect(errorEl).not.toBeNull();
    });

    it('should save on Enter key', async () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);

      // Wait for blur delay (150ms) + save
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(onUpdate).toHaveBeenCalledWith('test-id-123', { name: 'Jane Doe' });
    });

    it('should cancel on Escape key', () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(event);

      expect(onUpdate).not.toHaveBeenCalled();
      const nameDisplay = document.querySelector('[data-field="name"]');
      expect(nameDisplay.textContent).toBe('John Doe');
    });

    it('should prevent multiple simultaneous edits', () => {
      const nameEl = document.querySelector('[data-field="name"]');
      const amountEl = document.querySelector('[data-field="amount"]');

      nameEl.click();
      amountEl.click(); // Should be ignored while editing

      const inputs = document.querySelectorAll('.inline-edit-input');
      expect(inputs).toHaveLength(1);
    });
  });

  describe('menu', () => {
    it('should open menu when menu button is clicked', () => {
      const menuBtn = document.querySelector('.menu-button');
      menuBtn.click();

      const menu = document.querySelector('.action-menu');
      expect(menu.hidden).toBe(false);
    });

    it('should have Edit and Delete options', () => {
      const menuBtn = document.querySelector('.menu-button');
      menuBtn.click();

      const editBtn = document.querySelector('[data-action="edit"]');
      const deleteBtn = document.querySelector('[data-action="delete"]');

      expect(editBtn).not.toBeNull();
      expect(deleteBtn).not.toBeNull();
      expect(editBtn.textContent).toBe('Edit');
      expect(deleteBtn.textContent).toBe('Delete');
    });

    it('should call onDeleteRequest when Delete is clicked', () => {
      const menuBtn = document.querySelector('.menu-button');
      menuBtn.click();

      const deleteBtn = document.querySelector('[data-action="delete"]');
      deleteBtn.click();

      expect(onDeleteRequest).toHaveBeenCalledWith(mockContributor);
    });

    it('should enter edit mode when Edit is clicked', () => {
      const menuBtn = document.querySelector('.menu-button');
      menuBtn.click();

      const editBtn = document.querySelector('[data-action="edit"]');
      editBtn.click();

      const input = document.querySelector('.inline-edit-input');
      expect(input).not.toBeNull();
    });
  });

  describe('status feedback', () => {
    it('should show Updated badge after successful save', async () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';
      input.blur();

      // Wait for blur delay (150ms) + status display
      await new Promise(resolve => setTimeout(resolve, 200));

      const badge = document.querySelector('.status-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('Updated');
    });

    it('should auto-remove status badge after 2 seconds', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';
      input.blur();

      // Wait for blur delay (150ms) + status display
      await vi.advanceTimersByTimeAsync(200);

      // Badge should exist
      let badge = document.querySelector('.status-badge');
      expect(badge).not.toBeNull();

      // Advance time by 2 seconds for auto-remove
      await vi.advanceTimersByTimeAsync(2000);

      // Badge should be removed
      badge = document.querySelector('.status-badge');
      expect(badge).toBeNull();

      vi.useRealTimers();
    });

    it('should have role="status" for accessibility', async () => {
      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';
      input.blur();

      // Wait for blur delay (150ms) + status display
      await new Promise(resolve => setTimeout(resolve, 200));

      const badge = document.querySelector('.status-badge');
      expect(badge).not.toBeNull();
      expect(badge.getAttribute('role')).toBe('status');
    });
  });

  describe('dimming', () => {
    it('should apply dimmed class when isDimmed option is true', () => {
      card.destroy();
      document.body.innerHTML = '';

      const dimmedCard = new ContributorCard(mockContributor, {
        onUpdate,
        isDimmed: true,
      });
      document.body.appendChild(dimmedCard.render());

      const cardEl = document.querySelector('.contributor-card');
      expect(cardEl.classList.contains('dimmed')).toBe(true);

      dimmedCard.destroy();
    });

    it('should update dimmed state via setDimmed', () => {
      const cardEl = document.querySelector('.contributor-card');
      expect(cardEl.classList.contains('dimmed')).toBe(false);

      card.setDimmed(true);
      expect(cardEl.classList.contains('dimmed')).toBe(true);

      card.setDimmed(false);
      expect(cardEl.classList.contains('dimmed')).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should return element via getElement', () => {
      const el = card.getElement();
      expect(el).not.toBeNull();
      expect(el.classList.contains('contributor-card')).toBe(true);
    });

    it('should return contributor ID via getId', () => {
      expect(card.getId()).toBe('test-id-123');
    });
  });

  describe('destroy', () => {
    it('should clean up status timeout', () => {
      vi.useFakeTimers();

      const nameEl = document.querySelector('[data-field="name"]');
      nameEl.click();

      const input = document.querySelector('.inline-edit-input');
      input.value = 'Jane Doe';
      input.blur();

      card.destroy();

      // Should not throw when timer fires
      vi.advanceTimersByTime(2000);
      expect(true).toBe(true); // If we get here, no error was thrown
    });
  });

  describe('received toggle', () => {
    it('should show received checkbox when contributor has received field', () => {
      // Re-create card with received field
      card.destroy();
      document.body.innerHTML = '';

      const contributorWithReceived = {
        ...mockContributor,
        received: false,
      };

      card = new ContributorCard(contributorWithReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
    });

    it('should have checkbox checked when received is true', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorReceived = {
        ...mockContributor,
        received: true,
      };

      card = new ContributorCard(contributorReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(true);
    });

    it('should have checkbox unchecked when received is false', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorNotReceived = {
        ...mockContributor,
        received: false,
      };

      card = new ContributorCard(contributorNotReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(false);
    });

    it('should have checkbox unchecked when received is undefined', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorNoReceived = {
        ...mockContributor,
        // received field not defined
      };

      card = new ContributorCard(contributorNoReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(false);
    });

    it('should call onUpdate with received value when checkbox clicked', async () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorNotReceived = {
        ...mockContributor,
        received: false,
      };

      card = new ContributorCard(contributorNotReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();

      // Simulate checking the checkbox
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onUpdate).toHaveBeenCalledWith('test-id-123', { received: true });
    });

    it('should call onUpdate with received false when checkbox unchecked', async () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorReceived = {
        ...mockContributor,
        received: true,
      };

      card = new ContributorCard(contributorReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();

      // Simulate unchecking the checkbox
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onUpdate).toHaveBeenCalledWith('test-id-123', { received: false });
    });

    it('should have received class on card when contributor.received is true', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorReceived = {
        ...mockContributor,
        received: true,
      };

      card = new ContributorCard(contributorReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const cardEl = document.querySelector('.contributor-card');
      expect(cardEl.classList.contains('received')).toBe(true);
    });

    it('should not have received class when contributor.received is false', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorNotReceived = {
        ...mockContributor,
        received: false,
      };

      card = new ContributorCard(contributorNotReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const cardEl = document.querySelector('.contributor-card');
      expect(cardEl.classList.contains('received')).toBe(false);
    });

    it('should have aria-label on received checkbox for accessibility', () => {
      card.destroy();
      document.body.innerHTML = '';

      const contributorWithReceived = {
        ...mockContributor,
        received: false,
      };

      card = new ContributorCard(contributorWithReceived, {
        onUpdate,
        onDeleteRequest,
      });
      document.body.appendChild(card.render());

      const checkbox = document.querySelector('[data-field="received"] input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(checkbox.getAttribute('aria-label')).toMatch(/received|mark as received/i);
    });
  });
});
