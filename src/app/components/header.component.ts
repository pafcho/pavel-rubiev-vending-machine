import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type MachineTab = 'vending' | 'admin';

const ACTIVE_TAB_CLASS = 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100';
const INACTIVE_TAB_CLASS =
  'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <header
      class="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-800 dark:bg-slate-950/90"
    >
      <h1 class="text-xl font-semibold tracking-tight sm:text-2xl">Vending Machine</h1>
      <nav
        class="flex gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-900"
        role="tablist"
        aria-label="Views"
      >
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            role="tab"
            class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            [class]="tabClass(tab.id)"
            [attr.aria-selected]="activeTab() === tab.id"
            (click)="tabChange.emit(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </nav>
    </header>
  `,
})
export class HeaderComponent {
  readonly activeTab = input.required<MachineTab>();
  readonly tabChange = output<MachineTab>();

  protected readonly tabs: readonly { id: MachineTab; label: string }[] = [
    { id: 'vending', label: 'Vending' },
    { id: 'admin', label: 'Admin Inventory' },
  ];

  protected tabClass(tab: MachineTab): string {
    return this.activeTab() === tab ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS;
  }
}
