import { useCallback, useEffect, useRef, useState } from 'react';
import { forgeTick } from '../lib/api';

const HEAT_STAGES = [
  { threshold: 0,  label: 'Cold Start', color: '#64748b', glow: 'rgba(100,116,139,0.20)' },
  { threshold: 35, label: 'Tempered',   color: '#d97706', glow: 'rgba(217,119,6,0.22)'    },
  { threshold: 65, label: 'White Heat', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)'  },
  { threshold: 85, label: 'Starfire',   color: '#ef4444', glow: 'rgba(239,68,68,0.28)'    },
];

function getStage(heat) {
  return [...HEAT_STAGES].reverse().find(s => heat >= s.threshold) ?? HEAT_STAGES[0];
}

function fmtCountdown(ms) {
  if (!ms || ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ForgeTimer({ onDecayUpdate }) {
  const [tick, setTick]           = useState(null);
  const [localMs, setLocalMs]     = useState(0);
  const [localHeat, setLocalHeat] = useState(null);
  const [broken, setBroken]       = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const intervalRef  = useRef(null);
  const syncRef      = useRef(null);
  const lastSyncRef  = useRef(Date.now());
  const warnedRef    = useRef(false); // use ref to avoid stale closure in interval

  const doSync = useCallback(async () => {
    try {
      const data = await forgeTick();
      setTick(data);
      setLocalMs(data.comboWindowRemainingMs ?? 0);
      setLocalHeat(data.heat);
      warnedRef.current = false;
      setBroken(data.comboWindowRemainingMs === 0 && (data.comboCount ?? 0) > 0);
      lastSyncRef.current = Date.now();
      if (onDecayUpdate) onDecayUpdate(data.heat);
    } catch (_e) {
      // silent — polling failure should not crash UI
    }
  }, [onDecayUpdate]);

  // Server sync every 10s
  useEffect(() => {
    doSync();
    syncRef.current = setInterval(doSync, 10_000);
    return () => clearInterval(syncRef.current);
  }, [doSync]);

  // Client-side 1s tick for countdown + heat decay preview
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSyncRef.current;

      setLocalMs(prev => {
        const next = Math.max(0, prev - 1000);
        if (next === 0 && prev > 0) setBroken(true);
        if (next <= 120_000 && next > 0 && !warnedRef.current) {
          warnedRef.current = true;
          setIsCritical(true);
        }
        if (next === 0) setIsCritical(false);
        return next;
      });

      if (tick?.lastActionAt) {
        const hoursSince = elapsed / 3_600_000;
        const decayed = Math.max(0, tick.heat - hoursSince * (tick.decayPerHour ?? 4));
        setLocalHeat(Math.round(decayed * 10) / 10);
        if (onDecayUpdate) onDecayUpdate(decayed);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [tick, onDecayUpdate]);

  if (!tick) {
    return (
      <article className="panel ft-panel">
        <div className="panel-header">
          <div><p className="eyebrow">Forge timer</p><h3>Syncing...</h3></div>
        </div>
      </article>
    );
  }

  const stage      = getStage(localHeat ?? tick.heat);
  const comboCount = tick.comboCount ?? 0;
  const isActive   = localMs > 0 && comboCount > 0;
  const multiplier = Math.min(1 + Math.max(0, comboCount - 1) * 0.15, 2.5);

  return (
    <article className={`panel ft-panel ${isCritical ? 'ft-critical' : ''} ${broken ? 'ft-broken' : ''}`}>
      {isCritical && !broken && (
        <div className="ft-warning-banner">
          <span className="ft-warning-icon">⚠</span>
          <span>Combo expires in {fmtCountdown(localMs)} — act now to preserve chain</span>
        </div>
      )}
      {broken && (
        <div className="ft-broken-banner">
          <span className="ft-warning-icon">💔</span>
          <span>Chain broken — combo reset, −{tick.comboResetHeat ?? 5} heat penalty applied</span>
        </div>
      )}

      <div className="ft-grid">
        {/* Live heat */}
        <div className="ft-cell ft-heat-cell">
          <p className="eyebrow">Live heat</p>
          <div className="ft-heat-display">
            <span className="ft-heat-number">{Math.floor(localHeat ?? tick.heat)}</span>
            <span className="ft-heat-unit">%</span>
          </div>
          <p className="ft-stage-name" style={{ color: stage.color }}>{stage.label}</p>
          <div className="ft-decay-bar-wrap">
            <div
              className="ft-decay-bar-fill"
              style={{
                width: `${localHeat ?? tick.heat}%`,
                background: stage.color,
                boxShadow: `0 0 8px ${stage.glow}`,
              }}
            />
          </div>
          <p className="ft-decay-hint">Decaying −{tick.decayPerHour}/hr while idle</p>
        </div>

        {/* Countdown */}
        <div className="ft-cell ft-countdown-cell">
          <p className="eyebrow">Combo window</p>
          {isActive ? (
            <>
              <div
                className={`ft-countdown-number ${isCritical ? 'ft-countdown-critical' : ''}`}
              >
                {fmtCountdown(localMs)}
              </div>
              <div className="ft-arc-wrap">
                <svg viewBox="0 0 80 80" className="ft-arc-svg">
                  <circle cx="40" cy="40" r="34" className="ft-arc-bg" />
                  <circle
                    cx="40" cy="40" r="34"
                    className="ft-arc-fill"
                    style={{
                      stroke: isCritical ? '#ef4444' : stage.color,
                      strokeDasharray: `${2 * Math.PI * 34}`,
                      strokeDashoffset: `${2 * Math.PI * 34 * (1 - localMs / (tick.comboWindowMs ?? 1_800_000))}`,
                      filter: `drop-shadow(0 0 4px ${stage.glow})`,
                    }}
                  />
                </svg>
                <div className="ft-arc-inner">
                  <span className="ft-arc-combo">{comboCount}</span>
                  <span className="ft-arc-label">strikes</span>
                </div>
              </div>
              <div className="ft-multiplier-row">
                <span className="ft-multiplier-label">Combo multiplier</span>
                <span className="ft-multiplier-value">
                  ×{multiplier.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="ft-idle-state">
              <div className="ft-idle-icon">🌑</div>
              <p>{broken ? 'Chain broken' : 'No active chain'}</p>
              <p className="ft-idle-hint">Fire an action in Heat Chain to ignite</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="ft-cell ft-stats-cell">
          <p className="eyebrow">Forge status</p>
          <div className="ft-stat-rows">
            <div className="ft-stat-row"><span>Rank</span><strong>{tick.rank}</strong></div>
            <div className="ft-stat-row">
              <span>Chain</span>
              <strong style={{ color: isActive ? stage.color : '#475569' }}>{tick.comboChain}</strong>
            </div>
            <div className="ft-stat-row"><span>Last action</span><strong>{fmtTime(tick.lastActionAt)}</strong></div>
            <div className="ft-stat-row">
              <span>Status</span>
              <strong style={{ color: broken ? '#ef4444' : isActive ? '#10b981' : '#475569' }}>
                {broken ? 'Chain broken' : isActive ? 'Active' : 'Idle'}
              </strong>
            </div>
            <div className="ft-stat-row"><span>Decay rate</span><strong>−{tick.decayPerHour}%/hr</strong></div>
          </div>
          <p className="ft-combo-hint-text">{tick.comboHint}</p>
        </div>
      </div>
    </article>
  );
}
