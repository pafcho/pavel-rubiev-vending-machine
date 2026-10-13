import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DENOMINATIONS, bankTotal } from '../../domain/money.ts';
import { SEED_DATA } from '../../services/seed.ts';
import { API_LATENCY_MS, ProductsApiService } from './products-api.service.ts';
import { SIMULATE_API_FAILURE } from './simulate-api-failure.token.ts';

/** Subscribes, advances the fake clock past the latency, and returns what arrived. */
function settle<T>(stream: Observable<T>) {
  const result: { value?: T; error?: Error; completed: boolean } = { completed: false };
  stream.subscribe({
    next: (value) => (result.value = value),
    error: (error: Error) => (result.error = error),
    complete: () => (result.completed = true),
  });
  return {
    result,
    elapse: (ms: number) => vi.advanceTimersByTime(ms),
  };
}

describe('ProductsApiService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('when healthy', () => {
    let api: ProductsApiService;

    beforeEach(() => {
      api = TestBed.inject(ProductsApiService);
    });

    it('is cold and emits the product list only after the latency', () => {
      const { result, elapse } = settle(api.getProducts());

      elapse(API_LATENCY_MS - 1);
      expect(result.value).toBeUndefined();

      elapse(1);
      expect(result.value).toHaveLength(SEED_DATA.products.length);
      expect(result.value?.[0]?.name).toBe(SEED_DATA.products[0]?.name);
      expect(result.completed).toBe(true);
    });

    it('emits the machine coin float after the latency', () => {
      const { result, elapse } = settle(api.getMachineBank());

      elapse(API_LATENCY_MS);
      expect(bankTotal(result.value!)).toBe(bankTotal(SEED_DATA.bank));
      for (const coin of DENOMINATIONS) {
        expect(result.value![coin]).toBeGreaterThanOrEqual(0);
      }
    });

    it('hands back fresh copies on every subscription', () => {
      const products$ = api.getProducts();
      const first = settle(products$);
      first.elapse(API_LATENCY_MS);
      first.result.value![0]!.name = 'Tampered';
      first.result.value![0]!.stock = 999;

      const second = settle(products$);
      second.elapse(API_LATENCY_MS);
      expect(second.result.value?.[0]?.name).toBe(SEED_DATA.products[0]?.name);
      expect(second.result.value?.[0]?.stock).toBe(SEED_DATA.products[0]?.stock);

      const bank = settle(api.getMachineBank());
      bank.elapse(API_LATENCY_MS);
      bank.result.value![25] = 999;
      const bankAgain = settle(api.getMachineBank());
      bankAgain.elapse(API_LATENCY_MS);
      expect(bankAgain.result.value![25]).toBe(SEED_DATA.bank[25]);
    });
  });

  describe('when failure is simulated', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SIMULATE_API_FAILURE, useValue: true }],
      });
    });

    it('errors only after the latency, on both endpoints', () => {
      const api = TestBed.inject(ProductsApiService);

      const products = settle(api.getProducts());
      const bank = settle(api.getMachineBank());

      products.elapse(API_LATENCY_MS - 1);
      expect(products.result.error).toBeUndefined();

      products.elapse(1);
      expect(products.result.error?.message).toContain('/api/products');
      expect(bank.result.error?.message).toContain('/api/machine/bank');
      expect(products.result.value).toBeUndefined();
    });
  });
});
