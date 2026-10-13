import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { ProductDraft } from '../../../domain/machineReducer.ts';
import { formatUSD } from '../../../domain/money.ts';
import { MAX_STOCK_PER_PRODUCT } from '../../../domain/types.ts';
import type { Product } from '../../../domain/types.ts';

/**
 * Add/edit dialog. It owns only its field values: validation against the
 * machine state happens in the container, which feeds the result back via `error`.
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      class="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
    >
      <form
        class="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-slate-900"
        (submit)="handleSubmit($event)"
      >
        <h2 id="product-form-title" class="text-lg font-semibold">{{ title() }}</h2>

        @if (error(); as errorMessage) {
          <p
            role="alert"
            class="rounded-xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
          >
            {{ errorMessage }}
          </p>
        }

        <label class="flex flex-col gap-1 text-sm">
          Name
          <input
            required
            class="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm">
          Emoji
          <input
            maxlength="4"
            class="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            [value]="emoji()"
            (input)="emoji.set($any($event.target).value)"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm">
          Price (USD, multiple of {{ formatUSD(5) }})
          <input
            type="number"
            step="0.05"
            min="0.05"
            required
            class="tabular rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            [value]="priceInput()"
            (input)="priceInput.set($any($event.target).value)"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm">
          Stock (0–{{ maxStock }})
          <input
            type="number"
            min="0"
            required
            class="tabular rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            [max]="maxStock"
            [value]="stock()"
            (input)="stock.set(+$any($event.target).value)"
          />
        </label>

        <div class="mt-2 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            (click)="dismiss.emit()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {{ submitLabel() }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProductFormComponent implements OnInit {
  /** The product being edited, or `null` when adding a new one. */
  readonly product = input<Product | null>(null);
  readonly error = input<string | null>(null);
  readonly save = output<ProductDraft>();
  readonly dismiss = output<void>();

  protected readonly maxStock = MAX_STOCK_PER_PRODUCT;
  protected readonly formatUSD = formatUSD;

  protected readonly name = signal('');
  protected readonly priceInput = signal('');
  protected readonly stock = signal(0);
  protected readonly emoji = signal('🛒');

  protected readonly title = computed(() => {
    const product = this.product();
    return product ? `Edit ${product.name}` : 'Add product';
  });
  protected readonly submitLabel = computed(() => (this.product() ? 'Save changes' : 'Add product'));

  // Inputs are not readable in the constructor, so the fields are seeded here.
  ngOnInit(): void {
    const product = this.product();
    if (!product) return;

    this.name.set(product.name);
    this.priceInput.set((product.priceCents / 100).toFixed(2));
    this.stock.set(product.stock);
    this.emoji.set(product.emoji);
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();

    this.save.emit({
      name: this.name(),
      priceCents: Math.round(Number(this.priceInput()) * 100),
      stock: this.stock(),
      emoji: this.emoji(),
    });
  }
}
