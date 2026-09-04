import { describe, expect, it } from 'vitest';
import type { CoinValue } from '../money.ts';
import { bankFrom, bankTotal, emptyBank } from '../money.ts';
import type { Product } from '../types.ts';
import {
  initialState,
  machineReducer,
  selectTotalMoneyHeld,
} from '../machineReducer.ts';
import type { MachineState, ProductDraft } from '../machineReducer.ts';

const gum: Product = { id: 'p-gum', name: 'Chewing Gum', priceCents: 55, stock: 3, emoji: '🍬' };
const cola: Product = { id: 'p-cola', name: 'Cola', priceCents: 125, stock: 1, emoji: '🥤' };

/** A loaded, ready machine with a small, deliberately tight coin float. */
function readyState(overrides: Partial<MachineState> = {}): MachineState {
  return machineReducer(initialState, {
    type: 'LOAD_SUCCESS',
    products: [gum, cola],
    bank: bankFrom({ 100: 1, 25: 1, 10: 3, 5: 2 }),
    ...overrides,
  });
}

describe('loading', () => {
  it('LOAD_START marks the machine as loading and clears prior errors', () => {
    const loaded = readyState();
    const reloading = machineReducer(loaded, { type: 'LOAD_START' });
    expect(reloading.status).toBe('loading');
    expect(reloading.error).toBeNull();
  });

  it('LOAD_SUCCESS stores products and bank, sorted by price, and resets escrow/tray', () => {
    const state = readyState();
    expect(state.status).toBe('ready');
    expect(state.products.map((p) => p.id)).toEqual(['p-gum', 'p-cola']);
    expect(bankTotal(state.bank)).toBe(bankTotal(bankFrom({ 100: 1, 25: 1, 10: 3, 5: 2 })));
    expect(bankTotal(state.inserted)).toBe(0);
  });

  it('LOAD_FAILURE records the error and leaves status as error', () => {
    const state = machineReducer(initialState, {
      type: 'LOAD_FAILURE',
      error: 'network down',
    });
    expect(state.status).toBe('error');
    expect(state.error).toBe('network down');
  });
});

describe('INSERT_COIN', () => {
  it('adds an accepted coin to escrow and increases total money held', () => {
    const before = readyState();
    const totalBefore = selectTotalMoneyHeld(before);

    const after = machineReducer(before, { type: 'INSERT_COIN', coin: 25 });

    expect(after.inserted[25]).toBe(1);
    expect(selectTotalMoneyHeld(after)).toBe(totalBefore + 25);
  });

  it('rejects a denomination the machine does not accept, without changing any money', () => {
    const before = readyState();
    const totalBefore = selectTotalMoneyHeld(before);

    // Cast past the type system the way a corrupted caller might.
    const after = machineReducer(before, { type: 'INSERT_COIN', coin: 1 as CoinValue });

    expect(selectTotalMoneyHeld(after)).toBe(totalBefore);
    expect(after.message?.kind).toBe('error');
  });
});

describe('BUY', () => {
  it('rejects the purchase atomically when inserted funds are insufficient', () => {
    const before = machineReducer(readyState(), { type: 'INSERT_COIN', coin: 25 });
    const totalBefore = selectTotalMoneyHeld(before);

    const after = machineReducer(before, { type: 'BUY', productId: gum.id });

    expect(after.message?.kind).toBe('error');
    expect(after.inserted).toEqual(before.inserted);
    expect(after.bank).toEqual(before.bank);
    expect(after.products.find((p) => p.id === gum.id)?.stock).toBe(gum.stock);
    expect(selectTotalMoneyHeld(after)).toBe(totalBefore);
  });

  it('rejects the purchase atomically when a sold-out product is requested', () => {
    const soldOut: Product = { ...gum, stock: 0 };
    const before = machineReducer(
      readyState({ products: [soldOut, cola] }),
      { type: 'INSERT_COIN', coin: 100 },
    );
    const totalBefore = selectTotalMoneyHeld(before);

    const after = machineReducer(before, { type: 'BUY', productId: soldOut.id });

    expect(after.message?.kind).toBe('error');
    expect(after.inserted).toEqual(before.inserted);
    expect(selectTotalMoneyHeld(after)).toBe(totalBefore);
  });

  it('rejects the purchase atomically when exact change cannot be dispensed', () => {
    // Bank + escrow can only ever produce multiples of 25c (no dimes/nickels),
    // so 20c change for a 5c overpayment on a 55c item is not payable.
    const tightBank = bankFrom({ 100: 1, 25: 4 });
    let state = readyState({ bank: tightBank });
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 25 });
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 25 });
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 25 });
    const totalBefore = selectTotalMoneyHeld(state);
    const stockBefore = state.products.find((p) => p.id === gum.id)?.stock;

    const after = machineReducer(state, { type: 'BUY', productId: gum.id });

    expect(after.message?.kind).toBe('error');
    expect(after.inserted).toEqual(state.inserted);
    expect(after.bank).toEqual(state.bank);
    expect(after.products.find((p) => p.id === gum.id)?.stock).toBe(stockBefore);
    expect(selectTotalMoneyHeld(after)).toBe(totalBefore);
  });

  it('on success: deducts stock, clears escrow, moves product + change to the tray, conserves total money', () => {
    let state = readyState();
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 100 });
    const totalBeforeBuy = selectTotalMoneyHeld(state);

    const after = machineReducer(state, { type: 'BUY', productId: gum.id });

    expect(after.products.find((p) => p.id === gum.id)?.stock).toBe(gum.stock - 1);
    expect(bankTotal(after.inserted)).toBe(0);
    expect(after.tray.items).toHaveLength(1);
    expect(after.tray.items[0]?.id).toBe(gum.id);
    expect(bankTotal(after.tray.coins)).toBe(100 - gum.priceCents);
    // A sale only moves money between compartments; it never creates or
    // destroys it, so the grand total is unchanged even though a sale happened.
    expect(selectTotalMoneyHeld(after)).toBe(totalBeforeBuy);
  });

  it('greedy fallback: owing 30c from three dimes and a quarter returns the three dimes', () => {
    // Regression for the change algorithm as exercised through the reducer:
    // the float holds a quarter and three dimes; greedy would take the
    // quarter and get stuck, so the DFS fallback must pay 10+10+10 instead.
    const priced30: Product = { id: 'p-thirty', name: 'Thirty', priceCents: 70, stock: 1, emoji: '🎯' };
    let state = readyState({
      products: [priced30],
      bank: bankFrom({ 25: 1, 10: 3 }),
    });
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 100 });

    const after = machineReducer(state, { type: 'BUY', productId: priced30.id });

    expect(after.tray.coins).toEqual(bankFrom({ 10: 3 }));
    expect(bankTotal(after.tray.coins)).toBe(30);
  });
});

describe('RESET', () => {
  it('returns escrowed coins to the tray, conserving total money, and clears escrow', () => {
    let state = readyState();
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 25 });
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 10 });
    const totalBefore = selectTotalMoneyHeld(state);

    const after = machineReducer(state, { type: 'RESET' });

    expect(bankTotal(after.inserted)).toBe(0);
    expect(bankTotal(after.tray.coins)).toBe(35);
    expect(selectTotalMoneyHeld(after)).toBe(totalBefore);
  });

  it('is a no-op message when there is nothing inserted to return', () => {
    const state = readyState();
    const after = machineReducer(state, { type: 'RESET' });
    expect(after.message?.kind).toBe('info');
    expect(after.inserted).toEqual(state.inserted);
  });
});

describe('COLLECT_TRAY', () => {
  it('empties the tray without touching the bank or escrow', () => {
    let state = readyState();
    state = machineReducer(state, { type: 'INSERT_COIN', coin: 100 });
    state = machineReducer(state, { type: 'BUY', productId: gum.id });
    expect(state.tray.items.length).toBeGreaterThan(0);

    const after = machineReducer(state, { type: 'COLLECT_TRAY' });

    expect(after.tray.items).toEqual([]);
    expect(bankTotal(after.tray.coins)).toBe(0);
    expect(after.bank).toEqual(state.bank);
    expect(after.inserted).toEqual(state.inserted);
  });
});

describe('DISMISS_MESSAGE', () => {
  it('clears the current message', () => {
    const state = machineReducer(readyState(), {
      type: 'INSERT_COIN',
      coin: 1 as CoinValue,
    });
    expect(state.message).not.toBeNull();

    const after = machineReducer(state, { type: 'DISMISS_MESSAGE' });
    expect(after.message).toBeNull();
  });
});

describe('admin CRUD', () => {
  const draft: ProductDraft = { name: 'Pretzels', priceCents: 65, stock: 5, emoji: '🥨' };

  it('CREATE_PRODUCT adds a validated product with a deterministic generated id', () => {
    const state = readyState();
    const after = machineReducer(state, { type: 'CREATE_PRODUCT', draft });

    const created = after.products.find((p) => p.name === 'Pretzels');
    expect(created).toBeDefined();
    expect(created?.priceCents).toBe(65);
    expect(after.nextProductSeq).toBe(state.nextProductSeq + 1);
  });

  it('CREATE_PRODUCT rejects a price that clashes with an existing product', () => {
    const state = readyState();
    const after = machineReducer(state, {
      type: 'CREATE_PRODUCT',
      draft: { ...draft, priceCents: gum.priceCents },
    });

    expect(after.products).toEqual(state.products);
    expect(after.message?.kind).toBe('error');
  });

  it('UPDATE_PRODUCT replaces the editable fields of an existing product', () => {
    const state = readyState();
    const after = machineReducer(state, {
      type: 'UPDATE_PRODUCT',
      id: gum.id,
      draft: { ...draft, priceCents: 60 },
    });

    const updated = after.products.find((p) => p.id === gum.id);
    expect(updated?.name).toBe('Pretzels');
    expect(updated?.priceCents).toBe(60);
  });

  it('DELETE_PRODUCT removes the product', () => {
    const state = readyState();
    const after = machineReducer(state, { type: 'DELETE_PRODUCT', id: gum.id });
    expect(after.products.find((p) => p.id === gum.id)).toBeUndefined();
  });

  it('RESTOCK_PRODUCT clamps stock within 0..MAX_STOCK_PER_PRODUCT', () => {
    const state = readyState();

    const restocked = machineReducer(state, {
      type: 'RESTOCK_PRODUCT',
      id: gum.id,
      delta: 100,
    });
    expect(restocked.products.find((p) => p.id === gum.id)?.stock).toBe(15);

    const depleted = machineReducer(state, {
      type: 'RESTOCK_PRODUCT',
      id: gum.id,
      delta: -100,
    });
    expect(depleted.products.find((p) => p.id === gum.id)?.stock).toBe(0);
  });
});

describe('money conservation invariant', () => {
  it('total money held changes only via INSERT_COIN (in) and COLLECT_TRAY (out), never via BUY', () => {
    let state = readyState();
    let total = selectTotalMoneyHeld(state);

    state = machineReducer(state, { type: 'INSERT_COIN', coin: 100 });
    total += 100;
    expect(selectTotalMoneyHeld(state)).toBe(total);

    // Successful sale: total unchanged, money only moves compartments.
    state = machineReducer(state, { type: 'BUY', productId: gum.id });
    expect(selectTotalMoneyHeld(state)).toBe(total);

    // Failed sale (nothing inserted now, insufficient funds): total unchanged.
    state = machineReducer(state, { type: 'BUY', productId: cola.id });
    expect(selectTotalMoneyHeld(state)).toBe(total);

    // Collecting the tray removes money from the tracked system (the
    // customer takes it away) — the one legitimate decrease.
    const collectedAmount = bankTotal(state.tray.coins);
    state = machineReducer(state, { type: 'COLLECT_TRAY' });
    total -= collectedAmount;
    expect(selectTotalMoneyHeld(state)).toBe(total);
    expect(bankTotal(emptyBank())).toBe(0);
  });
});
