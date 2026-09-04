import type { CoinBank } from './money.ts';

/**
 * Inventory cap per product type, from the requirements:
 * "Inventory size - up to 15 products of the same type".
 */
export const MAX_STOCK_PER_PRODUCT = 15;

/** A product slot in the machine. */
export interface Product {
  /** Stable identifier; generated locally for products created via the admin view. */
  id: string;
  name: string;
  /** Price in cents. Unique across products, and a multiple of the smallest coin. */
  priceCents: number;
  /** Units currently loaded, `0` to {@link MAX_STOCK_PER_PRODUCT}. */
  stock: number;
  /** Lightweight visual identity, so no image assets are required. */
  emoji: string;
}

/** Shape returned by the mocked external products service. */
export interface MachineSeedData {
  products: Product[];
  /** The machine's starting coin float, used to pay out change. */
  bank: CoinBank;
}
