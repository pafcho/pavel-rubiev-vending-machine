import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { Product } from '../../../domain/types.ts';
import { ActionBarComponent } from './action-bar.component.ts';

const cola: Product = { id: 'cola', name: 'Cola', priceCents: 125, stock: 3, emoji: '🥤' };

function setup(inputs: { selectedProduct: Product | null; insertedTotal: number }) {
  const fixture = TestBed.createComponent(ActionBarComponent);
  fixture.componentRef.setInput('selectedProduct', inputs.selectedProduct);
  fixture.componentRef.setInput('insertedTotal', inputs.insertedTotal);
  fixture.detectChanges();

  const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
  return { fixture, buy: buttons[0]!, returnCoins: buttons[1]! };
}

describe('ActionBarComponent', () => {
  it('prompts for a selection and disables both buttons when idle', () => {
    const { buy, returnCoins } = setup({ selectedProduct: null, insertedTotal: 0 });

    expect(buy.textContent?.trim()).toBe('Select a product');
    expect(buy.disabled).toBe(true);
    expect(returnCoins.disabled).toBe(true);
  });

  it('keeps Buy disabled until the credit covers the price', () => {
    const { buy } = setup({ selectedProduct: cola, insertedTotal: 100 });

    expect(buy.textContent?.trim()).toBe('Buy Cola ($1.25)');
    expect(buy.disabled).toBe(true);
  });

  it('emits buy and returnCoins when affordable', () => {
    const { fixture, buy, returnCoins } = setup({ selectedProduct: cola, insertedTotal: 150 });
    const emitted: string[] = [];
    fixture.componentInstance.buy.subscribe(() => emitted.push('buy'));
    fixture.componentInstance.returnCoins.subscribe(() => emitted.push('return'));

    buy.click();
    returnCoins.click();

    expect(buy.disabled).toBe(false);
    expect(emitted).toEqual(['buy', 'return']);
  });
});
