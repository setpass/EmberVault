/**
 * LeaderboardPanel — Competitive Rankings UI
 * Boards: Overall, Heat, Combo, Artifacts, XP, Season
 * Features: animated rank rows, player highlight, rank badges, history sparkline
 */
import { useEffect, useState } from 'react';
import './leaderboard.css';

async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

const BOARD_TABS = [
  { id: 'overall',   label: 'Overall',   icon: '🏆', statKey: 'score',        statLabel: 'Score'   },
  { id: 'heat',      label: 'Heat',      icon: '🔥', statKey: 'heat',         statLabel: 'Peak %'  },
  { id: 'combo',     label: 'Combo',     icon: '🔗', statKey: 'maxCombo',     statLabel: 'Max'     },
  { id: 'artifacts', label: 'Artifacts', icon: '⚒',  statKey: 'artifactCount',statLabel: 'Forged'  },
  { id: 'xp',        label: 'XP',        icon: '⭐', statKey: 'xp',           statLabel: 'XP'      },
  { id: 'season',    label: 'Season',    icon: '🌡',  statKey: 'seasonScore',  statLabel: 'Pts'     },
];

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankBadge({ rank }) {
  if (rank <= 3) return <span className="lb-medal">{RANK_MEDAL[rank]}</span>;
  return <span className="lb-rank-num">#{rank}</span>;
}

function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      className="lb-avatar"
      style={{ width: size, height: size, fontSize: size * 0.33, background: color + '22', borderColor: color + '55', color }}
    >
      {initials}
    </div>
  );
}

function StatBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="lb-stat-bar-track">
      <div className="lb-stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Sparkline({ history }) {
  if (!history || history.length < 2) return null;
  const scores = history.map(h => h.score).reverse();
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const W = 80, H = 28;
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W;
    const y = H - ((s - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={W} height={H} className="lb-sparkline">
      <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={pts.split(' ').at(-1).split(',')[0]} cy={pts.split(' ').at(-1).split(',')[1]} r="2.5" fill="#f59e0b" />
    </svg>
  );
}

function PlayerRankSummary({ playerRanks, totalOperators }) {
  const rankColor = (r) => {
    if (r === 1) return '#ffd700';
    if (r <= 3) return '#f59e0b';
    if (r <= Math.ceil(totalOperators / 2)) return '#10b981';
    return '#64748b';
  };

  return (
    <div className="lb-summary-grid">
      {BOARD_TABS.map(tab => {
        const r = playerRanks[tab.id];
        return (
          <div key={tab.id} className="lb-summary-cell">
            <span className="lb-summary-icon">{tab.icon}</span>
            <span className="lb-summary-label">{tab.label}</span>
            <strong className="lb-summary-rank" style={{ color: rankColor(r) }}>#{r}</strong>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardRow({ entry, tab, maxStat, index }) {
  const statVal = tab.id === 'overall' ? entry.score
    : tab.id === 'season' ? entry.seasonScore
    : entry.stats[tab.statKey];

  const fmtVal = (v) => {
    if (tab.statKey === 'heat') return `${v}%`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v;
  };

  return (
    <div
      className={`lb-row ${entry.isPlayer ? 'lb-row-player' : ''} ${entry.rank <= 3 ? 'lb-row-top' : ''}`}
      style={{
        animationDelay: `${index * 0.04}s`,
        borderColor: entry.isPlayer ? '#f59e0b44' : undefined,
        background: entry.isPlayer ? 'rgba(245,158,11,0.05)' : undefined,
      }}
    >
      <div className="lb-row-rank">
        <RankBadge rank={entry.rank} />
      </div>

      <Avatar initials={entry.avatar} color={entry.color} />

      <div className="lb-row-info">
        <div className="lb-row-name">
          {entry.name}
          {entry.isPlayer && <span className="lb-you-tag">YOU</span>}
        </div>
        <div className="lb-row-role">{entry.role}</div>
        <div className="lb-row-level">Lv.{entry.stats.level} · {entry.stats.levelLabel}</div>
      </div>

      <div className="lb-row-bar-wrap">
        <StatBar value={statVal} max={maxStat} color={entry.color} />
      </div>

      <div className="lb-row-stat" style={{ color: entry.isPlayer ? '#f59e0b' : entry.color }}>
        {fmtVal(statVal)}
        <span className="lb-row-stat-label">{tab.statLabel}</span>
      </div>
    </div>
  );
}

export function LeaderboardPanel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overall');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await fetchLeaderboard();
      setData(d);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return (
    <article className="panel lb-root">
      <div className="panel-header"><div><p className="eyebrow">Leaderboard</p><h3>Loading rankings...</h3></div></div>
    </article>
  );

  if (!data) return null;

  const { boards, playerRanks, totalOperators, history, player } = data;
  const activeBoard = boards[tab] ?? [];
  const currentTab  = BOARD_TABS.find(t => t.id === tab);

  // Max stat for bar scaling
  const getMaxStat = () => {
    if (tab === 'overall') return Math.max(...activeBoard.map(e => e.score), 1);
    if (tab === 'season')  return Math.max(...activeBoard.map(e => e.seasonScore), 1);
    return Math.max(...activeBoard.map(e => e.stats[currentTab.statKey] ?? 0), 1);
  };
  const maxStat = getMaxStat();

  return (
    <article className="panel lb-root">
      {/* Header */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h3>Operator rankings</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge blue">{totalOperators} operators</span>
          <button
            className="ghost-button small"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ minWidth: 70 }}
          >
            {refreshing ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Player rank summary cards */}
      <div className="lb-player-card">
        <div className="lb-player-header">
          <Avatar initials="YO" color="#f59e0b" size={42} />
          <div>
            <div className="lb-player-name">{player.stats.levelLabel}</div>
            <div className="lb-player-sub">Lv.{player.stats.level} · {player.stats.xp} XP · Score {player.score.toLocaleString()}</div>
          </div>
          <div className="lb-player-sparkline-wrap">
            <span className="lb-sparkline-label">Score history</span>
            <Sparkline history={history} />
          </div>
        </div>
        <PlayerRankSummary playerRanks={playerRanks} totalOperators={totalOperators} />
      </div>

      {/* Board Tabs */}
      <div className="lb-tabs">
        {BOARD_TABS.map(t => (
          <button
            key={t.id}
            className={`lb-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard rows */}
      <div className="lb-list">
        {activeBoard.map((entry, i) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            tab={currentTab}
            maxStat={maxStat}
            index={i}
          />
        ))}
      </div>

      <p className="lb-footnote">Rankings update after each forge action. Rivals scale with your performance.</p>
    </article>
  );
}
