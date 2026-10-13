import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { COIN_LABELS, DENOMINATIONS, formatUSD } from '../../../domain/money.ts';
import type { CoinValue } from '../../../domain/money.ts';

/** The coin slot (four accepted denominations) plus the running credit display. */
@Component({
  selector: 'app-coin-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section
      class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-600 dark:text-slate-400">Insert coins</h2>
        <span class="tabular text-lg font-semibold">{{ formatUSD(insertedTotal()) }}</span>
      </div>
      <div class="grid grid-cols-4 gap-2">
        @for (coin of denominations; track coin) {
          <button
            type="button"
            class="tabular rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-indigo-950"
            (click)="insertCoin.emit(coin)"
          >
            {{ coinLabels[coin] }}
          </button>
        }
      </div>
    </section>
  `,
})
export class CoinSlotComponent {
  readonly insertedTotal = input.required<number>();
  readonly insertCoin = output<CoinValue>();

  protected readonly denominations = DENOMINATIONS;
  protected readonly coinLabels = COIN_LABELS;
  protected readonly formatUSD = formatUSD;
}
