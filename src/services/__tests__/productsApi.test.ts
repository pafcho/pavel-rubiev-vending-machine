import { describe, expect, it } from 'vitest';
import {
  DENOMINATIONS,
  bankTotal,
  isValidPriceCents,
} from '../../domain/money.ts';
import { MAX_STOCK_PER_PRODUCT } from '../../domain/types.ts';
import { fetchMachineBank, fetchProducts } from '../productsApi.ts';
import { SEED_DATA } from '../seed.ts';

describe('mocked products API', () => {
  it('resolves the initial product list asynchronously', async () => {
    const products = await fetchProducts();
    expect(products).toHaveLength(SEED_DATA.products.length);
    expect(products[0]?.name).toBe(SEED_DATA.products[0]?.name);
  });

  it('resolves the machine coin float', async () => {
    const bank = await fetchMachineBank();
    expect(bankTotal(bank)).toBe(bankTotal(SEED_DATA.bank));
    for (const coin of DENOMINATIONS) {
      expect(bank[coin]).toBeGreaterThanOrEqual(0);
    }
  });

  it('hands back copies, so callers cannot mutate the source data', async () => {
    const first = await fetchProducts();
    first[0]!.name = 'Tampered';
    first[0]!.stock = 999;

    const second = await fetchProducts();
    expect(second[0]?.name).toBe(SEED_DATA.products[0]?.name);
    expect(second[0]?.stock).toBe(SEED_DATA.products[0]?.stock);

    const bank = await fetchMachineBank();
    bank[25] = 999;
    expect((await fetchMachineBank())[25]).toBe(SEED_DATA.bank[25]);
  });
});

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
