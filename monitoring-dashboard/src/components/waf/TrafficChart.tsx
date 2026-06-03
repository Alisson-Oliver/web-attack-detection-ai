import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  counts: { allow: number; captcha: number; block: number };
}

export function TrafficChart({ counts }: Props) {
  const total = counts.allow + counts.captcha + counts.block;
  const data = [
    { name: "Allowed", value: counts.allow, color: "oklch(0.74 0.18 155)" },
    { name: "Captcha", value: counts.captcha, color: "oklch(0.82 0.17 85)" },
    { name: "Blocked", value: counts.block, color: "oklch(0.68 0.24 20)" },
  ];
  const display = total === 0 ? [{ name: "Idle", value: 1, color: "oklch(0.3 0.03 255)" }] : data;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={display}
              dataKey="value"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {display.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            {total > 0 && (
              <Tooltip
                contentStyle={{
                  background: "oklch(0.21 0.025 252)",
                  border: "1px solid oklch(0.32 0.03 255)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Requests
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {data.map((d) => {
          const pct = total === 0 ? 0 : (d.value / total) * 100;
          return (
            <div key={d.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
                  />
                  <span className="font-medium text-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {d.value} <span className="opacity-60">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: d.color, boxShadow: `0 0 8px ${d.color}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
