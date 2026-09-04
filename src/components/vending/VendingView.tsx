import { useState } from 'react';
import { selectCanAfford, selectInsertedTotal } from '../../domain/machineReducer.ts';
import { useMachineDispatch, useMachineState } from '../../state/MachineContext.tsx';
import { ActionBar } from './ActionBar.tsx';
import { BankPanel } from './BankPanel.tsx';
import { CoinSlot } from './CoinSlot.tsx';
import { OutputTray } from './OutputTray.tsx';
import { ProductGrid } from './ProductGrid.tsx';
import { StatusBanner } from './StatusBanner.tsx';

export function VendingView() {
  const state = useMachineState();
  const dispatch = useMachineDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The load effect only runs on mount, so a retry re-requests it the
  // simplest way available without reaching into the (unmodified) provider.
  const retry = () => window.location.reload();
  const dismissMessage = () => dispatch({ type: 'DISMISS_MESSAGE' });

  if (state.status !== 'ready') {
    return <StatusBanner state={state} onRetry={retry} onDismissMessage={dismissMessage} />;
  }

  const selectedProduct = state.products.find((product) => product.id === selectedId) ?? null;
  const insertedTotal = selectInsertedTotal(state);

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-6">
      <StatusBanner state={state} onRetry={retry} onDismissMessage={dismissMessage} />

      <ProductGrid
        products={state.products}
        selectedId={selectedId}
        onSelect={setSelectedId}
        canAfford={(product) => selectCanAfford(state, product)}
      />

      <CoinSlot insertedTotal={insertedTotal} onInsert={(coin) => dispatch({ type: 'INSERT_COIN', coin })} />

      <OutputTray tray={state.tray} onCollect={() => dispatch({ type: 'COLLECT_TRAY' })} />

      <BankPanel bank={state.bank} />

      <ActionBar
        selectedProduct={selectedProduct}
        insertedTotal={insertedTotal}
        onBuy={() => {
          if (selectedProduct) dispatch({ type: 'BUY', productId: selectedProduct.id });
        }}
        onReturnCoins={() => dispatch({ type: 'RESET' })}
      />
    </div>
  );
}
