export function formatBandwidth(gb: number): string {
  if (gb >= 1000) {
    const tb = gb / 1000;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
}

export function formatCost(rs: number): string {
  return `Rs ${rs.toLocaleString('en-PK')}`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
