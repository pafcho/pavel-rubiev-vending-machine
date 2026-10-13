import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MachineStore } from '../../state/machine.store.ts';
import { ActionBarComponent } from './action-bar.component.ts';
import { BankPanelComponent } from './bank-panel.component.ts';
import { CoinSlotComponent } from './coin-slot.component.ts';
import { OutputTrayComponent } from './output-tray.component.ts';
import { ProductGridComponent } from './product-grid.component.ts';
import { StatusBannerComponent } from './status-banner.component.ts';

@Component({
  selector: 'app-vending-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [
    ActionBarComponent,
    BankPanelComponent,
    CoinSlotComponent,
    OutputTrayComponent,
    ProductGridComponent,
    StatusBannerComponent,
  ],
  template: `
    @if (store.state().status !== 'ready') {
      <app-status-banner
        [status]="store.state().status"
        [error]="store.state().error"
        [message]="store.state().message"
        (retry)="store.load()"
        (dismissMessage)="store.dispatch({ type: 'DISMISS_MESSAGE' })"
      />
    } @else {
      <div class="flex flex-col gap-6 pb-28 lg:pb-6">
        <app-status-banner
          [status]="store.state().status"
          [error]="store.state().error"
          [message]="store.state().message"
          (retry)="store.load()"
          (dismissMessage)="store.dispatch({ type: 'DISMISS_MESSAGE' })"
        />

        <app-product-grid
          [products]="store.state().products"
          [selectedId]="selectedId()"
          [affordableIds]="store.affordableIds()"
          (productSelect)="selectedId.set($event)"
        />

        <app-coin-slot
          [insertedTotal]="store.insertedTotal()"
          (insertCoin)="store.dispatch({ type: 'INSERT_COIN', coin: $event })"
        />

        <app-output-tray
          [tray]="store.state().tray"
          (collect)="store.dispatch({ type: 'COLLECT_TRAY' })"
        />

        <app-bank-panel [bank]="store.state().bank" />

        <app-action-bar
          [selectedProduct]="selectedProduct()"
          [insertedTotal]="store.insertedTotal()"
          (buy)="buy()"
          (returnCoins)="store.dispatch({ type: 'RESET' })"
        />
      </div>
    }
  `,
})
export class VendingViewComponent {
  protected readonly store = inject(MachineStore);

  protected readonly selectedId = signal<string | null>(null);
  protected readonly selectedProduct = computed(
    () => this.store.state().products.find((product) => product.id === this.selectedId()) ?? null,
  );

  protected buy(): void {
    const product = this.selectedProduct();
    if (product) this.store.dispatch({ type: 'BUY', productId: product.id });
  }
}
