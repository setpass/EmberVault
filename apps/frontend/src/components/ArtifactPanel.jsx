/**
 * ArtifactPanel — Part 2
 * Unlock animation, modal detail, rarity tiers, progress, 3-state categorization
 */
import { useEffect, useRef, useState } from 'react';
import { forgeApi } from '../lib/api';

const TIER_META = {
  'Common Artifact':    { color: '#94a3b8', glow: 'rgba(148,163,184,0.2)', stars: 1 },
  'Rare Artifact':      { color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',  stars: 2 },
  'Epic Artifact':      { color: '#8b5cf6', glow: 'rgba(139,92,246,0.22)', stars: 3 },
  'Mythic Artifact':    { color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', stars: 4 },
  'Legendary Artifact': { color: '#ef4444', glow: 'rgba(239,68,68,0.28)', stars: 5 },
};

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StarRow({ count = 1, color }) {
  return (
    <div className="ap-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`ap-star ${i < count ? 'lit' : ''}`} style={{ color: i < count ? color : undefined }} />
      ))}
    </div>
  );
}

function ProgressRing({ progress, color, size = 48 }) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ap-ring">
      <circle cx={size/2} cy={size/2} r={r} className="ap-ring-bg" />
      <circle
        cx={size/2} cy={size/2} r={r}
        className="ap-ring-fill"
        style={{
          stroke: color,
          strokeDasharray: circ,
          strokeDashoffset: circ * (1 - progress),
          filter: `drop-shadow(0 0 3px ${color}88)`,
        }}
      />
      <text x={size/2} y={size/2 + 5} className="ap-ring-text" fill={color}>
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

function ArtifactModal({ artifact, onClose }) {
  const meta = TIER_META[artifact.tier] ?? TIER_META['Common Artifact'];
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div
        className="ap-modal"
        style={{ borderColor: meta.color + '44', boxShadow: `0 0 60px ${meta.glow}, 0 0 0 1px ${meta.color}22` }}
        onClick={e => e.stopPropagation()}
      >
        <button className="ap-modal-close" onClick={onClose}>✕</button>

        <div className="ap-modal-header">
          <div>
            <div className="ap-modal-tier" style={{ color: meta.color }}>{artifact.tier}</div>
            <h2 className="ap-modal-title" style={{ color: artifact.unlocked ? '#f1f5f9' : '#475569' }}>
              {artifact.unlocked ? artifact.title : '???'}
            </h2>
            <StarRow count={meta.stars} color={meta.color} />
          </div>
          {artifact.unlocked ? (
            <div className="ap-modal-forged-badge" style={{ background: meta.glow, borderColor: meta.color }}>
              <span style={{ color: meta.color }}>✓</span> Forged
            </div>
          ) : (
            <ProgressRing progress={artifact.progress ?? 0} color={meta.color} size={64} />
          )}
        </div>

        <p className="ap-modal-desc">
          {artifact.unlocked ? artifact.description : artifact.unlockHint}
        </p>

        <div className="ap-modal-grid">
          <div className="ap-modal-field">
            <span className="ap-modal-label">Trigger</span>
            <span className="ap-modal-value">{artifact.trigger}</span>
          </div>
          <div className="ap-modal-field">
            <span className="ap-modal-label">Effect</span>
            <span className="ap-modal-value" style={{ color: meta.color }}>{artifact.effect}</span>
          </div>
          {!artifact.unlocked && (
            <div className="ap-modal-field" style={{ gridColumn: '1/-1' }}>
              <span className="ap-modal-label">Progress</span>
              <span className="ap-modal-value">{artifact.progressHint}</span>
            </div>
          )}
          {artifact.unlocked && artifact.unlockedAt && (
            <div className="ap-modal-field" style={{ gridColumn: '1/-1' }}>
              <span className="ap-modal-label">Forged on</span>
              <span className="ap-modal-value">{fmtDate(artifact.unlockedAt)}</span>
            </div>
          )}
        </div>

        {/* Unlock progress bar */}
        {!artifact.unlocked && (
          <div className="ap-modal-progress">
            <div className="ap-modal-pb-track">
              <div
                className="ap-modal-pb-fill"
                style={{ width: `${(artifact.progress ?? 0) * 100}%`, background: meta.color }}
              />
            </div>
            <span style={{ color: meta.color }}>{Math.round((artifact.progress ?? 0) * 100)}% forged</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactCard({ artifact, isNew, onClick }) {
  const meta = TIER_META[artifact.tier] ?? TIER_META['Common Artifact'];
  const cardRef = useRef(null);

  // Mount animation for newly unlocked
  useEffect(() => {
    if (isNew && cardRef.current) {
      cardRef.current.classList.add('ap-card-new-unlock');
      const t = setTimeout(() => cardRef.current?.classList.remove('ap-card-new-unlock'), 3000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      ref={cardRef}
      className={`ap-card ${artifact.unlocked ? 'ap-card-unlocked' : artifact.progress > 0 ? 'ap-card-progress' : 'ap-card-locked'}`}
      style={artifact.unlocked ? { borderColor: meta.color + '33', background: meta.glow } : {}}
      onClick={onClick}
      title="Click for details"
    >
      {isNew && <div className="ap-new-badge" style={{ background: meta.color }}>NEW</div>}

      <div className="ap-card-top">
        <span className="ap-card-tier" style={{ color: meta.color }}>{artifact.tier}</span>
        <StarRow count={meta.stars} color={meta.color} />
      </div>

      <h4 className="ap-card-title" style={{ color: artifact.unlocked ? '#f1f5f9' : '#334155' }}>
        {artifact.unlocked ? artifact.title : '???'}
      </h4>

      {artifact.unlocked ? (
        <p className="ap-card-desc">{artifact.description}</p>
      ) : (
        <>
          <div className="ap-card-pb-track">
            <div
              className="ap-card-pb-fill"
              style={{ width: `${(artifact.progress ?? 0) * 100}%`, background: meta.color + 'aa' }}
            />
          </div>
          <p className="ap-card-hint">{artifact.progressHint}</p>
        </>
      )}

      <div className="ap-card-foot">
        <span className="ap-card-trigger">{artifact.trigger}</span>
        {artifact.unlocked && (
          <span className="ap-card-effect" style={{ color: meta.color }}>{artifact.effect}</span>
        )}
      </div>

      {artifact.unlocked && (
        <div className="ap-card-stamp" style={{ color: meta.color }}>✓ Forged</div>
      )}
    </div>
  );
}

export function ArtifactPanel({ artifacts: artifactsProp }) {
  const [catalog, setCatalog]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('unlocked');
  const [selected, setSelected]   = useState(null);
  const [newIds, setNewIds]       = useState(new Set());
  const prevIdsRef                = useRef(new Set());

  useEffect(() => {
    forgeApi.catalog()
      .then(data => {
        const freshUnlocked = new Set(data.catalog.filter(a => a.unlocked).map(a => a.id));
        const prev = prevIdsRef.current;
        const justUnlocked = [...freshUnlocked].filter(id => !prev.has(id));
        if (justUnlocked.length) {
          setNewIds(new Set(justUnlocked));
          setTab('unlocked'); // auto-switch to unlocked tab on new unlock
          setTimeout(() => setNewIds(new Set()), 5000);
        }
        prevIdsRef.current = freshUnlocked;
        setCatalog(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [artifactsProp]);

  if (loading) return (
    <article className="panel ap-root">
      <div className="panel-header"><div><p className="eyebrow">Artifact vault</p><h3>Loading...</h3></div></div>
    </article>
  );

  const all        = catalog?.catalog ?? [];
  const unlocked   = all.filter(a => a.unlocked);
  const inProgress = all.filter(a => !a.unlocked && a.progress > 0);
  const locked     = all.filter(a => !a.unlocked && a.progress === 0);
  const totalPct   = Math.round((unlocked.length / Math.max(all.length, 1)) * 100);

  const tabs = [
    { id: 'unlocked',   label: `Forged (${unlocked.length})` },
    { id: 'progress',   label: `In progress (${inProgress.length})` },
    { id: 'locked',     label: `Locked (${locked.length})` },
  ];

  const shown = tab === 'unlocked' ? unlocked : tab === 'progress' ? inProgress : locked;

  return (
    <article className="panel ap-root">
      {selected && (
        <ArtifactModal
          artifact={all.find(a => a.id === selected) ?? {}}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="panel-header">
        <div>
          <p className="eyebrow">Artifact vault</p>
          <h3>Forged identity outputs</h3>
        </div>
        <span className="badge blue">{unlocked.length} / {all.length} forged</span>
      </div>

      {/* Collection bar */}
      <div className="ap-collection-bar">
        <div className="ap-collection-fill" style={{ width: `${totalPct}%` }} />
      </div>
      <p className="ap-collection-label">{totalPct}% of collection forged</p>

      {/* Tabs */}
      <div className="ap-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`ap-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="ap-empty">
          <p>
            {tab === 'unlocked' ? 'No artifacts forged yet — fire actions in Heat Chain.' :
             tab === 'progress' ? 'No artifacts in progress yet.' :
             'All artifacts have been started or forged.'}
          </p>
        </div>
      ) : (
        <div className="ap-grid">
          {shown.map(artifact => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              isNew={newIds.has(artifact.id)}
              onClick={() => setSelected(artifact.id)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
