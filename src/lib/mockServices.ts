import type {
  MaintenanceRecord,
  ResourceMetrics,
  TerminalEntry,
} from '@/types';

// ============================================================
// MOCK SERVICE ABSTRACTIONS
// These simulate backend operations. Each service has a clean
// interface so it can be replaced with real API/SSH calls later.
// The UI never touches SSH credentials or executes commands
// directly — it always goes through these abstractions.
// ============================================================

// ---------- Resource Monitor Service ----------

export interface ResourceMonitorService {
  /** Poll current resource metrics for a VPS. */
  getMetrics(vpsId: string): Promise<ResourceMetrics>;
  /** Start periodic polling; returns an unsubscribe function. */
  subscribe(vpsId: string, onUpdate: (metrics: ResourceMetrics) => void): () => void;
}

function randomMetrics(current?: Partial<ResourceMetrics>): ResourceMetrics {
  const cpu = current?.cpuPct !== undefined
    ? clamp(current.cpuPct + rand(-8, 8), 3, 96)
    : rand(12, 65);
  const ramUsed = current?.ramUsedMb !== undefined
    ? clamp(current.ramUsedMb + rand(-64, 64), 256, 4096)
    : rand(512, 3072);
  const bandwidthUsed = current?.bandwidthUsedGb !== undefined
    ? Math.max(0, current.bandwidthUsedGb + rand(-2, 5))
    : rand(50, 800);
  return {
    cpuPct: Math.round(cpu),
    ramUsedMb: Math.round(ramUsed),
    ramTotalMb: current?.ramTotalMb ?? 4096,
    diskUsedGb: current?.diskUsedGb ?? rand(20, 80),
    diskTotalGb: current?.diskTotalGb ?? 100,
    bandwidthUsedGb: Math.round(bandwidthUsed),
    bandwidthLimitGb: current?.bandwidthLimitGb ?? 1000,
    uploadMbps: Math.round(rand(10, 120)),
    downloadMbps: Math.round(rand(20, 250)),
    updatedAt: new Date().toISOString(),
  };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export const mockResourceMonitor: ResourceMonitorService = {
  async getMetrics(vpsId: string): Promise<ResourceMetrics> {
    await delay(300 + Math.random() * 400);
    return randomMetrics();
  },
  subscribe(vpsId: string, onUpdate: (m: ResourceMetrics) => void): () => void {
    const interval = setInterval(() => {
      onUpdate(randomMetrics());
    }, 3000);
    return () => clearInterval(interval);
  },
};

// ---------- VPS Start Date Detection Service ----------

export interface VpsConnectionService {
  /** Simulate connecting to a VPS and detecting its creation date. */
  detectStartDate(vpsIp: string): Promise<{ startDate: string; ubuntuVersion: string }>;
  /** Simulate SSH provisioning log steps. Returns log lines progressively. */
  streamProvisioning(ip: string, sshPort: number): AsyncGenerator<string>;
}

export const mockVpsConnection: VpsConnectionService = {
  async detectStartDate(_vpsIp: string): Promise<{ startDate: string; ubuntuVersion: string }> {
    await delay(800 + Math.random() * 600);
    return {
      startDate: new Date().toISOString().slice(0, 10),
      ubuntuVersion: 'Ubuntu 22.04.4 LTS',
    };
  },
  async *streamProvisioning(ip: string, sshPort: number): AsyncGenerator<string> {
    const lines = [
      `[SSH] Connecting to root@${ip}:${sshPort}...`,
      '[SSH] Authentication successful.',
      '[SYSTEM] Detecting system creation date...',
      '[SYSTEM] Start date detected successfully.',
      '[SYSTEM] Checking for existing 3x-ui installation...',
      '[CHECK] No existing panel found.',
      `[INSTALL] Running: bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)...`,
      '[SUCCESS] 3x-ui panel installed on port 2053.',
      `[API] Testing connection to panel web API at http://${ip}:2053/login...`,
      '[COMPLETE] VPS Node successfully linked!',
    ];
    for (const line of lines) {
      await delay(900 + Math.random() * 200);
      yield line;
    }
  },
};

// ---------- Ubuntu Maintenance Service ----------

export interface MaintenanceService {
  checkUpdates(vpsId: string): Promise<{ available: number; security: number }>;
  updateSystem(vpsId: string): Promise<{ result: string; success: boolean }>;
  restartVps(vpsId: string): Promise<{ result: string; success: boolean }>;
}

export const mockMaintenance: MaintenanceService = {
  async checkUpdates(_vpsId: string): Promise<{ available: number; security: number }> {
    await delay(1200 + Math.random() * 600);
    return {
      available: Math.round(rand(0, 24)),
      security: Math.round(rand(0, 5)),
    };
  },
  async updateSystem(_vpsId: string): Promise<{ result: string; success: boolean }> {
    await delay(2000 + Math.random() * 1000);
    return { result: 'All packages updated successfully', success: true };
  },
  async restartVps(_vpsId: string): Promise<{ result: string; success: boolean }> {
    await delay(2500 + Math.random() * 800);
    return { result: 'VPS restarted successfully', success: true };
  },
};

// ---------- Terminal Command Service ----------

const COMMAND_RESPONSES: Record<string, string> = {
  'systemctl status xray': `● xray.service - Xray Service
     Loaded: loaded (/etc/systemd/system/xray.service; enabled)
     Active: active (running) since Sun 2026-08-16 06:00:00 UTC
   Main PID: 1234 (xray)
      Tasks: 12 (limit: 4915)
     Memory: 45.2M
        CPU: 1min 23s`,
  'xray version': `Xray 1.8.24 (Xray, Penetrates Everything.) Custom (go1.22.2 linux/amd64)
A unified platform for Xray-core.
License: Apache License 2.0`,
  'uname -a': `Linux vps 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux`,
  'df -h': `Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        99G   42G   52G  45% /
tmpfs           2.0G   12M  2.0G   1% /dev/shm`,
  'free -h': `              total   used   free  shared  buff/cache  available
Mem:           4.0Gi  1.8Gi  1.2Gi   45Mi       1.0Gi       2.0Gi
Swap:          2.0Gi   0.0Gi  2.0Gi`,
  'uptime': ` 12:00:01 up 14 days,  3:22,  1 user,  load average: 0.42, 0.38, 0.31`,
  'ls -la /etc/x-ui/': `total 28
drwxr-xr-x 2 root root 4096 Aug 16 06:00 .
drwxr-xr-x 1 root root 4096 Aug 16 06:00 ..
-rw-r--r-- 1 root root  512 Aug 16 06:00 x-ui.db
-rw-r--r-- 1 root root  128 Aug 16 06:00 config.json`,
  'cat /etc/os-release': `PRETTY_NAME="Ubuntu 22.04.4 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.4 LTS (Jammy Jellyfish)"`,
  'x-ui status': `x-ui panel is running on port 2053
Version: 2.4.1
Uptime: 14 days`,
};

export interface TerminalService {
  execute(vpsId: string, command: string): Promise<TerminalEntry>;
  getSimulatedResponse(command: string): string;
}

export const mockTerminal: TerminalService = {
  async execute(_vpsId: string, command: string): Promise<TerminalEntry> {
    await delay(400 + Math.random() * 600);
    const output = mockTerminal.getSimulatedResponse(command);
    const known = Object.keys(COMMAND_RESPONSES).some((c) => command.trim().toLowerCase().startsWith(c.toLowerCase()));
    return {
      id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      command,
      output,
      success: known || command.trim().length > 0,
    };
  },
  getSimulatedResponse(command: string): string {
    const trimmed = command.trim().toLowerCase();
    for (const [key, response] of Object.entries(COMMAND_RESPONSES)) {
      if (trimmed.startsWith(key.toLowerCase())) return response;
    }
    if (trimmed.length === 0) return 'Empty command.';
    return `bash: ${command.split(' ')[0]}: command executed (mock mode)\nOutput would appear here in a real SSH session.`;
  },
};

// ---------- Helpers ----------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeMaintenanceRecord(
  operation: MaintenanceRecord['operation'],
  result: string,
  status: MaintenanceRecord['status'],
  details?: string
): MaintenanceRecord {
  return {
    id: `mt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    operation,
    result,
    status,
    details,
  };
}

// Re-export for convenience
export type { ResourceMetrics, MaintenanceRecord, TerminalEntry };
