/**
 * ProgressionPanel — Rewards & Progression Tiers (Battle Pass)
 * 50 tiers, free + forge tracks, XP bar, milestones, tier-up animations
 */
import { useEffect, useRef, useState } from 'react';
import './progression.css';

async function fetchProgression() {
  const res = await fetch('/api/progression');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
async function postClaim(tier, track) {
  const res = await fetch('/api/progression/claim', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, track }),
  });
  return res.json();
}

const REWARD_COLORS = {
  title:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  equipment:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  consumable: { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  material:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  xp_bonus:   { color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
};

function XPBar({ xpStats }) {
  const { totalXP, currentTier, tierXP, tierPct, nextTierXP, maxTier, passCompletion, forgeTrackUnlocked } = xpStats;

  return (
    <div className="prog-xpbar-wrap">
      <div className="prog-xpbar-header">
        <div className="prog-tier-badge">
          <span className="prog-tier-num">Tier {currentTier}</span>
          {currentTier >= maxTier && <span className="prog-tier-max">MAX</span>}
        </div>
        <div className="prog-xpbar-nums">
          <span className="prog-xp-cur">{tierXP}</span>
          <span className="prog-xp-sep"> / </span>
          <span className="prog-xp-max">200 XP</span>
          <span className="prog-xp-next"> · {nextTierXP} to next tier</span>
        </div>
        {forgeTrackUnlocked && (
          <span className="prog-forge-badge">🔥 Forge Track Unlocked</span>
        )}
      </div>

      {/* Tier XP bar */}
      <div className="prog-bar-track">
        <div className="prog-bar-fill" style={{ width: `${tierPct * 100}%` }} />
      </div>

      {/* Overall pass progress */}
      <div className="prog-pass-row">
        <span className="prog-pass-label">Pass progress</span>
        <div className="prog-pass-bar-track">
          <div className="prog-pass-bar-fill" style={{ width: `${passCompletion * 100}%` }} />
        </div>
        <span className="prog-pass-pct">{Math.round(passCompletion * 100)}%</span>
        <span className="prog-total-xp">{totalXP.toLocaleString()} XP total</span>
      </div>
    </div>
  );
}

function MilestoneBar({ milestones }) {
  return (
    <div className="prog-milestones">
      {milestones.map((m, i) => (
        <div key={i} className={`prog-milestone ${m.reached ? 'prog-milestone-reached' : ''}`}>
          <span className="prog-ms-icon">{m.reached ? m.icon : '🔒'}</span>
          <span className="prog-ms-label">{m.label}</span>
          <span className="prog-ms-tier" style={{ color: m.reached ? '#f59e0b' : '#334155' }}>
            T{m.tier}
          </span>
        </div>
      ))}
    </div>
  );
}

function RewardChip({ reward, claimed, unlocked, onClaim, track }) {
  const rc = REWARD_COLORS[reward?.type] ?? REWARD_COLORS.xp_bonus;
  const canClaim = unlocked && !claimed;

  return (
    <div
      className={`prog-reward-chip ${claimed ? 'prog-chip-claimed' : ''} ${canClaim ? 'prog-chip-claimable' : ''} ${!unlocked ? 'prog-chip-locked' : ''}`}
      style={canClaim ? { borderColor: rc.color + '66', background: rc.bg } : {}}
      onClick={canClaim ? onClaim : undefined}
      title={canClaim ? `Click to claim: ${reward?.label}` : reward?.label}
    >
      <span className="prog-chip-icon">{claimed ? '✅' : !unlocked ? '🔒' : reward?.icon}</span>
      <span className="prog-chip-label" style={{ color: claimed ? '#334155' : unlocked ? rc.color : '#1e293b' }}>
        {claimed ? 'Claimed' : reward?.label ?? '—'}
      </span>
      {canClaim && <span className="prog-chip-cta">Claim</span>}
    </div>
  );
}

function TierRow({ tierData, forgeTrackUnlocked, onClaim }) {
  const { tier, unlocked, free, forge } = tierData;
  const isMilestone = [5, 10, 20, 30, 40, 50].includes(tier);

  return (
    <div className={`prog-tier-row ${unlocked ? 'prog-tier-unlocked' : ''} ${isMilestone ? 'prog-tier-milestone' : ''}`}>
      {/* Tier number */}
      <div className="prog-tier-num-col" style={{ color: unlocked ? '#f59e0b' : '#334155' }}>
        {isMilestone ? <span className="prog-tier-star">★</span> : null}
        <span>{tier}</span>
      </div>

      {/* Free track */}
      <div className="prog-track-col prog-track-free">
        <RewardChip
          reward={free}
          claimed={free.claimed}
          unlocked={unlocked}
          track="free"
          onClaim={() => onClaim(tier, 'free')}
        />
      </div>

      {/* Forge track */}
      <div className={`prog-track-col prog-track-forge ${!forgeTrackUnlocked ? 'prog-track-locked' : ''}`}>
        <RewardChip
          reward={forge}
          claimed={forge.claimed}
          unlocked={unlocked && forgeTrackUnlocked}
          track="forge"
          onClaim={() => onClaim(tier, 'forge')}
        />
      </div>
    </div>
  );
}

function XPLogEntry({ entry }) {
  const label = entry.source.startsWith('forge:')
    ? `Forge · ${entry.source.slice(6).replace(/_/g, ' ')}`
    : entry.source;
  const when = new Date(entry.at);
  const timeStr = `${when.getHours()}:${String(when.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="prog-log-entry">
      <span className="prog-log-icon">⭐</span>
      <span className="prog-log-label">{label}</span>
      <span className="prog-log-xp">+{entry.amount} XP</span>
      <span className="prog-log-time">{timeStr}</span>
    </div>
  );
}

export function ProgressionPanel({ xpResult }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('tiers');
  const [claimFlash, setClaimFlash] = useState(null);
  const scrollRef = useRef(null);

  const load = () =>
    fetchProgression()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (xpResult) load(); }, [xpResult]);

  // Scroll to current tier on first load
  useEffect(() => {
    if (data && scrollRef.current) {
      const currentTier = data.xpStats.currentTier;
      const row = scrollRef.current.querySelector(`[data-tier="${currentTier}"]`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [data?.xpStats?.currentTier]);

  const handleClaim = async (tier, track) => {
    const res = await postClaim(tier, track);
    if (res.message) { alert(res.message); return; }
    setClaimFlash({ tier, track, reward: res.reward });
    setTimeout(() => setClaimFlash(null), 2500);
    load();
  };

  if (loading) return (
    <article className="panel prog-root">
      <div className="panel-header"><div><p className="eyebrow">Progression</p><h3>Loading pass...</h3></div></div>
    </article>
  );
  if (!data) return null;

  const { tiers, xpStats, recentXP, milestones } = data;
  const unclaimedCount = tiers.filter(t => t.unlocked && (!t.free.claimed || (xpStats.forgeTrackUnlocked && !t.forge.claimed))).length;

  return (
    <article className="panel prog-root">
      {claimFlash && (
        <div className="prog-claim-flash">
          <span>{claimFlash.reward?.icon ?? '⭐'}</span>
          <span className="prog-flash-label">{claimFlash.reward?.label} claimed!</span>
        </div>
      )}

      {/* Header */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Progression</p>
          <h3>Season Pass · Tier {xpStats.currentTier}/{xpStats.maxTier}</h3>
        </div>
        {unclaimedCount > 0 && (
          <span className="badge orange">{unclaimedCount} unclaimed</span>
        )}
      </div>

      {/* XP Bar */}
      <XPBar xpStats={xpStats} />

      {/* Tabs */}
      <div className="prog-tabs">
        {['tiers', 'milestones', 'xp log'].map(t => (
          <button
            key={t}
            className={`prog-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'tiers' ? `🏆 Tiers` : t === 'milestones' ? `🌟 Milestones` : `📊 XP Log`}
          </button>
        ))}
      </div>

      {/* Tiers view */}
      {tab === 'tiers' && (
        <div className="prog-tiers-wrap">
          {/* Track headers */}
          <div className="prog-track-header-row">
            <div className="prog-tier-num-col" />
            <div className="prog-track-col prog-track-free">
              <span className="prog-track-title">Free Track</span>
            </div>
            <div className="prog-track-col prog-track-forge">
              <span className="prog-track-title" style={{ color: xpStats.forgeTrackUnlocked ? '#f59e0b' : '#334155' }}>
                {xpStats.forgeTrackUnlocked ? '🔥 Forge Track' : '🔒 Forge Track'}
              </span>
              {!xpStats.forgeTrackUnlocked && (
                <span className="prog-track-hint">Reach 90% heat to unlock</span>
              )}
            </div>
          </div>

          {/* Tier rows */}
          <div className="prog-tier-list" ref={scrollRef}>
            {tiers.map(t => (
              <div key={t.tier} data-tier={t.tier}>
                <TierRow
                  tierData={t}
                  forgeTrackUnlocked={xpStats.forgeTrackUnlocked}
                  onClaim={handleClaim}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones view */}
      {tab === 'milestones' && (
        <div className="prog-milestones-view">
          {milestones.map((m, i) => (
            <div key={i} className={`prog-ms-card ${m.reached ? 'prog-ms-reached' : ''}`}>
              <span className="prog-ms-card-icon">{m.reached ? m.icon : '🔒'}</span>
              <div className="prog-ms-card-body">
                <p className="prog-ms-card-name" style={{ color: m.reached ? '#f1f5f9' : '#334155' }}>
                  {m.label}
                </p>
                <p className="prog-ms-card-sub">
                  Tier {m.tier} · {m.xp.toLocaleString()} XP required
                </p>
              </div>
              {m.reached
                ? <span className="prog-ms-done">✓ Reached</span>
                : <span className="prog-ms-todo">{(m.xp - xpStats.totalXP).toLocaleString()} XP away</span>
              }
            </div>
          ))}
        </div>
      )}

      {/* XP Log */}
      {tab === 'xp log' && (
        <div className="prog-log-list">
          {recentXP.length === 0 ? (
            <p className="prog-log-empty">No XP earned yet. Fire forge actions to start earning!</p>
          ) : recentXP.map((entry, i) => (
            <XPLogEntry key={i} entry={entry} />
          ))}
        </div>
      )}
    </article>
  );
}
