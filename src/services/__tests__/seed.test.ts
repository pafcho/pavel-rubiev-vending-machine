import { describe, expect, it } from 'vitest';
import { isValidPriceCents } from '../../domain/money.ts';
import { MAX_STOCK_PER_PRODUCT } from '../../domain/types.ts';
import { SEED_DATA } from '../seed.ts';

describe('seed data invariants', () => {
  it('gives every product type a distinct price', () => {
    const prices = SEED_DATA.products.map((product) => product.priceCents);
    expect(new Set(prices).size).toBe(prices.length);
  });

  it('prices every product in whole multiples of the smallest coin', () => {
    for (const product of SEED_DATA.products) {
      expect(isValidPriceCents(product.priceCents)).toBe(true);
    }
  });

  it('keeps stock within the 15-unit-per-type inventory cap', () => {
    for (const product of SEED_DATA.products) {
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.stock).toBeLessThanOrEqual(MAX_STOCK_PER_PRODUCT);
    }
  });

  it('gives every product a unique id', () => {
    const ids = SEED_DATA.products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
