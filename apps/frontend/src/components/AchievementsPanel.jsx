/**
 * AchievementsPanel — Badges & Achievements UI
 * Features: Category filter, tier filter, XP level bar, badge grid, achievement detail modal
 */
import { useEffect, useRef, useState } from 'react';
import './achievements.css';

const API_BASE = '/api';

async function fetchAchievements() {
  const res = await fetch(`${API_BASE}/achievements`);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

const TIER_STYLES = {
  BRONZE: { color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', label: 'Bronze' },
  SILVER: { color: '#a8a9ad', bg: 'rgba(168,169,173,0.12)', label: 'Silver' },
  GOLD: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)', label: 'Gold' },
  PLATINUM: { color: '#e5e4e2', bg: 'rgba(229,228,226,0.15)', label: 'Platinum' },
  LEGENDARY: { color: '#ff6b35', bg: 'rgba(255,107,53,0.15)', label: 'Legendary' },
};

const CATEGORY_LABELS = {
  forge: { label: 'Forge', icon: '⚒' },
  heat: { label: 'Heat', icon: '🔥' },
  combo: { label: 'Combo', icon: '🔗' },
  identity: { label: 'Identity', icon: '🔑' },
  vault: { label: 'Vault', icon: '🔒' },
  secret: { label: 'Secret', icon: '👁' },
};

function AchievementModal({ ach, onClose }) {
  const ts = TIER_STYLES[ach.tier] ?? TIER_STYLES.BRONZE;
  return (
    <div className="ach-modal-overlay" onClick={onClose}>
      <div
        className="ach-modal"
        style={{ borderColor: ts.color + '44', boxShadow: `0 0 48px ${ts.bg}` }}
        onClick={e => e.stopPropagation()}
      >
        <button className="ach-modal-close" onClick={onClose}>✕</button>
        <div className="ach-modal-header">
          <span className="ach-modal-icon">{ach.secret && !ach.unlocked ? '?' : ach.icon}</span>
          <div>
            <span className="ach-modal-tier" style={{ color: ts.color }}>{ts.label}</span>
            <h2 className="ach-modal-title">{ach.secret && !ach.unlocked ? '???' : ach.title}</h2>
            <p className="ach-modal-cat">{CATEGORY_LABELS[ach.category]?.label ?? ach.category}</p>
          </div>
          {ach.unlocked
            ? <div className="ach-modal-badge" style={{ background: ts.bg, borderColor: ts.color, color: ts.color }}>✓ Unlocked</div>
            : <div className="ach-modal-xp" style={{ color: ts.color }}>+{ach.xp} XP</div>
          }
        </div>
        <p className="ach-modal-desc">{ach.secret && !ach.unlocked ? 'A hidden achievement. Keep forging to discover it.' : ach.description}</p>
        {!ach.unlocked && (
          <>
            <div className="ach-modal-progress-wrap">
              <div className="ach-modal-pb-track">
                <div className="ach-modal-pb-fill" style={{ width: `${Math.round(ach.progress * 100)}%`, background: ts.color }} />
              </div>
              <span style={{ color: ts.color }}>{Math.round(ach.progress * 100)}%</span>
            </div>
            <p className="ach-modal-hint">{ach.hint}</p>
          </>
        )}
        {ach.unlocked && ach.unlockedAt && (
          <p className="ach-modal-date">
            Unlocked {new Date(ach.unlockedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ ach, isNew, onClick }) {
  const ts = TIER_STYLES[ach.tier] ?? TIER_STYLES.BRONZE;
  const cardRef = useRef(null);

  useEffect(() => {
    if (isNew && cardRef.current) {
      cardRef.current.classList.add('ach-card-new');
      const t = setTimeout(() => cardRef.current?.classList.remove('ach-card-new'), 3500);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      ref={cardRef}
      className={`ach-card ${ach.unlocked ? 'ach-card-done' : 'ach-card-locked'}`}
      style={ach.unlocked ? { borderColor: ts.color + '44', background: ts.bg } : {}}
      onClick={onClick}
    >
      {isNew && <div className="ach-new-badge" style={{ background: ts.color }}>NEW</div>}

      <div className="ach-card-icon-wrap" style={ach.unlocked ? { background: ts.bg, borderColor: ts.color + '66' } : {}}>
        <span className="ach-card-icon">{ach.secret && !ach.unlocked ? '?' : ach.icon}</span>
      </div>

      <div className="ach-card-body">
        <span className="ach-card-tier" style={{ color: ach.unlocked ? ts.color : '#475569' }}>{ts.label}</span>
        <h4 className="ach-card-title" style={{ color: ach.unlocked ? '#f1f5f9' : '#334155' }}>
          {ach.secret && !ach.unlocked ? '???' : ach.title}
        </h4>
        {ach.unlocked ? (
          <span className="ach-card-xp" style={{ color: ts.color }}>+{ach.xp} XP earned</span>
        ) : (
          <div className="ach-card-progress-wrap">
            <div className="ach-card-pb-track">
              <div className="ach-card-pb-fill" style={{ width: `${Math.round(ach.progress * 100)}%`, background: ts.color + 'aa' }} />
            </div>
            <span className="ach-card-pct">{Math.round(ach.progress * 100)}%</span>
          </div>
        )}
      </div>

      {ach.unlocked && <div className="ach-card-check" style={{ color: ts.color }}>✓</div>}
    </div>
  );
}

export function AchievementsPanel({ newAchievementIds = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [newIds, setNewIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    fetchAchievements()
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [newAchievementIds]);

  // Flash new achievements
  useEffect(() => {
    if (newAchievementIds.length > 0) {
      setNewIds(new Set(newAchievementIds));
      setTimeout(() => setNewIds(new Set()), 5000);
    }
  }, [newAchievementIds]);

  if (loading) return (
    <article className="panel ach-root">
      <div className="panel-header"><div><p className="eyebrow">Achievements</p><h3>Loading...</h3></div></div>
    </article>
  );

  if (!data) return null;

  const { catalog = [], level, xp, totalUnlocked, totalAchievements } = data;

  // Filter logic
  const filtered = catalog.filter(a => {
    const catMatch = tab === 'all' || a.category === tab;
    const tierMatch = tierFilter === 'all' || a.tier === tierFilter;
    return catMatch && tierMatch;
  });

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];
  const tiers = ['all', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGENDARY'];

  const completionPct = Math.round((totalUnlocked / Math.max(totalAchievements, 1)) * 100);

  return (
    <article className="panel ach-root">
      {selected && (
        <AchievementModal
          ach={catalog.find(a => a.id === selected) ?? {}}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Header */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Achievements</p>
          <h3>Forge badges &amp; milestones</h3>
        </div>
        <span className="badge blue">{totalUnlocked} / {totalAchievements}</span>
      </div>

      {/* XP Level Bar */}
      <div className="ach-level-card">
        <div className="ach-level-row">
          <div>
            <span className="ach-level-num">Lv.{level.level}</span>
            <span className="ach-level-label">{level.label}</span>
          </div>
          <div className="ach-xp-info">
            <span className="ach-xp-val">{xp} XP</span>
            {level.nextThreshold && (
              <span className="ach-xp-next">/ {level.nextThreshold} XP</span>
            )}
          </div>
        </div>
        <div className="ach-level-track">
          <div className="ach-level-fill" style={{ width: `${Math.round(level.progress * 100)}%` }} />
        </div>
        <div className="ach-level-foot">
          <span>{completionPct}% of achievements unlocked</span>
          <span>{level.nextThreshold ? `${level.nextThreshold - xp} XP to next level` : 'Max level reached'}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="ach-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ach-tab ${tab === cat ? 'active' : ''}`}
            onClick={() => setTab(cat)}
          >
            {cat === 'all' ? 'All' : `${CATEGORY_LABELS[cat]?.icon} ${CATEGORY_LABELS[cat]?.label}`}
          </button>
        ))}
      </div>

      {/* Tier Filter Pills */}
      <div className="ach-tier-filters">
        {tiers.map(t => {
          const ts = TIER_STYLES[t];
          return (
            <button
              key={t}
              className={`ach-tier-pill ${tierFilter === t ? 'active' : ''}`}
              style={tierFilter === t && ts ? { borderColor: ts.color, color: ts.color, background: ts.bg } : {}}
              onClick={() => setTierFilter(t)}
            >
              {t === 'all' ? 'All tiers' : ts?.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="ach-empty">
          <p>No achievements in this category yet — keep forging!</p>
        </div>
      ) : (
        <div className="ach-grid">
          {filtered.map(ach => (
            <AchievementCard
              key={ach.id}
              ach={ach}
              isNew={newIds.has(ach.id)}
              onClick={() => setSelected(ach.id)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
