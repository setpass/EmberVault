import { useEffect, useState } from 'react';
import { forgeApi } from '../lib/api';

const TIER_ORDER = { 'Common Artifact': 0, 'Rare Artifact': 1, 'Epic Artifact': 2, 'Mythic Artifact': 3, 'Legendary Artifact': 4 };
const TIER_COLORS = {
  'Common Artifact':    '#94a3b8',
  'Rare Artifact':      '#3b82f6',
  'Epic Artifact':      '#8b5cf6',
  'Mythic Artifact':    '#f59e0b',
  'Legendary Artifact': '#ef4444',
};
const TIER_GLOW = {
  'Common Artifact':    'rgba(148,163,184,0.15)',
  'Rare Artifact':      'rgba(59,130,246,0.15)',
  'Epic Artifact':      'rgba(139,92,246,0.15)',
  'Mythic Artifact':    'rgba(245,158,11,0.15)',
  'Legendary Artifact': 'rgba(239,68,68,0.18)',
};

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RarityDots({ rarity = 1 }) {
  return (
    <div className="rarity-dots">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`rarity-dot ${i < rarity ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div className="artifact-unlock-bar">
      <div
        className="artifact-unlock-fill"
        style={{ width: `${(progress * 100).toFixed(1)}%`, background: color }}
      />
    </div>
  );
}

export function ArtifactShelf({ artifacts: unlockedFromProps }) {
  const [catalog, setCatalog]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('unlocked');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    forgeApi.catalog()
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unlockedFromProps]);

  if (loading) return (
    <article className="panel">
      <div className="panel-header"><div><p className="eyebrow">Artifact shelf</p><h3>Loading collection...</h3></div></div>
    </article>
  );

  const all      = catalog?.catalog ?? [];
  const unlocked = all.filter((a) => a.unlocked).sort((a, b) => (TIER_ORDER[b.tier] ?? 0) - (TIER_ORDER[a.tier] ?? 0));
  const locked   = all.filter((a) => !a.unlocked).sort((a, b) => (TIER_ORDER[b.tier] ?? 0) - (TIER_ORDER[a.tier] ?? 0));
  const shown    = view === 'unlocked' ? unlocked : all.sort((a, b) => (TIER_ORDER[b.tier] ?? 0) - (TIER_ORDER[a.tier] ?? 0));
  const totalPct = ((unlocked.length / Math.max(all.length, 1)) * 100).toFixed(0);

  return (
    <article className="panel artifact-panel-v2">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Artifact shelf</p>
          <h3>Forged identity outputs</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge blue">{unlocked.length} / {all.length}</span>
          <button className="ghost-button small" onClick={() => setView(view === 'unlocked' ? 'catalog' : 'unlocked')}>
            {view === 'unlocked' ? 'View all' : 'My shelf'}
          </button>
        </div>
      </div>

      {/* Collection progress */}
      <div className="shelf-progress-bar">
        <div className="shelf-progress-fill" style={{ width: `${totalPct}%` }} />
      </div>
      <p className="shelf-progress-label">{totalPct}% of collection forged — {locked.length} artifact{locked.length !== 1 ? 's' : ''} remaining</p>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="shelf-empty">
          <p>No artifacts forged yet.</p>
          <p className="eyebrow">Go to Heat Chain → trigger actions to unlock your first artifact.</p>
        </div>
      ) : (
        <div className="artifact-grid-v2">
          {shown.map((artifact) => {
            const color = TIER_COLORS[artifact.tier] ?? '#94a3b8';
            const glow  = TIER_GLOW[artifact.tier] ?? 'transparent';
            const isSelected = selected === artifact.id;
            return (
              <div
                key={artifact.id}
                className={`artifact-card-v2 ${artifact.unlocked ? 'unlocked' : 'locked'} ${isSelected ? 'expanded' : ''}`}
                style={artifact.unlocked ? { borderColor: `${color}44`, background: glow } : {}}
                onClick={() => setSelected(isSelected ? null : artifact.id)}
              >
                {/* Tier + rarity */}
                <div className="acv2-top">
                  <span className="acv2-tier" style={{ color }}>{artifact.tier}</span>
                  <RarityDots rarity={artifact.rarity ?? 1} />
                </div>

                {/* Title */}
                <h4 className="acv2-title" style={{ color: artifact.unlocked ? '#f1f5f9' : '#475569' }}>
                  {artifact.unlocked ? artifact.title : '???'}
                </h4>

                {/* Progress bar (locked only) */}
                {!artifact.unlocked && (
                  <>
                    <ProgressBar progress={artifact.progress} color={color} />
                    <p className="acv2-progress-hint">{artifact.progressHint}</p>
                  </>
                )}

                {/* Expanded detail */}
                {isSelected && (
                  <div className="acv2-detail">
                    <p className="acv2-desc">
                      {artifact.unlocked ? artifact.description : artifact.unlockHint}
                    </p>
                    <div className="acv2-meta-row">
                      <span className="acv2-meta-label">Trigger</span>
                      <span className="acv2-meta-value">{artifact.trigger}</span>
                    </div>
                    <div className="acv2-meta-row">
                      <span className="acv2-meta-label">Effect</span>
                      <span className="acv2-meta-value" style={{ color }}>{artifact.effect}</span>
                    </div>
                    {artifact.unlocked && artifact.unlockedAt && (
                      <div className="acv2-meta-row">
                        <span className="acv2-meta-label">Forged</span>
                        <span className="acv2-meta-value">{fmtDate(artifact.unlockedAt)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Forged stamp */}
                {artifact.unlocked && (
                  <div className="acv2-forged-stamp" style={{ color }}>✓ Forged</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'unlocked' && locked.length > 0 && (
        <div className="shelf-locked-footer">
          <span className="eyebrow">{locked.length} artifact{locked.length !== 1 ? 's' : ''} still locked</span>
          <button className="ghost-button small" onClick={() => setView('catalog')}>
            View unlock conditions →
          </button>
        </div>
      )}
    </article>
  );
}
