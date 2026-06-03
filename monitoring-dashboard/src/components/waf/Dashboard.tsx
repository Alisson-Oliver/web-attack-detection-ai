import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Play, Shield, Square, Zap } from "lucide-react";
import { generateLog, type LogEntry } from "@/lib/waf-simulator";
import { StatusBadge } from "./StatusBadge";
import { ScriptTypeBadge } from "./ScriptTypeBadge";
import { TrafficChart } from "./TrafficChart";

const MAX_LOGS = 100;

export function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (entry: LogEntry) => setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));

  useEffect(() => {
    if (streaming) {
      intervalRef.current = setInterval(() => addLog(generateLog()), 800);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [streaming]);

  const counts = useMemo(
    () =>
      logs.reduce(
        (acc, l) => {
          if (l.status === "ALLOW") acc.allow++;
          else if (l.status === "CAPTCHA") acc.captcha++;
          else acc.block++;
          return acc;
        },
        { allow: 0, captcha: 0, block: 0 },
      ),
    [logs],
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
              SENTINEL<span className="text-primary">.AI</span>
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              AI Web Application Firewall · Live Console
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 font-mono text-xs">
          <span
            className={`h-2 w-2 rounded-full ${streaming ? "bg-allow glow-allow animate-pulse-dot" : "bg-muted-foreground"}`}
          />
          <span className="text-muted-foreground">{streaming ? "STREAMING" : "IDLE"}</span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Simulation controls */}
        <section className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
              Simular Tráfego
            </h2>
          </div>
          <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
            Trigger synthetic API traffic to evaluate the WAF inference engine in real time.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => addLog(generateLog())}
              className="group flex w-full items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 hover:shadow-[0_0_20px_oklch(0.72_0.18_200/30%)]"
            >
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Single Request
              </span>
              <span className="font-mono text-[10px] opacity-60 group-hover:opacity-100">
                ./fire --once
              </span>
            </button>

            <button
              onClick={() => setStreaming((s) => !s)}
              className={`group flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                streaming
                  ? "border-block bg-(--block)/15 text-block glow-block"
                  : "border-allow bg-(--allow)/10 text-allow hover:glow-allow"
              }`}
            >
              <span className="flex items-center gap-2">
                {streaming ? <Square className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                {streaming ? "Stop Continuous" : "Continuous Traffic"}
              </span>
              <span className="font-mono text-[10px] opacity-60 group-hover:opacity-100">
                {streaming ? "live · 800ms" : "./fire --loop"}
              </span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
            <Stat label="Allow" value={counts.allow} color="var(--allow)" />
            <Stat label="Captcha" value={counts.captcha} color="var(--captcha)" />
            <Stat label="Block" value={counts.block} color="var(--block)" />
          </div>
        </section>

        {/* Traffic overview */}
        <section className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Traffic Overview
              </h2>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              window · {logs.length}/{MAX_LOGS}
            </span>
          </div>
          <TrafficChart counts={counts} />
        </section>

        {/* Logs */}
        <section className="rounded-xl border border-border bg-card/70 backdrop-blur lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${streaming ? "bg-allow animate-pulse-dot" : "bg-muted-foreground"}`}
              />
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Live API Logs
              </h2>
            </div>
            <button
              onClick={() => setLogs([])}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
            >
              clear
            </button>
          </div>

          <div className="max-h-120 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/95 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Script</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Request Path</th>
                  <th className="px-5 py-3 font-medium">Source IP</th>
                  <th className="px-5 py-3 font-medium">Entropy</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2 font-mono">
                        <span className="opacity-50">// no traffic captured</span>
                        <span className="opacity-30">awaiting simulation...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="animate-row-in border-t border-border/50 transition hover:bg-accent/40"
                    >
                      <td className="px-5 py-2.5">
                        <ScriptTypeBadge type={log.scriptType} />
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">
                        {log.timestamp}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs text-foreground">{log.path}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">
                        {log.ip}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs">
                        <EntropyBar value={log.entropy} />
                      </td>
                      <td className="px-5 py-2.5">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div
        className="font-mono text-lg font-bold"
        style={{
          color: `var(--${label.toLowerCase() === "allow" ? "allow" : label.toLowerCase() === "captcha" ? "captcha" : "block"})`,
        }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="sr-only" style={{ color }} />
    </div>
  );
}

function EntropyBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 7) * 100);
  const color = value >= 4 ? "var(--block)" : value >= 2.5 ? "var(--captcha)" : "var(--allow)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-muted-foreground">{value.toFixed(2)}</span>
    </div>
  );
}
