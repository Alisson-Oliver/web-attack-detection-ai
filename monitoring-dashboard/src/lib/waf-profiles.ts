export type ProfileKey = "normal" | "brute-force" | "scraper" | "dos" | "ddos";
export type ScriptType = "Normal" | "Ataque";

export interface TrafficProfile {
  key: ProfileKey;
  label: string;
  description: string;
  userAgent: string;
  ipRange: string;
  generateIp: () => string;
  pickRequest: () => { method: "GET" | "POST"; path: string; body?: Record<string, string> };
  minDelayMs: number;
  maxDelayMs: number;
  scriptType: ScriptType;
}

function r(): number {
  return Math.floor(Math.random() * 254) + 1;
}

export const PROFILES: Record<ProfileKey, TrafficProfile> = {
  normal: {
    key: "normal",
    label: "Normal User",
    description: "Human browsing · Chrome UA · 2–5 s delay · 200.150.x.x",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
    ipRange: "200.150.x.x",
    generateIp: () => `200.150.${r()}.${r()}`,
    pickRequest: () => {
      if (Math.random() < 0.8) {
        const paths = ["/api/produtos", "/api/jogos", "/api/softwares", "/api/promocoes"];
        return { method: "GET", path: paths[Math.floor(Math.random() * paths.length)] };
      }
      return { method: "POST", path: "/api/login", body: { user: "alisson", pass: "minhasenha" } };
    },
    minDelayMs: 2000,
    maxDelayMs: 5000,
    scriptType: "Normal",
  },

  "brute-force": {
    key: "brute-force",
    label: "Brute Force Bot",
    description: "Login flood · python-requests UA · 100–300 ms · 10.0.x.x",
    userAgent: "python-requests/2.28.1",
    ipRange: "10.0.x.x",
    generateIp: () => `10.0.${r()}.${r()}`,
    pickRequest: () => ({
      method: "POST",
      path: "/api/login",
      body: { user: "admin", pass: `senha_${Math.floor(Math.random() * 9999)}` },
    }),
    minDelayMs: 100,
    maxDelayMs: 300,
    scriptType: "Ataque",
  },

  scraper: {
    key: "scraper",
    label: "Scraper Bot",
    description: "Stealth scan · Scrapy UA · 1–3 s delay · 192.168.x.x",
    userAgent: "Scrapy/2.11 (Bot)",
    ipRange: "192.168.x.x",
    generateIp: () => `192.168.${r()}.${r()}`,
    pickRequest: () => ({
      method: "GET",
      path: `/api/pasta_secreta_${Math.floor(Math.random() * 500) + 1}`,
    }),
    minDelayMs: 1000,
    maxDelayMs: 3000,
    scriptType: "Ataque",
  },

  dos: {
    key: "dos",
    label: "DoS Single IP",
    description: "Max flood · curl UA · fixed IP 66.66.66.66",
    userAgent: "curl/7.68.0",
    ipRange: "66.66.66.66",
    generateIp: () => "66.66.66.66",
    pickRequest: () => ({ method: "GET", path: "/api/produtos" }),
    minDelayMs: 0,
    maxDelayMs: 50,
    scriptType: "Ataque",
  },

  ddos: {
    key: "ddos",
    label: "DDoS Botnet",
    description: "Distributed flood · Botnet UA · 100–500 ms · 172.16.x.x",
    userAgent: "Mozilla/5.0 (Botnet Node)",
    ipRange: "172.16.x.x",
    generateIp: () => `172.16.${r()}.${r()}`,
    pickRequest: () => {
      const paths = ["/api/lancamentos", "/api/promocoes"];
      return { method: "GET", path: paths[Math.floor(Math.random() * paths.length)] };
    },
    minDelayMs: 100,
    maxDelayMs: 500,
    scriptType: "Ataque",
  },
};

export const PROFILE_LIST = Object.values(PROFILES);
