import { cloneBank } from '../domain/money.ts';
import type { CoinBank } from '../domain/money.ts';
import type { Product } from '../domain/types.ts';
import { SEED_DATA } from './seed.ts';

/**
 * Mocked external products service.
 *
 * This is the "external resource" from the requirements, implemented as an
 * asynchronous, in-process stand-in for a real HTTP API: it has latency, it can
 * fail, and it hands back deep copies so a caller can never reach in and mutate
 * the source data.
 *
 * It is read-only by design. The requirements ask for product CRUD in
 * application state only, so there are no write endpoints here at all — that
 * makes the boundary impossible to cross by accident.
 */

/** Simulated round-trip time, with jitter so loading states look realistic. */
const LATENCY_MIN_MS = 400;
const LATENCY_MAX_MS = 800;

/**
 * When enabled, both endpoints reject so the error + retry UI can be exercised.
 * Toggle without a code change by running `VITE_SIMULATE_API_FAILURE=true npm run dev`.
 */
export const SIMULATE_FAILURE =
  import.meta.env.VITE_SIMULATE_API_FAILURE === 'true';

function randomLatency(): number {
  return LATENCY_MIN_MS + Math.random() * (LATENCY_MAX_MS - LATENCY_MIN_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Mimics a fetch: waits out the latency, then fails if failure is simulated. */
async function request<T>(endpoint: string, respond: () => T): Promise<T> {
  await delay(randomLatency());

  if (SIMULATE_FAILURE) {
    throw new Error(`Vending service unavailable (GET ${endpoint} failed)`);
  }

  return respond();
}

/**
 * Fetches the initial product list.
 *
 * Returns fresh object copies on every call, so the seed data survives any
 * mutation a caller might perform on the result.
 */
export function fetchProducts(): Promise<Product[]> {
  return request('/api/products', () =>
    SEED_DATA.products.map((product) => ({ ...product })),
  );
}

/** Fetches the machine's starting coin float, used to pay out change. */
export function fetchMachineBank(): Promise<CoinBank> {
  return request('/api/machine/bank', () => cloneBank(SEED_DATA.bank));
}
