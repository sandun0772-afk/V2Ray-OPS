import { useEffect, useRef } from 'react';
import { TerminalSquare } from 'lucide-react';

export interface TerminalLine {
  id: string;
  text: string;
  /** Tag prefix parsed from text like "[SSH] ...". */
  tag: string;
  /** Tailwind text color class for the tag. */
  color: string;
}

const TAG_COLORS: Record<string, string> = {
  SSH: 'text-sky-400',
  SYSTEM: 'text-violet-300',
  CHECK: 'text-amber-300',
  INSTALL: 'text-cyan-300',
  SUCCESS: 'text-emerald-400',
  API: 'text-sky-300',
  COMPLETE: 'text-emerald-400 font-semibold',
  NET: 'text-sky-400',
  ERROR: 'text-rose-400',
};

export function parseTag(text: string): { tag: string; color: string } {
  const m = text.match(/^\[([A-Z]+)\]/);
  const tag = m?.[1] ?? 'LOG';
  return { tag, color: TAG_COLORS[tag] ?? 'text-slate-300' };
}

interface TerminalProps {
  lines: TerminalLine[];
  active: boolean;
}

export function Terminal({ lines, active }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#0a0f1c] shadow-inner">
      <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-900/80 px-4 py-2.5">
        <TerminalSquare className="h-4 w-4 text-slate-400" />
        <span className="font-mono text-xs font-medium text-slate-300">
          provisioning log
        </span>
        <div className="ml-auto flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
      </div>
      <div
        ref={scrollRef}
        className="terminal-scanlines max-h-[300px] min-h-[180px] overflow-y-auto px-4 py-3"
      >
        {lines.length === 0 && !active && (
          <p className="font-mono text-xs text-slate-600">
            Waiting to start...
          </p>
        )}
        <div className="space-y-1.5">
          {lines.map((line) => {
            const { color } = parseTag(line.text);
            return (
              <div key={line.id} className="term-line flex gap-2 font-mono text-xs leading-relaxed">
                <span className="shrink-0 select-none text-slate-600">
                  {String(line.id).padStart(2, '0')}
                </span>
                <span className="whitespace-pre-wrap break-all text-slate-200">
                  <span className={color}>{line.text.slice(0, line.text.indexOf(']') + 1)}</span>
                  <span>{line.text.slice(line.text.indexOf(']') + 1)}</span>
                </span>
              </div>
            );
          })}
          {active && (
            <div className="term-line flex gap-2 font-mono text-xs">
              <span className="shrink-0 select-none text-slate-600">→</span>
              <span className="term-cursor text-emerald-400">█</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
