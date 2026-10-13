import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MAX_STOCK_PER_PRODUCT } from '../../../domain/types.ts';
import type { Product } from '../../../domain/types.ts';

@Component({
  selector: 'app-restock-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-full border border-slate-300 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700"
        [disabled]="product().stock <= 0"
        [attr.aria-label]="'Remove one ' + product().name"
        (click)="restock.emit(-1)"
      >
        −
      </button>
      <span class="tabular w-6 text-center">{{ product().stock }}</span>
      <button
        type="button"
        class="rounded-full border border-slate-300 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700"
        [disabled]="product().stock >= maxStock"
        [attr.aria-label]="'Add one ' + product().name"
        (click)="restock.emit(1)"
      >
        +
      </button>
    </div>
  `,
})
export class RestockControlsComponent {
  readonly product = input.required<Product>();
  /** Emits the stock change: `-1` or `1`. */
  readonly restock = output<number>();

  protected readonly maxStock = MAX_STOCK_PER_PRODUCT;
}
