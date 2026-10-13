import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { formatUSD } from '../../../domain/money.ts';
import type { Product } from '../../../domain/types.ts';
import { RestockControlsComponent } from './restock-controls.component.ts';

export interface RestockEvent {
  id: string;
  delta: number;
}

@Component({
  selector: 'app-product-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [RestockControlsComponent],
  template: `
    <div class="flex flex-col gap-3">
      <!-- Mobile: stacked cards -->
      <ul class="flex flex-col gap-3 sm:hidden">
        @for (product of products(); track product.id) {
          <li
            class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 font-medium">
                <span aria-hidden="true">{{ product.emoji }}</span>
                {{ product.name }}
              </span>
              <span class="tabular">{{ formatUSD(product.priceCents) }}</span>
            </div>
            <app-restock-controls
              [product]="product"
              (restock)="restock.emit({ id: product.id, delta: $event })"
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-full border border-slate-300 py-1.5 text-sm dark:border-slate-700"
                (click)="editProduct.emit(product)"
              >
                Edit
              </button>
              <button
                type="button"
                class="flex-1 rounded-full border border-red-300 py-1.5 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
                (click)="removeProduct.emit(product.id)"
              >
                Delete
              </button>
            </div>
          </li>
        }
      </ul>

      <!-- Desktop: table -->
      <table class="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr class="text-slate-500 dark:text-slate-400">
            <th class="px-3 py-2 font-medium">Product</th>
            <th class="px-3 py-2 font-medium">Price</th>
            <th class="px-3 py-2 font-medium">Stock</th>
            <th class="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (product of products(); track product.id) {
            <tr class="border-t border-slate-200 dark:border-slate-800">
              <td class="px-3 py-3">
                <span class="flex items-center gap-2">
                  <span aria-hidden="true">{{ product.emoji }}</span>
                  {{ product.name }}
                </span>
              </td>
              <td class="tabular px-3 py-3">{{ formatUSD(product.priceCents) }}</td>
              <td class="px-3 py-3">
                <app-restock-controls
                  [product]="product"
                  (restock)="restock.emit({ id: product.id, delta: $event })"
                />
              </td>
              <td class="px-3 py-3">
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700"
                    (click)="editProduct.emit(product)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="rounded-full border border-red-300 px-3 py-1 text-red-600 dark:border-red-800 dark:text-red-400"
                    (click)="removeProduct.emit(product.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ProductTableComponent {
  readonly products = input.required<readonly Product[]>();
  readonly editProduct = output<Product>();
  readonly removeProduct = output<string>();
  readonly restock = output<RestockEvent>();

  protected readonly formatUSD = formatUSD;
}
