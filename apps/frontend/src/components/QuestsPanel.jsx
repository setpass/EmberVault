/**
 * QuestsPanel — Daily / Weekly / Story Missions UI
 * Features: countdown timers, lore panels, progress bars, reward previews,
 *           story chapter chain with unlock states, quest completion toasts
 */
import { useEffect, useState } from 'react';
import './quests.css';

async function fetchQuests() {
  const res = await fetch('/api/quests');
  if (!res.ok) throw new Error('Failed to fetch quests');
  return res.json();
}

const DIFF_COLORS = {
  easy:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Easy'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Medium' },
  hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Hard'   },
};

const TYPE_META = {
  daily:  { label: 'Daily',   color: '#3b82f6', icon: '🌅' },
  weekly: { label: 'Weekly',  color: '#8b5cf6', icon: '📅' },
  story:  { label: 'Story',   color: '#f59e0b', icon: '📖' },
};

function useCountdown(ms) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    setRemaining(ms);
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, [ms]);

  if (remaining <= 0) return 'Resetting...';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

function RewardBadge({ reward }) {
  if (!reward) return null;
  const isXP   = reward.type === 'xp';
  const isHeat = reward.type === 'heat';
  const isTitle = reward.type === 'title';
  const isTag  = reward.type === 'tag';
  const color  = isXP ? '#f59e0b' : isHeat ? '#ef4444' : isTitle ? '#8b5cf6' : '#10b981';
  return (
    <span className="q-reward-badge" style={{ color, background: color + '18', borderColor: color + '44' }}>
      {isXP ? '⭐' : isHeat ? '🔥' : isTitle ? '👑' : '🏷'} {reward.label}
    </span>
  );
}

function QuestProgressBar({ progress, color, height = 5 }) {
  return (
    <div className="q-pb-track" style={{ height }}>
      <div className="q-pb-fill" style={{ width: `${Math.round(progress * 100)}%`, background: color }} />
    </div>
  );
}

function DailyWeeklyCard({ quest }) {
  const diff = DIFF_COLORS[quest.difficulty] ?? DIFF_COLORS.easy;
  const tm   = TYPE_META[quest.type];

  return (
    <div className={`q-card ${quest.completed ? 'q-card-done' : 'q-card-active'}`}
         style={quest.completed ? { borderColor: '#10b98133', background: 'rgba(16,185,129,0.04)' } : {}}>

      <div className="q-card-top">
        <span className="q-card-icon">{quest.completed ? '✅' : quest.icon}</span>
        <div className="q-card-meta">
          <span className="q-diff-pill" style={{ color: diff.color, background: diff.bg }}>{diff.label}</span>
        </div>
      </div>

      <h4 className="q-card-title" style={{ color: quest.completed ? '#64748b' : '#f1f5f9' }}>
        {quest.title}
      </h4>
      <p className="q-card-desc">{quest.description}</p>

      {!quest.completed && (
        <div className="q-card-progress">
          <QuestProgressBar progress={quest.progress} color={tm.color} />
          <span className="q-progress-pct">{Math.round(quest.progress * 100)}%</span>
        </div>
      )}

      <div className="q-card-footer">
        <RewardBadge reward={quest.reward} />
        {quest.completed && <span className="q-done-label">Completed</span>}
      </div>
    </div>
  );
}

function StoryChapter({ quest, isFirst }) {
  const [expanded, setExpanded] = useState(quest.active);

  const borderColor = quest.completed ? '#10b981' : quest.active ? '#f59e0b' : '#1e293b';
  const dotColor    = quest.completed ? '#10b981' : quest.active ? '#f59e0b' : '#334155';

  return (
    <div className="sq-row">
      {/* Timeline connector */}
      <div className="sq-timeline">
        <div className="sq-dot" style={{ background: dotColor, boxShadow: quest.active ? `0 0 10px ${dotColor}88` : 'none' }} />
        {!isFirst && <div className="sq-line" style={{ background: quest.completed ? '#10b981' : '#1e293b' }} />}
      </div>

      <div className={`sq-card ${quest.completed ? 'sq-done' : quest.active ? 'sq-active' : 'sq-locked'}`}
           style={{ borderColor }}
           onClick={() => !quest.locked && setExpanded(e => !e)}>

        <div className="sq-card-header">
          <div className="sq-chapter-num" style={{ color: quest.completed ? '#10b981' : quest.active ? '#f59e0b' : '#334155' }}>
            Chapter {quest.chapter}
          </div>
          <div className="sq-header-right">
            <span className="sq-card-icon">{quest.locked ? '🔒' : quest.completed ? '✅' : quest.icon}</span>
            {!quest.locked && (
              <span className="sq-expand-btn">{expanded ? '▲' : '▼'}</span>
            )}
          </div>
        </div>

        <h4 className="sq-title" style={{ color: quest.locked ? '#334155' : quest.completed ? '#94a3b8' : '#f1f5f9' }}>
          {quest.locked ? '???' : quest.title}
        </h4>

        {!quest.locked && (
          <QuestProgressBar
            progress={quest.progress}
            color={quest.completed ? '#10b981' : '#f59e0b'}
            height={4}
          />
        )}

        {expanded && !quest.locked && (
          <div className="sq-expanded">
            {quest.lore && (
              <blockquote className="sq-lore">
                <span className="sq-lore-mark">"</span>
                {quest.lore}
              </blockquote>
            )}
            <p className="sq-desc">{quest.description}</p>
            <RewardBadge reward={quest.reward} />
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownChip({ label, ms, color }) {
  const text = useCountdown(ms);
  return (
    <div className="q-countdown-chip" style={{ borderColor: color + '33' }}>
      <span className="q-countdown-label">{label} resets in</span>
      <span className="q-countdown-val" style={{ color }}>{text}</span>
    </div>
  );
}

export function QuestsPanel({ newlyCompletedQuestIds = [] }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('daily');

  const load = () => {
    setLoading(true);
    fetchQuests()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [newlyCompletedQuestIds]);

  if (loading) return (
    <article className="panel q-root">
      <div className="panel-header"><div><p className="eyebrow">Quests</p><h3>Loading missions...</h3></div></div>
    </article>
  );

  if (!data) return null;

  const {
    daily, dailyDone, dailyTotal, dailyResetMs,
    weekly, weeklyDone, weeklyTotal, weeklyResetMs,
    story, storyDone, storyTotal,
  } = data;

  const tabs = [
    { id: 'daily',  label: `🌅 Daily`,  badge: `${dailyDone}/${dailyTotal}`  },
    { id: 'weekly', label: `📅 Weekly`, badge: `${weeklyDone}/${weeklyTotal}` },
    { id: 'story',  label: `📖 Story`,  badge: `${storyDone}/${storyTotal}`  },
  ];

  return (
    <article className="panel q-root">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Quests</p>
          <h3>Missions &amp; story</h3>
        </div>
        <span className="badge blue">{storyDone}/{storyTotal} story</span>
      </div>

      {/* Countdown chips */}
      <div className="q-countdowns">
        <CountdownChip label="Daily"  ms={dailyResetMs}  color="#3b82f6" />
        <CountdownChip label="Weekly" ms={weeklyResetMs} color="#8b5cf6" />
      </div>

      {/* Progress summary */}
      <div className="q-summary-row">
        <div className="q-summary-cell">
          <span className="q-summary-label">Daily</span>
          <div className="q-summary-bar-wrap">
            <QuestProgressBar progress={dailyTotal > 0 ? dailyDone / dailyTotal : 0} color="#3b82f6" height={6} />
          </div>
          <span className="q-summary-count" style={{ color: '#3b82f6' }}>{dailyDone}/{dailyTotal}</span>
        </div>
        <div className="q-summary-cell">
          <span className="q-summary-label">Weekly</span>
          <div className="q-summary-bar-wrap">
            <QuestProgressBar progress={weeklyTotal > 0 ? weeklyDone / weeklyTotal : 0} color="#8b5cf6" height={6} />
          </div>
          <span className="q-summary-count" style={{ color: '#8b5cf6' }}>{weeklyDone}/{weeklyTotal}</span>
        </div>
        <div className="q-summary-cell">
          <span className="q-summary-label">Story</span>
          <div className="q-summary-bar-wrap">
            <QuestProgressBar progress={storyTotal > 0 ? storyDone / storyTotal : 0} color="#f59e0b" height={6} />
          </div>
          <span className="q-summary-count" style={{ color: '#f59e0b' }}>{storyDone}/{storyTotal}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="q-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`q-tab ${tab === t.id ? 'active' : ''}`}
            style={tab === t.id ? { borderColor: TYPE_META[t.id].color + '55', color: TYPE_META[t.id].color } : {}}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="q-tab-badge">{t.badge}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'daily' && (
        <div className="q-grid">
          {daily.map(q => <DailyWeeklyCard key={q.id} quest={q} />)}
        </div>
      )}

      {tab === 'weekly' && (
        <div className="q-grid">
          {weekly.map(q => <DailyWeeklyCard key={q.id} quest={q} />)}
        </div>
      )}

      {tab === 'story' && (
        <div className="sq-list">
          {story.map((q, i) => (
            <StoryChapter key={q.id} quest={q} isFirst={i === story.length - 1} />
          ))}
        </div>
      )}
    </article>
  );
}
