export type MachineTab = 'vending' | 'admin';

interface HeaderProps {
  activeTab: MachineTab;
  onChangeTab: (tab: MachineTab) => void;
}

export function Header({ activeTab, onChangeTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-800 dark:bg-slate-950/90">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Vending Machine</h1>
      <nav
        className="flex gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-900"
        role="tablist"
        aria-label="Views"
      >
        <TabButton label="Vending" active={activeTab === 'vending'} onClick={() => onChangeTab('vending')} />
        <TabButton
          label="Admin Inventory"
          active={activeTab === 'admin'}
          onClick={() => onChangeTab('admin')}
        />
      </nav>
    </header>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
