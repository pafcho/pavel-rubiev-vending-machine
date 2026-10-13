import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { COIN_LABELS, DENOMINATIONS, bankTotal, formatUSD } from '../../../domain/money.ts';
import type { CoinBank } from '../../../domain/money.ts';

/** Collapsible debug panel so the change algorithm's inputs stay inspectable. */
@Component({
  selector: 'app-bank-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <details
      class="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <summary class="cursor-pointer font-medium text-slate-600 dark:text-slate-400">
        Machine float (debug): {{ formatUSD(total()) }}
      </summary>
      <ul class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        @for (coin of denominations; track coin) {
          <li class="tabular rounded-lg bg-slate-50 px-3 py-2 text-center dark:bg-slate-800">
            {{ bank()[coin] }} × {{ coinLabels[coin] }}
          </li>
        }
      </ul>
    </details>
  `,
})
export class BankPanelComponent {
  readonly bank = input.required<CoinBank>();

  protected readonly denominations = DENOMINATIONS;
  protected readonly coinLabels = COIN_LABELS;
  protected readonly formatUSD = formatUSD;

  protected readonly total = computed(() => bankTotal(this.bank()));
}
