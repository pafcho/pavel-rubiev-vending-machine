/**
 * Money primitives for the vending machine.
 *
 * Every monetary value in this application is an integer number of **cents**.
 * Floating-point dollars are never used: `0.1 + 0.2 !== 0.3` would silently
 * corrupt change calculations, which is the one thing a vending machine must
 * always get right.
 */

/**
 * The only coin denominations this machine accepts, in cents.
 *
 * Ordered descending so the greedy change algorithm can iterate directly.
 * $1.00, $0.25, $0.10, $0.05 — anything else is rejected at the coin slot.
 */
export const DENOMINATIONS = [100, 25, 10, 5] as const;

/** A coin value the machine accepts. */
export type CoinValue = (typeof DENOMINATIONS)[number];

/** A tally of coins: how many of each accepted denomination are held. */
export type CoinBank = Record<CoinValue, number>;

/** Short display labels for the coin slot buttons. */
export const COIN_LABELS: Record<CoinValue, string> = {
  100: '$1.00',
  25: '25¢',
  10: '10¢',
  5: '5¢',
};

/** Colloquial coin names, used for accessible labels and the output tray. */
export const COIN_NAMES: Record<CoinValue, string> = {
  100: 'Dollar',
  25: 'Quarter',
  10: 'Dime',
  5: 'Nickel',
};

/**
 * Prices (and therefore all change amounts) must be whole multiples of the
 * smallest coin, or exact change would be impossible.
 */
export const PRICE_INCREMENT_CENTS = 5;

/**
 * Type guard for the coin slot: narrows an arbitrary value to an accepted
 * denomination. This is the single gate that enforces "accepts only the
 * selected denominations", so it is applied in the reducer as well as the UI.
 */
export function isCoinValue(value: unknown): value is CoinValue {
  return (
    typeof value === 'number' &&
    (DENOMINATIONS as readonly number[]).includes(value)
  );
}

/** A bank holding no coins. */
export function emptyBank(): CoinBank {
  return { 100: 0, 25: 0, 10: 0, 5: 0 };
}

/** A defensive copy, so state is never mutated in place. */
export function cloneBank(bank: CoinBank): CoinBank {
  return { 100: bank[100], 25: bank[25], 10: bank[10], 5: bank[5] };
}

/** Total face value of a bank, in cents. */
export function bankTotal(bank: CoinBank): number {
  return DENOMINATIONS.reduce((sum, coin) => sum + coin * bank[coin], 0);
}

/** Total number of physical coins in a bank. */
export function coinCount(bank: CoinBank): number {
  return DENOMINATIONS.reduce((count, coin) => count + bank[coin], 0);
}

/** True when the bank holds no coins at all. */
export function isBankEmpty(bank: CoinBank): boolean {
  return coinCount(bank) === 0;
}

/** Returns a new bank with `count` more coins of the given denomination. */
export function addCoin(bank: CoinBank, coin: CoinValue, count = 1): CoinBank {
  const next = cloneBank(bank);
  next[coin] += count;
  return next;
}

/** Returns a new bank holding the coins of both inputs. */
export function mergeBanks(a: CoinBank, b: CoinBank): CoinBank {
  const next = emptyBank();
  for (const coin of DENOMINATIONS) {
    next[coin] = a[coin] + b[coin];
  }
  return next;
}

/**
 * Returns a new bank with the coins of `subtrahend` removed from `minuend`.
 *
 * Throws if that would drive any denomination negative: a coin bank going
 * negative means a bug in the purchase flow, and failing loudly here is far
 * better than quietly dispensing money the machine does not have.
 */
export function subtractBanks(minuend: CoinBank, subtrahend: CoinBank): CoinBank {
  const next = emptyBank();
  for (const coin of DENOMINATIONS) {
    const remaining = minuend[coin] - subtrahend[coin];
    if (remaining < 0) {
      throw new Error(
        `Cannot remove ${subtrahend[coin]} x ${COIN_LABELS[coin]} from a bank holding ${minuend[coin]}`,
      );
    }
    next[coin] = remaining;
  }
  return next;
}

/** Builds a bank from a partial tally, defaulting missing denominations to 0. */
export function bankFrom(counts: Partial<Record<CoinValue, number>>): CoinBank {
  const next = emptyBank();
  for (const coin of DENOMINATIONS) {
    next[coin] = counts[coin] ?? 0;
  }
  return next;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Formats an integer cent amount as USD for display, e.g. `125` -> `$1.25`. */
export function formatUSD(cents: number): string {
  return usdFormatter.format(cents / 100);
}

/**
 * Validates a candidate product price: positive and payable in the accepted
 * denominations. Enforced by the admin product form.
 */
export function isValidPriceCents(cents: number): boolean {
  return (
    Number.isInteger(cents) && cents > 0 && cents % PRICE_INCREMENT_CENTS === 0
  );
}
