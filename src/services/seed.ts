import { bankFrom } from '../domain/money.ts';
import type { MachineSeedData } from '../domain/types.ts';

/**
 * The data the mocked external service "owns".
 *
 * This module stands in for a remote database. It is read once, at startup,
 * through {@link ../services/productsApi.ts}; every later create/update/delete
 * happens in application state only and is deliberately never written back
 * here. Reloading the page therefore restores this baseline.
 *
 * Invariants intentionally encoded in this data (and enforced by the admin
 * form for anything added later):
 *  - every `priceCents` is unique across product types
 *  - every `priceCents` is a multiple of 5c, so exact change is always possible
 *  - every `stock` is within 0..15 units
 */
export const SEED_DATA: MachineSeedData = {
  products: [
    { id: 'p-gum', name: 'Chewing Gum', priceCents: 55, stock: 15, emoji: '🍬' },
    { id: 'p-chips', name: 'Potato Chips', priceCents: 95, stock: 12, emoji: '🥔' },
    { id: 'p-water', name: 'Sparkling Water', priceCents: 110, stock: 15, emoji: '💧' },
    { id: 'p-cola', name: 'Cola', priceCents: 125, stock: 9, emoji: '🥤' },
    { id: 'p-chocolate', name: 'Chocolate Bar', priceCents: 145, stock: 6, emoji: '🍫' },
    { id: 'p-trailmix', name: 'Trail Mix', priceCents: 165, stock: 3, emoji: '🥜' },
    { id: 'p-juice', name: 'Orange Juice', priceCents: 175, stock: 11, emoji: '🧃' },
    { id: 'p-espresso', name: 'Espresso Shot', priceCents: 200, stock: 1, emoji: '☕' },
    { id: 'p-energy', name: 'Energy Drink', priceCents: 250, stock: 8, emoji: '⚡' },
    { id: 'p-icecream', name: 'Ice Cream Sandwich', priceCents: 275, stock: 0, emoji: '🍨' },
  ],

  /**
   * The machine's starting coin float: $7.60 made of 4 dollars, 10 quarters,
   * 8 dimes and 6 nickels. Deliberately nickel-light — a finite float is what
   * makes the "cannot dispense exact change" path reachable and worth handling.
   */
  bank: bankFrom({ 100: 4, 25: 10, 10: 8, 5: 6 }),
};
