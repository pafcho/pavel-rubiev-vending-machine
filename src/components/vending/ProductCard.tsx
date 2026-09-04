import { formatUSD } from '../../domain/money.ts';
import type { Product } from '../../domain/types.ts';

interface ProductCardProps {
  product: Product;
  selected: boolean;
  affordable: boolean;
  onSelect: () => void;
}

export function ProductCard({ product, selected, affordable, onSelect }: ProductCardProps) {
  const soldOut = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soldOut}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-950'
          : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <span className="text-4xl" aria-hidden="true">
        {product.emoji}
      </span>
      <span className="font-medium">{product.name}</span>
      <span className="tabular text-lg font-semibold">{formatUSD(product.priceCents)}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {soldOut ? 'Sold out' : `${product.stock} left`}
      </span>
      {!soldOut && !affordable && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Insert more coins</span>
      )}
    </button>
  );
}
