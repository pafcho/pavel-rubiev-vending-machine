import { useState } from 'react';
import type { FormEvent } from 'react';
import { validateDraft } from '../../domain/machineReducer.ts';
import type { MachineState, ProductDraft } from '../../domain/machineReducer.ts';
import { formatUSD } from '../../domain/money.ts';
import { MAX_STOCK_PER_PRODUCT } from '../../domain/types.ts';
import type { Product } from '../../domain/types.ts';

interface ProductFormProps {
  state: MachineState;
  product: Product | null;
  onSubmit: (draft: ProductDraft) => void;
  onCancel: () => void;
}

export function ProductForm({ state, product, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? '');
  const [priceInput, setPriceInput] = useState(product ? (product.priceCents / 100).toFixed(2) : '');
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [emoji, setEmoji] = useState(product?.emoji ?? '🛒');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const priceCents = Math.round(Number(priceInput) * 100);
    const draft: ProductDraft = { name, priceCents, stock, emoji };

    const validationError = validateDraft(state, draft, product?.id);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(draft);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-slate-900"
      >
        <h2 id="product-form-title" className="text-lg font-semibold">
          {product ? `Edit ${product.name}` : 'Add product'}
        </h2>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Emoji
          <input
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            maxLength={4}
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Price (USD, multiple of {formatUSD(5)})
          <input
            type="number"
            step="0.05"
            min="0.05"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            required
            className="tabular rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Stock (0–{MAX_STOCK_PER_PRODUCT})
          <input
            type="number"
            min={0}
            max={MAX_STOCK_PER_PRODUCT}
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
            required
            className="tabular rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
