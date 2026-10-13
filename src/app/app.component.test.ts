import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SEED_DATA } from '../services/seed.ts';
import { AppComponent } from './app.component.ts';
import { AdminViewComponent } from './components/admin/admin-view.component.ts';
import { ProductFormComponent } from './components/admin/product-form.component.ts';
import { ProductTableComponent } from './components/admin/product-table.component.ts';
import { RestockControlsComponent } from './components/admin/restock-controls.component.ts';
import { HeaderComponent } from './components/header.component.ts';
import { ActionBarComponent } from './components/vending/action-bar.component.ts';
import { BankPanelComponent } from './components/vending/bank-panel.component.ts';
import { CoinSlotComponent } from './components/vending/coin-slot.component.ts';
import { OutputTrayComponent } from './components/vending/output-tray.component.ts';
import { ProductCardComponent } from './components/vending/product-card.component.ts';
import { ProductGridComponent } from './components/vending/product-grid.component.ts';
import { StatusBannerComponent } from './components/vending/status-banner.component.ts';
import { VendingViewComponent } from './components/vending/vending-view.component.ts';
import { ProductsApiService } from './core/products-api.service.ts';

const ALL_COMPONENTS: Type<unknown>[] = [
  AppComponent,
  HeaderComponent,
  VendingViewComponent,
  ActionBarComponent,
  BankPanelComponent,
  CoinSlotComponent,
  OutputTrayComponent,
  ProductCardComponent,
  ProductGridComponent,
  StatusBannerComponent,
  AdminViewComponent,
  ProductFormComponent,
  ProductTableComponent,
  RestockControlsComponent,
];

describe('component conventions', () => {
  it.each(ALL_COMPONENTS.map((component) => [component.name, component] as const))(
    '%s is standalone and OnPush',
    (_name, component) => {
      const def = (component as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }).ɵcmp;
      expect(def.standalone).toBe(true);
      expect(def.onPush).toBe(true);
    },
  );
});

describe('AppComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProductsApiService,
          useValue: {
            getProducts: () => of(SEED_DATA.products.map((product) => ({ ...product }))),
            getMachineBank: () => of({ ...SEED_DATA.bank }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const buttonByText = (text: string) =>
      [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === text);
    return { fixture, root, buttonByText };
  }

  it('loads the machine and renders the product grid', () => {
    const { root } = setup();

    expect(root.querySelectorAll('app-product-card')).toHaveLength(SEED_DATA.products.length);
  });

  it('buys a product end to end: coins in, item and change in the tray', () => {
    const { fixture, root, buttonByText } = setup();

    buttonByText('$1.00')!.click();
    buttonByText('$1.00')!.click();
    fixture.detectChanges();

    const colaCard = [...root.querySelectorAll<HTMLButtonElement>('app-product-card button')].find(
      (button) => button.textContent?.includes('Cola'),
    )!;
    colaCard.click();
    fixture.detectChanges();

    buttonByText('Buy Cola ($1.25)')!.click();
    fixture.detectChanges();

    const tray = root.querySelector('app-output-tray')!;
    expect(tray.textContent).toContain('Cola');
    expect(tray.textContent).toContain('Change: $0.75');
    expect(root.querySelector('app-status-banner')!.textContent).toContain('Dispensed Cola');
  });

  it('switches to the admin inventory and back', () => {
    const { fixture, root, buttonByText } = setup();

    buttonByText('Admin Inventory')!.click();
    fixture.detectChanges();
    expect(root.querySelector('app-admin-view')).not.toBeNull();
    expect(root.querySelector('app-vending-view')).toBeNull();

    buttonByText('Vending')!.click();
    fixture.detectChanges();
    expect(root.querySelector('app-vending-view')).not.toBeNull();
  });
});
