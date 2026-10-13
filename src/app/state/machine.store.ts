import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import {
  initialState,
  machineReducer,
  selectBankTotal,
  selectCanAfford,
  selectInsertedTotal,
  selectTotalMoneyHeld,
  selectTrayTotal,
  validateDraft,
} from '../../domain/machineReducer.ts';
import type { MachineAction, MachineState, ProductDraft } from '../../domain/machineReducer.ts';
import type { DeepReadonly } from '../core/deep-readonly.ts';
import { ProductsApiService } from '../core/products-api.service.ts';

/**
 * Signal-based store around the pure `machineReducer`.
 *
 * Provided per scope (`providers: [MachineStore]`), not in root, so each
 * provider owner gets its own machine. The store holds no rules: every state
 * transition goes through the reducer.
 */
@Injectable()
export class MachineStore {
  private readonly api = inject(ProductsApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<MachineState>(initialState);
  private readonly loadRequests = new Subject<void>();

  /** The machine state; deeply readonly so consumers cannot mutate it. */
  readonly state: Signal<DeepReadonly<MachineState>> = this._state.asReadonly();

  readonly insertedTotal = computed(() => selectInsertedTotal(this._state()));
  readonly bankTotal = computed(() => selectBankTotal(this._state()));
  readonly trayTotal = computed(() => selectTrayTotal(this._state()));
  readonly totalMoneyHeld = computed(() => selectTotalMoneyHeld(this._state()));

  /** Ids of products the current credit can pay for. */
  readonly affordableIds = computed<ReadonlySet<string>>(() => {
    const state = this._state();
    return new Set(
      state.products.filter((product) => selectCanAfford(state, product)).map(({ id }) => id),
    );
  });

  constructor() {
    // The only I/O in the store. `switchMap` makes a retry cancel any request
    // still in flight, and `catchError` sits inside it so a failed load never
    // terminates the request stream.
    this.loadRequests
      .pipe(
        tap(() => this.dispatch({ type: 'LOAD_START' })),
        switchMap(() =>
          forkJoin([this.api.getProducts(), this.api.getMachineBank()]).pipe(
            map(([products, bank]): MachineAction => ({ type: 'LOAD_SUCCESS', products, bank })),
            catchError((error: unknown) =>
              of<MachineAction>({
                type: 'LOAD_FAILURE',
                error:
                  error instanceof Error ? error.message : 'Failed to load the vending machine.',
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((action) => this.dispatch(action));
  }

  /** Runs an action through the pure reducer. */
  dispatch(action: MachineAction): void {
    this._state.update((s) => machineReducer(s, action));
  }

  /** Loads products and the coin float from the API; also serves as the retry. */
  load(): void {
    this.loadRequests.next();
  }

  /** Checks an admin draft against the current state without changing it. */
  validateDraft(draft: ProductDraft, ignoreId?: string): string | null {
    return validateDraft(this._state(), draft, ignoreId);
  }
}
