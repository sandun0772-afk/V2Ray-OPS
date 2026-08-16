import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast, ToastType } from '@/types';

const iconForType: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styleForType: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
};

const iconColorForType: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-sky-400',
  warning: 'text-amber-400',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = iconForType[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4800);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={`toast-in pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-3.5 shadow-2xl shadow-black/40 backdrop-blur-md ${styleForType[toast.type]}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorForType[toast.type]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-slate-100">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-300/90">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
