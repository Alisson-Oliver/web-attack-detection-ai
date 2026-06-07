import React, { useState } from 'react';
import {
  Shield, Activity, Play, Square, Wifi, WifiOff,
  User, Zap, Eye, Cpu, Globe, Trash2,
  CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';
import { useSimulator } from './hooks/useSimulator';
import './App.css';

const MODES = [
  { id: 1, label: 'Humano',      sub: '50 usuários legítimos',      icon: User,     color: 'var(--profile-1)' },
  { id: 2, label: 'Scraper',     sub: '20 bots furtivos',           icon: Eye,      color: 'var(--profile-3)' },
  { id: 3, label: 'Brute Force', sub: '50 atacantes de credencial', icon: Zap,      color: 'var(--profile-2)' },
  { id: 4, label: 'DoS',         sub: '5 threads, IP fixo',         icon: Cpu,      color: 'var(--profile-4)' },
  { id: 5, label: 'Botnet',      sub: '150 nós distribuídos',       icon: Globe,    color: 'var(--profile-5)' },
  { id: 6, label: 'Caos Total',  sub: '80% humano + 20% ataques',   icon: Activity, color: '#e2e8f0' },
];

const PROFILE_COLORS = {
  'Humano':      'var(--profile-1)',
  'Brute Force': 'var(--profile-2)',
  'Scraper':     'var(--profile-3)',
  'DoS Single':  'var(--profile-4)',
  'Botnet':      'var(--profile-5)',
};

const DECISION_META = {
  ALLOW:   { color: 'var(--allow)',   Icon: CheckCircle,   label: 'ALLOW'   },
  CAPTCHA: { color: 'var(--captcha)', Icon: AlertTriangle, label: 'CAPTCHA' },
  BLOCK:   { color: 'var(--block)',   Icon: XCircle,       label: 'BLOCK'   },
};

function StatusDot({ connected, running }) {
  return (
    <div className="status-dot-wrap">
      <span className={`status-dot ${running ? 'running' : connected ? 'idle' : 'offline'}`} />
      <span className="status-label">
        {running ? 'ATIVO' : connected ? 'AGUARDANDO' : 'DESCONECTADO'}
      </span>
    </div>
  );
}

function StatCard({ profile, data, color }) {
  const total = data.ALLOW + data.CAPTCHA + data.BLOCK;
  const blockPct = total > 0 ? Math.round((data.BLOCK / total) * 100) : 0;
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-profile" style={{ color }}>{profile}</span>
        <span className="stat-total">{total} req</span>
      </div>
      <div className="stat-bars">
        <div className="stat-bar-row">
          <CheckCircle size={11} color="var(--allow)" />
          <div className="bar-track">
            <div className="bar-fill allow" style={{ width: total ? `${(data.ALLOW/total)*100}%` : '0%' }} />
          </div>
          <span className="bar-val" style={{ color: 'var(--allow)' }}>{data.ALLOW}</span>
        </div>
        <div className="stat-bar-row">
          <AlertTriangle size={11} color="var(--captcha)" />
          <div className="bar-track">
            <div className="bar-fill captcha" style={{ width: total ? `${(data.CAPTCHA/total)*100}%` : '0%' }} />
          </div>
          <span className="bar-val" style={{ color: 'var(--captcha)' }}>{data.CAPTCHA}</span>
        </div>
        <div className="stat-bar-row">
          <XCircle size={11} color="var(--block)" />
          <div className="bar-track">
            <div className="bar-fill block" style={{ width: total ? `${(data.BLOCK/total)*100}%` : '0%' }} />
          </div>
          <span className="bar-val" style={{ color: 'var(--block)' }}>{data.BLOCK}</span>
        </div>
      </div>
      <div className="stat-footer">
        <span className="stat-pct" style={{
          color: blockPct > 50 ? 'var(--block)' : blockPct > 20 ? 'var(--captcha)' : 'var(--allow)'
        }}>
          {blockPct}% bloqueado
        </span>
      </div>
    </div>
  );
}

function LogRow({ entry }) {
  const dec = DECISION_META[entry.decision] || DECISION_META.ALLOW;
  const { Icon } = dec;
  const profileColor = PROFILE_COLORS[entry.profile] || '#8899aa';
  const ts = entry.ts ? entry.ts.slice(11, 19) : '';

  return (
    <div className={`log-row dec-${entry.decision.toLowerCase()}`}>
      <span className="log-ts">{ts}</span>
      <span className="log-profile" style={{ color: profileColor }}>{entry.profile}</span>
      <span className="log-ip">{entry.ip}</span>
      <span className={`log-method method-${entry.method}`}>{entry.method}</span>
      <span className="log-endpoint">{entry.endpoint}</span>
      <span className="log-status">{entry.status}</span>
      <span className="log-decision" style={{ color: dec.color }}>
        <Icon size={11} />
        {dec.label}
      </span>
    </div>
  );
}

export default function App() {
  const { running, mode, logs, stats, connected, start, stop, clear } = useSimulator();
  const [starting, setStarting] = useState(false);

  async function handleStart(modeId) {
    setStarting(true);
    await start(modeId);
    setStarting(false);
  }

  const ConnIcon = connected ? Wifi : WifiOff;
  const totalReqs    = Object.values(stats).reduce((s, p) => s + p.ALLOW + p.CAPTCHA + p.BLOCK, 0);
  const totalBlocked = Object.values(stats).reduce((s, p) => s + p.BLOCK, 0);
  const totalCaptcha = Object.values(stats).reduce((s, p) => s + p.CAPTCHA, 0);
  const totalAllow   = totalReqs - totalBlocked - totalCaptcha;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Shield size={20} color="var(--allow)" />
          <span className="header-title">BotShield</span>
          <span className="header-sub">Security Monitor</span>
        </div>
        <div className="header-right">
          <StatusDot connected={connected} running={running} />
          <ConnIcon size={14} color={connected ? 'var(--allow)' : 'var(--block)'} />
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <p className="sidebar-label">SIMULAÇÃO</p>
            {running ? (
              <button className="btn-stop" onClick={stop}>
                <Square size={13} />
                Parar simulação
              </button>
            ) : (
              <div className="mode-list">
                {MODES.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      className="mode-btn"
                      style={{ '--accent': m.color }}
                      onClick={() => handleStart(m.id)}
                      disabled={starting}
                    >
                      <Icon size={14} color={m.color} />
                      <div className="mode-text">
                        <span className="mode-label">{m.label}</span>
                        <span className="mode-sub">{m.sub}</span>
                      </div>
                      <Play size={11} className="mode-play" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">TOTAIS</p>
            <div className="totals">
              <div className="total-row">
                <span className="total-label">Requisições</span>
                <span className="total-val">{totalReqs}</span>
              </div>
              <div className="total-row">
                <CheckCircle size={11} color="var(--allow)" />
                <span className="total-label">Permitidas</span>
                <span className="total-val" style={{ color: 'var(--allow)' }}>{totalAllow}</span>
              </div>
              <div className="total-row">
                <AlertTriangle size={11} color="var(--captcha)" />
                <span className="total-label">CAPTCHA</span>
                <span className="total-val" style={{ color: 'var(--captcha)' }}>{totalCaptcha}</span>
              </div>
              <div className="total-row">
                <XCircle size={11} color="var(--block)" />
                <span className="total-label">Bloqueadas</span>
                <span className="total-val" style={{ color: 'var(--block)' }}>{totalBlocked}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">REGISTROS</p>
            <button className="btn-clear" onClick={clear}>
              <Trash2 size={13} />
              Limpar registros
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="stats-grid">
            {Object.entries(stats).map(([profile, data]) => (
              <StatCard
                key={profile}
                profile={profile}
                data={data}
                color={PROFILE_COLORS[profile] || '#8899aa'}
              />
            ))}
          </div>

          <div className="log-panel">
            <div className="log-header">
              <Activity size={13} color="var(--text2)" />
              <span>Feed de Requisições</span>
              <span className="log-count">{logs.length} entradas</span>
            </div>
            <div className="log-cols-header">
              <span>HORA</span>
              <span>PERFIL</span>
              <span>IP</span>
              <span>MÉT.</span>
              <span>ENDPOINT</span>
              <span>STATUS</span>
              <span>DECISÃO</span>
            </div>
            <div className="log-list">
              {logs.length === 0 ? (
                <div className="log-empty">
                  <Shield size={32} color="var(--border2)" />
                  <p>Inicie uma simulação para visualizar o tráfego</p>
                </div>
              ) : (
                logs.map(e => <LogRow key={e.id} entry={e} />)
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
