import type { Status } from "@/lib/waf-simulator";

const styles: Record<Status, string> = {
  ALLOW: "border-[color:var(--allow)] text-[color:var(--allow)] bg-[color:var(--allow)]/10",
  CAPTCHA: "border-[color:var(--captcha)] text-[color:var(--captcha)] bg-[color:var(--captcha)]/10",
  BLOCK: "border-[color:var(--block)] text-[color:var(--block)] bg-[color:var(--block)]/10",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest font-mono ${styles[status]}`}
    >
      {status}
    </span>
  );
}
