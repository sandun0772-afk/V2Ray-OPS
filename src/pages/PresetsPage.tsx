import { useState } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Network,
  Globe,
  Calendar,
  Gauge,
  DollarSign,
  Infinity as InfinityIcon,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/store';
import type { Preset, Protocol } from '@/types';
import { newId } from '@/lib/mockData';
import { formatCost } from '@/lib/format';
import {
  Button,
  Card,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Select,
  StatCard,
  TextInput,
} from '@/components/ui';

const PROTOCOL_LABEL: Record<Protocol, string> = {
  vless: 'VLESS',
  vmess: 'VMess',
  trojan: 'Trojan',
};

interface PresetForm {
  name: string;
  sni: string;
  protocol: Protocol;
  durationDays: string;
  dataLimitGb: string;
  suggestedPrice: string;
}

const emptyForm: PresetForm = {
  name: '',
  sni: 'cdn.cloudflare.com',
  protocol: 'vless',
  durationDays: '30',
  dataLimitGb: '50',
  suggestedPrice: '1000',
};

export function PresetsPage() {
  const { presets, setPresets, pushToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PresetForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Preset | null>(null);

  const stats = {
    total: presets.length,
    unlimited: presets.filter((p) => p.dataLimitGb === 0).length,
    avgPrice: presets.length > 0 ? Math.round(presets.reduce((s, p) => s + p.suggestedPrice, 0) / presets.length) : 0,
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (preset: Preset) => {
    setEditingId(preset.id);
    setForm({
      name: preset.name,
      sni: preset.sni,
      protocol: preset.protocol,
      durationDays: String(preset.durationDays),
      dataLimitGb: String(preset.dataLimitGb),
      suggestedPrice: String(preset.suggestedPrice),
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      pushToast('warning', 'Missing field', 'Preset name is required.');
      return;
    }
    if (editingId) {
      setPresets((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: form.name.trim(),
                sni: form.sni,
                protocol: form.protocol,
                durationDays: Number(form.durationDays) || 30,
                dataLimitGb: Number(form.dataLimitGb) || 0,
                suggestedPrice: Number(form.suggestedPrice) || 0,
              }
            : p
        )
      );
      pushToast('success', 'Preset updated', `${form.name.trim()} has been saved.`);
    } else {
      const newPreset: Preset = {
        id: newId('p'),
        name: form.name.trim(),
        sni: form.sni,
        protocol: form.protocol,
        durationDays: Number(form.durationDays) || 30,
        dataLimitGb: Number(form.dataLimitGb) || 0,
        suggestedPrice: Number(form.suggestedPrice) || 0,
      };
      setPresets((prev) => [...prev, newPreset]);
      pushToast('success', 'Preset created', `${form.name.trim()} is now available for onboarding.`);
    }
    setModalOpen(false);
  };

  const handleDelete = (preset: Preset) => {
    setPresets((prev) => prev.filter((p) => p.id !== preset.id));
    pushToast('info', 'Preset removed', `${preset.name} was deleted.`);
    setConfirmDelete(null);
  };

  const set = <K extends keyof PresetForm>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Package Presets"
        subtitle="Pre-configured templates for fast client onboarding"
        icon={<Package className="h-6 w-6" />}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Create New Preset
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Package className="h-4 w-4" />} label="Total Presets" value={String(stats.total)} tone="sky" />
        <StatCard icon={<InfinityIcon className="h-4 w-4" />} label="Unlimited Plans" value={String(stats.unlimited)} tone="violet" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Avg Price" value={formatCost(stats.avgPrice)} tone="emerald" />
      </div>

      {/* Grid of preset cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => (
          <Card key={p.id} className="group flex flex-col p-4 transition-all duration-150 hover:border-sky-500/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{p.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    <Network className="h-2.5 w-2.5 text-sky-400" />
                    {PROTOCOL_LABEL[p.protocol]}
                  </span>
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton onClick={() => openEdit(p)} title="Edit" variant="primary">
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton onClick={() => setConfirmDelete(p)} title="Delete" variant="danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <PresetField icon={<Globe className="h-3 w-3" />} label="SNI" value={p.sni} />
              <PresetField icon={<Calendar className="h-3 w-3" />} label="Duration" value={`${p.durationDays} days`} />
              <PresetField
                icon={<Gauge className="h-3 w-3" />}
                label="Data Limit"
                value={p.dataLimitGb === 0 ? 'Unlimited' : `${p.dataLimitGb} GB`}
              />
              <PresetField icon={<DollarSign className="h-3 w-3" />} label="Price" value={formatCost(p.suggestedPrice)} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-3">
              <span className="text-[11px] text-slate-500">
                {p.dataLimitGb === 0
                  ? 'Flat-rate unlimited plan'
                  : `${formatCost(p.suggestedPrice)} for ${p.dataLimitGb} GB`}
              </span>
              {p.dataLimitGb > 0 && (
                <span className="text-[11px] font-medium text-sky-400">
                  {formatCost(Math.round(p.suggestedPrice / p.dataLimitGb))}/GB
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Preset' : 'Create New Preset'}
        subtitle="Define defaults for quick client onboarding"
        icon={<Package className="h-5 w-5" />}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingId ? 'Save Changes' : 'Create Preset'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Preset Name">
              <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Pro 200GB" />
            </Field>
          </div>
          <Field label="Default SNI Header">
            <TextInput value={form.sni} onChange={(e) => set('sni', e.target.value)} placeholder="cdn.cloudflare.com" />
          </Field>
          <Field label="Protocol">
            <Select value={form.protocol} onChange={(v) => set('protocol', v)}>
              <option value="vless">VLESS</option>
              <option value="vmess">VMess</option>
              <option value="trojan">Trojan</option>
            </Select>
          </Field>
          <Field label="Duration (Days)">
            <TextInput value={form.durationDays} onChange={(e) => set('durationDays', e.target.value)} inputMode="numeric" placeholder="30" />
          </Field>
          <Field label="Data Limit (GB)" hint="0 = unlimited">
            <TextInput value={form.dataLimitGb} onChange={(e) => set('dataLimitGb', e.target.value)} inputMode="numeric" placeholder="50" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Suggested Selling Price (Rs)">
              <TextInput value={form.suggestedPrice} onChange={(e) => set('suggestedPrice', e.target.value)} inputMode="numeric" placeholder="1000" />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Delete this preset?"
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
            <span className="font-medium text-slate-200">{confirmDelete.name}</span> will no longer be available for client onboarding.
          </p>
        </Modal>
      )}
    </div>
  );
}

function PresetField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 px-2.5 py-1.5">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium text-slate-200">{value}</p>
    </div>
  );
}
