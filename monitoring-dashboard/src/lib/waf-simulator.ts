export type Status = "ALLOW" | "CAPTCHA" | "BLOCK";
export type ScriptType = "Normal" | "Ataque";

export interface LogEntry {
  id: string;
  scriptType: ScriptType;
  timestamp: string;
  path: string;
  ip: string;
  entropy: number;
  status: Status;
}

const PATHS = [
  "/api/v1/users",
  "/api/v1/login",
  "/api/v1/products",
  "/api/v1/checkout",
  "/admin/config",
  "/api/v1/search?q=test",
  "/wp-admin/",
  "/.env",
  "/api/v1/upload",
  "/api/v1/auth/refresh",
  "/api/v1/orders",
  "/api/v1/../../etc/passwd",
  "/api/v1/comments",
  "/graphql",
];

const SUSPICIOUS_PATHS = ["/wp-admin/", "/.env", "/api/v1/../../etc/passwd", "/admin/config"];

function randomIp(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function generateLog(): LogEntry {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const isSuspicious = SUSPICIOUS_PATHS.includes(path);
  const roll = Math.random();
  let status: Status;
  if (isSuspicious) {
    status = roll < 0.7 ? "BLOCK" : "CAPTCHA";
  } else {
    if (roll < 0.78) status = "ALLOW";
    else if (roll < 0.93) status = "CAPTCHA";
    else status = "BLOCK";
  }
  const entropy =
    status === "BLOCK"
      ? 4 + Math.random() * 3
      : status === "CAPTCHA"
        ? 2.5 + Math.random() * 2
        : Math.random() * 2.5;
  const now = new Date();
  const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    scriptType: isSuspicious ? "Ataque" : "Normal",
    timestamp: ts,
    path,
    ip: randomIp(),
    entropy: Number(entropy.toFixed(2)),
    status,
  };
}
