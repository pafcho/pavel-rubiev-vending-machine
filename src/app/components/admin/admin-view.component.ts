import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { ProductDraft } from '../../../domain/machineReducer.ts';
import type { Product } from '../../../domain/types.ts';
import { MachineStore } from '../../state/machine.store.ts';
import { ProductFormComponent } from './product-form.component.ts';
import { ProductTableComponent } from './product-table.component.ts';
import type { RestockEvent } from './product-table.component.ts';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [ProductFormComponent, ProductTableComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Inventory</h2>
        <button
          type="button"
          class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          (click)="isCreating.set(true)"
        >
          Add product
        </button>
      </div>

      @if (store.state().message; as message) {
        <div
          role="status"
          aria-live="polite"
          class="rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {{ message.text }}
        </div>
      }

      <app-product-table
        [products]="store.state().products"
        (editProduct)="editingProduct.set($event)"
        (removeProduct)="store.dispatch({ type: 'DELETE_PRODUCT', id: $event })"
        (restock)="restock($event)"
      />

      @if (formOpen()) {
        <app-product-form
          [product]="editingProduct()"
          [error]="formError()"
          (save)="save($event)"
          (dismiss)="closeForm()"
        />
      }
    </div>
  `,
})
export class AdminViewComponent {
  protected readonly store = inject(MachineStore);

  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly isCreating = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly formOpen = computed(() => this.isCreating() || this.editingProduct() !== null);

  protected restock({ id, delta }: RestockEvent): void {
    this.store.dispatch({ type: 'RESTOCK_PRODUCT', id, delta });
  }

  protected save(draft: ProductDraft): void {
    const editing = this.editingProduct();

    const validationError = this.store.validateDraft(draft, editing?.id);
    if (validationError) {
      this.formError.set(validationError);
      return;
    }

    if (editing) {
      this.store.dispatch({ type: 'UPDATE_PRODUCT', id: editing.id, draft });
    } else {
      this.store.dispatch({ type: 'CREATE_PRODUCT', draft });
    }
    this.closeForm();
  }

  protected closeForm(): void {
    this.isCreating.set(false);
    this.editingProduct.set(null);
    this.formError.set(null);
  }
}
