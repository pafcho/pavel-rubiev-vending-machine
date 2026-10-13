import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MachineMessage, MachineStatus } from '../../../domain/machineReducer.ts';

const MESSAGE_TONE: Record<MachineMessage['kind'], string> = {
  info: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
};

@Component({
  selector: 'app-status-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (status() === 'loading') {
      <div class="flex flex-col gap-3" role="status" aria-live="polite">
        <span class="sr-only">Loading the vending machine…</span>
        <div class="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          @for (slot of skeletonSlots; track slot) {
            <div class="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          }
        </div>
      </div>
    } @else if (status() === 'error') {
      <div
        role="alert"
        class="flex flex-col items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
      >
        <p class="font-medium">Could not load the vending machine.</p>
        <p class="text-sm">{{ error() }}</p>
        <button
          type="button"
          class="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          (click)="retry.emit()"
        >
          Retry
        </button>
      </div>
    } @else {
      @if (message(); as activeMessage) {
        <div
          role="status"
          aria-live="polite"
          class="flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"
          [class]="tone[activeMessage.kind]"
        >
          <span>{{ activeMessage.text }}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            class="shrink-0 rounded-full px-2 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
            (click)="dismissMessage.emit()"
          >
            ✕
          </button>
        </div>
      } @else {
        <!-- Kept mounted (empty) so screen readers pick up the next announcement. -->
        <div aria-live="polite" class="sr-only"></div>
      }
    }
  `,
})
export class StatusBannerComponent {
  readonly status = input.required<MachineStatus>();
  readonly error = input.required<string | null>();
  readonly message = input.required<MachineMessage | null>();
  readonly retry = output<void>();
  readonly dismissMessage = output<void>();

  protected readonly tone = MESSAGE_TONE;
  protected readonly skeletonSlots = [0, 1, 2, 3, 4, 5];
}
