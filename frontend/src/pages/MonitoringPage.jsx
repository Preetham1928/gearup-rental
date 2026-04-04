import React, { useState, useEffect } from 'react';
import api from '../api';

const SERVICES = [
  { name: 'API Server (Node.js/Express)', endpoint: '/health', key: 'api' },
  { name: 'React Frontend', endpoint: null, key: 'frontend' },
  { name: 'PostgreSQL (Sequelize ORM)', endpoint: null, key: 'postgres' },
  { name: 'MongoDB (Mongoose ODM)', endpoint: null, key: 'mongo' },
  { name: 'Kubernetes Cluster', endpoint: null, key: 'k8s' },
];

export default function MonitoringPage() {
  const [apiHealth, setApiHealth] = useState(null);
  const [uptime, setUptime] = useState(null);
  const [tick, setTick] = useState(0);

  // Poll /health every 15s
  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/health'.replace('/api', '').replace('api/', '') || 'http://localhost:5000/health');
        setApiHealth(res.data);
      } catch {
        setApiHealth(null);
      }
    };
    check();
    const iv = setInterval(() => { check(); setTick(t => t + 1); }, 15000);
    return () => clearInterval(iv);
  }, []);

  // Simulated metrics (in real app: Prometheus)
  const metrics = {
    uptime: '99.8%',
    responseTime: `${120 + Math.floor(Math.sin(tick) * 20)}ms`,
    requestsPerHr: `${2400 + Math.floor(Math.random() * 200)}`,
    errorRate: '0.3%',
    cpuUsage: 42 + Math.floor(Math.sin(tick * 0.5) * 10),
    memUsage: 68 + Math.floor(Math.cos(tick * 0.3) * 8),
    diskUsage: 55,
    pods: 3,
  };

  const serviceStatus = {
    api: apiHealth ? 'healthy' : 'degraded',
    frontend: 'healthy',
    postgres: 'healthy',
    mongo: 'degraded',
    k8s: 'healthy',
  };

  const STATUS_COLOR = { healthy: 'var(--success)', degraded: 'var(--warning)', down: 'var(--danger)' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">MONITORING</h1>
          <div className="page-sub">Prometheus · Grafana · ELK Stack · Real-time metrics</div>
        </div>
        <span className="badge badge-available" style={{ padding: '8px 16px', fontSize: 12 }}>● Systems Operational</span>
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: '⬆️', val: metrics.uptime, label: 'Uptime (30d)', cls: 'green' },
          { icon: '⚡', val: metrics.responseTime, label: 'Avg Response', cls: 'blue' },
          { icon: '📡', val: metrics.requestsPerHr, label: 'Requests / hr', cls: 'orange' },
          { icon: '❌', val: metrics.errorRate, label: 'Error Rate', cls: 'red' },
        ].map((m, i) => (
          <div key={i} className={`stat-card ${m.cls} slide-up`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon">{m.icon}</div>
            <div className="stat-val" style={{ fontSize: 32 }}>{m.val}</div>
            <div className="stat-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Service Health */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">SERVICE HEALTH</div>
            {apiHealth && <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>uptime: {Math.floor(apiHealth.uptime)}s</span>}
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SERVICES.map(svc => {
              const st = serviceStatus[svc.key];
              return (
                <div key={svc.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span>{svc.name}</span>
                    <span style={{ fontWeight: 600, color: STATUS_COLOR[st], fontFamily: 'DM Mono, monospace', fontSize: 11 }}>
                      ● {st}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: st === 'healthy' ? '95%' : st === 'degraded' ? '60%' : '10%',
                      background: STATUS_COLOR[st]
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resource Usage */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">RESOURCE USAGE</div></div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'CPU Usage', val: metrics.cpuUsage, color: metrics.cpuUsage > 80 ? 'var(--danger)' : 'var(--accent)' },
              { label: 'Memory Usage', val: metrics.memUsage, color: metrics.memUsage > 85 ? 'var(--danger)' : 'var(--info)' },
              { label: 'Disk Usage', val: metrics.diskUsage, color: 'var(--success)' },
              { label: 'Kubernetes Pods Active', val: (metrics.pods / 5) * 100, displayVal: `${metrics.pods}/5`, color: 'var(--success)' },
            ].map(r => (
              <div key={r.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontFamily: 'DM Mono, monospace' }}>
                  <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ color: r.color }}>{r.displayVal || `${r.val}%`}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.val}%`, background: r.color, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">RECENT ALERTS</div>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>Prometheus Alertmanager</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {[
            { level: 'warning', msg: 'MongoDB response time elevated (>200ms)', time: '15 min ago', icon: '⚠️' },
            { level: 'info', msg: 'Auto-scaling triggered: +1 pod added to rentforge-api', time: '1 hr ago', icon: '📡' },
            { level: 'info', msg: 'Build #143 deployment to staging initiated', time: '2 hr ago', icon: '🔄' },
            { level: 'error', msg: 'Build #140 failed: auth test suite error', time: '2 days ago', icon: '❌' },
            { level: 'info', msg: 'Terraform apply: 2 EC2 instances provisioned', time: '3 days ago', icon: '✅' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(37,42,56,.5)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, marginTop: 1 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{a.msg}</div>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', marginTop: 3 }}>
                  {a.time} · <span style={{ color: { warning: 'var(--warning)', error: 'var(--danger)', info: 'var(--info)' }[a.level] }}>{a.level.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
