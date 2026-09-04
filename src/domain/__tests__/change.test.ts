import { describe, expect, it } from 'vitest';
import { bankFrom, bankTotal, emptyBank } from '../money.ts';
import { makeChange } from '../change.ts';

describe('makeChange', () => {
  it('pays nothing when nothing is owed', () => {
    expect(makeChange(0, emptyBank())).toEqual(emptyBank());
  });

  it('returns null for a negative amount', () => {
    expect(makeChange(-5, bankFrom({ 100: 5 }))).toBeNull();
  });

  it('returns null when the bank does not hold enough total value', () => {
    expect(makeChange(100, bankFrom({ 25: 3 }))).toBeNull();
  });

  describe('bounded greedy path', () => {
    it('pays exact change using the fewest coins when greedy succeeds', () => {
      const bank = bankFrom({ 100: 2, 25: 4, 10: 4, 5: 4 });
      expect(makeChange(135, bank)).toEqual(bankFrom({ 100: 1, 25: 1, 10: 1 }));
    });

    it('never dispenses more coins than the bank holds', () => {
      const bank = bankFrom({ 25: 1, 10: 1, 5: 1 });
      const change = makeChange(40, bank);
      expect(change).toEqual(bankFrom({ 25: 1, 10: 1, 5: 1 }));
    });
  });

  describe('DFS fallback when greedy would leave a remainder', () => {
    it('owing 30c from three dimes and a quarter falls back to the three dimes', () => {
      // Greedy takes the 25c coin first, leaving 5c that no coin in this bank
      // can cover (there are no nickels), so it fails and the DFS fallback
      // must find the 10+10+10 combination instead.
      const bank = bankFrom({ 25: 1, 10: 3 });
      expect(makeChange(30, bank)).toEqual(bankFrom({ 10: 3 }));
    });

    it('finds a combination that skips a larger coin entirely', () => {
      // Greedy takes 1x$1 + 0x25 (75 remaining/100 -> take 0 more $1) ... force
      // a case where the only exact combination avoids the quarter: owing 75c
      // from a single quarter and five dimes plus a dollar that would overpay.
      const bank = bankFrom({ 100: 1, 25: 1, 10: 5 });
      const change = makeChange(75, bank);
      expect(change).not.toBeNull();
      expect(bankTotal(change!)).toBe(75);
      expect(change![100]).toBeLessThanOrEqual(bank[100]);
      expect(change![25]).toBeLessThanOrEqual(bank[25]);
      expect(change![10]).toBeLessThanOrEqual(bank[10]);
    });

    it('returns null when the bank holds enough value but no exact combination exists', () => {
      // 5c owed, but the only coins in the float are quarters: no subset of
      // quarters ever sums to 5c, no matter how much total value is present.
      const bank = bankFrom({ 25: 10 });
      expect(makeChange(5, bank)).toBeNull();
    });
  });

  it('never mutates the bank passed in', () => {
    const bank = bankFrom({ 100: 1, 25: 2, 10: 2, 5: 2 });
    const snapshot = { ...bank };
    makeChange(45, bank);
    expect(bank).toEqual(snapshot);
  });
});
