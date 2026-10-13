import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { cloneBank } from '../../domain/money.ts';
import type { CoinBank } from '../../domain/money.ts';
import type { Product } from '../../domain/types.ts';
import { SEED_DATA } from '../../services/seed.ts';
import { SIMULATE_API_FAILURE } from './simulate-api-failure.token.ts';

/** Simulated round-trip time of the mocked service. */
export const API_LATENCY_MS = 600;

/**
 * Mocked external products service, exposed as RxJS streams.
 *
 * Each stream is cold: nothing is "requested" until it is subscribed to, the
 * response is built after the latency elapses, and every subscription gets deep
 * copies so a caller can never mutate the seed data.
 *
 * It is read-only by design — product CRUD lives in application state only.
 */
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly simulateFailure = inject(SIMULATE_API_FAILURE);

  /** Fetches the initial product list. */
  getProducts(): Observable<Product[]> {
    return this.request('/api/products', () =>
      SEED_DATA.products.map((product) => ({ ...product })),
    );
  }

  /** Fetches the machine's starting coin float, used to pay out change. */
  getMachineBank(): Observable<CoinBank> {
    return this.request('/api/machine/bank', () => cloneBank(SEED_DATA.bank));
  }

  /**
   * Mimics a fetch: waits out the latency, then either responds or errors.
   * `delay` only postpones emissions, not errors, so the failure is raised in
   * `map` *after* the delay to keep failures as slow as successes.
   */
  private request<T>(endpoint: string, respond: () => T): Observable<T> {
    return of(endpoint).pipe(
      delay(API_LATENCY_MS),
      map(() => {
        if (this.simulateFailure) {
          throw new Error(`Vending service unavailable (GET ${endpoint} failed)`);
        }
        return respond();
      }),
    );
  }
}
