import { useMemo } from 'react';
import {
  Server,
  Users,
  HardDrive,
  TrendingUp,
  Wallet,
  AlertTriangle,
  UserPlus,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  CircleAlert,
} from 'lucide-react';
import { useStore } from '@/store';
import type { PageId } from '@/types';
import { daysUntil, formatBandwidth, formatCost } from '@/lib/format';
import { Card, PageHeader, StatCard } from '@/components/ui';

type ExpiryLevel = 'safe' | 'danger' | 'expired-vps-first';

interface ExpiryWarning {
  clientId: string;
  remark: string;
  clientDays: number;
  vpsName: string;
  vpsDays: number;
  level: ExpiryLevel;
}

function classifyExpiry(clientDays: number, vpsDays: number): ExpiryLevel {
  if (vpsDays < clientDays && vpsDays < 30) return 'expired-vps-first';
  if (clientDays > vpsDays) return 'danger';
  return 'safe';
}

const levelConfig: Record<ExpiryLevel, { icon: typeof AlertTriangle; chip: string; label: string }> = {
  safe: { icon: ShieldCheck, chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200', label: 'WARNING' },
  danger: { icon: ShieldAlert, chip: 'border-rose-500/30 bg-rose-500/10 text-rose-200', label: 'DANGER' },
  'expired-vps-first': { icon: CircleAlert, chip: 'border-rose-500/40 bg-rose-500/15 text-rose-100', label: 'EXPIRED ALERT' },
};

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { vpsList, clients, presets } = useStore();

  const stats = useMemo(() => {
    const activeVps = vpsList.length;
    const activeClients = clients.filter((c) => c.status !== 'expired').length;
    const totalTraffic = vpsList.reduce((s, v) => s + v.bandwidthGb, 0);
    const monthlyRevenue = clients.reduce((s, c) => s + c.sellingPrice, 0);
    const vpsExpenses = vpsList.reduce((s, v) => s + v.monthlyCost, 0);
    const netProfit = monthlyRevenue - vpsExpenses;
    return { activeVps, activeClients, totalTraffic, monthlyRevenue, vpsExpenses, netProfit };
  }, [vpsList, clients]);

  const warnings = useMemo<ExpiryWarning[]>(() => {
    return clients
      .map((c) => {
        const vps = vpsList.find((v) => v.id === c.vpsId);
        if (!vps) return null;
        const clientDays = daysUntil(c.expiryDate);
        const vpsDays = daysUntil(vps.expirationDate);
        const level = classifyExpiry(clientDays, vpsDays);
        return {
          clientId: c.id,
          remark: c.remark,
          clientDays,
          vpsName: vps.name,
          vpsDays,
          level,
        } as ExpiryWarning;
      })
      .filter((w): w is ExpiryWarning => w !== null)
      .sort((a, b) => {
        const order: Record<ExpiryLevel, number> = { 'expired-vps-first': 0, danger: 1, safe: 2 };
        return order[a.level] - order[b.level];
      });
  }, [clients, vpsList]);

  const dangerCount = warnings.filter((w) => w.level !== 'safe').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Overview"
        subtitle="At-a-glance health of your VPN operation"
        icon={<TrendingUp className="h-6 w-6" />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<Server className="h-4 w-4" />} label="Active VPS" value={String(stats.activeVps)} tone="sky" />
        <StatCard icon={<Users className="h-4 w-4" />} label="Active Clients" value={String(stats.activeClients)} tone="violet" />
        <StatCard icon={<HardDrive className="h-4 w-4" />} label="Total Traffic" value={formatBandwidth(stats.totalTraffic)} tone="amber" />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Monthly Revenue" value={formatCost(stats.monthlyRevenue)} tone="emerald" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Net Profit" value={formatCost(stats.netProfit)} tone="cyan" sub={`after ${formatCost(stats.vpsExpenses)} hosting`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Expiry warnings */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-200">Priority Expiry Warnings</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${dangerCount > 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
              {dangerCount > 0 ? `${dangerCount} need attention` : 'All clear'}
            </span>
          </div>
          <div className="divide-y divide-slate-800/70">
            {warnings.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No clients to analyze.</p>
            )}
            {warnings.map((w) => {
              const cfg = levelConfig[w.level];
              const Icon = cfg.icon;
              const msg =
                w.level === 'expired-vps-first'
                  ? `Client '${w.remark}' (Expires in ${w.clientDays}d) is on VPS '${w.vpsName}' (Expires in ${w.vpsDays}d) — VPS will expire first!`
                  : w.level === 'danger'
                    ? `Client '${w.remark}' (Expires in ${w.clientDays}d) is assigned to '${w.vpsName}' which expires in ${w.vpsDays}d.`
                    : `Client '${w.remark}' (Expires in ${w.clientDays}d) is assigned to '${w.vpsName}' which expires in ${w.vpsDays}d (Safe).`;
              return (
                <div key={w.clientId} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${cfg.chip}`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-300">{msg}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3.5">
            <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <QuickAction
              icon={<UserPlus className="h-4 w-4" />}
              label="Quick Add Client"
              desc="Onboard a new VPN client"
              onClick={() => onNavigate('clients')}
            />
            <QuickAction
              icon={<Server className="h-4 w-4" />}
              label="Add VPS Node"
              desc="Provision or link a 3x-ui panel"
              onClick={() => onNavigate('vps')}
            />
            <QuickAction
              icon={<Calculator className="h-4 w-4" />}
              label="View Financials"
              desc="Revenue, expenses & pricing"
              onClick={() => onNavigate('financials')}
            />
          </div>
          <div className="border-t border-slate-800/70 px-4 py-3">
            <p className="text-[11px] text-slate-500">
              {presets.length} presets available for fast onboarding
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left transition-all duration-150 hover:border-sky-500/30 hover:bg-slate-800/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 transition-colors group-hover:bg-sky-500/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  );
}
