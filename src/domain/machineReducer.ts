import { makeChange } from './change.ts';
import type { CoinBank, CoinValue } from './money.ts';
import {
  PRICE_INCREMENT_CENTS,
  addCoin,
  bankTotal,
  coinCount,
  emptyBank,
  formatUSD,
  isCoinValue,
  isValidPriceCents,
  mergeBanks,
  subtractBanks,
} from './money.ts';
import { MAX_STOCK_PER_PRODUCT } from './types.ts';
import type { Product } from './types.ts';

/**
 * The vending machine as a pure state machine.
 *
 * Everything that moves money or stock lives in this reducer, so the rules can
 * be tested without React and the money-accounting invariant can be asserted
 * over long action sequences. The reducer is strictly pure: no clocks, no
 * randomness, no I/O — ids for new products come from a counter in state rather
 * than `crypto.randomUUID()` precisely to keep it deterministic.
 */

export type MachineStatus = 'loading' | 'ready' | 'error';

export interface MachineMessage {
  kind: 'info' | 'success' | 'error';
  text: string;
}

/**
 * A product as dispensed — a snapshot, not a live reference.
 *
 * Copying only the display fields keeps an item sitting in the tray from
 * showing a stale stock count after later purchases or admin edits.
 */
export interface DispensedItem {
  id: string;
  name: string;
  emoji: string;
  priceCents: number;
}

/**
 * The output tray: what the customer has been given but not yet picked up.
 *
 * Both parts accumulate until collected, so buying twice without collecting, or
 * mixing a purchase with a coin return, can never make an item or a coin vanish.
 */
export interface TrayContents {
  items: DispensedItem[];
  /** Change from purchases plus any coins handed back by a reset. */
  coins: CoinBank;
}

export interface MachineState {
  status: MachineStatus;
  /** Failure text from the products API; only set when `status` is `'error'`. */
  error: string | null;
  products: Product[];
  /** Coins in escrow: inserted, not yet spent or returned. */
  inserted: CoinBank;
  /** The machine's own float, from which change is paid. */
  bank: CoinBank;
  tray: TrayContents;
  message: MachineMessage | null;
  /** Counter behind ids for admin-created products, keeping the reducer pure. */
  nextProductSeq: number;
}

/** Editable fields of a product, as submitted by the admin form. */
export interface ProductDraft {
  name: string;
  priceCents: number;
  stock: number;
  emoji: string;
}

export type MachineAction =
  // Loading from the mocked external service
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; products: Product[]; bank: CoinBank }
  | { type: 'LOAD_FAILURE'; error: string }
  // Vending
  | { type: 'INSERT_COIN'; coin: CoinValue }
  | { type: 'BUY'; productId: string }
  | { type: 'RESET' }
  | { type: 'COLLECT_TRAY' }
  | { type: 'DISMISS_MESSAGE' }
  // Admin CRUD, in application state only
  | { type: 'CREATE_PRODUCT'; draft: ProductDraft }
  | { type: 'UPDATE_PRODUCT'; id: string; draft: ProductDraft }
  | { type: 'DELETE_PRODUCT'; id: string }
  | { type: 'RESTOCK_PRODUCT'; id: string; delta: number };

export function emptyTray(): TrayContents {
  return { items: [], coins: emptyBank() };
}

export function isTrayEmpty(tray: TrayContents): boolean {
  return tray.items.length === 0 && coinCount(tray.coins) === 0;
}

export const initialState: MachineState = {
  status: 'loading',
  error: null,
  products: [],
  inserted: emptyBank(),
  bank: emptyBank(),
  tray: emptyTray(),
  message: null,
  nextProductSeq: 1,
};

/** Attaches a message without touching money or stock. */
function withMessage(
  state: MachineState,
  kind: MachineMessage['kind'],
  text: string,
): MachineState {
  return { ...state, message: { kind, text } };
}

/** Prices are unique, so ordering by price gives a stable, total order. */
function sortByPrice(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.priceCents - b.priceCents);
}

function toDispensedItem(product: Product): DispensedItem {
  return {
    id: product.id,
    name: product.name,
    emoji: product.emoji,
    priceCents: product.priceCents,
  };
}

/**
 * Validates an admin draft against the requirements: a name, a price payable in
 * the accepted coins, a price no other product already uses, and stock within
 * the 15-unit-per-type cap.
 *
 * @param ignoreId the product being edited, excluded from the price clash check
 * @returns an error message, or `null` when the draft is valid
 */
export function validateDraft(
  state: MachineState,
  draft: ProductDraft,
  ignoreId?: string,
): string | null {
  if (draft.name.trim().length === 0) {
    return 'Product name is required.';
  }

  if (!isValidPriceCents(draft.priceCents)) {
    return `Price must be a positive multiple of ${formatUSD(PRICE_INCREMENT_CENTS)}.`;
  }

  const clash = state.products.find(
    (product) => product.priceCents === draft.priceCents && product.id !== ignoreId,
  );
  if (clash) {
    return `${clash.name} already costs ${formatUSD(draft.priceCents)} — every product needs a different price.`;
  }

  if (
    !Number.isInteger(draft.stock) ||
    draft.stock < 0 ||
    draft.stock > MAX_STOCK_PER_PRODUCT
  ) {
    return `Stock must be a whole number from 0 to ${MAX_STOCK_PER_PRODUCT}.`;
  }

  return null;
}

function normalizeDraft(draft: ProductDraft): Omit<Product, 'id'> {
  return {
    name: draft.name.trim(),
    priceCents: draft.priceCents,
    stock: draft.stock,
    emoji: draft.emoji.trim() || '🛒',
  };
}

export function machineReducer(
  state: MachineState,
  action: MachineAction,
): MachineState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null, message: null };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'ready',
        error: null,
        products: sortByPrice(action.products),
        bank: action.bank,
        inserted: emptyBank(),
        tray: emptyTray(),
        message: null,
      };

    case 'LOAD_FAILURE':
      return { ...state, status: 'error', error: action.error, message: null };

    case 'INSERT_COIN': {
      // Second gate on denominations: the UI only offers the four accepted
      // coins, but the rule belongs in the domain, not in a button handler.
      if (!isCoinValue(action.coin)) {
        return withMessage(
          state,
          'error',
          'That coin is not accepted. This machine takes $0.05, $0.10, $0.25 and $1.00 only.',
        );
      }

      return {
        ...state,
        inserted: addCoin(state.inserted, action.coin),
        message: null,
      };
    }

    case 'BUY': {
      const product = state.products.find(({ id }) => id === action.productId);
      if (!product) {
        return withMessage(state, 'error', 'That product is no longer available.');
      }

      if (product.stock <= 0) {
        return withMessage(state, 'error', `${product.name} is sold out.`);
      }

      const insertedTotal = bankTotal(state.inserted);
      if (insertedTotal < product.priceCents) {
        const shortfall = product.priceCents - insertedTotal;
        return withMessage(
          state,
          'error',
          `Insert ${formatUSD(shortfall)} more to buy ${product.name}.`,
        );
      }

      const changeDue = insertedTotal - product.priceCents;

      // The escrowed coins are part of the float the moment the sale commits,
      // exactly as in a real machine — and they materially improve the odds of
      // being able to pay the change.
      const availableForChange = mergeBanks(state.bank, state.inserted);
      const change = makeChange(changeDue, availableForChange);

      if (change === null) {
        // Atomic rejection: stock, float and escrow all stay exactly as they
        // were, so the customer can add smaller coins or ask for a refund.
        return withMessage(
          state,
          'error',
          `Cannot dispense exact change for ${product.name} (${formatUSD(changeDue)} owed). Insert smaller coins or press Return Coins.`,
        );
      }

      return {
        ...state,
        products: state.products.map((candidate) =>
          candidate.id === product.id
            ? { ...candidate, stock: candidate.stock - 1 }
            : candidate,
        ),
        bank: subtractBanks(availableForChange, change),
        inserted: emptyBank(),
        tray: {
          items: [...state.tray.items, toDispensedItem(product)],
          coins: mergeBanks(state.tray.coins, change),
        },
        message: {
          kind: 'success',
          text:
            changeDue > 0
              ? `Dispensed ${product.name}. Your change is ${formatUSD(changeDue)}.`
              : `Dispensed ${product.name}. Exact payment, no change due.`,
        },
      };
    }

    case 'RESET': {
      const returned = bankTotal(state.inserted);
      if (returned === 0) {
        return withMessage(state, 'info', 'No coins to return.');
      }

      // The very coins that were inserted come back — not an equivalent
      // reconstruction — because escrow is tracked per denomination.
      return {
        ...state,
        inserted: emptyBank(),
        tray: {
          items: state.tray.items,
          coins: mergeBanks(state.tray.coins, state.inserted),
        },
        message: { kind: 'info', text: `Returned ${formatUSD(returned)}.` },
      };
    }

    case 'COLLECT_TRAY':
      if (isTrayEmpty(state.tray)) {
        return withMessage(state, 'info', 'The tray is empty.');
      }
      return { ...state, tray: emptyTray(), message: null };

    case 'DISMISS_MESSAGE':
      return state.message === null ? state : { ...state, message: null };

    case 'CREATE_PRODUCT': {
      const invalid = validateDraft(state, action.draft);
      if (invalid) return withMessage(state, 'error', invalid);

      const product: Product = {
        id: `p-custom-${state.nextProductSeq}`,
        ...normalizeDraft(action.draft),
      };

      return {
        ...state,
        products: sortByPrice([...state.products, product]),
        nextProductSeq: state.nextProductSeq + 1,
        message: { kind: 'success', text: `Added ${product.name}.` },
      };
    }

    case 'UPDATE_PRODUCT': {
      const existing = state.products.find(({ id }) => id === action.id);
      if (!existing) {
        return withMessage(state, 'error', 'That product no longer exists.');
      }

      const invalid = validateDraft(state, action.draft, action.id);
      if (invalid) return withMessage(state, 'error', invalid);

      const updated: Product = { id: existing.id, ...normalizeDraft(action.draft) };

      return {
        ...state,
        products: sortByPrice(
          state.products.map((product) => (product.id === action.id ? updated : product)),
        ),
        message: { kind: 'success', text: `Updated ${updated.name}.` },
      };
    }

    case 'DELETE_PRODUCT': {
      const existing = state.products.find(({ id }) => id === action.id);
      if (!existing) {
        return withMessage(state, 'error', 'That product no longer exists.');
      }

      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.id),
        message: { kind: 'info', text: `Removed ${existing.name}.` },
      };
    }

    case 'RESTOCK_PRODUCT': {
      const existing = state.products.find(({ id }) => id === action.id);
      if (!existing) {
        return withMessage(state, 'error', 'That product no longer exists.');
      }

      // Clamped rather than rejected: the +/- controls should simply stop at the
      // ends of the range instead of raising an error.
      const stock = Math.max(
        0,
        Math.min(MAX_STOCK_PER_PRODUCT, existing.stock + action.delta),
      );

      if (stock === existing.stock) {
        return withMessage(
          state,
          'info',
          action.delta > 0
            ? `${existing.name} is already fully loaded (${MAX_STOCK_PER_PRODUCT} units).`
            : `${existing.name} is already empty.`,
        );
      }

      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.id ? { ...product, stock } : product,
        ),
        message: null,
      };
    }

    default: {
      // Exhaustiveness check: adding an action without handling it fails to compile.
      const unhandled: never = action;
      return unhandled;
    }
  }
}

/* ---------------------------------------------------------------- selectors */

/** Credit currently in escrow, in cents. */
export function selectInsertedTotal(state: MachineState): number {
  return bankTotal(state.inserted);
}

/** Face value of the machine's float, in cents. */
export function selectBankTotal(state: MachineState): number {
  return bankTotal(state.bank);
}

/** Face value of the coins waiting in the tray, in cents. */
export function selectTrayTotal(state: MachineState): number {
  return bankTotal(state.tray.coins);
}

/**
 * Every cent the machine is holding: float + escrow + uncollected tray.
 *
 * Money only enters through `INSERT_COIN` and only leaves through
 * `COLLECT_TRAY`; a sale merely moves it between float and tray. The reducer
 * tests assert exactly that.
 */
export function selectTotalMoneyHeld(state: MachineState): number {
  return selectBankTotal(state) + selectInsertedTotal(state) + selectTrayTotal(state);
}

export function selectProductById(
  state: MachineState,
  productId: string | null,
): Product | undefined {
  if (productId === null) return undefined;
  return state.products.find(({ id }) => id === productId);
}

/** Whether the current credit covers the product's price. */
export function selectCanAfford(state: MachineState, product: Product): boolean {
  return selectInsertedTotal(state) >= product.priceCents;
}

/**
 * Whether a purchase would currently be payable in change — used to warn in the
 * UI *before* the customer commits, rather than only rejecting afterwards.
 */
export function selectCanDispenseChange(
  state: MachineState,
  product: Product,
): boolean {
  const changeDue = selectInsertedTotal(state) - product.priceCents;
  if (changeDue < 0) return false;
  return makeChange(changeDue, mergeBanks(state.bank, state.inserted)) !== null;
}
