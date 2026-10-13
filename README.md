# Vending Machine

A web-based vending machine built with **Angular 18 (standalone components, Signals, RxJS) + TypeScript**, styled with **Tailwind CSS v4**, and backed by a strictly separated, unit-tested domain layer. The application loads its initial product catalog and coin float from a mocked external API, then runs entirely on local application state: inserting coins, buying products, returning coins, and administering inventory (CRUD) all flow through a single, pure, testable state machine.

## Overview

The codebase draws a hard line between **domain logic** and **UI**:

- `src/domain/` — plain TypeScript, zero framework or DOM dependencies. Money arithmetic (`money.ts`), the change-making algorithm (`change.ts`), and the vending machine's entire state machine (`machineReducer.ts`) live here as pure functions and a pure reducer. Every rule (stock limits, atomic purchase rejection, money conservation) is unit-tested in isolation, with no rendering, mocking, or DOM setup required.
- `src/services/` — the mocked catalog (`seed.ts`).
- `src/app/core/` — `ProductsApiService`, the mocked external API exposed as cold RxJS streams (`of(...).pipe(delay(600))`), simulating network latency and, optionally, failure. Failure is switched by the `SIMULATE_API_FAILURE` injection token, which `app.config.ts` sets from `?simulateFailure=true`.
- `src/app/state/` — `MachineStore`, an `@Injectable()` Signals store. State lives in a private `WritableSignal`, is exposed as a deeply readonly `Signal`, and every change goes through `dispatch(action)` → `machineReducer`. It also runs the one side effect (loading from the API, with retry) and exposes `computed()` selectors.
- `src/app/components/` — standalone, `OnPush` components. The container views (`VendingViewComponent`, `AdminViewComponent`) inject `MachineStore` and read its signals in their templates; every child component is purely presentational, taking signal `input()`s and emitting `output()`s. There are no NgModules.

This separation means the hardest part of the assignment — the money and change-making rules — can be reasoned about and verified with plain Vitest unit tests, independent of anything rendered on screen.

## Requirements Fulfilled

| Requirement | Implementation |
| --- | --- |
| Inventory size — up to 15 products of the same type | `MAX_STOCK_PER_PRODUCT = 15`, enforced in the reducer's restock/validate logic and clamped in the admin UI |
| Distinct price per product type | Enforced by `validateDraft` on every create/update; rejects a price already used by another product |
| A chosen currency, with accepted denominations documented and enforced | USD; only $0.05 / $0.10 / $0.25 / $1.00 accepted — see [Currency & Denominations](#currency--denominations) |
| Machine must return change | `makeChange` (greedy + memoized DFS fallback) computes exact change from the combined bank + inserted coins, or the purchase is atomically rejected |
| Get initial product list from an external resource (mocked API) | `src/app/core/products-api.service.ts` — RxJS streams with simulated latency and an optional failure mode, a stand-in for a real HTTP endpoint, seeded from `src/services/seed.ts` |
| CRUD for products in application state only | `CREATE_PRODUCT` / `UPDATE_PRODUCT` / `DELETE_PRODUCT` / `RESTOCK_PRODUCT` actions mutate only the in-memory reducer state; the mocked API is read-only and is never written back to, so a page reload restores the original seed |
| Vending: insert coins, buy, reset (return coins without purchase) | `INSERT_COIN`, `BUY`, and `RESET` actions in the vending view |
| Responsive web design | Tailwind v4 utility classes throughout, mobile-first (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, a sticky bottom action bar on mobile, table-to-stacked-cards collapse in the admin view) |

## Currency & Denominations

The machine deals exclusively in **US dollars (USD)** and accepts **only** these four coin denominations:

- $1.00
- $0.25
- $0.10
- $0.05

Any other value is rejected at the coin slot by a runtime type guard (`isCoinValue`), not just by the UI — so the rule holds even if a caller bypasses the buttons.

## Technical Decisions

### Integer Currency

Every monetary value in the application — prices, inserted coins, bank float, change — is an integer number of **cents**. Floating-point dollars are never used: `0.1 + 0.2 !== 0.3` in JavaScript, and a vending machine cannot afford to be wrong about money by even a fraction of a cent. Product prices are additionally constrained to whole multiples of the smallest coin (5¢), so exact change is always mathematically achievable in principle.

### Change Algorithm

`makeChange(amountCents, availableBank)` uses a two-pass strategy:

1. **Bounded greedy** — walk the denominations from largest to smallest, taking as many of each coin as both the remaining amount and the bank's supply allow. This is the canonical, optimal approach for the US coin system when supply is unlimited, and it's a single fast pass over four denominations.
2. **Memoized DFS fallback** — greedy can fail even when an exact solution exists, because the bank's supply of each coin is *finite*. For example, owing 30¢ from a float of one 25¢ coin and three 10¢ coins: greedy takes the quarter first and gets stuck on the remaining 5¢, while 10+10+10 pays it exactly. When greedy leaves a remainder, a depth-first search explores coin counts per denomination, memoized on `(remaining amount, denomination index)` so every unreachable state is visited at most once. If no combination sums exactly to the amount owed, `makeChange` returns `null` and the calling code must refuse the sale rather than shortchange the customer.

### State Management

The entire vending machine — inventory, coin float, escrowed coins, output tray, and messages — is modeled as a single, pure `machineReducer` function (`(state, action) => state`), driven by an Angular Signals store (`this.state.update(s => machineReducer(s, action))`). Because it is pure and framework-agnostic:

- The **money conservation invariant** (bank + inserted + tray totals never gain or lose value except when a coin is physically inserted or collected) can be asserted directly in unit tests, across arbitrary sequences of actions, with no rendering or mocking involved.
- A rejected purchase (insufficient funds, sold out, or no exact change available) is guaranteed atomic: the reducer either returns a wholly new state with stock/bank/escrow updated together, or returns an unmodified state plus an error message — there is no partially-applied transaction.
- The reducer needs no backend, database, or async machinery to be fully tested; `npm test` exercises the whole state machine in plain Node.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm start

# Build for production
npm run build

# Run the test suite
npm test
```

Open the app with `?simulateFailure=true` (e.g. `http://localhost:5173/?simulateFailure=true`) to exercise the error + retry UI.

Other useful scripts: `npm run test:watch` (Vitest in watch mode), `npm run typecheck` (Angular compiler with strict templates, plus the spec project), `npm run lint` (Oxlint), `npm run preview` (serve the production build locally).

### Build tooling note

The app is compiled by Angular 18's compiler (AOT) running inside Vite through `@analogjs/vite-plugin-angular`, rather than the Angular CLI builder. The immutable domain files import with `.ts` extensions, which needs `allowImportingTsExtensions`; TypeScript 5.5 (the newest version Angular 18 supports) only allows that with `noEmit`, which the CLI builder cannot run with. `.npmrc` sets `legacy-peer-deps` because `@angular/build@18` declares an optional peer on Tailwind 2/3.

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
