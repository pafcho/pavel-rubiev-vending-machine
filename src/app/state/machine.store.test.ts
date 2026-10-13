import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialState, machineReducer } from '../../domain/machineReducer.ts';
import type { MachineAction } from '../../domain/machineReducer.ts';
import { SEED_DATA } from '../../services/seed.ts';
import { ProductsApiService } from '../core/products-api.service.ts';
import { MachineStore } from './machine.store.ts';

/** A controllable stand-in for the API, so tests decide when and how loads settle. */
class FakeProductsApi {
  products$: Observable<typeof SEED_DATA.products> = of(SEED_DATA.products);
  bank$: Observable<typeof SEED_DATA.bank> = of(SEED_DATA.bank);
  getProducts = () => this.products$;
  getMachineBank = () => this.bank$;
}

describe('MachineStore', () => {
  let api: FakeProductsApi;
  let store: MachineStore;

  beforeEach(() => {
    api = new FakeProductsApi();
    TestBed.configureTestingModule({
      providers: [MachineStore, { provide: ProductsApiService, useValue: api }],
    });
    store = TestBed.inject(MachineStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('starts from the reducer initial state', () => {
    expect(store.state()).toBe(initialState);
  });

  it('routes every dispatched action through the pure reducer', () => {
    const actions: MachineAction[] = [
      { type: 'LOAD_SUCCESS', products: SEED_DATA.products, bank: SEED_DATA.bank },
      { type: 'INSERT_COIN', coin: 100 },
      { type: 'INSERT_COIN', coin: 25 },
    ];
    let expected = initialState;
    for (const action of actions) {
      store.dispatch(action);
      expected = machineReducer(expected, action);
    }

    expect(store.state()).toEqual(expected);
    expect(store.insertedTotal()).toBe(125);
  });

  it('exposes a deeply readonly signal that cannot be written to', () => {
    // @ts-expect-error - a readonly Signal has no `set`
    expect(store.state.set).toBeUndefined();
    // @ts-expect-error - nested state properties are not assignable
    const mutate = () => (store.state().products[0]!.stock = 0);
    expect(mutate).toBeDefined();
  });

  describe('load()', () => {
    it('loads products and the bank, ending in the ready state', () => {
      store.load();

      const state = store.state();
      expect(state.status).toBe('ready');
      expect(state.products).toHaveLength(SEED_DATA.products.length);
      expect(store.bankTotal()).toBeGreaterThan(0);
    });

    it('is loading while the request is in flight', () => {
      api.products$ = new Subject();
      store.load();

      expect(store.state().status).toBe('loading');
    });

    it('turns an API failure into the error state with its message', () => {
      api.products$ = throwError(() => new Error('boom'));
      store.load();

      expect(store.state().status).toBe('error');
      expect(store.state().error).toBe('boom');
    });

    it('falls back to a generic message for non-Error failures', () => {
      api.products$ = throwError(() => 'nope');
      store.load();

      expect(store.state().error).toBe('Failed to load the vending machine.');
    });

    it('recovers when retried after a failure', () => {
      api.products$ = throwError(() => new Error('boom'));
      store.load();
      expect(store.state().status).toBe('error');

      api.products$ = of(SEED_DATA.products);
      store.load();

      expect(store.state().status).toBe('ready');
      expect(store.state().error).toBeNull();
    });

    it('ignores a stale response when a retry supersedes it', () => {
      const stale = new Subject<typeof SEED_DATA.products>();
      api.products$ = stale;
      store.load();

      api.products$ = of(SEED_DATA.products.slice(0, 1));
      store.load();
      stale.next(SEED_DATA.products);
      stale.complete();

      expect(store.state().products).toHaveLength(1);
    });
  });
});
