import { useState } from 'react';
import type { MachineTab } from './components/Header.tsx';
import { Header } from './components/Header.tsx';
import { AdminView } from './components/admin/AdminView.tsx';
import { VendingView } from './components/vending/VendingView.tsx';
import { MachineProvider } from './state/MachineContext.tsx';

function App() {
  const [tab, setTab] = useState<MachineTab>('vending');

  return (
    <MachineProvider>
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col">
        <Header activeTab={tab} onChangeTab={setTab} />
        <main className="flex-1 p-4 sm:p-6">
          {tab === 'vending' ? <VendingView /> : <AdminView />}
        </main>
      </div>
    </MachineProvider>
  )
}

export default App
