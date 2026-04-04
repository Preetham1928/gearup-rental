import React, { useState } from 'react';

const PIPELINES = [
  {
    id: 142, branch: 'main', status: 'deployed', triggeredBy: 'Dr. Mohammed Ali Shaik', ago: '2 hr ago',
    stages: [
      { name: 'Source', status: 'passed', time: '0m 12s' },
      { name: 'Build', status: 'passed', time: '1m 48s' },
      { name: 'Unit Tests', status: 'passed', time: '0m 55s' },
      { name: 'Docker Build', status: 'passed', time: '2m 10s' },
      { name: 'Push Registry', status: 'passed', time: '0m 28s' },
      { name: 'Deploy K8s', status: 'passed', time: '0m 35s' },
    ]
  },
  {
    id: 143, branch: 'develop', status: 'running', triggeredBy: 'Mr. K Sudheer Kumar', ago: 'Just now',
    stages: [
      { name: 'Source', status: 'passed', time: '0m 08s' },
      { name: 'Build', status: 'running', time: '0m 42s' },
      { name: 'Unit Tests', status: 'queued', time: '—' },
      { name: 'Docker Build', status: 'queued', time: '—' },
      { name: 'Push Registry', status: 'queued', time: '—' },
      { name: 'Deploy K8s', status: 'queued', time: '—' },
    ]
  },
  {
    id: 141, branch: 'main', status: 'passed', triggeredBy: 'Mr. K Sudheer Kumar', ago: 'Yesterday',
    stages: [
      { name: 'Source', status: 'passed', time: '0m 10s' },
      { name: 'Build', status: 'passed', time: '1m 52s' },
      { name: 'Unit Tests', status: 'passed', time: '1m 02s' },
      { name: 'Docker Build', status: 'passed', time: '2m 05s' },
      { name: 'Push Registry', status: 'passed', time: '0m 30s' },
      { name: 'Deploy K8s', status: 'passed', time: '0m 40s' },
    ]
  },
  {
    id: 140, branch: 'feature/auth', status: 'failed', triggeredBy: 'Ms. M Mounika', ago: '2 days ago',
    stages: [
      { name: 'Source', status: 'passed', time: '0m 09s' },
      { name: 'Build', status: 'passed', time: '1m 44s' },
      { name: 'Unit Tests', status: 'failed', time: '0m 38s' },
      { name: 'Docker Build', status: 'skipped', time: '—' },
      { name: 'Push Registry', status: 'skipped', time: '—' },
      { name: 'Deploy K8s', status: 'skipped', time: '—' },
    ]
  },
];

const STAGE_STYLE = {
  passed:  { dot: '#22c55e', label: '✓ Passed' },
  failed:  { dot: '#ef4444', label: '✕ Failed' },
  running: { dot: '#3b82f6', label: '⟳ Running', pulse: true },
  queued:  { dot: '#6b7280', label: '⌛ Queued' },
  skipped: { dot: '#374151', label: '— Skipped' },
};

const STATUS_BADGE = {
  deployed: 'badge-deployed',
  passed: 'badge-approved',
  running: 'badge-active',
  failed: 'badge-rejected',
};

function PipelineCard({ pipe, expanded, onToggle }) {
  return (
    <div className="panel" style={{ marginBottom: 16, borderColor: pipe.status === 'running' ? 'rgba(59,130,246,.4)' : 'var(--border)' }}>
      <div className="panel-header" style={{ cursor: 'pointer' }} onClick={onToggle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="panel-title">BUILD #{pipe.id}</span>
            <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--accent)', background: 'rgba(244,161,26,.08)', padding: '2px 8px', border: '1px solid rgba(244,161,26,.2)' }}>
              {pipe.branch}
            </span>
            <span className={`badge ${STATUS_BADGE[pipe.status] || 'badge-pending'}`}>● {pipe.status}</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', marginTop: 4 }}>
            Triggered by: {pipe.triggeredBy} · {pipe.ago}
          </div>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="panel-body">
          {/* Stage row */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {pipe.stages.map((s, i) => {
              const st = STAGE_STYLE[s.status] || STAGE_STYLE.queued;
              return (
                <React.Fragment key={i}>
                  <div style={{ flex: '0 0 140px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{s.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: st.dot, display: 'inline-block', flexShrink: 0,
                        animation: st.pulse ? 'pulse 1.5s infinite' : 'none'
                      }} />
                      {st.label}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)', marginTop: 4 }}>{s.time}</div>
                  </div>
                  {i < pipe.stages.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', fontSize: 20, padding: '0 4px', flexShrink: 0 }}>›</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Simulated logs for running/failed */}
          {(pipe.status === 'running' || pipe.status === 'failed') && (
            <div style={{ marginTop: 16, background: '#0a0c0f', border: '1px solid var(--border)', padding: '14px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#a0a8c0', lineHeight: 1.8, maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ color: '#4ade80' }}>$ npm install</div>
              <div>added 847 packages in 12s</div>
              <div style={{ color: '#4ade80' }}>$ npm run build</div>
              <div>Creating an optimized production build...</div>
              {pipe.status === 'running' && <div style={{ color: '#60a5fa' }}>Compiling... <span style={{ animation: 'pulse 1s infinite' }}>▌</span></div>}
              {pipe.status === 'failed' && (
                <>
                  <div style={{ color: '#f87171' }}>FAIL src/tests/auth.test.js</div>
                  <div style={{ color: '#f87171' }}>✕ POST /api/auth/login - invalid credentials (38ms)</div>
                  <div style={{ color: '#f87171' }}>Expected: 401 · Received: 500</div>
                  <div style={{ color: '#fbbf24' }}>Tests: 1 failed, 8 passed, 9 total</div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CicdPage() {
  const [expanded, setExpanded] = useState(142);
  const [triggering, setTriggering] = useState(false);

  const triggerBuild = () => {
    setTriggering(true);
    setTimeout(() => { setTriggering(false); alert('✅ Build #144 triggered on branch: main'); }, 1500);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">CI/CD PIPELINES</h1>
          <div className="page-sub">Jenkins · GitHub Actions · Docker · Kubernetes</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => window.open('https://github.com', '_blank')}>GitHub Actions ↗</button>
          <button className="btn btn-primary" onClick={triggerBuild} disabled={triggering}>
            {triggering ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Triggering...</> : '▶ Trigger Build'}
          </button>
        </div>
      </div>

      {/* Tool pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Jenkins', desc: 'CI Orchestrator', color: '#d33833' },
          { label: 'GitHub Actions', desc: 'Workflow', color: '#238636' },
          { label: 'Docker', desc: 'Containerization', color: '#1d63ed' },
          { label: 'Kubernetes', desc: 'Orchestration', color: '#326ce5' },
          { label: 'Terraform', desc: 'IaC', color: '#7b42bc' },
        ].map(t => (
          <div key={t.label} style={{ border: `1px solid ${t.color}33`, background: `${t.color}11`, padding: '6px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--muted)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Pipeline list */}
      {PIPELINES.map(pipe => (
        <PipelineCard
          key={pipe.id}
          pipe={pipe}
          expanded={expanded === pipe.id}
          onToggle={() => setExpanded(expanded === pipe.id ? null : pipe.id)}
        />
      ))}

      {/* Jenkinsfile snippet */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="panel-header"><div className="panel-title">JENKINSFILE (PIPELINE AS CODE)</div></div>
        <div className="panel-body" style={{ padding: 0 }}>
          <pre style={{ background: '#0a0c0f', padding: '20px 24px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#a0a8c0', lineHeight: 1.8, overflowX: 'auto', margin: 0 }}>
{`pipeline {
  agent any
  environment {
    IMAGE_NAME = "rentforge-api"
    REGISTRY   = "registry.rentforge.io"
  }
  stages {
    stage('Source')     { steps { checkout scm } }
    stage('Build')      { steps { sh 'npm install' } }
    stage('Unit Tests') { steps { sh 'npm test -- --coverage' } }
    stage('Docker Build') {
      steps {
        sh 'docker build -t $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER ./backend'
        sh 'docker push $REGISTRY/$IMAGE_NAME:$BUILD_NUMBER'
      }
    }
    stage('Deploy K8s') {
      when { branch 'main' }
      steps {
        sh 'kubectl set image deployment/rentforge-api api=$REGISTRY/$IMAGE_NAME:$BUILD_NUMBER'
        sh 'kubectl rollout status deployment/rentforge-api'
      }
    }
  }
  post {
    failure { mail to: 'team@rentforge.io', subject: "Build #\${BUILD_NUMBER} Failed" }
    success { echo 'Deployment successful!' }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
