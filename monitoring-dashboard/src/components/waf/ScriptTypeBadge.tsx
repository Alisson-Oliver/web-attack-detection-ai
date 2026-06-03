import type { ScriptType } from "@/lib/waf-simulator";

const styles: Record<ScriptType, string> = {
  Normal:
    "border-[color:var(--allow)] text-[color:var(--allow)] bg-[color:var(--allow)]/10 glow-allow",
  Ataque:
    "border-[color:var(--block)] text-[color:var(--block)] bg-[color:var(--block)]/10 glow-block",
};

export function ScriptTypeBadge({ type }: { type: ScriptType }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest font-mono ${styles[type]}`}
    >
      {type}
    </span>
  );
}
