import { formatUSD } from '../../domain/money.ts';
import { MAX_STOCK_PER_PRODUCT } from '../../domain/types.ts';
import type { Product } from '../../domain/types.ts';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRestock: (id: string, delta: number) => void;
}

export function ProductTable({ products, onEdit, onDelete, onRestock }: ProductTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span aria-hidden="true">{product.emoji}</span>
                {product.name}
              </span>
              <span className="tabular">{formatUSD(product.priceCents)}</span>
            </div>
            <RestockControls product={product} onRestock={onRestock} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 rounded-full border border-slate-300 py-1.5 text-sm dark:border-slate-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product.id)}
                className="flex-1 rounded-full border border-red-300 py-1.5 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-slate-500 dark:text-slate-400">
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="px-3 py-2 font-medium">Price</th>
            <th className="px-3 py-2 font-medium">Stock</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-slate-200 dark:border-slate-800">
              <td className="px-3 py-3">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{product.emoji}</span>
                  {product.name}
                </span>
              </td>
              <td className="tabular px-3 py-3">{formatUSD(product.priceCents)}</td>
              <td className="px-3 py-3">
                <RestockControls product={product} onRestock={onRestock} />
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="rounded-full border border-red-300 px-3 py-1 text-red-600 dark:border-red-800 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RestockControls({
  product,
  onRestock,
}: {
  product: Product;
  onRestock: (id: string, delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onRestock(product.id, -1)}
        disabled={product.stock <= 0}
        aria-label={`Remove one ${product.name}`}
        className="rounded-full border border-slate-300 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700"
      >
        −
      </button>
      <span className="tabular w-6 text-center">{product.stock}</span>
      <button
        type="button"
        onClick={() => onRestock(product.id, 1)}
        disabled={product.stock >= MAX_STOCK_PER_PRODUCT}
        aria-label={`Add one ${product.name}`}
        className="rounded-full border border-slate-300 px-2 py-0.5 disabled:opacity-40 dark:border-slate-700"
      >
        +
      </button>
    </div>
  );
}
