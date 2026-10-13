import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Product } from '../../../domain/types.ts';
import { ProductCardComponent } from './product-card.component.ts';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [ProductCardComponent],
  template: `
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (product of products(); track product.id) {
        <app-product-card
          [product]="product"
          [selected]="product.id === selectedId()"
          [affordable]="affordableIds().has(product.id)"
          (productSelect)="productSelect.emit(product.id)"
        />
      }
    </div>
  `,
})
export class ProductGridComponent {
  readonly products = input.required<readonly Product[]>();
  readonly selectedId = input.required<string | null>();
  readonly affordableIds = input.required<ReadonlySet<string>>();
  readonly productSelect = output<string>();
}
