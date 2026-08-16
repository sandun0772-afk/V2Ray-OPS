import { useEffect, useRef, useState } from 'react';
import { X, Server, Link2, Lock, Calendar, DollarSign, Globe, KeyRound, Terminal as TerminalIcon } from 'lucide-react';
import type { Toast, ToastType, Vps } from '@/types';
import { newId, randomBandwidth, randomClients, randomInbounds } from '@/lib/mockData';
import { Terminal, parseTag, type TerminalLine } from '@/components/Terminal';
import { Button, Field, PasswordInput, Spinner, TextInput } from '@/components/ui';

type Tab = 'install' | 'connect';

interface InstallForm {
  name: string;
  ip: string;
  sshPort: string;
  auth: string;
  expirationDate: string;
  monthlyCost: string;
}

interface ConnectForm {
  name: string;
  panelUrl: string;
  panelPort: string;
  username: string;
  password: string;
  expirationDate: string;
  monthlyCost: string;
}

const emptyInstall: InstallForm = {
  name: '',
  ip: '',
  sshPort: '22',
  auth: '',
  expirationDate: '',
  monthlyCost: '',
};

const emptyConnect: ConnectForm = {
  name: '',
  panelUrl: '',
  panelPort: '2053',
  username: '',
  password: '',
  expirationDate: '',
  monthlyCost: '',
};

const INPUT_ICON = 'h-4 w-4 text-slate-500';

interface AddVpsModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (vps: Vps) => void;
  pushToast: (type: ToastType, title: string, message?: string) => Toast | void;
}

export function AddVpsModal({ open, onClose, onAdded, pushToast }: AddVpsModalProps) {
  const [tab, setTab] = useState<Tab>('install');
  const [install, setInstall] = useState<InstallForm>(emptyInstall);
  const [connect, setConnect] = useState<ConnectForm>(emptyConnect);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab('install');
      setInstall(emptyInstall);
      setConnect(emptyConnect);
      setRunning(false);
      setLines([]);
    }
  }, [open]);

  // Clean timers on close/unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  if (!open) return null;

  const close = () => {
    if (running) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setLines([]);
    setRunning(false);
    onClose();
  };

  const queueLines = (texts: string[], onDone: () => void) => {
    setRunning(true);
    setLines([]);
    const collected: TerminalLine[] = [];
    texts.forEach((text, idx) => {
      const t = setTimeout(() => {
        const { tag, color } = parseTag(text);
        const line: TerminalLine = {
          id: String(idx + 1),
          text,
          tag,
          color,
        };
        collected.push(line);
        setLines([...collected]);
        if (idx === texts.length - 1) {
          const finalTimer = setTimeout(() => {
            setRunning(false);
            onDone();
          }, 650);
          timersRef.current.push(finalTimer);
        }
      }, idx * 1000);
      timersRef.current.push(t);
    });
  };

  const validateInstall = (): boolean => {
    if (!install.name.trim()) {
      pushToast('warning', 'Missing field', 'Server name is required.');
      return false;
    }
    if (!install.ip.trim()) {
      pushToast('warning', 'Missing field', 'IP address is required.');
      return false;
    }
    if (!install.auth.trim()) {
      pushToast('warning', 'Missing field', 'Root password or SSH private key is required.');
      return false;
    }
    if (!install.expirationDate) {
      pushToast('warning', 'Missing field', 'VPS expiration date is required.');
      return false;
    }
    return true;
  };

  const validateConnect = (): boolean => {
    if (!connect.name.trim()) {
      pushToast('warning', 'Missing field', 'Server name is required.');
      return false;
    }
    if (!connect.panelUrl.trim()) {
      pushToast('warning', 'Missing field', 'Panel URL / IP is required.');
      return false;
    }
    if (!connect.username.trim()) {
      pushToast('warning', 'Missing field', 'Panel username is required.');
      return false;
    }
    if (!connect.password.trim()) {
      pushToast('warning', 'Missing field', 'Panel password is required.');
      return false;
    }
    if (!connect.expirationDate) {
      pushToast('warning', 'Missing field', 'VPS expiration date is required.');
      return false;
    }
    return true;
  };

  const startInstall = () => {
    if (!validateInstall()) return;
    const ip = install.ip.trim();
    const sshPort = install.sshPort.trim() || '22';
    const logs = [
      `[SSH] Connecting to root@${ip}:${sshPort}...`,
      '[SSH] Authentication successful.',
      '[SYSTEM] Checking for existing 3x-ui installation...',
      '[CHECK] No existing panel found.',
      `[INSTALL] Running: bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)...`,
      '[SUCCESS] 3x-ui panel installed on port 2053.',
      `[API] Testing connection to panel web API at http://${ip}:2053/login...`,
      '[COMPLETE] VPS Node successfully linked!',
    ];
    queueLines(logs, () => {
      const vps: Vps = {
        id: newId(),
        name: install.name.trim(),
        type: 'installed',
        ip,
        port: 22,
        sshPort: Number(sshPort),
        panelPort: 2053,
        expirationDate: install.expirationDate,
        monthlyCost: Number(install.monthlyCost) || 0,
        status: 'online',
        bandwidthGb: 0,
        clients: 0,
        inbounds: 0,
        lastSync: new Date().toISOString(),
      };
      onAdded(vps);
      pushToast('success', 'VPS provisioned', `${vps.name} installed and is now Online.`);
      close();
    });
  };

  const startConnect = () => {
    if (!validateConnect()) return;
    const ip = connect.panelUrl.trim();
    const port = connect.panelPort.trim() || '2053';
    const inbounds = randomInbounds();
    const clients = randomClients();
    const logs = [
      `[NET] Pinging server at ${ip}...`,
      `[API] Sending auth token request to http://${ip}:${port}/login...`,
      '[API] HTTP 200 OK — Session cookie acquired.',
      '[API] Querying active inbounds from GET /panel/api/inbounds/list...',
      `[SUCCESS] Found ${inbounds} active inbounds and ${clients} clients.`,
    ];
    queueLines(logs, () => {
      const vps: Vps = {
        id: newId(),
        name: connect.name.trim(),
        type: 'connected',
        ip,
        port: Number(port),
        panelPort: Number(port),
        username: connect.username.trim(),
        expirationDate: connect.expirationDate,
        monthlyCost: Number(connect.monthlyCost) || 0,
        status: 'online',
        bandwidthGb: randomBandwidth(),
        clients,
        inbounds,
        lastSync: new Date().toISOString(),
      };
      onAdded(vps);
      pushToast('success', 'Panel connected', `${vps.name} linked with ${inbounds} inbounds.`);
      close();
    });
  };

  const setInst = <K extends keyof InstallForm>(k: K, v: string) =>
    setInstall((s) => ({ ...s, [k]: v }));
  const setConn = <K extends keyof ConnectForm>(k: K, v: string) =>
    setConnect((s) => ({ ...s, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm backdrop-in sm:items-center"
      onClick={close}
    >
      <div
        className="modal-in relative my-auto w-full max-w-2xl rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Add New VPS</h2>
              <p className="text-xs text-slate-400">Provision or link a 3x-ui node</p>
            </div>
          </div>
          <button
            onClick={close}
            disabled={running}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          <TabButton
            active={tab === 'install'}
            onClick={() => !running && setTab('install')}
            icon={<Server className="h-4 w-4" />}
            label="Install New 3x-ui Panel"
          />
          <TabButton
            active={tab === 'connect'}
            onClick={() => !running && setTab('connect')}
            icon={<Link2 className="h-4 w-4" />}
            label="Connect Existing Panel"
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {tab === 'install' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <IconField label="Server Name" icon={<Server className={INPUT_ICON} />}>
                  <TextInput
                    value={install.name}
                    onChange={(e) => setInst('name', e.target.value)}
                    placeholder="e.g. London-Edge-02"
                  />
                </IconField>
              </div>
              <IconField label="IP Address" icon={<Globe className={INPUT_ICON} />}>
                <TextInput
                  value={install.ip}
                  onChange={(e) => setInst('ip', e.target.value)}
                  placeholder="203.0.113.50"
                />
              </IconField>
              <IconField label="SSH Port" hint="default 22" icon={<TerminalIcon className={INPUT_ICON} />}>
                <TextInput
                  value={install.sshPort}
                  onChange={(e) => setInst('sshPort', e.target.value)}
                  inputMode="numeric"
                  placeholder="22"
                />
              </IconField>
              <div className="sm:col-span-2">
                <IconField
                  label="Root Password or SSH Private Key"
                  icon={<KeyRound className={INPUT_ICON} />}
                >
                  <PasswordInput
                    value={install.auth}
                    onChange={(e) => setInst('auth', e.target.value)}
                    placeholder="•••••••••••• or paste private key"
                  />
                </IconField>
              </div>
              <IconField label="VPS Expiration Date" icon={<Calendar className={INPUT_ICON} />}>
                <TextInput
                  type="date"
                  value={install.expirationDate}
                  onChange={(e) => setInst('expirationDate', e.target.value)}
                />
              </IconField>
              <IconField label="Monthly Cost (Rs)" icon={<DollarSign className={INPUT_ICON} />}>
                <TextInput
                  value={install.monthlyCost}
                  onChange={(e) => setInst('monthlyCost', e.target.value)}
                  inputMode="numeric"
                  placeholder="3200"
                />
              </IconField>
            </div>
          )}

          {tab === 'connect' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <IconField label="Server Name" icon={<Server className={INPUT_ICON} />}>
                  <TextInput
                    value={connect.name}
                    onChange={(e) => setConn('name', e.target.value)}
                    placeholder="e.g. NYC-Legacy"
                  />
                </IconField>
              </div>
              <IconField label="Panel URL / IP" icon={<Globe className={INPUT_ICON} />}>
                <TextInput
                  value={connect.panelUrl}
                  onChange={(e) => setConn('panelUrl', e.target.value)}
                  placeholder="panel.example.com or 203.0.113.50"
                />
              </IconField>
              <IconField label="Panel Port" hint="default 2053" icon={<TerminalIcon className={INPUT_ICON} />}>
                <TextInput
                  value={connect.panelPort}
                  onChange={(e) => setConn('panelPort', e.target.value)}
                  inputMode="numeric"
                  placeholder="2053"
                />
              </IconField>
              <IconField label="Username" icon={<Lock className={INPUT_ICON} />}>
                <TextInput
                  value={connect.username}
                  onChange={(e) => setConn('username', e.target.value)}
                  placeholder="admin"
                />
              </IconField>
              <IconField label="Password" icon={<KeyRound className={INPUT_ICON} />}>
                <PasswordInput
                  value={connect.password}
                  onChange={(e) => setConn('password', e.target.value)}
                  placeholder="••••••••"
                />
              </IconField>
              <IconField label="VPS Expiration Date" icon={<Calendar className={INPUT_ICON} />}>
                <TextInput
                  type="date"
                  value={connect.expirationDate}
                  onChange={(e) => setConn('expirationDate', e.target.value)}
                />
              </IconField>
              <IconField label="Monthly Cost (Rs)" icon={<DollarSign className={INPUT_ICON} />}>
                <TextInput
                  value={connect.monthlyCost}
                  onChange={(e) => setConn('monthlyCost', e.target.value)}
                  inputMode="numeric"
                  placeholder="2750"
                />
              </IconField>
            </div>
          )}

          {/* Terminal shows when running */}
          {(running || lines.length > 0) && (
            <div className="mt-5">
              <Terminal lines={lines} active={running} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
          <p className="hidden text-xs text-slate-500 sm:block">
            {tab === 'install'
              ? 'Runs the official 3x-ui install script over SSH.'
              : 'Links to an already-running 3x-ui panel via its web API.'}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={close} disabled={running}>
              Cancel
            </Button>
            {tab === 'install' ? (
              <Button onClick={startInstall} disabled={running}>
                {running ? (
                  <>
                    <Spinner className="h-4 w-4" /> Installing...
                  </>
                ) : (
                  <>
                    <TerminalIcon className="h-4 w-4" /> Start Installation
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={startConnect} disabled={running}>
                {running ? (
                  <>
                    <Spinner className="h-4 w-4" /> Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" /> Connect Panel
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-150 ${
        active
          ? 'bg-slate-800 text-sky-300 shadow-sm ring-1 ring-sky-500/30'
          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
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
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </span>
        <div className="[&_input]:pl-9">{children}</div>
      </div>
    </Field>
  );
}


