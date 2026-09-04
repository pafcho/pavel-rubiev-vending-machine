import { COIN_LABELS, DENOMINATIONS, bankTotal, formatUSD } from '../../domain/money.ts';
import type { TrayContents } from '../../domain/machineReducer.ts';

interface OutputTrayProps {
  tray: TrayContents;
  onCollect: () => void;
}

export function OutputTray({ tray, onCollect }: OutputTrayProps) {
  const changeTotal = bankTotal(tray.coins);
  const hasItems = tray.items.length > 0;
  const hasCoins = changeTotal > 0;

  if (!hasItems && !hasCoins) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Output tray</h2>
        <button
          type="button"
          onClick={onCollect}
          className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          Collect
        </button>
      </div>

      {hasItems && (
        <ul className="flex flex-wrap gap-2">
          {tray.items.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm dark:bg-black/20"
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      )}

      {hasCoins && (
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Change: {formatUSD(changeTotal)}</span>
          <ul className="flex flex-wrap gap-3 text-amber-800 dark:text-amber-200">
            {DENOMINATIONS.filter((coin) => tray.coins[coin] > 0).map((coin) => (
              <li key={coin} className="tabular">
                {tray.coins[coin]} × {COIN_LABELS[coin]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
