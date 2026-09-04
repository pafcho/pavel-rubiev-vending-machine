import { COIN_LABELS, DENOMINATIONS, bankTotal, formatUSD } from '../../domain/money.ts';
import type { CoinBank } from '../../domain/money.ts';

interface BankPanelProps {
  bank: CoinBank;
}

/** Collapsible debug panel so the change algorithm's inputs stay inspectable. */
export function BankPanel({ bank }: BankPanelProps) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
      <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-400">
        Machine float (debug): {formatUSD(bankTotal(bank))}
      </summary>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DENOMINATIONS.map((coin) => (
          <li key={coin} className="tabular rounded-lg bg-slate-50 px-3 py-2 text-center dark:bg-slate-800">
            {bank[coin]} × {COIN_LABELS[coin]}
          </li>
        ))}
      </ul>
    </details>
  );
}
