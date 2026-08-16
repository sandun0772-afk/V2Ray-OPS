import { useCallback, useMemo, useState } from 'react';
import {
  Server,
  Activity,
  AlertTriangle,
  Users,
  HardDrive,
  Globe2,
  RefreshCw,
  HeartPulse,
  X,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store';
import type { Banner, ToastType, Vps } from '@/types';
import { randomBandwidth, randomClients, randomInbounds, rollHealthCheck, newId } from '@/lib/mockData';
import { formatBandwidth, formatCost } from '@/lib/format';
import { AddVpsModal } from '@/components/AddVpsModal';
import { VpsTable } from '@/components/VpsTable';
import { Card, PageHeader, StatCard } from '@/components/ui';

const bannerIcon = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Activity,
};

const bannerStyle: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
};

export function VpsManagerPage() {
  const { vpsList, setVpsList, pushToast, banner, setBanner } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [healthCheckingId, setHealthCheckingId] = useState<string | null>(null);

  const handleAddVps = useCallback(
    (vps: Vps) => {
      setVpsList((prev) => [vps, ...prev]);
    },
    [setVpsList]
  );

  const handleSync = useCallback(
    (id: string) => {
      setSyncingId(id);
      setVpsList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'syncing' } : v))
      );
      setTimeout(() => {
        setVpsList((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: 'online',
                  bandwidthGb: randomBandwidth(),
                  clients: randomClients(),
                  inbounds: randomInbounds(),
                  lastSync: new Date().toISOString(),
                }
              : v
          )
        );
        setSyncingId(null);
        const vps = vpsList.find((v) => v.id === id);
        pushToast('success', 'Panel synced', `${vps?.name ?? 'Node'} stats refreshed from 3x-ui API.`);
      }, 2000);
    },
    [vpsList, setVpsList, pushToast]
  );

  const handleHealthCheck = useCallback(
    (id: string) => {
      setHealthCheckingId(id);
      setTimeout(() => {
        const vps = vpsList.find((v) => v.id === id);
        const { ok, latencyMs } = rollHealthCheck();
        setVpsList((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: ok ? 'online' : 'error' } : v))
        );
        setHealthCheckingId(null);
        const newBanner: Banner = {
          id: newId('banner'),
          type: ok ? 'success' : 'error',
          title: ok ? 'Node healthy' : 'Node unreachable',
          message: ok
            ? `${vps?.name ?? 'Node'} responded in ${latencyMs}ms — SSH + panel API OK.`
            : `${vps?.name ?? 'Node'} failed SSH/API probe — check credentials or firewall.`,
          vpsName: vps?.name ?? 'Node',
        };
        setBanner(newBanner);
        pushToast(
          ok ? 'success' : 'error',
          ok ? 'Health check passed' : 'Health check failed',
          ok ? `Latency ${latencyMs}ms` : 'SSH or API endpoint not responding.'
        );
      }, 1800);
    },
    [vpsList, setVpsList, pushToast, setBanner]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const vps = vpsList.find((v) => v.id === id);
      setVpsList((prev) => prev.filter((v) => v.id !== id));
      if (banner?.vpsName === vps?.name) setBanner(null);
      pushToast('info', 'Node removed', `${vps?.name ?? 'Node'} was deleted from the dashboard.`);
    },
    [vpsList, banner, setVpsList, setBanner, pushToast]
  );

  const stats = useMemo(() => {
    const total = vpsList.length;
    const online = vpsList.filter((v) => v.status === 'online').length;
    const error = vpsList.filter((v) => v.status === 'error').length;
    const totalClients = vpsList.reduce((sum, v) => sum + v.clients, 0);
    const totalBandwidth = vpsList.reduce((sum, v) => sum + v.bandwidthGb, 0);
    const monthlyCost = vpsList.reduce((sum, v) => sum + v.monthlyCost, 0);
    return { total, online, error, totalClients, totalBandwidth, monthlyCost };
  }, [vpsList]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="VPS Manager"
        subtitle="Provision, connect and monitor your 3x-ui nodes"
        icon={<Server className="h-6 w-6" />}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-150 hover:bg-sky-400 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add New VPS
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Server className="h-4 w-4" />} label="Total Nodes" value={String(stats.total)} tone="sky" />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Online" value={String(stats.online)} tone="emerald" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Errors" value={String(stats.error)} tone="rose" />
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Clients" value={String(stats.totalClients)} tone="violet" />
        <StatCard icon={<HardDrive className="h-4 w-4" />} label="Aggregate BW" value={formatBandwidth(stats.totalBandwidth)} tone="amber" />
        <StatCard icon={<Globe2 className="h-4 w-4" />} label="Monthly Cost" value={formatCost(stats.monthlyCost)} tone="slate" />
      </div>

      {banner && (
        <div className={`modal-in flex items-start gap-3 rounded-xl border p-3.5 ${bannerStyle[banner.type]}`}>
          {(() => {
            const Icon = bannerIcon[banner.type];
            return <Icon className="mt-0.5 h-5 w-5 shrink-0" />;
          })()}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">{banner.title}</p>
            <p className="text-xs text-slate-300/90">{banner.message}</p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Managed Nodes</h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {vpsList.length}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Sync Panel
            </span>
            <span className="inline-flex items-center gap-1">
              <HeartPulse className="h-3 w-3" /> Health Check
            </span>
          </div>
        </div>
        <VpsTable
          vpsList={vpsList}
          onSync={handleSync}
          onHealthCheck={handleHealthCheck}
          onDelete={handleDelete}
          syncingId={syncingId}
          healthCheckingId={healthCheckingId}
        />
      </Card>

      <AddVpsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleAddVps}
        pushToast={pushToast}
      />
    </div>
  );
}
