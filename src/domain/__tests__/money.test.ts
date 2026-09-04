import { describe, expect, it } from 'vitest';
import {
  DENOMINATIONS,
  addCoin,
  bankFrom,
  bankTotal,
  cloneBank,
  coinCount,
  emptyBank,
  formatUSD,
  isBankEmpty,
  isCoinValue,
  isValidPriceCents,
  mergeBanks,
  subtractBanks,
} from '../money.ts';

describe('accepted denominations', () => {
  it('accepts only $1.00, $0.25, $0.10 and $0.05', () => {
    expect([...DENOMINATIONS]).toEqual([100, 25, 10, 5]);
  });

  it('rejects every other coin or bill', () => {
    for (const rejected of [1, 2, 3, 15, 20, 50, 200, 500, 0, -5, 5.5]) {
      expect(isCoinValue(rejected)).toBe(false);
    }
  });

  it('rejects non-numeric input', () => {
    for (const rejected of ['25', null, undefined, {}, NaN]) {
      expect(isCoinValue(rejected)).toBe(false);
    }
  });

  it('accepts each supported denomination', () => {
    for (const coin of DENOMINATIONS) {
      expect(isCoinValue(coin)).toBe(true);
    }
  });
});

describe('bank arithmetic', () => {
  it('starts empty', () => {
    expect(bankTotal(emptyBank())).toBe(0);
    expect(coinCount(emptyBank())).toBe(0);
    expect(isBankEmpty(emptyBank())).toBe(true);
  });

  it('totals face value and coin count independently', () => {
    const bank = bankFrom({ 100: 2, 25: 3, 10: 1, 5: 4 });
    expect(bankTotal(bank)).toBe(200 + 75 + 10 + 20);
    expect(coinCount(bank)).toBe(10);
  });

  it('defaults omitted denominations to zero', () => {
    expect(bankFrom({ 25: 1 })).toEqual({ 100: 0, 25: 1, 10: 0, 5: 0 });
  });

  it('never mutates its inputs', () => {
    const bank = bankFrom({ 25: 1 });
    const snapshot = cloneBank(bank);

    addCoin(bank, 100);
    mergeBanks(bank, bankFrom({ 5: 2 }));
    subtractBanks(bank, bankFrom({ 25: 1 }));

    expect(bank).toEqual(snapshot);
  });

  it('adds and merges coins', () => {
    expect(addCoin(emptyBank(), 25, 3)[25]).toBe(3);
    expect(mergeBanks(bankFrom({ 100: 1, 5: 1 }), bankFrom({ 100: 2 }))).toEqual(
      bankFrom({ 100: 3, 5: 1 }),
    );
  });

  it('throws rather than letting a denomination go negative', () => {
    expect(() => subtractBanks(bankFrom({ 25: 1 }), bankFrom({ 25: 2 }))).toThrow();
  });
});

describe('formatting and price validation', () => {
  it('formats cents as USD', () => {
    expect(formatUSD(0)).toBe('$0.00');
    expect(formatUSD(5)).toBe('$0.05');
    expect(formatUSD(125)).toBe('$1.25');
    expect(formatUSD(1000)).toBe('$10.00');
  });

  it('requires prices to be payable in the accepted coins', () => {
    expect(isValidPriceCents(55)).toBe(true);
    expect(isValidPriceCents(100)).toBe(true);
    // Not a multiple of the 5c coin, so exact change could be impossible.
    expect(isValidPriceCents(99)).toBe(false);
    expect(isValidPriceCents(0)).toBe(false);
    expect(isValidPriceCents(-5)).toBe(false);
    expect(isValidPriceCents(12.5)).toBe(false);
  });
});
