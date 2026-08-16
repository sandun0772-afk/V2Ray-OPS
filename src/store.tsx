import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Alert,
  AlertCategory,
  AlertLevel,
  AuditEntry,
  Banner,
  Client,
  ClientIssue,
  Inbound,
  Preset,
  PriceConfig,
  Toast,
  ToastType,
  Vps,
} from '@/types';
import {
  initialClients,
  initialInbounds,
  initialPresets,
  initialPriceConfig,
  initialVpsList,
  newId,
} from '@/lib/mockData';

// ---------- Persistence ----------

const STORAGE_KEY = 'v2ray-ops-state-v1';

interface PersistedState {
  vpsList: Vps[];
  inbounds: Inbound[];
  clients: Client[];
  presets: Preset[];
  priceConfig: PriceConfig;
  auditLog: AuditEntry[];
  clientIssues: ClientIssue[];
}

function loadState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

// ---------- Store ----------

interface StoreValue {
  vpsList: Vps[];
  setVpsList: React.Dispatch<React.SetStateAction<Vps[]>>;
  inbounds: Inbound[];
  setInbounds: React.Dispatch<React.SetStateAction<Inbound[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  priceConfig: PriceConfig;
  setPriceConfig: React.Dispatch<React.SetStateAction<PriceConfig>>;
  auditLog: AuditEntry[];
  clientIssues: ClientIssue[];
  setClientIssues: React.Dispatch<React.SetStateAction<ClientIssue[]>>;
  alerts: Alert[];
  toasts: Toast[];
  pushToast: (type: ToastType, title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  banner: Banner | null;
  setBanner: React.Dispatch<React.SetStateAction<Banner | null>>;
  logAudit: (action: string, target: string, result?: 'success' | 'failed', details?: string) => void;
  regenerateAlerts: () => void;
  acknowledgeAlert: (id: string) => void;
  resolveIssue: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => loadState(), []);

  const [vpsList, setVpsList] = useState<Vps[]>(persisted?.vpsList ?? initialVpsList);
  const [inbounds, setInbounds] = useState<Inbound[]>(persisted?.inbounds ?? initialInbounds);
  const [clients, setClients] = useState<Client[]>(persisted?.clients ?? initialClients);
  const [presets, setPresets] = useState<Preset[]>(persisted?.presets ?? initialPresets);
  const [priceConfig, setPriceConfig] = useState<PriceConfig>(
    persisted?.priceConfig ?? initialPriceConfig
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(persisted?.auditLog ?? []);
  const [clientIssues, setClientIssues] = useState<ClientIssue[]>(persisted?.clientIssues ?? []);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);

  // ---------- Persistence ----------

  useEffect(() => {
    saveState({ vpsList, inbounds, clients, presets, priceConfig, auditLog, clientIssues });
  }, [vpsList, inbounds, clients, presets, priceConfig, auditLog, clientIssues]);

  // ---------- Toast ----------

  const pushToast = useCallback((type: ToastType, title: string, message?: string) => {
    const toast: Toast = { id: newId('toast'), type, title, message };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---------- Audit ----------

  const logAudit = useCallback(
    (action: string, target: string, result: 'success' | 'failed' = 'success', details?: string) => {
      const entry: AuditEntry = {
        id: newId('audit'),
        timestamp: new Date().toISOString(),
        action,
        target,
        result,
        details,
      };
      setAuditLog((prev) => [entry, ...prev].slice(0, 200));
    },
    []
  );

  // ---------- Alerts ----------

  const regenerateAlerts = useCallback(() => {
    setAlerts((prev) => {
      const acknowledgedIds = new Set(prev.filter((a) => a.acknowledged).map((a) => a.id));
      const newAlerts: Alert[] = [];
      const now = Date.now();

      for (const vps of vpsList) {
        const vpsDays = Math.ceil((new Date(vps.expirationDate).getTime() - now) / 86400000);
        if (vpsDays < 0) {
          newAlerts.push(makeAlert('critical', 'vps-offline', 'VPS expired', `${vps.name} expired ${Math.abs(vpsDays)}d ago`, vps.id, vps.name));
        } else if (vpsDays <= 14) {
          newAlerts.push(makeAlert('warning', 'vps-expiring', 'VPS expiring soon', `${vps.name} expires in ${vpsDays}d`, vps.id, vps.name));
        }
        if (vps.status === 'error' || vps.status === 'offline') {
          newAlerts.push(makeAlert('critical', 'vps-offline', 'VPS offline', `${vps.name} is currently offline`, vps.id, vps.name));
        }
        if (vps.metrics.cpuPct > 80) {
          newAlerts.push(makeAlert('warning', 'high-cpu', 'High CPU', `${vps.name} CPU at ${vps.metrics.cpuPct}%`, vps.id, vps.name));
        }
        if (vps.metrics.ramUsedMb / vps.metrics.ramTotalMb > 0.85) {
          newAlerts.push(makeAlert('warning', 'high-ram', 'High RAM', `${vps.name} RAM at ${Math.round((vps.metrics.ramUsedMb / vps.metrics.ramTotalMb) * 100)}%`, vps.id, vps.name));
        }
        if (vps.metrics.bandwidthLimitGb > 0 && vps.metrics.bandwidthUsedGb / vps.metrics.bandwidthLimitGb > 0.85) {
          newAlerts.push(makeAlert('warning', 'high-bandwidth', 'High bandwidth', `${vps.name} bandwidth at ${Math.round((vps.metrics.bandwidthUsedGb / vps.metrics.bandwidthLimitGb) * 100)}%`, vps.id, vps.name));
        }
        if (vps.ubuntu.availableUpdates > 0) {
          newAlerts.push(makeAlert('info', 'ubuntu-updates', 'Ubuntu updates available', `${vps.name}: ${vps.ubuntu.availableUpdates} packages (${vps.ubuntu.securityUpdates} security)`, vps.id, vps.name));
        }
      }

      for (const client of clients) {
        const cDays = Math.ceil((new Date(client.expiryDate).getTime() - now) / 86400000);
        if (cDays < 0) {
          newAlerts.push(makeAlert('warning', 'client-expiring', 'Client expired', `${client.remark} expired ${Math.abs(cDays)}d ago`, client.id, client.remark));
        } else if (cDays <= 7) {
          newAlerts.push(makeAlert('warning', 'client-expiring', 'Client expiring soon', `${client.remark} expires in ${cDays}d`, client.id, client.remark));
        }
      }

      for (const issue of clientIssues) {
        if (issue.status === 'open') {
          newAlerts.push(makeAlert('info', 'client-issue', 'Client issue reported', `${issue.clientName}: ${issue.category}`, issue.id, issue.clientName));
        }
      }

      // Preserve acknowledged state
      return newAlerts.map((a) => ({
        ...a,
        acknowledged: acknowledgedIds.has(a.id),
      }));
    });
  }, [vpsList, clients, clientIssues]);

  useEffect(() => {
    regenerateAlerts();
  }, [regenerateAlerts]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  const resolveIssue = useCallback((id: string) => {
    setClientIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      vpsList,
      setVpsList,
      inbounds,
      setInbounds,
      clients,
      setClients,
      presets,
      setPresets,
      priceConfig,
      setPriceConfig,
      auditLog,
      clientIssues,
      setClientIssues,
      alerts,
      toasts,
      pushToast,
      dismissToast,
      banner,
      setBanner,
      logAudit,
      regenerateAlerts,
      acknowledgeAlert,
      resolveIssue,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vpsList, inbounds, clients, presets, priceConfig, auditLog, clientIssues, alerts, toasts, banner]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// ---------- Helpers ----------

function makeAlert(
  level: AlertLevel,
  category: AlertCategory,
  title: string,
  message: string,
  targetId: string,
  targetName: string
): Alert {
  return {
    id: `${category}-${targetId}-${title}`,
    level,
    category,
    title,
    message,
    targetId,
    targetName,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };
}
