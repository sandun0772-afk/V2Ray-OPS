import { useState } from 'react';
import {
  LayoutDashboard,
  Server,
  Users,
  Package,
  Calculator,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import type { PageId } from '@/types';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vps', label: 'VPS Manager', icon: Server },
  { id: 'clients', label: 'Client Manager', icon: Users },
  { id: 'presets', label: 'Presets', icon: Package },
  { id: 'financials', label: 'Financials', icon: Calculator },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
}

export function Sidebar({ current, onNavigate, onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setMobileOpen(false);
            }}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-sky-500/10 text-sky-300'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sky-400" />
            )}
            <Icon
              className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}
              size={18}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
        <Shield className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-slate-100">v2ray ops</p>
        <p className="text-[10px] text-slate-500">Control Panel</p>
      </div>
    </div>
  );

  const logoutBtn = (
    <button
      onClick={onLogout}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-300"
    >
      <LogOut className="h-4.5 w-4.5" size={18} />
      Logout
    </button>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-800/80 bg-slate-950/80 p-3 backdrop-blur-sm lg:flex">
        <div className="py-2">{brand}</div>
        <div className="mt-4 flex-1">{navList}</div>
        <div className="border-t border-slate-800/80 pt-3">{logoutBtn}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        {brand}
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="backdrop-in absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div
            className="modal-in absolute left-0 top-0 h-full w-64 border-r border-slate-800 bg-slate-950 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between py-2">
              {brand}
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              {navList}
              <div className="mt-auto border-t border-slate-800/80 pt-3">{logoutBtn}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
