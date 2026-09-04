import type { MachineState } from '../../domain/machineReducer.ts';

interface StatusBannerProps {
  state: MachineState;
  onRetry: () => void;
  onDismissMessage: () => void;
}

const MESSAGE_TONE: Record<'info' | 'success' | 'error', string> = {
  info: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
};

export function StatusBanner({ state, onRetry, onDismissMessage }: StatusBannerProps) {
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col gap-3" role="status" aria-live="polite">
        <span className="sr-only">Loading the vending machine…</span>
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
      >
        <p className="font-medium">Could not load the vending machine.</p>
        <p className="text-sm">{state.error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state.message) {
    // Kept mounted (empty) so screen readers pick up the next announcement.
    return <div aria-live="polite" className="sr-only" />;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${MESSAGE_TONE[state.message.kind]}`}
    >
      <span>{state.message.text}</span>
      <button
        type="button"
        onClick={onDismissMessage}
        aria-label="Dismiss message"
        className="shrink-0 rounded-full px-2 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}
