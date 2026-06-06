import { type TrafficProfile } from "./waf-profiles";

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
  method: "GET" | "POST";
  httpStatus: number;
}

const BACKEND_URL = "http://localhost:3050";

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

function formatTimestamp(now: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;
}

function entropyForStatus(status: Status): number {
  if (status === "BLOCK") return 4 + Math.random() * 3;
  if (status === "CAPTCHA") return 2.5 + Math.random() * 2;
  return Math.random() * 2.5;
}

/** Generates a local mock log entry (no network call). */
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
  const now = new Date();
  const httpStatus = status === "BLOCK" ? 403 : status === "CAPTCHA" ? 401 : 200;
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    scriptType: isSuspicious ? "Ataque" : "Normal",
    timestamp: formatTimestamp(now),
    path,
    ip: randomIp(),
    entropy: Number(entropyForStatus(status).toFixed(2)),
    status,
    method: "GET",
    httpStatus,
  };
}

/** Fires a real HTTP request to the NestJS backend using the given Locust-style profile. */
export async function fetchLogFromProfile(profile: TrafficProfile): Promise<LogEntry> {
  const ip = profile.generateIp();
  const { method, path, body } = profile.pickRequest();
  const now = new Date();

  const headers: Record<string, string> = {
    "X-Forwarded-For": ip,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";

  let httpStatus = 200;
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    });
    httpStatus = res.status;
  } catch {
    httpStatus = 0;
  }

  let status: Status;
  if (httpStatus === 403) status = "BLOCK";
  else if (httpStatus === 401) status = "CAPTCHA";
  else if (httpStatus === 0) status = "BLOCK";
  else status = "ALLOW";

  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    scriptType: profile.scriptType,
    timestamp: formatTimestamp(now),
    path,
    ip,
    entropy: Number(entropyForStatus(status).toFixed(2)),
    status,
    method,
    httpStatus,
  };
}
