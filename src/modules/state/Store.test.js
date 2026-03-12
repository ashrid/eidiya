/**
 * Tests for Store - observable state with auto-persistence
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Store } from './Store.js';
import { DEFAULT_STATE } from './schema.js';

// Mock SafeStorage
class MockStorage {
  constructor() {
    this.data = new Map();
    this.quotaError = false;
  }

  setItem(key, value) {
    if (this.quotaError) {
      return { success: false, fallback: true, error: 'quota_exceeded' };
    }
    this.data.set(key, value);
    return { success: true, fallback: false };
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  removeItem(key) {
    this.data.delete(key);
  }

  isUsingFallback() {
    return false;
  }
}

describe('Store', () => {
  let storage;
  let store;

  beforeEach(() => {
    storage = new MockStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create store with initial state', () => {
      store = new Store({ contributors: [] }, storage);
      expect(store.getState()).toEqual({ contributors: [] });
    });

    it('should use DEFAULT_STATE if no initial state provided', () => {
      store = new Store(null, storage);
      const state = store.getState();
      expect(state.version).toBe(DEFAULT_STATE.version);
      expect(state.contributors).toEqual([]);
    });

    it('should work without storage', () => {
      store = new Store({ contributors: [] });
      expect(store.getState()).toEqual({ contributors: [] });
    });
  });

  describe('getState', () => {
    it('should return immutable copy of state', () => {
      store = new Store({ contributors: [{ id: '1', name: 'Test', date: '2024-01-01', amountInFils: 1000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 } }] }, storage);
      const state = store.getState();
      state.contributors.push({ id: '2', name: 'Test2', date: '2024-01-01', amountInFils: 1000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 } });
      expect(store.getState().contributors).toHaveLength(1);
    });

    it('should return current state', () => {
      store = new Store({ version: '1.0.0', contributors: [] }, storage);
      expect(store.getState().version).toBe('1.0.0');
    });
  });

  describe('subscribe', () => {
    it('should add listener and return unsubscribe function', () => {
      store = new Store({ contributors: [] }, storage);
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener on state change', () => {
      store = new Store({ contributors: [], count: 0 }, storage);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
        expect.objectContaining({ count: 0 })
      );
    });

    it('should pass newState and prevState to listener', () => {
      store = new Store({ value: 'initial' }, storage);
      const listener = vi.fn();
      store.subscribe(listener);

      store.setState({ value: 'updated' });
      const [newState, prevState] = listener.mock.calls[0];
      expect(newState.value).toBe('updated');
      expect(prevState.value).toBe('initial');
    });

    it('should support multiple listeners', () => {
      store = new Store({ count: 0 }, storage);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setState({ count: 1 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should stop calling listener after unsubscribe', () => {
      store = new Store({ count: 0 }, storage);
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setState({ count: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe of non-existent listener gracefully', () => {
      store = new Store({ count: 0 }, storage);
      const unsubscribe = store.subscribe(() => {});
      unsubscribe();
      unsubscribe(); // Should not throw
    });
  });

  describe('setState', () => {
    it('should merge partial update with existing state', () => {
      store = new Store({ a: 1, b: 2 }, storage);
      store.setState({ b: 3 });
      expect(store.getState()).toEqual({ a: 1, b: 3 });
    });

    it('should accept function updater', () => {
      store = new Store({ count: 5 }, storage);
      store.setState(prev => ({ count: prev.count + 1 }));
      expect(store.getState().count).toBe(6);
    });

    it('should pass previous state to function updater', () => {
      store = new Store({ value: 'test' }, storage);
      store.setState(prev => ({ value: prev.value + '-updated' }));
      expect(store.getState().value).toBe('test-updated');
    });

    it('should not mutate state directly', () => {
      store = new Store({ items: [1, 2, 3] }, storage);
      const prevState = store.getState();
      store.setState({ items: [...prevState.items, 4] });
      expect(prevState.items).toEqual([1, 2, 3]);
    });

    it('should persist to storage after state change', () => {
      store = new Store({ contributors: [], version: '1.0.0' }, storage);
      store.setState({ contributors: [{ id: '1', name: 'Test' }] });

      const persisted = storage.getItem('eidiya:state');
      expect(persisted).toEqual(
        expect.objectContaining({
          contributors: [{ id: '1', name: 'Test' }],
        })
      );
    });

    it('should not persist if no storage provided', () => {
      store = new Store({ count: 0 });
      store.setState({ count: 1 });
      // Should not throw
      expect(store.getState().count).toBe(1);
    });
  });

  describe('persistence', () => {
    it('should persist to storage key eidiya:state', () => {
      store = new Store({ contributors: [] }, storage);
      store.setState({ version: '1.0.0' });

      expect(storage.data.has('eidiya:state')).toBe(true);
    });

    it('should dispatch quota exceeded event on quota error', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      storage.quotaError = true;

      store = new Store({ contributors: [] }, storage);
      store.setState({ test: 'data' });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'eidiya:quota-exceeded',
        })
      );
    });

    it('should include error detail in quota exceeded event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      storage.quotaError = true;

      store = new Store({ contributors: [] }, storage);
      store.setState({ test: 'data' });

      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ error: 'quota_exceeded' });
    });
  });

  describe('load', () => {
    it('should hydrate state from storage', () => {
      storage.data.set('eidiya:state', {
        version: '1.0.0',
        contributors: [{
          id: 'loaded',
          name: 'Loaded User',
          date: '2024-01-01',
          amountInFils: 1000,
          breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 }
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      store = new Store(DEFAULT_STATE, storage);
      store.load();

      expect(store.getState().contributors).toEqual([
        {
          id: 'loaded',
          name: 'Loaded User',
          date: '2024-01-01',
          amountInFils: 1000,
          received: false,
          breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 }
        },
      ]);
    });

    it('should validate loaded data', () => {
      storage.data.set('eidiya:state', {
        version: '1.0.0',
        contributors: 'invalid', // Should be array
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      store = new Store(DEFAULT_STATE, storage);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store.load();

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(store.getState().contributors).toEqual([]);
    });

    it('should migrate loaded data', () => {
      storage.data.set('eidiya:state', {
        // Missing version, will be migrated
        contributors: [],
      });

      store = new Store(DEFAULT_STATE, storage);
      store.load();

      expect(store.getState().version).toBe(DEFAULT_STATE.version);
    });

    it('should use defaults when storage returns null', () => {
      store = new Store(DEFAULT_STATE, storage);
      store.load();

      expect(store.getState().contributors).toEqual([]);
    });

    it('should not throw if no storage provided', () => {
      store = new Store(DEFAULT_STATE);
      expect(() => store.load()).not.toThrow();
    });

    it('should notify listeners after loading', () => {
      storage.data.set('eidiya:state', {
        version: '1.0.0',
        contributors: [{
          id: '1',
          name: 'Test',
          date: '2024-01-01',
          amountInFils: 1000,
          breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 }
        }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      store = new Store(DEFAULT_STATE, storage);
      const listener = vi.fn();
      store.subscribe(listener);
      store.load();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ contributors: [{
          id: '1',
          name: 'Test',
          date: '2024-01-01',
          amountInFils: 1000,
          received: false,
          breakdown: { five: 0, ten: 0, twenty: 0, fifty: 0, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 1 }
        }] }),
        expect.objectContaining({ contributors: [] })
      );
    });
  });

  describe('integration', () => {
    it('should handle full lifecycle', () => {
      // Create store and load (empty)
      store = new Store(DEFAULT_STATE, storage);
      store.load();
      expect(store.getState().contributors).toEqual([]);

      // Subscribe to changes
      const changes = [];
      store.subscribe((newState, prevState) => {
        changes.push({ new: newState.contributors.length, prev: prevState.contributors.length });
      });

      // Add contributor
      store.setState({
        contributors: [{ id: '1', name: 'Test', amountInFils: 1000 }],
      });

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ new: 1, prev: 0 });

      // Verify persistence
      const persisted = storage.getItem('eidiya:state');
      expect(persisted.contributors).toHaveLength(1);
    });

    it('should maintain state immutability through updates', () => {
      store = new Store(DEFAULT_STATE, storage);
      store.load();

      const state1 = store.getState();
      store.setState({ contributors: [{ id: '1', name: 'Test' }] });
      const state2 = store.getState();

      expect(state1).not.toBe(state2);
      expect(state1.contributors).toEqual([]);
      expect(state2.contributors).toHaveLength(1);
    });
  });

  describe('addContributor', () => {
    beforeEach(() => {
      store = new Store(DEFAULT_STATE, storage);
      // Mock crypto.randomUUID
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValue('test-uuid-123'),
      });
    });

    it('should create contributor with UUID id', () => {
      const contributor = store.addContributor({
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      expect(contributor.id).toBe('test-uuid-123');
    });

    it('should add contributor to state.contributors array', () => {
      store.addContributor({
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      expect(store.getState().contributors).toHaveLength(1);
      expect(store.getState().contributors[0].name).toBe('John Doe');
    });

    it('should preserve existing contributors', () => {
      store.setState({
        contributors: [{ id: 'existing', name: 'Existing', date: '2024-01-01', amountInFils: 5000, breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 } }],
      });

      store.addContributor({
        name: 'New Contributor',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      expect(store.getState().contributors).toHaveLength(2);
      expect(store.getState().contributors[0].name).toBe('Existing');
      expect(store.getState().contributors[1].name).toBe('New Contributor');
    });

    it('should notify subscribers', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.addContributor({
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should persist to storage', () => {
      store.addContributor({
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      const persisted = storage.getItem('eidiya:state');
      expect(persisted.contributors).toHaveLength(1);
      expect(persisted.contributors[0].name).toBe('John Doe');
    });

    it('should trim name and copy breakdown', () => {
      const originalBreakdown = { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 };

      const contributor = store.addContributor({
        name: '  John Doe  ',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: originalBreakdown,
      });

      expect(contributor.name).toBe('John Doe');
      expect(contributor.breakdown).toEqual(originalBreakdown);
      expect(contributor.breakdown).not.toBe(originalBreakdown); // Should be a copy
    });

    it('should return the created contributor object', () => {
      const contributor = store.addContributor({
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });

      expect(contributor).toEqual({
        id: 'test-uuid-123',
        name: 'John Doe',
        date: '2024-03-15',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 },
      });
    });
  });

  describe('updateContributor', () => {
    beforeEach(() => {
      store = new Store(DEFAULT_STATE, storage);
      // Add a contributor to update
      store.setState({
        contributors: [{
          id: 'contrib-1',
          name: 'Original Name',
          date: '2024-01-01',
          amountInFils: 5000,
          breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
        }],
      });
    });

    it('should update existing contributor and return updated object', () => {
      const updated = store.updateContributor('contrib-1', { name: 'Updated Name' });

      expect(updated).not.toBeNull();
      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe('contrib-1');
    });

    it('should return null if contributor not found', () => {
      const updated = store.updateContributor('non-existent', { name: 'New Name' });

      expect(updated).toBeNull();
    });

    it('should preserve ID and unmodified fields', () => {
      const updated = store.updateContributor('contrib-1', { name: 'Updated Name' });

      expect(updated.id).toBe('contrib-1');
      expect(updated.date).toBe('2024-01-01');
      expect(updated.amountInFils).toBe(5000);
      expect(updated.breakdown).toEqual({ five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 });
    });

    it('should trigger setState and notify subscribers', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.updateContributor('contrib-1', { name: 'Updated Name' });

      expect(listener).toHaveBeenCalledTimes(1);
      const [newState, prevState] = listener.mock.calls[0];
      expect(newState.contributors[0].name).toBe('Updated Name');
      expect(prevState.contributors[0].name).toBe('Original Name');
    });

    it('should persist updated state to storage', () => {
      store.updateContributor('contrib-1', { name: 'Updated Name' });

      const persisted = storage.getItem('eidiya:state');
      expect(persisted.contributors[0].name).toBe('Updated Name');
    });

    it('should handle multiple field updates', () => {
      const updated = store.updateContributor('contrib-1', {
        name: 'New Name',
        amountInFils: 10000,
        breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
      });

      expect(updated.name).toBe('New Name');
      expect(updated.amountInFils).toBe(10000);
      expect(updated.breakdown.fifty).toBe(2);
    });
  });

  describe('deleteContributor', () => {
    beforeEach(() => {
      store = new Store(DEFAULT_STATE, storage);
      // Add contributors to delete
      store.setState({
        contributors: [
          {
            id: 'contrib-1',
            name: 'First Contributor',
            date: '2024-01-01',
            amountInFils: 5000,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          },
          {
            id: 'contrib-2',
            name: 'Second Contributor',
            date: '2024-01-02',
            amountInFils: 10000,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
      });
    });

    it('should remove contributor and return true', () => {
      const result = store.deleteContributor('contrib-1');

      expect(result).toBe(true);
      expect(store.getState().contributors).toHaveLength(1);
    });

    it('should return false if contributor not found', () => {
      const result = store.deleteContributor('non-existent');

      expect(result).toBe(false);
      expect(store.getState().contributors).toHaveLength(2);
    });

    it('should trigger setState and notify subscribers', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.deleteContributor('contrib-1');

      expect(listener).toHaveBeenCalledTimes(1);
      const [newState, prevState] = listener.mock.calls[0];
      expect(newState.contributors).toHaveLength(1);
      expect(prevState.contributors).toHaveLength(2);
    });

    it('should persist updated state to storage', () => {
      store.deleteContributor('contrib-1');

      const persisted = storage.getItem('eidiya:state');
      expect(persisted.contributors).toHaveLength(1);
      expect(persisted.contributors[0].id).toBe('contrib-2');
    });

    it('should preserve other contributors', () => {
      store.deleteContributor('contrib-1');

      const contributors = store.getState().contributors;
      expect(contributors).toHaveLength(1);
      expect(contributors[0].id).toBe('contrib-2');
      expect(contributors[0].name).toBe('Second Contributor');
    });
  });

  describe('toggleReceived', () => {
    beforeEach(() => {
      store = new Store(DEFAULT_STATE, storage);
      // Add contributors to toggle
      store.setState({
        contributors: [
          {
            id: 'contrib-1',
            name: 'First Contributor',
            date: '2024-01-01',
            amountInFils: 5000,
            received: false,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          },
          {
            id: 'contrib-2',
            name: 'Second Contributor',
            date: '2024-01-02',
            amountInFils: 10000,
            received: true,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 2, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          },
          {
            id: 'contrib-3',
            name: 'Third Contributor',
            date: '2024-01-03',
            amountInFils: 15000,
            breakdown: { five: 0, ten: 0, twenty: 0, fifty: 3, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 }
          }
        ],
      });
    });

    it('should toggle received from false to true', () => {
      const updated = store.toggleReceived('contrib-1');

      expect(updated.received).toBe(true);
      expect(store.getState().contributors[0].received).toBe(true);
    });

    it('should toggle received from true to false', () => {
      const updated = store.toggleReceived('contrib-2');

      expect(updated.received).toBe(false);
      expect(store.getState().contributors[1].received).toBe(false);
    });

    it('should toggle undefined received to true', () => {
      const updated = store.toggleReceived('contrib-3');

      expect(updated.received).toBe(true);
      expect(store.getState().contributors[2].received).toBe(true);
    });

    it('should return null if contributor not found', () => {
      const updated = store.toggleReceived('non-existent');

      expect(updated).toBeNull();
    });

    it('should trigger setState and notify subscribers', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.toggleReceived('contrib-1');

      expect(listener).toHaveBeenCalledTimes(1);
      const [newState, prevState] = listener.mock.calls[0];
      expect(newState.contributors[0].received).toBe(true);
      expect(prevState.contributors[0].received).toBe(false);
    });

    it('should persist updated state to storage', () => {
      store.toggleReceived('contrib-1');

      const persisted = storage.getItem('eidiya:state');
      expect(persisted.contributors[0].received).toBe(true);
    });

    it('should preserve other contributor fields', () => {
      const updated = store.toggleReceived('contrib-1');

      expect(updated.name).toBe('First Contributor');
      expect(updated.date).toBe('2024-01-01');
      expect(updated.amountInFils).toBe(5000);
      expect(updated.breakdown).toEqual({ five: 0, ten: 0, twenty: 0, fifty: 1, hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0 });
    });

    it('should preserve other contributors when toggling', () => {
      store.toggleReceived('contrib-1');

      const contributors = store.getState().contributors;
      expect(contributors[1].received).toBe(true); // contrib-2 unchanged
      expect(contributors[2].received).toBeUndefined(); // contrib-3 unchanged
    });
  });
});
