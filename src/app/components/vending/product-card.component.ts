import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatUSD } from '../../../domain/money.ts';
import type { Product } from '../../../domain/types.ts';

const SELECTED_CLASS = 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-950';
const UNSELECTED_CLASS =
  'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      type="button"
      class="flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      [class]="stateClass()"
      [disabled]="soldOut()"
      [attr.aria-pressed]="selected()"
      (click)="productSelect.emit()"
    >
      <span class="text-4xl" aria-hidden="true">{{ product().emoji }}</span>
      <span class="font-medium">{{ product().name }}</span>
      <span class="tabular text-lg font-semibold">{{ formatUSD(product().priceCents) }}</span>
      <span class="text-xs text-slate-500 dark:text-slate-400">{{ stockLabel() }}</span>
      @if (!soldOut() && !affordable()) {
        <span class="text-xs font-medium text-amber-600 dark:text-amber-400">Insert more coins</span>
      }
    </button>
  `,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly selected = input.required<boolean>();
  readonly affordable = input.required<boolean>();
  readonly productSelect = output<void>();

  protected readonly formatUSD = formatUSD;

  protected readonly soldOut = computed(() => this.product().stock <= 0);
  protected readonly stockLabel = computed(() =>
    this.soldOut() ? 'Sold out' : `${this.product().stock} left`,
  );
  protected readonly stateClass = computed(() =>
    this.selected() ? SELECTED_CLASS : UNSELECTED_CLASS,
  );
}
