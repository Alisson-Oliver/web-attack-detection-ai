import { useCallback, useMemo, useRef, useState } from "react";
import { Activity, ChevronDown, Shield, Square, Zap } from "lucide-react";
import { fetchLogFromProfile, type LogEntry } from "@/lib/waf-simulator";
import { PROFILES, PROFILE_LIST, type ProfileKey } from "@/lib/waf-profiles";
import { StatusBadge } from "./StatusBadge";
import { ScriptTypeBadge } from "./ScriptTypeBadge";
import { TrafficChart } from "./TrafficChart";

const MAX_LOGS = 100;
const MAX_CONSOLE = 60;

export function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileKey>("normal");
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const streamingRef = useRef(false);
  const selectedProfileRef = useRef<ProfileKey>("normal");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushLog = (entry: LogEntry) => setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));

  const pushConsoleLine = (line: string) => {
    setConsoleLines((prev) => [...prev.slice(-(MAX_CONSOLE - 1)), line]);
    setTimeout(() => consoleEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  const runLoop = useCallback(async function loop() {
    if (!streamingRef.current) return;
    const profile = PROFILES[selectedProfileRef.current];

    const isAttack = profile.scriptType === "Ataque";
    const parallelCount = isAttack ? 5 : 1;

    try {
      const logs = await Promise.all(
        Array.from({ length: parallelCount }, () => fetchLogFromProfile(profile)),
      );
      setLogs((prev) => [...logs, ...prev].slice(0, MAX_LOGS));
      logs.forEach((log) => {
        const statusTag = log.httpStatus === 0 ? "offline" : `HTTP ${log.httpStatus}`;
        setConsoleLines((prev) => [
          ...prev.slice(-(MAX_CONSOLE - 1)),
          `${log.method.padEnd(4)} ${log.path} · ${log.ip} → ${log.status} [${statusTag}]`,
        ]);
      });
    } catch {
      setConsoleLines((prev) => [
        ...prev.slice(-(MAX_CONSOLE - 1)),
        `! connection error — backend offline?`,
      ]);
    }

    const delay = profile.minDelayMs + Math.random() * (profile.maxDelayMs - profile.minDelayMs);
    timerRef.current = setTimeout(loop, delay);
  }, []);

  const toggleStreaming = () => {
    if (streamingRef.current) {
      streamingRef.current = false;
      setStreaming(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      pushConsoleLine(`■ ${PROFILES[selectedProfileRef.current].label} stopped`);
    } else {
      streamingRef.current = true;
      selectedProfileRef.current = selectedProfile;
      setStreaming(true);
      pushConsoleLine(
        `▶ ${PROFILES[selectedProfile].label} started · range ${PROFILES[selectedProfile].ipRange}`,
      );
      runLoop();
    }
  };

  const handleProfileChange = (key: ProfileKey) => {
    setSelectedProfile(key);
    selectedProfileRef.current = key;
  };

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
        <section className="flex flex-col rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
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
            {/* Profile selector */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Attack Profile
              </label>
              <div className="relative">
                <select
                  value={selectedProfile}
                  onChange={(e) => handleProfileChange(e.target.value as ProfileKey)}
                  disabled={streaming}
                  className="w-full appearance-none rounded-lg border border-border bg-background/60 px-4 py-2.5 pr-8 font-mono text-sm text-foreground transition focus:border-primary/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PROFILE_LIST.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {PROFILES[selectedProfile].description}
              </p>
            </div>

            {/* Continuous traffic button */}
            <button
              onClick={toggleStreaming}
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
                {streaming
                  ? `live · ${PROFILES[selectedProfileRef.current].ipRange}`
                  : "./fire --loop"}
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
            <Stat label="Allow" value={counts.allow} />
            <Stat label="Captcha" value={counts.captcha} />
            <Stat label="Block" value={counts.block} />
          </div>

          {/* Console output */}
          <div className="mt-4 flex-1 rounded-lg border border-border bg-background/80">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${streaming ? "bg-primary animate-pulse-dot" : "bg-muted-foreground/40"}`}
                />
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  console
                </span>
              </div>
              <button
                onClick={() => setConsoleLines([])}
                className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
              >
                clr
              </button>
            </div>
            <div className="h-40 overflow-auto p-2.5">
              {consoleLines.length === 0 ? (
                <p className="font-mono text-[10px] text-muted-foreground/40">
                  // awaiting simulation...
                </p>
              ) : (
                consoleLines.map((line, i) => (
                  <p
                    key={i}
                    className={`font-mono text-[10px] leading-5 ${
                      line.startsWith("!") || line.startsWith("■")
                        ? "text-muted-foreground"
                        : line.includes("BLOCK")
                          ? "text-[var(--block)]"
                          : line.includes("CAPTCHA")
                            ? "text-[var(--captcha)]"
                            : line.startsWith("▶")
                              ? "text-primary"
                              : "text-[var(--allow)]"
                    }`}
                  >
                    {line}
                  </p>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
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

        {/* Live API logs table */}
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
                  <th className="px-5 py-3 font-medium">Method</th>
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
                      colSpan={7}
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
                      <td className="px-5 py-2.5">
                        <MethodBadge method={log.method} />
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

function Stat({ label, value }: { label: string; value: number }) {
  const color =
    label.toLowerCase() === "allow"
      ? "var(--allow)"
      : label.toLowerCase() === "captcha"
        ? "var(--captcha)"
        : "var(--block)";
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="font-mono text-lg font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
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

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`font-mono text-[10px] font-bold tracking-wider ${
        method === "POST" ? "text-[var(--captcha)]" : "text-[var(--allow)]"
      }`}
    >
      {method}
    </span>
  );
}
