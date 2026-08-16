import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ClientStatus } from '@/types';

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function IconButton({
  onClick,
  title,
  disabled,
  children,
  variant = 'ghost',
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'ghost' | 'primary' | 'danger';
}) {
  const variants: Record<string, string> = {
    ghost: 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
    primary: 'text-sky-300 hover:bg-sky-500/15 hover:text-sky-200',
    danger: 'text-rose-300 hover:bg-rose-500/15 hover:text-rose-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function VpsStatusBadge({ status }: { status: 'online' | 'syncing' | 'error' }) {
  const config = {
    online: { label: 'Online', dot: 'bg-emerald-400', glow: 'glow-pulse', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    syncing: { label: 'Syncing', dot: 'bg-amber-400', glow: '', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    error: { label: 'Error', dot: 'bg-rose-500', glow: '', chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.chip}`}
    >
      <span className={`relative h-2 w-2 rounded-full ${config.dot} ${config.glow}`} />
      {config.label}
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config: Record<ClientStatus, { label: string; chip: string }> = {
    active: { label: 'Active', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    expiring: { label: 'Expiring', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    expired: { label: 'Expired', chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    suspended: { label: 'Suspended', chip: 'bg-slate-500/20 text-slate-300 border-slate-600/40' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${c.chip}`}>
      {c.label}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20';

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className = '', ...rest } = props;
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function PasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className = '', ...rest } = props;
  return <input type="password" className={`${inputBase} ${className}`} {...rest} />;
}

export function Select({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%2001%201.06.02L10%2011.06l3.71-3.83a.75.75%200%2011%201.08%201.04l-4.25%204.39a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9 ${className}`}
    >
      {children}
    </select>
  );
}

export function Button({
  onClick,
  children,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 disabled:bg-slate-700 disabled:shadow-none',
    secondary:
      'border border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800',
    danger: 'bg-rose-500/90 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20',
    ghost: 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Tone map for stat cards ---------- */
export const toneMap: Record<string, { ring: string; icon: string; bg: string }> = {
  sky: { ring: 'ring-sky-500/20', icon: 'text-sky-400', bg: 'bg-sky-500/10' },
  emerald: { ring: 'ring-emerald-500/20', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rose: { ring: 'ring-rose-500/20', icon: 'text-rose-400', bg: 'bg-rose-500/10' },
  violet: { ring: 'ring-violet-500/20', icon: 'text-violet-300', bg: 'bg-violet-500/10' },
  amber: { ring: 'ring-amber-500/20', icon: 'text-amber-300', bg: 'bg-amber-500/10' },
  slate: { ring: 'ring-slate-600/30', icon: 'text-slate-300', bg: 'bg-slate-700/20' },
  cyan: { ring: 'ring-cyan-500/20', icon: 'text-cyan-300', bg: 'bg-cyan-500/10' },
};

export function StatCard({
  icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: keyof typeof toneMap;
  sub?: string;
}) {
  const t = toneMap[tone];
  return (
    <Card className={`flex items-center gap-3 p-3.5 ring-1 ${t.ring}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-100">{value}</p>
        {sub && <p className="truncate text-[10px] text-slate-500">{sub}</p>}
      </div>
    </Card>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  closeDisabled,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeDisabled?: boolean;
}) {
  if (!open) return null;
  const sizeClass = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm backdrop-in sm:items-center"
      onClick={closeDisabled ? undefined : onClose}
    >
      <div
        className={`modal-in relative my-auto w-full ${sizeClass} rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/50`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, tone = 'sky' }: { value: number; max: number; tone?: 'sky' | 'amber' | 'rose' | 'emerald' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const toneClass: Record<string, string> = {
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
      <div
        className={`h-full rounded-full transition-all duration-300 ${toneClass[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
