import { useState } from 'react';
import type { Product } from '../../domain/types.ts';
import { useMachineDispatch, useMachineState } from '../../state/MachineContext.tsx';
import { ProductForm } from './ProductForm.tsx';
import { ProductTable } from './ProductTable.tsx';

export function AdminView() {
  const state = useMachineState();
  const dispatch = useMachineDispatch();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const formOpen = isCreating || editingProduct !== null;

  function closeForm() {
    setIsCreating(false);
    setEditingProduct(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inventory</h2>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add product
        </button>
      </div>

      {state.message && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {state.message.text}
        </div>
      )}

      <ProductTable
        products={state.products}
        onEdit={setEditingProduct}
        onDelete={(id) => dispatch({ type: 'DELETE_PRODUCT', id })}
        onRestock={(id, delta) => dispatch({ type: 'RESTOCK_PRODUCT', id, delta })}
      />

      {formOpen && (
        <ProductForm
          state={state}
          product={editingProduct}
          onSubmit={(draft) => {
            if (editingProduct) {
              dispatch({ type: 'UPDATE_PRODUCT', id: editingProduct.id, draft });
            } else {
              dispatch({ type: 'CREATE_PRODUCT', draft });
            }
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}
