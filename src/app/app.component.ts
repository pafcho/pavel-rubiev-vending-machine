import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { HeaderComponent } from './components/header.component.ts';
import type { MachineTab } from './components/header.component.ts';
import { AdminViewComponent } from './components/admin/admin-view.component.ts';
import { VendingViewComponent } from './components/vending/vending-view.component.ts';
import { MachineStore } from './state/machine.store.ts';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [HeaderComponent, VendingViewComponent, AdminViewComponent],
  providers: [MachineStore],
  template: `
    <div class="mx-auto flex min-h-svh max-w-5xl flex-col">
      <app-header [activeTab]="tab()" (tabChange)="tab.set($event)" />
      <main class="flex-1 p-4 sm:p-6">
        @if (tab() === 'vending') {
          <app-vending-view />
        } @else {
          <app-admin-view />
        }
      </main>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private readonly store = inject(MachineStore);

  protected readonly tab = signal<MachineTab>('vending');

  // The machine loads once at startup, whichever tab is shown.
  ngOnInit(): void {
    this.store.load();
  }
}
