import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatUSD } from '../../../domain/money.ts';
import type { Product } from '../../../domain/types.ts';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div
      class="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-slate-800 dark:bg-slate-950/95"
    >
      <button
        type="button"
        class="flex-1 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        [disabled]="!canBuy()"
        (click)="buy.emit()"
      >
        {{ buyLabel() }}
      </button>
      <button
        type="button"
        class="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        [disabled]="insertedTotal() === 0"
        (click)="returnCoins.emit()"
      >
        Return Coins
      </button>
    </div>
  `,
})
export class ActionBarComponent {
  readonly selectedProduct = input.required<Product | null>();
  readonly insertedTotal = input.required<number>();
  readonly buy = output<void>();
  readonly returnCoins = output<void>();

  protected readonly canBuy = computed(() => {
    const product = this.selectedProduct();
    return product !== null && product.stock > 0 && this.insertedTotal() >= product.priceCents;
  });

  protected readonly buyLabel = computed(() => {
    const product = this.selectedProduct();
    return product ? `Buy ${product.name} (${formatUSD(product.priceCents)})` : 'Select a product';
  });
}
