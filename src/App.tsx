import { useState } from 'react';
import { Shield, LogIn } from 'lucide-react';
import type { PageId } from '@/types';
import { StoreProvider, useStore } from '@/store';
import { Sidebar } from '@/components/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { Button } from '@/components/ui';
import { DashboardPage } from '@/pages/DashboardPage';
import { VpsManagerPage } from '@/pages/VpsManagerPage';
import { ClientManagerPage } from '@/pages/ClientManagerPage';
import { PresetsPage } from '@/pages/PresetsPage';
import { FinancialsPage } from '@/pages/FinancialsPage';

function AppShell() {
  const { toasts, dismissToast } = useStore();
  const [page, setPage] = useState<PageId>('dashboard');
  const [loggedOut, setLoggedOut] = useState(false);

  if (loggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div
          className="pointer-events-none fixed inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(900px circle at 12% -10%, rgba(14,165,233,0.10), transparent 45%), radial-gradient(800px circle at 95% 8%, rgba(16,185,129,0.08), transparent 45%)',
          }}
        />
        <div className="modal-in relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-100">You've been logged out</h1>
          <p className="mt-1 text-sm text-slate-500">Session ended. Sign back in to manage your nodes.</p>
          <Button className="mt-6 w-full" onClick={() => setLoggedOut(false)}>
            <LogIn className="h-4 w-4" />
            Sign Back In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(900px circle at 12% -10%, rgba(14,165,233,0.10), transparent 45%), radial-gradient(800px circle at 95% 8%, rgba(16,185,129,0.08), transparent 45%)',
        }}
      />

      <Sidebar current={page} onNavigate={setPage} onLogout={() => setLoggedOut(true)} />

      {/* Main content — offset for desktop sidebar */}
      <div className="lg:pl-60">
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div key={page} className="modal-in">
            {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
            {page === 'vps' && <VpsManagerPage />}
            {page === 'clients' && <ClientManagerPage />}
            {page === 'presets' && <PresetsPage />}
            {page === 'financials' && <FinancialsPage />}
          </div>

          <footer className="mt-8 pb-4 text-center text-xs text-slate-600">
            Simulated provisioning environment · No real SSH/API calls are made
          </footer>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
