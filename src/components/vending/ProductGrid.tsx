import type { Product } from '../../domain/types.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductGridProps {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canAfford: (product: Product) => boolean;
}

export function ProductGrid({ products, selectedId, onSelect, canAfford }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selected={product.id === selectedId}
          affordable={canAfford(product)}
          onSelect={() => onSelect(product.id)}
        />
      ))}
    </div>
  );
}
