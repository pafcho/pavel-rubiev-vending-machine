import { formatUSD } from '../../domain/money.ts';
import type { Product } from '../../domain/types.ts';

interface ActionBarProps {
  selectedProduct: Product | null;
  insertedTotal: number;
  onBuy: () => void;
  onReturnCoins: () => void;
}

export function ActionBar({ selectedProduct, insertedTotal, onBuy, onReturnCoins }: ActionBarProps) {
  const canBuy =
    selectedProduct !== null && selectedProduct.stock > 0 && insertedTotal >= selectedProduct.priceCents;

  return (
    <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-slate-800 dark:bg-slate-950/95">
      <button
        type="button"
        onClick={onBuy}
        disabled={!canBuy}
        className="flex-1 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
      >
        {selectedProduct
          ? `Buy ${selectedProduct.name} (${formatUSD(selectedProduct.priceCents)})`
          : 'Select a product'}
      </button>
      <button
        type="button"
        onClick={onReturnCoins}
        disabled={insertedTotal === 0}
        className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
      >
        Return Coins
      </button>
    </div>
  );
}
