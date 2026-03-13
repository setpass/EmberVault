/**
 * ForgeControlPanel — Part 3
 * Action simulator — trigger real API actions, see results live
 */
import { useState } from 'react';
import { forgeApi } from '../lib/api';

const ACTIONS = [
  { key: 'wallet_link',       label: 'Wallet Link',        icon: '🔗', heat: 15, desc: 'Link a wallet to the forge' },
  { key: 'wallet_sign',       label: 'Wallet Sign',        icon: '✍️', heat: 18, desc: 'Sign with linked wallet' },
  { key: 'vault_save',        label: 'Vault Save',         icon: '🔒', heat: 12, desc: 'Save a vault record' },
  { key: 'credential_update', label: 'Credential Update',  icon: '🪪', heat: 10, desc: 'Update a credential' },
  { key: 'permission_change', label: 'Permission Change',  icon: '🛡️', heat:  8, desc: 'Modify access control' },
  { key: 'activity_log',      label: 'Activity Log',       icon: '📋', heat:  5, desc: 'Log an activity entry' },
  { key: 'season_complete',   label: 'Season Complete',    icon: '🏆', heat: 25, desc: 'Complete a seasonal trial' },
];

const TIER_COLORS = {
  'Common Artifact':    '#94a3b8',
  'Rare Artifact':      '#3b82f6',
  'Epic Artifact':      '#8b5cf6',
  'Mythic Artifact':    '#f59e0b',
  'Legendary Artifact': '#ef4444',
};

const HEAT_STAGES = [
  { threshold: 0,  color: '#64748b' },
  { threshold: 35, color: '#d97706' },
  { threshold: 65, color: '#f59e0b' },
  { threshold: 85, color: '#ef4444' },
];
function stageColor(heat) {
  return [...HEAT_STAGES].reverse().find(s => heat >= s.threshold)?.color ?? '#64748b';
}

function ResultCard({ result }) {
  const heatColor = stageColor(result.forge?.heat ?? 0);
  return (
    <div className="fcp-result-card">
      <div className="fcp-result-header">
        <span className="fcp-result-action">{result.actionType?.replace(/_/g, ' ')}</span>
        <span className="fcp-result-time">{new Date().toLocaleTimeString('en-GB')}</span>
      </div>

      <div className="fcp-result-metrics">
        <div className="fcp-metric">
          <span className="fcp-metric-label">Heat gain</span>
          <strong className="fcp-metric-value">
            +{result.heatGain}
          </strong>
        </div>
        <div className="fcp-metric">
          <span className="fcp-metric-label">Multiplier</span>
          <strong className="fcp-metric-value">
            ×{result.comboMultiplier?.toFixed(2)}
          </strong>
        </div>
        <div className="fcp-metric">
          <span className="fcp-metric-label">Total heat</span>
          <strong className="fcp-metric-value">
            {result.forge?.heat}%
          </strong>
        </div>
        <div className="fcp-metric">
          <span className="fcp-metric-label">Chain</span>
          <strong className="fcp-metric-value">{result.forge?.comboChain}</strong>
        </div>
      </div>

      {result.comboBroken && (
        <div className="fcp-result-alert fcp-alert-broken">
          💔 Combo was broken — −{result.forge?.comboResetHeat ?? 5} heat penalty applied
        </div>
      )}

      {result.newArtifacts?.length > 0 && (
        <div className="fcp-result-artifacts">
          {result.newArtifacts.map(a => (
            <div key={a.id} className="fcp-artifact-unlock" style={{ borderColor: TIER_COLORS[a.tier] + '55' }}>
              <span className="fcp-artifact-unlock-icon">🔥</span>
              <div>
                <strong style={{ color: TIER_COLORS[a.tier] }}>{a.title}</strong>
                <span className="fcp-artifact-unlock-tier"> — {a.tier}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trial progress changes */}
      {result.trials?.some(t => t.progress > 0 && t.progress < 1) && (
        <div className="fcp-trial-updates">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Trial progress</p>
          {result.trials.filter(t => t.progress > 0).map(trial => (
            <div key={trial.id} className="fcp-trial-row">
              <span>{trial.title}</span>
              <div className="fcp-trial-mini-bar">
                <div
                  className="fcp-trial-mini-fill"
                  style={{
                    width: `${trial.progress * 100}%`,
                    background: trial.eligible ? heatColor : '#374151',
                  }}
                />
              </div>
              <span className="fcp-trial-pct">{Math.round(trial.progress * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ForgeControlPanel({ onForgeUpdate }) {
  const [selected, setSelected]   = useState('vault_save');
  const [customTitle, setCustomTitle] = useState('');
  const [firing, setFiring]       = useState(false);
  const [history, setHistory]     = useState([]);

  const selectedMeta = ACTIONS.find(a => a.key === selected);

  async function handleFire() {
    if (firing) return;
    setFiring(true);
    try {
      const result = await forgeApi.trigger(selected, { title: customTitle || undefined });
      setHistory(prev => [result, ...prev].slice(0, 8));
      if (onForgeUpdate) onForgeUpdate(result);
      setCustomTitle('');
    } catch (err) {
      setHistory(prev => [{ error: err.message, actionType: selected }, ...prev].slice(0, 8));
    } finally {
      setFiring(false);
    }
  }

  const heatColor = history[0]?.forge ? stageColor(history[0].forge.heat) : '#f59e0b';

  return (
    <div className="fcp-root">
      {/* ── Selector + fire ──────────────────────────────── */}
      <article className="panel fcp-selector">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Forge control panel</p>
            <h3>Action simulator</h3>
          </div>
          <span className="badge blue">Live API</span>
        </div>

        <div className="fcp-action-list">
          {ACTIONS.map(action => (
            <button
              key={action.key}
              className={`fcp-action-row ${selected === action.key ? 'selected' : ''}`}
              style={selected === action.key ? { borderColor: heatColor + '55', background: heatColor + '0a' } : {}}
              onClick={() => setSelected(action.key)}
            >
              <span className="fcp-action-icon">{action.icon}</span>
              <div className="fcp-action-info">
                <span className="fcp-action-name">{action.label}</span>
                <span className="fcp-action-desc">{action.desc}</span>
              </div>
              <span className="fcp-action-heat">
                +{action.heat}
              </span>
            </button>
          ))}
        </div>

        <div className="fcp-fire-zone">
          <input
            className="hc-input"
            type="text"
            placeholder={`Label for "${selectedMeta?.label}" (optional)`}
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFire()}
          />
          <button
            className={`primary-button fcp-fire-btn ${firing ? 'firing' : ''}`}
            style={!firing ? { boxShadow: `0 0 24px ${heatColor}44` } : {}}
            disabled={firing}
            onClick={handleFire}
          >
            {firing
              ? '⚙ Forging...'
              : `${selectedMeta?.icon} Fire — ${selectedMeta?.label}`
            }
          </button>
        </div>
      </article>

      {/* ── Result history ────────────────────────────────── */}
      <article className="panel fcp-history">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Forge run log</p>
            <h3>Recent results</h3>
          </div>
          {history.length > 0 && (
            <button className="ghost-button small" onClick={() => setHistory([])}>Clear</button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="fcp-empty">
            <p>No actions fired yet.</p>
            <p className="eyebrow">Select an action and fire to see results here.</p>
          </div>
        ) : (
          <div className="fcp-history-list">
            {history.map((result, i) => (
              result.error
                ? <div key={i} className="fcp-error-card">{result.error}</div>
                : <ResultCard key={i} result={result} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
