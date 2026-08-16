import type {
  Client,
  Inbound,
  Preset,
  PriceConfig,
  Vps,
} from '@/types';
import { makeMaintenanceRecord } from '@/lib/mockServices';

// ============================================================
// SEED DATA — all derived from the centralized carrier config
// and normalized data model. No duplication across pages.
// ============================================================

const ISO_TODAY = '2026-08-16';

function dateFromToday(days: number): string {
  const d = new Date(ISO_TODAY + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeMetrics(
  cpu: number,
  ramUsed: number,
  ramTotal: number,
  diskUsed: number,
  diskTotal: number,
  bwUsed: number,
  bwLimit: number,
  up: number,
  down: number
) {
  return {
    cpuPct: cpu,
    ramUsedMb: ramUsed,
    ramTotalMb: ramTotal,
    diskUsedGb: diskUsed,
    diskTotalGb: diskTotal,
    bandwidthUsedGb: bwUsed,
    bandwidthLimitGb: bwLimit,
    uploadMbps: up,
    downloadMbps: down,
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Inbounds ----------

export const initialInbounds: Inbound[] = [
  // Frankfurt-01 (vps-1)
  {
    id: 'ib-1', vpsId: 'vps-1', protocol: 'vless', port: 443, transport: 'ws',
    security: 'tls', sni: 'cdn.cloudflare.com', path: '/vless', remark: 'Frankfurt-VLESS-443',
    status: 'active', connectedClients: 8, trafficUsedGb: 420,
  },
  {
    id: 'ib-2', vpsId: 'vps-1', protocol: 'trojan', port: 8443, transport: 'ws',
    security: 'tls', sni: 'cdn.cloudflare.com', path: '/trojan', remark: 'Frankfurt-Trojan-8443',
    status: 'active', connectedClients: 6, trafficUsedGb: 427,
  },
  // Amsterdam-Edge (vps-2)
  {
    id: 'ib-3', vpsId: 'vps-2', protocol: 'vless', port: 443, transport: 'ws',
    security: 'tls', sni: 'ams.cdn.net', path: '/vl', remark: 'Amsterdam-VLESS-443',
    status: 'active', connectedClients: 5, trafficUsedGb: 280,
  },
  {
    id: 'ib-4', vpsId: 'vps-2', protocol: 'trojan', port: 2053, transport: 'ws',
    security: 'tls', sni: 'ams.cdn.net', path: '/tr', remark: 'Amsterdam-Trojan-2053',
    status: 'active', connectedClients: 4, trafficUsedGb: 232,
  },
  // SG-1 (vps-3)
  {
    id: 'ib-5', vpsId: 'vps-3', protocol: 'vless', port: 443, transport: 'ws',
    security: 'tls', sni: 'sg1.cdn.net', path: '/vless', remark: 'SG-VLESS-443',
    status: 'active', connectedClients: 12, trafficUsedGb: 680,
  },
  {
    id: 'ib-6', vpsId: 'vps-3', protocol: 'vmess', port: 8080, transport: 'ws',
    security: 'none', sni: '', path: '/vm', remark: 'SG-VMess-8080',
    status: 'active', connectedClients: 9, trafficUsedGb: 523,
  },
];

// ---------- VPS ----------

export const initialVpsList: Vps[] = [
  {
    id: 'vps-1',
    name: 'Frankfurt-01',
    type: 'installed',
    ip: '185.241.206.84',
    domain: 'frankfurt01.vpn.lk',
    location: 'Frankfurt, DE',
    provider: 'Hetzner',
    port: 22,
    sshPort: 22,
    panelPort: 2053,
    startDate: '2026-07-18',
    serviceDurationDays: 120,
    expirationDate: '2026-11-15',
    monthlyCost: 3200,
    bandwidthLimitGb: 1000,
    status: 'online',
    lastSync: '2026-08-16T07:42:00Z',
    metrics: makeMetrics(34, 1840, 4096, 42, 100, 847, 1000, 45, 120),
    ubuntu: {
      version: 'Ubuntu 22.04.4 LTS',
      lastUpdateCheck: '2026-08-15T10:00:00Z',
      availableUpdates: 3,
      securityUpdates: 1,
      systemStatus: 'updates-available',
    },
    maintenanceHistory: [
      makeMaintenanceRecord('check-updates', '3 packages available (1 security)', 'info', '2026-08-15'),
      makeMaintenanceRecord('update-system', 'All packages updated', 'success', '2026-08-10'),
    ],
    terminalHistory: [],
  },
  {
    id: 'vps-2',
    name: 'Amsterdam-Edge',
    type: 'connected',
    ip: '94.142.241.111',
    domain: 'ams.edge.vpn.lk',
    location: 'Amsterdam, NL',
    provider: 'Vultr',
    port: 2053,
    panelPort: 2053,
    username: 'admin',
    startDate: '2026-06-20',
    serviceDurationDays: 90,
    expirationDate: '2026-09-18',
    monthlyCost: 2750,
    bandwidthLimitGb: 2000,
    status: 'online',
    lastSync: '2026-08-15T22:10:00Z',
    metrics: makeMetrics(22, 1024, 2048, 18, 80, 512, 2000, 30, 85),
    ubuntu: {
      version: 'Ubuntu 24.04.1 LTS',
      lastUpdateCheck: '2026-08-14T18:00:00Z',
      availableUpdates: 0,
      securityUpdates: 0,
      systemStatus: 'up-to-date',
    },
    maintenanceHistory: [
      makeMaintenanceRecord('check-updates', 'System is up to date', 'success', '2026-08-14'),
    ],
    terminalHistory: [],
  },
  {
    id: 'vps-3',
    name: 'SG-1',
    type: 'installed',
    ip: '139.180.92.47',
    domain: 'sg1.vpn.lk',
    location: 'Singapore, SG',
    provider: 'DigitalOcean',
    port: 22,
    sshPort: 22,
    panelPort: 2053,
    startDate: '2026-07-01',
    serviceDurationDays: 61,
    expirationDate: '2026-08-31',
    monthlyCost: 4100,
    bandwidthLimitGb: 2000,
    status: 'error',
    lastSync: '2026-08-14T18:55:00Z',
    metrics: makeMetrics(78, 3200, 4096, 75, 100, 1203, 2000, 95, 210),
    ubuntu: {
      version: 'Ubuntu 20.04.6 LTS',
      lastUpdateCheck: '2026-08-12T14:00:00Z',
      availableUpdates: 12,
      securityUpdates: 4,
      systemStatus: 'updates-available',
    },
    maintenanceHistory: [
      makeMaintenanceRecord('check-updates', '12 packages available (4 security)', 'info', '2026-08-12'),
    ],
    terminalHistory: [],
  },
];

// ---------- Presets (Routing Profiles) ----------

export const initialPresets: Preset[] = [
  {
    id: 'p-1',
    name: 'Cloudflare WS Standard',
    protocol: 'vless',
    defaultSni: 'cdn.cloudflare.com',
    transport: 'ws',
    security: 'tls',
    routingProfile: 'cf-direct',
    compatibleCarriers: ['hutch', 'airtel', 'dialog'],
    compatibleConnectionTypes: ['mobile'],
    description: 'Optimized for Sri Lankan mobile carriers via Cloudflare CDN. Low latency, good for streaming.',
    notes: 'Works well with Hutch and Airtel mobile data. Use with Cloudflare-proxied domains.',
  },
  {
    id: 'p-2',
    name: 'Trojan TLS Premium',
    protocol: 'trojan',
    defaultSni: 'cdn.cloudflare.com',
    transport: 'ws',
    security: 'tls',
    routingProfile: 'trojan-premium',
    compatibleCarriers: ['hutch', 'airtel', 'dialog', 'dialog_fixed', 'slt'],
    compatibleConnectionTypes: ['mobile', 'fixed'],
    description: 'Premium Trojan routing with TLS. Works across all carriers and connection types.',
    notes: 'Best overall compatibility. Recommended for mixed mobile/fixed deployments.',
  },
  {
    id: 'p-3',
    name: 'VMess Direct (No TLS)',
    protocol: 'vmess',
    defaultSni: '',
    transport: 'ws',
    security: 'none',
    routingProfile: 'vmess-direct',
    compatibleCarriers: ['dialog_fixed', 'slt'],
    compatibleConnectionTypes: ['fixed'],
    description: 'VMess without TLS for fixed-line connections where deep packet inspection is less of a concern.',
    notes: 'Do NOT use on mobile networks. Suitable for SLT and Dialog fixed connections only.',
  },
  {
    id: 'p-4',
    name: 'VLESS Reality Secure',
    protocol: 'vless',
    defaultSni: 'www.microsoft.com',
    transport: 'tcp',
    security: 'reality',
    routingProfile: 'reality-stealth',
    compatibleCarriers: ['hutch', 'airtel', 'dialog'],
    compatibleConnectionTypes: ['mobile'],
    description: 'VLESS with Reality protocol for maximum stealth on restrictive mobile networks.',
    notes: 'Uses SNI camouflage. Excellent for carriers that block standard VPN traffic.',
  },
  {
    id: 'p-5',
    name: 'SLT Router Optimized',
    protocol: 'vless',
    defaultSni: 'slt.cdn.net',
    transport: 'ws',
    security: 'tls',
    routingProfile: 'slt-optimized',
    compatibleCarriers: ['slt'],
    compatibleConnectionTypes: ['fixed'],
    description: 'Tuned for SLT fiber/ADSL routers. Higher throughput for streaming and large downloads.',
    notes: 'Use custom SNI for SLT. Pair with SLT Netflix or Zoom packages.',
  },
];

// ---------- Clients ----------

function genUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const initialClients: Client[] = [
  {
    id: 'c-1', remark: 'alex_user', email: 'alex@example.com',
    vpsId: 'vps-2', inboundId: 'ib-3', protocol: 'vless', presetId: 'p-1',
    connectionType: 'mobile', carrierId: 'hutch', offerId: 'hutch-unlimited',
    sni: 'ams.cdn.net', dataUsedGb: 62, dataLimitGb: 0,
    startDate: dateFromToday(-5), durationDays: 30, expiryDate: dateFromToday(25),
    sellingPrice: 200, status: 'active', uuid: genUuid(), clientUrl: '/client/c-1',
  },
  {
    id: 'c-2', remark: 'vpn_pro_99', email: 'pro99@example.com',
    vpsId: 'vps-1', inboundId: 'ib-2', protocol: 'trojan', presetId: 'p-2',
    connectionType: 'fixed', carrierId: 'dialog_fixed', offerId: 'dialog_fixed-unlimited',
    sni: 'cdn.cloudflare.com', dataUsedGb: 175, dataLimitGb: 0,
    startDate: dateFromToday(-15), durationDays: 60, expiryDate: dateFromToday(45),
    sellingPrice: 300, status: 'active', uuid: genUuid(), clientUrl: '/client/c-2',
  },
  {
    id: 'c-3', remark: 'john_doe', email: 'john@example.com',
    vpsId: 'vps-3', inboundId: 'ib-5', protocol: 'vless', presetId: 'p-4',
    connectionType: 'mobile', carrierId: 'airtel', offerId: 'airtel-standard',
    sni: 'sg1.cdn.net', dataUsedGb: 48, dataLimitGb: 50,
    startDate: dateFromToday(0), durationDays: 30, expiryDate: dateFromToday(30),
    sellingPrice: 50, status: 'active', uuid: genUuid(), clientUrl: '/client/c-3',
  },
  {
    id: 'c-4', remark: 'sara_k', email: 'sara@example.com',
    vpsId: 'vps-1', inboundId: 'ib-1', protocol: 'vless', presetId: 'p-1',
    connectionType: 'mobile', carrierId: 'dialog', offerId: 'dialog-unlimited',
    sni: 'cdn.cloudflare.com', dataUsedGb: 12, dataLimitGb: 0,
    startDate: dateFromToday(-10), durationDays: 120, expiryDate: dateFromToday(110),
    sellingPrice: 200, status: 'active', uuid: genUuid(), clientUrl: '/client/c-4',
  },
  {
    id: 'c-5', remark: 'mike_t', email: 'mike@example.com',
    vpsId: 'vps-2', inboundId: 'ib-4', protocol: 'trojan', presetId: 'p-2',
    connectionType: 'mobile', carrierId: 'airtel', offerId: 'airtel-whatsapp',
    sni: 'ams.cdn.net', dataUsedGb: 88, dataLimitGb: 0,
    startDate: dateFromToday(-25), durationDays: 30, expiryDate: dateFromToday(5),
    sellingPrice: 200, status: 'expiring', uuid: genUuid(), clientUrl: '/client/c-5',
  },
  {
    id: 'c-6', remark: 'leo_unlimited',
    vpsId: 'vps-3', inboundId: 'ib-6', protocol: 'vmess', presetId: 'p-3',
    connectionType: 'fixed', carrierId: 'slt', offerId: 'slt-unlimited',
    sni: 'sg1.cdn.net', dataUsedGb: 540, dataLimitGb: 0,
    startDate: dateFromToday(-33), durationDays: 30, expiryDate: dateFromToday(-3),
    sellingPrice: 450, status: 'expired', uuid: genUuid(), clientUrl: '/client/c-6',
  },
  {
    id: 'c-7', remark: 'natasha_w', email: 'natasha@example.com',
    vpsId: 'vps-1', inboundId: 'ib-1', protocol: 'vless', presetId: 'p-1',
    connectionType: 'mobile', carrierId: 'hutch', offerId: 'hutch-zoom',
    sni: 'cdn.cloudflare.com', dataUsedGb: 3, dataLimitGb: 0,
    startDate: dateFromToday(-2), durationDays: 30, expiryDate: dateFromToday(28),
    sellingPrice: 200, status: 'active', uuid: genUuid(), clientUrl: '/client/c-7',
  },
  {
    id: 'c-8', remark: 'karim_dev',
    vpsId: 'vps-2', inboundId: 'ib-3', protocol: 'vless', presetId: 'p-1',
    connectionType: 'mobile', carrierId: 'dialog', offerId: 'dialog-standard',
    sni: 'ams.cdn.net', dataUsedGb: 99, dataLimitGb: 100,
    startDate: dateFromToday(-18), durationDays: 30, expiryDate: dateFromToday(12),
    sellingPrice: 100, status: 'active', uuid: genUuid(), clientUrl: '/client/c-8',
  },
];

// ---------- Price Config ----------

export const initialPriceConfig: PriceConfig = {
  currency: 'Rs',
  mobileRatePerGb: 1.0,
  fixedRatePerGb: 1.5,
};

// ---------- Helpers ----------

export function newId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function generateUuid(): string {
  return genUuid();
}

export function rollHealthCheck(): { ok: boolean; latencyMs: number } {
  const ok = Math.random() > 0.18;
  return { ok, latencyMs: Math.round(18 + Math.random() * 120) };
}

export function isValidDomain(domain: string): boolean {
  if (!domain.trim()) return false;
  // Basic domain validation: labels separated by dots, valid chars
  const re = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(domain.trim());
}

export function computeExpiryDate(startDate: string, durationDays: number): string {
  const d = new Date(startDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + durationDays);
  return d.toISOString().slice(0, 10);
}

export const CUSTOM_PRESET_ID = 'preset-custom';
