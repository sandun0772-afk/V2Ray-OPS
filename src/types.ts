// ============================================================
// NORMALIZED DATA MODEL
// VPS -> Inbounds -> Clients
// VPS -> ResourceMetrics, MaintenanceHistory, TerminalHistory
// Preset -> Routing/Configuration profile (NO data limits)
// Carrier -> Offers, Pricing rules
// Client -> VPS, Inbound, Preset, Carrier, ConnectionType, Offer, Usage, Portal
// ============================================================

export type VpsStatus = 'online' | 'syncing' | 'error' | 'offline';

export type VpsType = 'installed' | 'connected';

export type Protocol = 'vless' | 'vmess' | 'trojan';

export type Transport = 'ws' | 'tcp' | 'grpc' | 'httpupgrade';

export type Security = 'tls' | 'reality' | 'none';

export type ConnectionType = 'mobile' | 'fixed';

export type CarrierId =
  | 'hutch'
  | 'airtel'
  | 'dialog'
  | 'dialog_fixed'
  | 'slt';

// ---------- VPS ----------

export interface ResourceMetrics {
  cpuPct: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  bandwidthUsedGb: number;
  bandwidthLimitGb: number; // 0 = unlimited
  uploadMbps: number;
  downloadMbps: number;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  timestamp: string;
  operation: 'check-updates' | 'update-system' | 'restart-vps';
  result: string;
  status: 'success' | 'failed' | 'info';
  details?: string;
}

export interface UbuntuStatus {
  version: string;
  lastUpdateCheck: string | null;
  availableUpdates: number;
  securityUpdates: number;
  systemStatus: 'up-to-date' | 'updates-available' | 'checking' | 'updating' | 'needs-restart';
}

export interface TerminalEntry {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  success: boolean;
}

export interface Inbound {
  id: string;
  vpsId: string;
  protocol: Protocol;
  port: number;
  transport: Transport;
  security: Security;
  sni: string;
  path?: string;
  remark: string;
  status: 'active' | 'inactive';
  connectedClients: number;
  trafficUsedGb: number;
}

export interface Vps {
  id: string;
  name: string;
  type: VpsType;
  ip: string;
  domain: string;
  location: string;
  provider: string;
  /** SSH port for installed nodes, panel port for connected nodes. */
  port: number;
  sshPort?: number;
  panelPort?: number;
  startDate: string;
  serviceDurationDays: number;
  expirationDate: string; // computed: startDate + duration
  monthlyCost: number;
  bandwidthLimitGb: number; // 0 = unlimited
  status: VpsStatus;
  lastSync: string;
  metrics: ResourceMetrics;
  ubuntu: UbuntuStatus;
  maintenanceHistory: MaintenanceRecord[];
  terminalHistory: TerminalEntry[];
}

// ---------- PRESET (Routing Profile) ----------

export interface Preset {
  id: string;
  name: string;
  protocol: Protocol;
  defaultSni: string;
  transport: Transport;
  security: Security;
  routingProfile: string;
  compatibleCarriers: CarrierId[];
  compatibleConnectionTypes: ConnectionType[];
  description: string;
  notes: string;
}

// ---------- CARRIER / OFFER ----------

export interface Offer {
  id: string;
  carrierId: CarrierId;
  name: string;
  connectionType: ConnectionType;
  price: number;
  isUnlimited: boolean;
  /** Per-GB rate when not unlimited. 0 means flat price only. */
  ratePerGb?: number;
}

export interface CarrierConfig {
  id: CarrierId;
  name: string;
  connectionType: ConnectionType;
  unlimitedOfferPrice: number;
  unlimitedOfferName: string;
  standardRatePerGb: number;
  packages: string[];
}

// ---------- CLIENT ----------

export type ClientStatus = 'active' | 'expiring' | 'expired' | 'suspended';

export interface Client {
  id: string;
  remark: string;
  email?: string;
  vpsId: string;
  inboundId: string;
  protocol: Protocol;
  presetId: string;
  connectionType: ConnectionType;
  carrierId: CarrierId;
  offerId: string | null;
  sni: string;
  dataUsedGb: number;
  dataLimitGb: number; // 0 = unlimited
  startDate: string;
  durationDays: number;
  expiryDate: string;
  sellingPrice: number;
  status: ClientStatus;
  uuid: string;
  clientUrl: string;
}

// ---------- ALERTS / AUDIT / ISSUES ----------

export type AlertLevel = 'critical' | 'warning' | 'info';
export type AlertCategory =
  | 'vps-expiring'
  | 'client-expiring'
  | 'vps-offline'
  | 'high-cpu'
  | 'high-ram'
  | 'high-bandwidth'
  | 'ubuntu-updates'
  | 'client-issue';

export interface Alert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  targetId: string;
  targetName: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  result: 'success' | 'failed';
  details?: string;
}

export interface ClientIssue {
  id: string;
  clientId: string;
  clientName: string;
  category: string;
  message: string;
  contact?: string;
  timestamp: string;
  status: 'open' | 'resolved';
}

// ---------- PRICE CONFIG ----------

export interface PriceConfig {
  currency: string;
  mobileRatePerGb: number;
  fixedRatePerGb: number;
}

// ---------- UI ----------

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface Banner {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  vpsName: string;
}

export type PageId =
  | 'dashboard'
  | 'vps'
  | 'clients'
  | 'presets'
  | 'financials'
  | 'alerts'
  | 'audit'
  | 'portal';

export interface SearchResult {
  type: 'vps' | 'client' | 'preset' | 'inbound';
  id: string;
  title: string;
  subtitle: string;
  page: PageId;
}
