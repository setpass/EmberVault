import { useEffect, useRef, useState } from 'react';
import { forgeApi } from '../lib/api';

const TIER_COLORS = {
  'Common Artifact':    '#94a3b8',
  'Rare Artifact':      '#3b82f6',
  'Epic Artifact':      '#8b5cf6',
  'Mythic Artifact':    '#f59e0b',
  'Legendary Artifact': '#ef4444',
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const ACTION_LABELS = {
  vault_save:        { label: 'Vault Save',        icon: '🔒', hint: '+12 heat base' },
  credential_update: { label: 'Credential Update', icon: '🪪', hint: '+10 heat base' },
  permission_change: { label: 'Permission Change', icon: '🛡️', hint: '+8 heat base' },
  wallet_link:       { label: 'Wallet Link',       icon: '🔗', hint: '+15 heat base' },
  wallet_sign:       { label: 'Wallet Sign',       icon: '✍️', hint: '+18 heat base' },
  activity_log:      { label: 'Activity Log',      icon: '📋', hint: '+5 heat base' },
  season_complete:   { label: 'Season Complete',   icon: '🏆', hint: '+25 heat base' },
};

const HEAT_STAGES = [
  { threshold: 0,  label: 'Cold Start', color: '#64748b', glow: 'rgba(100,116,139,0.25)' },
  { threshold: 35, label: 'Tempered',   color: '#d97706', glow: 'rgba(217,119,6,0.28)'  },
  { threshold: 65, label: 'White Heat', color: '#f59e0b', glow: 'rgba(245,158,11,0.32)'  },
  { threshold: 85, label: 'Starfire',   color: '#ef4444', glow: 'rgba(239,68,68,0.35)'  },
];

function getStage(heat) {
  return [...HEAT_STAGES].reverse().find((s) => heat >= s.threshold) ?? HEAT_STAGES[0];
}

function fmtCountdown(ms) {
  if (ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

export function HeatChain({ forge: forgeProp, onForgeUpdate }) {
  const [forge, setForge]               = useState(forgeProp);
  const [catalog, setCatalog]           = useState([]);
  const [trials, setTrials]             = useState([]);
  const [firing, setFiring]             = useState(false);
  const [lastResult, setLastResult]     = useState(null);
  const [selectedAction, setSelectedAction] = useState('vault_save');
  const [customTitle, setCustomTitle]   = useState('');
  const [countdown, setCountdown]       = useState(0);
  const timerRef = useRef(null);

  // Sync forge from parent
  useEffect(() => { setForge(forgeProp); }, [forgeProp]);

  // Load catalog + trials on mount
  useEffect(() => {
    forgeApi.state().then((s) => {
      setCatalog(s.catalog ?? []);
      setTrials(s.trials ?? []);
      setCountdown(s.forge?.comboWindowRemainingMs ?? 0);
    }).catch(() => {});
  }, []);

  // Countdown tick
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1000) {
            clearInterval(timerRef.current);
            // Combo expired — update forge state
            setForge((f) => f ? { ...f, comboCount: 0, comboActive: false, comboChain: '0 strike chain' } : f);
            return 0;
          }
          return c - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  const heat        = forge?.heat ?? 0;
  const comboCount  = forge?.comboCount ?? 0;
  const multiplier  = Math.min(1 + Math.max(0, comboCount - 1) * 0.15, 2.5);
  const comboActive = countdown > 0 && comboCount > 0;
  const stage       = getStage(heat);

  async function handleFire() {
    if (firing) return;
    setFiring(true);
    setLastResult(null);
    try {
      const result = await forgeApi.trigger(selectedAction, { title: customTitle || undefined });
      setLastResult(result);
      setForge(result.forge);
      setCatalog(result.catalog ?? catalog);
      setTrials(result.trials ?? trials);
      setCountdown(result.comboWindowRemainingMs ?? 0);
      onForgeUpdate(result);
      setCustomTitle('');
    } catch (err) {
      setLastResult({ error: err.message });
    } finally {
      setFiring(false);
    }
  }

  return (
    <div className="hc-root">

      {/* ── Row 1: Live heat engine ──────────────────────── */}
      <div className="hc-row hc-row-top">

        {/* Heat meter card */}
        <article className="panel hc-meter-card">
          <div className="hc-meter-header">
            <div>
              <p className="eyebrow">Live forge engine</p>
              <h3 className="hc-stage-label" style={{ color: stage.color }}>{stage.label}</h3>
            </div>
            <div className="hc-heat-badge" style={{ background: stage.glow, borderColor: stage.color + '44' }}>
              <span className="hc-heat-value">{heat}</span>
              <span className="hc-heat-pct">%</span>
            </div>
          </div>

          {/* Main bar */}
          <div className="hc-bar-wrap">
            <div
              className="hc-bar-fill"
              style={{ width: `${heat}%`, background: stage.color, boxShadow: `0 0 12px ${stage.glow}` }}
            />
            {/* Stage tick marks */}
            {HEAT_STAGES.slice(1).map((s) => (
              <div
                key={s.threshold}
                className={`hc-tick ${heat >= s.threshold ? 'reached' : ''}`}
                style={{ left: `${s.threshold}%`, '--tc': s.color }}
              >
                <span className="hc-tick-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="hc-bar-foot">
            <span className="hc-hint-text">{forge?.heatHint}</span>
            <span className="hc-rank-badge">⚒ {forge?.rank}</span>
          </div>

          {/* Combo strip */}
          <div className="hc-combo-strip">
            <div className="hc-combo-pips">
              {Array.from({ length: Math.min(comboCount, 12) }).map((_, i) => (
                <span
                  key={i}
                  className={`hc-pip ${comboActive ? 'active' : 'dead'}`}
                  style={{
                    background: comboActive ? stage.color : '#374151',
                    boxShadow: comboActive ? `0 0 6px ${stage.glow}` : 'none',
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              ))}
              {comboCount > 12 && <span className="hc-pip-overflow">+{comboCount - 12}</span>}
            </div>

            <div className="hc-combo-info">
              <div>
                <p className="eyebrow">Combo chain</p>
                <strong style={{ color: comboActive ? '#f0f0f8' : '#64748b' }}>
                  {forge?.comboChain ?? '0 strike chain'}
                </strong>
                {multiplier > 1 && comboActive && (
                  <span className="hc-multiplier" style={{ color: stage.color }}>×{multiplier.toFixed(2)}</span>
                )}
              </div>

              {/* Countdown */}
              {comboActive && countdown > 0 ? (
                <div className="hc-countdown active">
                  <span className="hc-countdown-label">Chain expires in</span>
                  <span className="hc-countdown-value">
                    {fmtCountdown(countdown)}
                  </span>
                </div>
              ) : comboCount > 0 ? (
                <div className="hc-countdown dead">
                  <span className="hc-countdown-label">Chain expired</span>
                  <span className="hc-countdown-value" style={{ color: '#ef4444' }}>Reset</span>
                </div>
              ) : null}
            </div>
          </div>
          <p className="hc-combo-hint">{forge?.comboHint}</p>
        </article>

        {/* Action trigger card */}
        <article className="panel hc-action-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fire an action</p>
              <h3>Trigger forge run</h3>
            </div>
            {comboActive && (
              <span className="badge" style={{ background: stage.glow, color: stage.color, border: `1px solid ${stage.color}` }}>
                ×{multiplier.toFixed(2)} active
              </span>
            )}
          </div>

          <div className="hc-action-grid">
            {Object.entries(ACTION_LABELS).map(([key, meta]) => (
              <button
                key={key}
                className={`hc-action-tile ${selectedAction === key ? 'selected' : ''}`}
                style={selectedAction === key ? { borderColor: stage.color, background: `${stage.glow}` } : {}}
                onClick={() => setSelectedAction(key)}
              >
                <span className="hc-action-icon">{meta.icon}</span>
                <span className="hc-action-name">{meta.label}</span>
                <span className="hc-action-heat">{meta.hint}</span>
              </button>
            ))}
          </div>

          <input
            className="hc-input"
            type="text"
            placeholder="Optional: custom action label"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFire()}
          />

          <button
            className={`primary-button hc-fire-btn ${firing ? 'firing' : ''}`}
            style={!firing ? { boxShadow: `0 0 20px ${stage.glow}` } : {}}
            onClick={handleFire}
            disabled={firing}
          >
            {firing ? '⚙ Forging...' : `⚡ ${ACTION_LABELS[selectedAction]?.label}`}
          </button>

          {lastResult && !lastResult.error && (
            <div className="hc-result">
              <div className="hc-result-row">
                <span>Heat gained</span>
                <strong style={{ color: '#10b981' }}>+{lastResult.heatGain}</strong>
              </div>
              <div className="hc-result-row">
                <span>Combo multiplier</span>
                <strong style={{ color: stage.color }}>×{lastResult.comboMultiplier?.toFixed(2)}</strong>
              </div>
              {lastResult.comboBroken && (
                <div className="hc-result-row warn">
                  <span>Combo was reset</span>
                  <strong style={{ color: '#ef4444' }}>−5 heat penalty</strong>
                </div>
              )}
              {lastResult.newArtifacts?.length > 0 && (
                <div className="hc-new-artifacts">
                  {lastResult.newArtifacts.map((a) => (
                    <div key={a.id} className="hc-artifact-flash">
                      🔥 <strong>{a.title}</strong> — {a.tier} unlocked
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {lastResult?.error && (
            <div className="hc-result error">{lastResult.error}</div>
          )}
        </article>
      </div>

      {/* ── Row 2: Artifact progress ─────────────────────── */}
      <div className="hc-row">
        <article className="panel hc-progress-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Artifact forge progress</p>
              <h3>Unlock conditions</h3>
            </div>
            <span className="badge blue">
              {catalog.filter((a) => a.unlocked).length} / {catalog.length} forged
            </span>
          </div>
          <div className="hc-progress-list">
            {catalog.map((artifact) => (
              <div key={artifact.id} className={`hc-progress-row ${artifact.unlocked ? 'done' : ''}`}>
                <div className="hc-progress-meta">
                  <span
                    className="hc-progress-tier"
                    style={{ color: TIER_COLORS[artifact.tier] ?? '#94a3b8' }}
                  >
                    {artifact.tier}
                  </span>
                  <span className="hc-progress-title">{artifact.unlocked ? artifact.title : artifact.title}</span>
                  <span className="hc-progress-hint">
                    {artifact.unlocked ? `✓ Forged ${artifact.unlockedAt ? fmtDate(artifact.unlockedAt) : ''}` : artifact.progressHint}
                  </span>
                </div>
                <div className="hc-progress-bar-wrap">
                  <div
                    className="hc-progress-bar-fill"
                    style={{
                      width: `${(artifact.progress * 100).toFixed(1)}%`,
                      background: artifact.unlocked
                        ? TIER_COLORS[artifact.tier] ?? '#10b981'
                        : `${TIER_COLORS[artifact.tier] ?? '#64748b'}88`,
                    }}
                  />
                </div>
                <span className="hc-progress-pct">
                  {artifact.unlocked ? '✓' : `${Math.round(artifact.progress * 100)}%`}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Seasonal trials with heat gates */}
        <article className="panel hc-trials-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Seasonal trials</p>
              <h3>Heat-gated challenges</h3>
            </div>
          </div>
          <div className="hc-trials-list">
            {trials.map((trial) => (
              <div key={trial.id} className={`hc-trial-row ${trial.eligible ? 'eligible' : 'locked'}`}>
                <div className="hc-trial-head">
                  <div>
                    <h4>{trial.title}</h4>
                    <p>{trial.description}</p>
                  </div>
                  <span className="hc-trial-reward">{trial.reward}</span>
                </div>
                <div className="hc-trial-bar-wrap">
                  <div
                    className="hc-trial-bar-fill"
                    style={{
                      width: `${(trial.progress * 100).toFixed(1)}%`,
                      background: trial.eligible ? stage.color : '#374151',
                    }}
                  />
                </div>
                <div className="hc-trial-foot">
                  <span className={`hc-trial-gate ${trial.eligible ? 'met' : ''}`}>
                    {trial.eligible ? '✓ Heat gate met' : `Requires ${trial.heatRequired}% heat — currently ${heat}%`}
                  </span>
                  <span>{Math.round(trial.progress * 100)}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

    </div>
  );
}

