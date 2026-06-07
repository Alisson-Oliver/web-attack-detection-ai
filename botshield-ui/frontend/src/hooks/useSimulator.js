import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'http://localhost:8001';
const MAX_LOGS = 200;

const EMPTY_STATS = {
  'Humano':      { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
  'Brute Force': { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
  'Scraper':     { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
  'DoS Single':  { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
  'Botnet':      { ALLOW: 0, CAPTCHA: 0, BLOCK: 0 },
};

export function useSimulator() {
  const [running, setRunning]     = useState(false);
  const [mode, setMode]           = useState(null);
  const [logs, setLogs]           = useState([]);
  const [stats, setStats]         = useState(EMPTY_STATS);
  const [connected, setConnected] = useState(false);
  const logIdRef = useRef(0);

  useEffect(() => {
    const es = new EventSource(`${API}/stream`);
    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === 'request') {
          const entry = { ...evt, id: ++logIdRef.current };
          setLogs(prev => {
            const next = [entry, ...prev];
            return next.length > MAX_LOGS ? next.slice(0, MAX_LOGS) : next;
          });
          if (evt.stats) setStats(evt.stats);
        } else if (evt.type === 'stopped') {
          setRunning(false);
          setMode(null);
        } else if (evt.type === 'cleared') {
          setLogs([]);
          if (evt.stats) setStats(evt.stats);
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  const start = useCallback(async (modeNum) => {
    const res = await fetch(`${API}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: modeNum }),
    });
    const data = await res.json();
    if (data.ok) {
      setRunning(true);
      setMode(modeNum);
      setLogs([]);
      setStats(EMPTY_STATS);
    }
    return data;
  }, []);

  const stop = useCallback(async () => {
    await fetch(`${API}/stop`, { method: 'POST' });
    setRunning(false);
    setMode(null);
  }, []);

  const clear = useCallback(async () => {
    await fetch(`${API}/clear`, { method: 'POST' });
    setLogs([]);
    setStats(EMPTY_STATS);
  }, []);

  return { running, mode, logs, stats, connected, start, stop, clear };
}
