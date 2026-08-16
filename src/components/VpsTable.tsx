import { useState } from 'react';
import {
  RefreshCw,
  HeartPulse,
  Trash2,
  Globe,
  Calendar,
  Users,
  Network,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import type { Vps } from '@/types';
import { formatBandwidth, formatCost, formatRelative, daysUntil } from '@/lib/format';
import { IconButton, Spinner, VpsStatusBadge } from '@/components/ui';

interface VpsTableProps {
  vpsList: Vps[];
  onSync: (id: string) => void;
  onHealthCheck: (id: string) => void;
  onDelete: (id: string) => void;
  syncingId: string | null;
  healthCheckingId: string | null;
}

export function VpsTable({
  vpsList,
  onSync,
  onHealthCheck,
  onDelete,
  syncingId,
  healthCheckingId,
}: VpsTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<Vps | null>(null);

  if (vpsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
          <Globe className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300">No VPS nodes yet</p>
          <p className="text-xs text-slate-500">
            Click "Add New VPS" to provision or connect your first 3x-ui panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Node</th>
              <th className="px-4 py-3 font-medium">Endpoint</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Stats</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {vpsList.map((vps) => {
              const days = daysUntil(vps.expirationDate);
              const expiringSoon = days <= 14;
              const isSyncing = syncingId === vps.id;
              const isHealthChecking = healthCheckingId === vps.id;
              return (
                <tr
                  key={vps.id}
                  className="group transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 ring-1 ring-slate-700/50">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-100">{vps.name}</p>
                        <p className="text-xs text-slate-500">
                          {vps.type === 'installed' ? 'Installed panel' : 'Connected panel'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-slate-300">{vps.ip}</p>
                    <p className="font-mono text-xs text-slate-500">
                      :{vps.type === 'installed' ? vps.sshPort ?? vps.port : vps.panelPort ?? vps.port}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <VpsStatusBadge status={vps.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                        {formatBandwidth(vps.bandwidthGb)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {vps.clients} clients
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Network className="h-3.5 w-3.5 text-slate-500" />
                        {vps.inbounds} inbounds
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs">
                      <p className={expiringSoon ? 'text-amber-300' : 'text-slate-300'}>
                        {new Date(vps.expirationDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className={expiringSoon ? 'text-amber-400/80' : 'text-slate-500'}>
                        {days > 0 ? `in ${days}d` : `${Math.abs(days)}d overdue`}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-slate-300">{formatCost(vps.monthlyCost)}</span>
                    <p className="text-[10px] text-slate-500">last sync {formatRelative(vps.lastSync)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        onClick={() => onSync(vps.id)}
                        disabled={isSyncing}
                        title="Sync Panel"
                        variant="primary"
                      >
                        {isSyncing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        <span className="hidden xl:inline">Sync</span>
                      </IconButton>
                      <IconButton
                        onClick={() => onHealthCheck(vps.id)}
                        disabled={isHealthChecking}
                        title="Health Check"
                      >
                        {isHealthChecking ? <Spinner className="h-3.5 w-3.5" /> : <HeartPulse className="h-3.5 w-3.5" />}
                        <span className="hidden xl:inline">Health</span>
                      </IconButton>
                      <IconButton
                        onClick={() => setConfirmDelete(vps)}
                        title="Delete Node"
                        variant="danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">Delete</span>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-3 lg:hidden">
        {vpsList.map((vps) => {
          const days = daysUntil(vps.expirationDate);
          const expiringSoon = days <= 14;
          const isSyncing = syncingId === vps.id;
          const isHealthChecking = healthCheckingId === vps.id;
          return (
            <div
              key={vps.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{vps.name}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {vps.ip}:{vps.type === 'installed' ? vps.sshPort ?? vps.port : vps.panelPort ?? vps.port}
                    </p>
                  </div>
                </div>
                <VpsStatusBadge status={vps.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Stat icon={<HardDrive className="h-3 w-3" />} label="Bandwidth" value={formatBandwidth(vps.bandwidthGb)} />
                <Stat icon={<Users className="h-3 w-3" />} label="Clients" value={String(vps.clients)} />
                <Stat icon={<Network className="h-3 w-3" />} label="Inbounds" value={String(vps.inbounds)} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span className={expiringSoon ? 'text-amber-300' : ''}>
                    {days > 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                  </span>
                </span>
                <span className="text-slate-300">{formatCost(vps.monthlyCost)}/mo</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-slate-800 pt-3">
                <IconButton
                  onClick={() => onSync(vps.id)}
                  disabled={isSyncing}
                  title="Sync Panel"
                  variant="primary"
                >
                  {isSyncing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sync
                </IconButton>
                <IconButton
                  onClick={() => onHealthCheck(vps.id)}
                  disabled={isHealthChecking}
                  title="Health Check"
                >
                  {isHealthChecking ? <Spinner className="h-3.5 w-3.5" /> : <HeartPulse className="h-3.5 w-3.5" />}
                  Health
                </IconButton>
                <IconButton
                  onClick={() => setConfirmDelete(vps)}
                  title="Delete Node"
                  variant="danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <DeleteConfirm
          vps={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            onDelete(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 px-2 py-1.5">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-medium text-slate-200">{value}</p>
    </div>
  );
}

function DeleteConfirm({
  vps,
  onCancel,
  onConfirm,
}: {
  vps: Vps;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm backdrop-in"
      onClick={onCancel}
    >
      <div
        className="modal-in w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Delete this node?</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              <span className="font-medium text-slate-200">{vps.name}</span> ({vps.ip}) will be
              removed from the dashboard. This does not touch the actual server.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-colors hover:bg-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}


