import { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  AlertTriangle,
  UserPlus,
  Mail,
  Globe,
  Network,
  Calendar,
  DollarSign,
  Gauge,
  Server,
} from 'lucide-react';
import { useStore } from '@/store';
import type { Client, ClientStatus, Protocol } from '@/types';
import { CUSTOM_PRESET_ID, newId } from '@/lib/mockData';
import { daysUntil, formatBandwidth, formatCost } from '@/lib/format';
import {
  Button,
  Card,
  ClientStatusBadge,
  Field,
  IconButton,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatCard,
  TextInput,
} from '@/components/ui';

const PROTOCOL_LABEL: Record<Protocol, string> = {
  vless: 'VLESS',
  vmess: 'VMess',
  trojan: 'Trojan',
};

function deriveStatus(expiryDate: string): ClientStatus {
  const d = daysUntil(expiryDate);
  if (d < 0) return 'expired';
  if (d <= 7) return 'expiring';
  return 'active';
}

interface ClientFormState {
  remark: string;
  email: string;
  vpsId: string;
  presetId: string;
  protocol: Protocol;
  sni: string;
  dataLimitGb: string;
  durationDays: string;
  sellingPrice: string;
}

const emptyForm: ClientFormState = {
  remark: '',
  email: '',
  vpsId: '',
  presetId: '',
  protocol: 'vless',
  sni: 'cdn.cloudflare.com',
  dataLimitGb: '50',
  durationDays: '30',
  sellingPrice: '1000',
};

export function ClientManagerPage() {
  const { clients, setClients, vpsList, presets, priceConfig, pushToast } = useStore();
  const [search, setSearch] = useState('');
  const [vpsFilter, setVpsFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  const vpsNameById = useMemo(() => {
    const map: Record<string, string> = {};
    vpsList.forEach((v) => {
      map[v.id] = v.name;
    });
    return map;
  }, [vpsList]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.remark.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesVps = vpsFilter === 'all' || c.vpsId === vpsFilter;
      return matchesSearch && matchesVps;
    });
  }, [clients, search, vpsFilter]);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.status !== 'expired').length;
    const expiring = clients.filter((c) => c.status === 'expiring').length;
    const expired = clients.filter((c) => c.status === 'expired').length;
    const revenue = clients.reduce((s, c) => s + c.sellingPrice, 0);
    return { active, expiring, expired, revenue, total: clients.length };
  }, [clients]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      vpsId: vpsList[0]?.id ?? '',
      presetId: presets[0]?.id ?? '',
      protocol: presets[0]?.protocol ?? 'vless',
      sni: presets[0]?.sni ?? 'cdn.cloudflare.com',
      dataLimitGb: String(presets[0]?.dataLimitGb ?? 50),
      durationDays: String(presets[0]?.durationDays ?? 30),
      sellingPrice: String(presets[0]?.suggestedPrice ?? 1000),
    });
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      remark: client.remark,
      email: client.email ?? '',
      vpsId: client.vpsId,
      presetId: CUSTOM_PRESET_ID,
      protocol: client.protocol,
      sni: client.sni,
      dataLimitGb: String(client.dataLimitGb),
      durationDays: String(Math.max(1, daysUntil(client.expiryDate))),
      sellingPrice: String(client.sellingPrice),
    });
    setModalOpen(true);
  };

  const applyPreset = (presetId: string) => {
    if (presetId === CUSTOM_PRESET_ID) {
      setForm((f) => ({ ...f, presetId }));
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setForm((f) => ({
      ...f,
      presetId,
      protocol: preset.protocol,
      sni: preset.sni,
      dataLimitGb: String(preset.dataLimitGb),
      durationDays: String(preset.durationDays),
      sellingPrice: String(preset.suggestedPrice),
    }));
  };

  const calcPriceHint = (): string => {
    const gb = Number(form.dataLimitGb) || 0;
    const rate = priceConfig.baseRatePerGb;
    if (gb === 0) return `Unlimited — flat rate suggested`;
    const calc = gb * rate;
    return `Calculated at ${priceConfig.currency} ${rate}/GB → ${priceConfig.currency} ${calc.toLocaleString('en-PK')}`;
  };

  const handleSubmit = () => {
    if (!form.remark.trim()) {
      pushToast('warning', 'Missing field', 'Client name/remark is required.');
      return;
    }
    if (!form.vpsId) {
      pushToast('warning', 'Missing field', 'Please select a VPS node.');
      return;
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (Number(form.durationDays) || 30));
    const expiryDate = expiry.toISOString().slice(0, 10);

    if (editingId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                remark: form.remark.trim(),
                email: form.email.trim() || undefined,
                vpsId: form.vpsId,
                protocol: form.protocol,
                sni: form.sni,
                dataLimitGb: Number(form.dataLimitGb) || 0,
                sellingPrice: Number(form.sellingPrice) || 0,
                expiryDate,
                status: deriveStatus(expiryDate),
              }
            : c
        )
      );
      pushToast('success', 'Client updated', `${form.remark.trim()} has been saved.`);
    } else {
      const newClient: Client = {
        id: newId('c'),
        remark: form.remark.trim(),
        email: form.email.trim() || undefined,
        vpsId: form.vpsId,
        protocol: form.protocol,
        sni: form.sni,
        dataLimitGb: Number(form.dataLimitGb) || 0,
        expiryDate,
        sellingPrice: Number(form.sellingPrice) || 0,
        status: deriveStatus(expiryDate),
        dataUsedGb: 0,
      };
      setClients((prev) => [newClient, ...prev]);
      pushToast('success', 'Client created', `${form.remark.trim()} added to ${vpsNameById[form.vpsId] ?? 'node'}.`);
    }
    setModalOpen(false);
  };

  const handleRenew = (client: Client) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const expiryDate = expiry.toISOString().slice(0, 10);
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? { ...c, expiryDate, status: 'active', dataUsedGb: 0 }
          : c
      )
    );
    pushToast('success', 'Client renewed', `${client.remark} extended by 30 days.`);
  };

  const handleDelete = (client: Client) => {
    setClients((prev) => prev.filter((c) => c.id !== client.id));
    pushToast('info', 'Client removed', `${client.remark} was deleted.`);
    setConfirmDelete(null);
  };

  const set = <K extends keyof ClientFormState>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Manager"
        subtitle="Manage VPN clients across your 3x-ui nodes"
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Active Clients" value={String(stats.active)} tone="emerald" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Expiring Soon" value={String(stats.expiring)} tone="amber" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Expired" value={String(stats.expired)} tone="rose" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Monthly Revenue" value={formatCost(stats.revenue)} tone="cyan" />
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by remark or email..."
              className="pl-9"
            />
          </div>
          <Select value={vpsFilter} onChange={setVpsFilter} className="sm:w-56">
            <option value="all">All VPS Nodes</option>
            {vpsList.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">VPS Node</th>
                <th className="px-4 py-3 font-medium">Protocol</th>
                <th className="px-4 py-3 font-medium">Data Used / Limit</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((c) => {
                const days = daysUntil(c.expiryDate);
                const isUnlimited = c.dataLimitGb === 0;
                const dataPct = isUnlimited ? 0 : (c.dataUsedGb / c.dataLimitGb) * 100;
                const dataTone = dataPct >= 90 ? 'rose' : dataPct >= 70 ? 'amber' : 'sky';
                return (
                  <tr key={c.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-100">{c.remark}</p>
                      {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <Server className="h-3.5 w-3.5 text-slate-500" />
                        {vpsNameById[c.vpsId] ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/40 px-2 py-1 font-mono text-xs text-slate-300">
                        <Network className="h-3 w-3 text-sky-400" />
                        {PROTOCOL_LABEL[c.protocol]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-32">
                        <p className="text-xs text-slate-300">
                          {formatBandwidth(c.dataUsedGb)} / {isUnlimited ? '∞' : `${c.dataLimitGb} GB`}
                        </p>
                        {!isUnlimited && (
                          <div className="mt-1">
                            <ProgressBar value={c.dataUsedGb} max={c.dataLimitGb} tone={dataTone} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-300">
                        {new Date(c.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className={`text-[10px] ${days < 0 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {days > 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-slate-200">{formatCost(c.sellingPrice)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ClientStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton onClick={() => openEdit(c)} title="Edit" variant="primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton onClick={() => handleRenew(c)} title="Renew +30d">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton onClick={() => setConfirmDelete(c)} title="Delete" variant="danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No clients match your filters.</p>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-3 lg:hidden">
          {filtered.map((c) => {
            const days = daysUntil(c.expiryDate);
            const isUnlimited = c.dataLimitGb === 0;
            return (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{c.remark}</p>
                    {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                  </div>
                  <ClientStatusBadge status={c.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-800/40 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-slate-500">VPS</p>
                    <p className="text-slate-200">{vpsNameById[c.vpsId] ?? 'Unknown'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-slate-500">Protocol</p>
                    <p className="text-slate-200">{PROTOCOL_LABEL[c.protocol]}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-slate-500">Data</p>
                    <p className="text-slate-200">{formatBandwidth(c.dataUsedGb)} / {isUnlimited ? '∞' : `${c.dataLimitGb}GB`}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-slate-500">Expiry</p>
                    <p className={days < 0 ? 'text-rose-300' : days <= 7 ? 'text-amber-300' : 'text-slate-200'}>
                      {days > 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-sm font-medium text-slate-200">{formatCost(c.sellingPrice)}</span>
                  <div className="flex gap-1">
                    <IconButton onClick={() => openEdit(c)} title="Edit" variant="primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton onClick={() => handleRenew(c)} title="Renew">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton onClick={() => setConfirmDelete(c)} title="Delete" variant="danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No clients match your filters.</p>
          )}
        </div>
      </Card>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Client' : 'Add New Client'}
        subtitle={editingId ? 'Update client configuration' : 'Onboard a new VPN client'}
        icon={<UserPlus className="h-5 w-5" />}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Save Changes' : 'Create Client'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <IconField label="Client Name / Remark" icon={<UserPlus className="h-4 w-4 text-slate-500" />}>
              <TextInput value={form.remark} onChange={(e) => set('remark', e.target.value)} placeholder="e.g. ali_vpn_01" />
            </IconField>
          </div>
          <IconField label="Email (optional)" icon={<Mail className="h-4 w-4 text-slate-500" />}>
            <TextInput value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="client@example.com" />
          </IconField>
          <IconField label="Select VPS Node" icon={<Server className="h-4 w-4 text-slate-500" />}>
            <Select value={form.vpsId} onChange={(v) => set('vpsId', v)}>
              {vpsList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.ip}
                </option>
              ))}
            </Select>
          </IconField>
          <div className="sm:col-span-2">
            <Field label="Select Package Preset">
              <Select value={form.presetId} onChange={applyPreset}>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.dataLimitGb === 0 ? 'Unlimited' : `${p.dataLimitGb}GB`} / {p.durationDays}d
                  </option>
                ))}
                <option value={CUSTOM_PRESET_ID}>Custom (configure manually)</option>
              </Select>
            </Field>
          </div>
          <IconField label="SNI Header" icon={<Globe className="h-4 w-4 text-slate-500" />}>
            <TextInput value={form.sni} onChange={(e) => set('sni', e.target.value)} placeholder="cdn.cloudflare.com" />
          </IconField>
          <Field label="Protocol">
            <Select value={form.protocol} onChange={(v) => set('protocol', v)}>
              <option value="vless">VLESS</option>
              <option value="vmess">VMess</option>
              <option value="trojan">Trojan</option>
            </Select>
          </Field>
          <Field label="Data Limit (GB)" hint="0 = unlimited">
            <TextInput value={form.dataLimitGb} onChange={(e) => set('dataLimitGb', e.target.value)} inputMode="numeric" placeholder="50" />
          </Field>
          <Field label="Duration (Days)">
            <TextInput value={form.durationDays} onChange={(e) => set('durationDays', e.target.value)} inputMode="numeric" placeholder="30" />
          </Field>
          <div className="sm:col-span-2">
            <IconField label="Selling Price (Rs)" icon={<DollarSign className="h-4 w-4 text-slate-500" />} hint={calcPriceHint()}>
              <TextInput value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} inputMode="numeric" placeholder="1000" />
            </IconField>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Delete this client?"
          size="sm"
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-200">{confirmDelete.remark}</span> will be removed from{' '}
            {vpsNameById[confirmDelete.vpsId] ?? 'the node'}. This does not delete the inbound on the actual panel.
          </p>
        </Modal>
      )}

    </div>
  );
}

function IconField({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <div className="[&_input]:pl-9 [&_select]:pl-9">{children}</div>
      </div>
    </Field>
  );
}
