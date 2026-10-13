import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { TrayContents } from '../../../domain/machineReducer.ts';
import { COIN_LABELS, DENOMINATIONS, bankTotal, formatUSD } from '../../../domain/money.ts';
import type { DeepReadonly } from '../../core/deep-readonly.ts';

@Component({
  selector: 'app-output-tray',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (hasItems() || hasCoins()) {
      <section
        class="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-amber-800 dark:text-amber-200">Output tray</h2>
          <button
            type="button"
            class="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            (click)="collect.emit()"
          >
            Collect
          </button>
        </div>

        @if (hasItems()) {
          <ul class="flex flex-wrap gap-2">
            @for (item of tray().items; track $index) {
              <li
                class="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm dark:bg-black/20"
              >
                <span aria-hidden="true">{{ item.emoji }}</span>
                <span>{{ item.name }}</span>
              </li>
            }
          </ul>
        }

        @if (hasCoins()) {
          <div class="flex flex-col gap-1 text-sm">
            <span class="font-medium">Change: {{ formatUSD(changeTotal()) }}</span>
            <ul class="flex flex-wrap gap-3 text-amber-800 dark:text-amber-200">
              @for (coin of changeCoins(); track coin) {
                <li class="tabular">{{ tray().coins[coin] }} × {{ coinLabels[coin] }}</li>
              }
            </ul>
          </div>
        }
      </section>
    }
  `,
})
export class OutputTrayComponent {
  readonly tray = input.required<DeepReadonly<TrayContents>>();
  readonly collect = output<void>();

  protected readonly coinLabels = COIN_LABELS;
  protected readonly formatUSD = formatUSD;

  protected readonly changeTotal = computed(() => bankTotal(this.tray().coins));
  protected readonly hasItems = computed(() => this.tray().items.length > 0);
  protected readonly hasCoins = computed(() => this.changeTotal() > 0);
  protected readonly changeCoins = computed(() =>
    DENOMINATIONS.filter((coin) => this.tray().coins[coin] > 0),
  );
}
