import { COIN_LABELS, DENOMINATIONS, formatUSD } from '../../domain/money.ts';
import type { CoinValue } from '../../domain/money.ts';

interface CoinSlotProps {
  insertedTotal: number;
  onInsert: (coin: CoinValue) => void;
}

/** The coin slot (four accepted denominations) plus the running credit display. */
export function CoinSlot({ insertedTotal, onInsert }: CoinSlotProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Insert coins</h2>
        <span className="tabular text-lg font-semibold">{formatUSD(insertedTotal)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {DENOMINATIONS.map((coin) => (
          <button
            key={coin}
            type="button"
            onClick={() => onInsert(coin)}
            className="tabular rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-indigo-950"
          >
            {COIN_LABELS[coin]}
          </button>
        ))}
      </div>
    </section>
  );
}
