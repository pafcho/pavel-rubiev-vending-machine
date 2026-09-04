import type { CoinBank } from './money.ts';
import {
  DENOMINATIONS,
  PRICE_INCREMENT_CENTS,
  bankTotal,
  cloneBank,
  emptyBank,
} from './money.ts';

/**
 * Change-making against a *finite* coin float.
 *
 * The machine can only pay change out of the coins it actually holds, which is
 * what makes this more interesting than textbook change-making:
 *
 *  - With an unlimited supply, greedy is provably optimal for the US set
 *    {5, 10, 25, 100} — it is a canonical system — so greedy is the fast path.
 *  - With a *bounded* supply greedy can fail even though a solution exists.
 *    Owing 30c from a float of {25:1, 10:3, 5:0}: greedy takes the quarter and
 *    then cannot cover the last 5c, while 10+10+10 pays exactly.
 *
 * So: try greedy first (one pass, fewest coins), and only if it fails fall back
 * to an exhaustive bounded search. If neither can pay the amount exactly, the
 * caller must refuse the sale rather than short-change the customer.
 */

/**
 * Greedy pass: walk the denominations high to low, taking as many of each coin
 * as both the remaining amount and the float allow.
 *
 * Returns `null` if a remainder is left over, which — given a bounded float —
 * does not prove the amount is unpayable, only that greedy could not pay it.
 */
function greedyChange(amountCents: number, available: CoinBank): CoinBank | null {
  const payout = emptyBank();
  let remaining = amountCents;

  for (const coin of DENOMINATIONS) {
    const take = Math.min(Math.floor(remaining / coin), available[coin]);
    payout[coin] = take;
    remaining -= take * coin;
  }

  return remaining === 0 ? payout : null;
}

/**
 * Exhaustive fallback: depth-first search over the denominations, memoised on
 * `(remaining, coinIndex)`.
 *
 * Memoising on that pair is sound because the coins available at index `i` are
 * fixed by the float and never depend on how many higher coins were taken along
 * the current path — so a `(remaining, index)` pair that failed once can never
 * succeed later. Only failures need caching; a success returns immediately.
 *
 * Counts are tried high to low so the first solution found leans towards fewer
 * coins, which also conserves the small change the machine will need later.
 *
 * The search space is tiny (four denominations, bounded counts), so this is
 * effectively instant — no need for a smarter algorithm.
 */
function searchChange(amountCents: number, available: CoinBank): CoinBank | null {
  const payout = emptyBank();
  const deadEnds = new Set<string>();

  const search = (remaining: number, index: number): boolean => {
    if (remaining === 0) return true;
    if (index >= DENOMINATIONS.length) return false;

    const key = `${remaining}:${index}`;
    if (deadEnds.has(key)) return false;

    const coin = DENOMINATIONS[index];
    const maxTake = Math.min(Math.floor(remaining / coin), available[coin]);

    for (let take = maxTake; take >= 0; take -= 1) {
      payout[coin] = take;
      if (search(remaining - take * coin, index + 1)) return true;
    }

    payout[coin] = 0;
    deadEnds.add(key);
    return false;
  };

  return search(amountCents, 0) ? cloneBank(payout) : null;
}

/**
 * Works out which coins to pay out for `amountCents` from the coins in
 * `availableBank`.
 *
 * @returns the coins to dispense, or `null` when the amount cannot be paid
 *   exactly from the float. Never mutates `availableBank`, and never returns a
 *   payout exceeding it.
 */
export function makeChange(
  amountCents: number,
  availableBank: CoinBank,
): CoinBank | null {
  // Nothing owed is trivially payable, and is the common case on exact payment.
  if (amountCents === 0) return emptyBank();

  // Defensive guards: a negative, fractional, or sub-nickel amount is a bug
  // upstream, and no combination of the accepted coins could ever pay it.
  if (
    !Number.isInteger(amountCents) ||
    amountCents < 0 ||
    amountCents % PRICE_INCREMENT_CENTS !== 0
  ) {
    return null;
  }

  // Cheap rejection before searching: the float simply does not hold enough.
  if (amountCents > bankTotal(availableBank)) return null;

  return greedyChange(amountCents, availableBank) ?? searchChange(amountCents, availableBank);
}

/** Whether `amountCents` can be paid exactly from the given float. */
export function canMakeChange(
  amountCents: number,
  availableBank: CoinBank,
): boolean {
  return makeChange(amountCents, availableBank) !== null;
}
