/**
 * EmberVault — Redesigned Dashboard (Production-ready)
 * Drop-in replacement for App.jsx
 * Zero extra dependencies — uses only React (already in package.json)
 * All original logic preserved.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDashboard, forgeApi } from './lib/api';
import { connectMetaMask, connectPetra, scaffoldSignature } from './lib/wallets';
import { WalletPanel }       from './components/WalletPanel';
import { ArtifactPanel }     from './components/ArtifactPanel';
import { ActivityFeed }      from './components/ActivityFeed';
import { VaultLedger }       from './components/VaultLedger';
import { PermissionsPanel }  from './components/PermissionsPanel';
import { HeatChain }         from './components/HeatChain';
import { ForgeTimer }        from './components/ForgeTimer';
import { ForgeControlPanel } from './components/ForgeControlPanel';
import { AchievementsPanel } from './components/AchievementsPanel';
import { LeaderboardPanel }  from './components/LeaderboardPanel';
import { QuestsPanel }       from './components/QuestsPanel';
import { InventoryPanel }    from './components/InventoryPanel';
import { ProgressionPanel }  from './components/ProgressionPanel';
import './styles/app.css';

/* ─── constants ─── */
const HEAT_STAGES = [
  { threshold: 0,  label: 'Cold Start', color: '#64748b' },
  { threshold: 35, label: 'Tempered',   color: '#d97706' },
  { threshold: 65, label: 'White Heat', color: '#f59e0b' },
  { threshold: 85, label: 'Starfire',   color: '#ef4444' },
];

const WALLET_KEY = 'embervault_wallet_state';
const loadWallet = () => {
  try { const r = sessionStorage.getItem(WALLET_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saveWallet = (s) => { try { sessionStorage.setItem(WALLET_KEY, JSON.stringify(s)); } catch { /**/ } };

const defaultWallet = {
  metaMask: { status: 'Offline', address: null, detail: 'EVM socket idle' },
  petra:    { status: 'Offline', address: null, detail: 'Aptos socket idle' },
};

const NAV_ITEMS = [
  { id: 'Forge Deck',   label: 'Forge Deck',   icon: '⚒' },
  { id: 'Heat Chain',   label: 'Heat Chain',   icon: '⚡' },
  { id: 'Artifacts',    label: 'Artifacts',    icon: '◈' },
  { id: 'Season',       label: 'Season',       icon: '◎' },
  { id: 'Achievements', label: 'Achievements', icon: '◉' },
  { id: 'Quests',       label: 'Quests',       icon: '⚔' },
  { id: 'Inventory',    label: 'Inventory',    icon: '▣' },
  { id: 'Progression',  label: 'Progression',  icon: '▲' },
  { id: 'Leaderboard',  label: 'Leaderboard',  icon: '▤' },
  { id: 'Vault Ledger', label: 'Vault Ledger', icon: '▥' },
  { id: 'Activity',     label: 'Activity',     icon: '▦' },
];

/* ─── design tokens ─── */
const T = {
  bg:      '#070710',
  surf:    '#0d0d1a',
  s2:      '#121220',
  s3:      '#181828',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  fire:    '#ff5722',
  fire2:   '#ff8c42',
  gold:    '#f5c842',
  text:    '#f0f0f8',
  muted:   '#6b6b8a',
  soft:    '#9090b0',
  green:   '#22c55e',
};

/* ─── tiny primitives ─── */
function Eyebrow({ children, color = T.muted }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '1.8px',
      textTransform: 'uppercase', color, marginBottom: 4,
    }}>
      {children}
    </p>
  );
}

function Badge({ children, color = T.fire }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 99,
      background: color + '22', color, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surf, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function HeatBar({ pct, color = T.fire, height = 6 }) {
  return (
    <div style={{ height, background: T.s3, borderRadius: 99, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 8px ${color}88`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

function StatPill({ label, value, sub, color = T.fire2 }) {
  return (
    <div style={{
      background: T.s2, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '12px 14px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 21, fontWeight: 800, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function PanelHeader({ eyebrow, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '0.2px' }}>{title}</h3>
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: 12 }}>{right}</div>}
    </div>
  );
}

/* ─── Heat Stage util ─── */
function getStage(heat) {
  return [...HEAT_STAGES].reverse().find(s => heat >= s.threshold) ?? HEAT_STAGES[0];
}

/* ─── Achievement Toast ─── */
const TIER_COLORS = {
  BRONZE: '#cd7f32', SILVER: '#a8a9ad', GOLD: '#ffd700',
  PLATINUM: '#e5e4e2', LEGENDARY: '#ff5722',
};

function AchToast({ toast, onDismiss }) {
  const color = TIER_COLORS[toast.tier] ?? T.gold;
  return (
    <div
      style={{
        background: T.s2, border: `1px solid ${color}44`,
        borderRadius: 14, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        minWidth: 270, animation: 'ev-slidein 0.3s ease',
        cursor: 'pointer',
      }}
      onClick={onDismiss}
    >
      <span style={{ fontSize: 26 }}>{toast.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Achievement Unlocked
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 2 }}>{toast.title}</p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        +{toast.xp ?? 0} XP
      </span>
    </div>
  );
}

/* ─── Hero Forge Card ─── */
function HeroForgeCard({ forge, profile, statCards, stage }) {
  return (
    <Card style={{ background: 'linear-gradient(135deg, #0c0a06 0%, #0f0f1c 100%)', border: `1px solid ${stage.color}33` }}>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%',
        background: `radial-gradient(circle, ${stage.color}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <Eyebrow color={stage.color}>Foundry Signature</Eyebrow>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
            {forge?.signatureName ?? '—'}
          </h2>
        </div>
        <Badge color={stage.color}>{profile?.status ?? 'Active'}</Badge>
      </div>

      {/* operator strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: `${stage.color}10`, border: `1px solid ${stage.color}22`,
        borderRadius: 10, padding: '12px 14px', marginBottom: 18,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${stage.color}, ${stage.color}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: `0 4px 14px ${stage.color}44`,
        }}>⚒</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{profile?.name ?? 'Operator'}</p>
          <p style={{ fontSize: 11, color: T.soft, marginTop: 2 }}>{forge?.signatureDescription ?? ''}</p>
        </div>
      </div>

      {/* stats 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {statCards.map(s => (
          <StatPill key={s.label} label={s.label} value={s.value} sub={s.hint} color={stage.color} />
        ))}
      </div>

      {/* heat bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <Eyebrow>Heat Engine</Eyebrow>
            <p style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: stage.color, fontVariantNumeric: 'tabular-nums' }}>
            {forge?.heat ?? 0}%
          </span>
        </div>
        <HeatBar pct={forge?.heat ?? 0} color={stage.color} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginTop: 6 }}>
          <span>{forge?.heatHint}</span>
          <span>{forge?.comboHint}</span>
        </div>
      </div>
    </Card>
  );
}

/* ─── Season Card ─── */
function SeasonCard({ forge, seasonalChallenges }) {
  return (
    <Card>
      <PanelHeader
        eyebrow="Seasonal Pressure"
        title={forge?.seasonName ?? '—'}
        right={<span style={{ fontSize: 11, color: T.muted }}>{forge?.seasonDeadline}</span>}
      />
      <p style={{ fontSize: 12, color: T.soft, lineHeight: 1.6, marginBottom: 14 }}>
        {forge?.seasonDescription}
      </p>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 6 }}>
          <span>Season progress</span>
          <span style={{ color: T.fire2, fontWeight: 700 }}>{forge?.seasonProgress ?? 0}%</span>
        </div>
        <HeatBar pct={forge?.seasonProgress ?? 0} color={T.fire2} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(seasonalChallenges ?? []).map(c => (
          <div key={c.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            background: T.s2, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '10px 12px', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.title}</p>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.description}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {c.reward}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Feature Ribbon ─── */
function FeatureRibbon({ forge }) {
  const items = [
    { eyebrow: 'System 01', title: 'Heat Chain',       desc: forge?.comboHint },
    { eyebrow: 'System 02', title: 'Artifact Minting', desc: forge?.artifactHint },
    { eyebrow: 'System 03', title: 'Seasonal Trials',  desc: forge?.seasonDescription },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
      {items.map(item => (
        <Card key={item.title} style={{ borderTop: `2px solid ${T.fire}`, padding: '14px 16px' }}>
          <Eyebrow>{item.eyebrow}</Eyebrow>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '4px 0' }}>{item.title}</p>
          <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{item.desc}</p>
        </Card>
      ))}
    </div>
  );
}

/* ─── API Routes Card ─── */
function ApiRoutes() {
  const routes = [
    ['POST /api/forge/action', 'Live heat engine'],
    ['GET  /api/forge/tick',   'Realtime polling'],
    ['GET  /api/forge/catalog','Artifact progression'],
    ['GET  /api/forge/trials', 'Seasonal heat gates'],
  ];
  return (
    <Card>
      <PanelHeader eyebrow="Forge API Surface" title="Operational Routes" />
      {routes.map(([route, label]) => (
        <div key={route} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 0', borderBottom: `1px solid ${T.border}`,
          fontSize: 12, color: T.soft, fontFamily: 'monospace',
        }}>
          <span>{route}</span>
          <span style={{ fontSize: 11, color: T.green, fontFamily: 'sans-serif', fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </Card>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ active, onNav, profile, forge }) {
  return (
    <aside style={{
      width: 220, minWidth: 220, background: T.surf,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      {/* fire ambient top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: `radial-gradient(ellipse at top left, ${T.fire}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* brand */}
      <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.fire, letterSpacing: '3px', textTransform: 'uppercase' }}>
          EmberVault
        </p>
        <p style={{ fontSize: 19, fontWeight: 800, color: T.text, lineHeight: 1.1, marginTop: 4 }}>
          Artifact Foundry
        </p>
      </div>

      {/* nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <NavButton key={item.id} item={item} isActive={isActive} onClick={() => onNav(item.id)} />
          );
        })}
      </nav>

      {/* operator cards */}
      <div style={{ padding: '0 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
          <Eyebrow>Operator</Eyebrow>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{profile?.role ?? '—'}</p>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{profile?.description}</p>
        </div>
        <div style={{ background: `${T.fire}10`, border: `1px solid ${T.fire}22`, borderRadius: 10, padding: 12 }}>
          <Eyebrow color={T.fire}>Doctrine</Eyebrow>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{forge?.doctrine}</p>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{forge?.motto}</p>
        </div>
      </div>
    </aside>
  );
}

function NavButton({ item, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', border: isActive ? `1px solid ${T.fire}33` : '1px solid transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        background: isActive ? `${T.fire}20` : hovered ? T.s2 : 'none',
        color: isActive ? T.fire2 : hovered ? T.text : T.muted,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        transition: 'all 0.12s', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

/* ─── Topbar ─── */
function Topbar({ activeNav, forge, stage, onConnect }) {
  return (
    <div style={{
      padding: '14px 28px',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      background: `linear-gradient(180deg, ${T.fire}05 0%, transparent 100%)`,
      flexShrink: 0,
    }}>
      <div>
        <Eyebrow color={T.fire}>Artifact Forge</Eyebrow>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
          {activeNav}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* live heat pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.s2, border: `1px solid ${T.border2}`,
          borderRadius: 99, padding: '6px 12px 6px 10px',
        }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, fontVariantNumeric: 'tabular-nums' }}>
            {forge?.heat ?? 0}%
          </span>
          <span style={{ fontSize: 11, color: T.muted }}>{stage.label}</span>
        </div>

        <a
          href="https://vite.dev/guide/"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12, color: T.muted, border: `1px solid ${T.border2}`,
            borderRadius: 8, padding: '7px 14px', textDecoration: 'none',
          }}
        >
          Docs
        </a>

        <button
          onClick={() => onConnect('metaMask')}
          style={{
            background: `linear-gradient(135deg, ${T.fire} 0%, #e64a19 100%)`,
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: `0 2px 14px ${T.fire}44`,
          }}
        >
          Ignite Wallet
        </button>
      </div>
    </div>
  );
}

/* ─── Layout helpers ─── */
function Grid2({ children, style = {} }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...style }}>
      {children}
    </div>
  );
}

function PageWrap({ children }) {
  return (
    <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [activeNav,         setActiveNav]         = useState('Forge Deck');
  const [dashboard,         setDashboard]         = useState(null);
  const [forge,             setForge]             = useState(null);
  const [artifacts,         setArtifacts]         = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState('');
  const [walletState,       setWalletState]       = useState(() => loadWallet() ?? defaultWallet);
  const [signInState,       setSignInState]       = useState('No forge handshake yet.');
  const [achievementToasts, setAchievementToasts] = useState([]);
  const [newAchievementIds, setNewAchievementIds] = useState([]);
  const [newQuestIds,       setNewQuestIds]       = useState([]);
  const [droppedItems,      setDroppedItems]      = useState([]);
  const [xpResult,          setXpResult]          = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [dash, forgeState] = await Promise.all([fetchDashboard(), forgeApi.state()]);
        setDashboard(dash);
        setForge(forgeState.forge);
        setArtifacts(forgeState.artifacts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleForgeUpdate = useCallback((result) => {
    setForge(result.forge);
    if (result.newArtifacts?.length) setArtifacts(prev => [...result.newArtifacts, ...prev]);
    fetchDashboard().then(setDashboard).catch(() => {});
    if (result.newAchievements?.length) {
      const ids = result.newAchievements.map(a => a.id);
      setNewAchievementIds(ids);
      setAchievementToasts(prev => [...result.newAchievements, ...prev].slice(0, 5));
      setTimeout(() => setAchievementToasts(prev => prev.filter(t => !ids.includes(t.id))), 5000);
    }
    if (result.newlyCompletedQuests?.length) {
      const ids = result.newlyCompletedQuests.map(q => q.id);
      setNewQuestIds(ids);
      setTimeout(() => setNewQuestIds([]), 5000);
    }
    if (result.droppedItems?.length) {
      setDroppedItems(result.droppedItems);
      setTimeout(() => setDroppedItems([]), 4500);
    }
    if (result.xpResult) {
      setXpResult(result.xpResult);
      setTimeout(() => setXpResult(null), 3000);
    }
  }, []);

  const handleDecayUpdate = useCallback((heat) => {
    setForge(prev => prev ? { ...prev, heat: Math.round(heat * 10) / 10 } : prev);
  }, []);

  const stage = useMemo(() => getStage(forge?.heat ?? 0), [forge?.heat]);

  const cadence = useMemo(() => (
    (dashboard?.activity ?? []).slice(0, 5).map((item, i) => ({
      ...item, chain: `Strike ${String(i + 1).padStart(2, '0')}`,
    }))
  ), [dashboard]);

  const statCards = useMemo(() => ([
    { label: 'Forge rank',    value: forge?.rank ?? '—',       hint: 'Progression identity' },
    { label: 'Heat',          value: `${forge?.heat ?? 0}%`,   hint: stage.label },
    { label: 'Combo chain',   value: forge?.comboChain ?? '—', hint: 'Back-to-back strikes' },
    { label: 'Artifacts',     value: artifacts.length || '—',  hint: 'Collection depth' },
  ]), [artifacts.length, stage.label, forge]);

  async function handleConnect(type) {
    try {
      const result = type === 'metaMask' ? await connectMetaMask() : await connectPetra();
      const next = {
        ...walletState,
        [type]: { status: 'Linked', address: result.address, detail: result.chainId ? `Chain ${result.chainId}` : 'Wallet active' },
      };
      setWalletState(next); saveWallet(next);
      setSignInState(`${result.provider} linked. Ready for ignition.`);
      forgeApi.trigger('wallet_link', { title: `${result.provider} wallet linked` }).then(handleForgeUpdate).catch(() => {});
    } catch (err) {
      const next = { ...walletState, [type]: { ...walletState[type], status: 'Missing', detail: err.message } };
      setWalletState(next); saveWallet(next);
    }
  }

  async function handleScaffoldSignIn(providerKey) {
    const wallet = walletState[providerKey];
    if (!wallet.address) { setSignInState('Link a wallet first.'); return; }
    const providerName = providerKey === 'metaMask' ? 'MetaMask' : 'Petra';
    const result = await scaffoldSignature(providerName, wallet.address);
    setSignInState(result.message.replace('Sign-in', 'Ignition'));
    forgeApi.trigger('wallet_sign', { title: `${providerName} ignition signature` }).then(handleForgeUpdate).catch(() => {});
  }

  const profile = dashboard?.profile;
  const seasonalChallenges = dashboard?.seasonalChallenges ?? [];

  /* ─── section renderers (all logic identical to original) ─── */
  function renderForgeDeck() {
    return (
      <PageWrap>
        <Grid2>
          <HeroForgeCard forge={forge} profile={profile} statCards={statCards} stage={stage} />
          <SeasonCard forge={forge} seasonalChallenges={seasonalChallenges} />
        </Grid2>
        <ForgeTimer onDecayUpdate={handleDecayUpdate} />
        <FeatureRibbon forge={forge} />
        <Grid2>
          <WalletPanel walletState={walletState} signInState={signInState} onConnect={handleConnect} onScaffoldSignIn={handleScaffoldSignIn} />
          <ArtifactPanel artifacts={artifacts} />
        </Grid2>
        <Grid2>
          <ActivityFeed cadence={cadence} />
          <VaultLedger vaultRecords={dashboard.vaultRecords} />
        </Grid2>
        <Grid2>
          <PermissionsPanel permissions={dashboard.permissions} />
          <ApiRoutes />
        </Grid2>
      </PageWrap>
    );
  }

  function renderHeatChain() {
    return (
      <PageWrap>
        <ForgeTimer onDecayUpdate={handleDecayUpdate} />
        <HeatChain forge={forge} artifacts={artifacts} onForgeUpdate={handleForgeUpdate} />
      </PageWrap>
    );
  }

  function renderArtifacts() {
    return <PageWrap><ArtifactPanel artifacts={artifacts} /></PageWrap>;
  }

  function renderSeason() {
    return <PageWrap><SeasonCard forge={forge} seasonalChallenges={seasonalChallenges} /></PageWrap>;
  }

  function renderActivity() {
    return (
      <PageWrap>
        <ForgeControlPanel onForgeUpdate={handleForgeUpdate} />
        <Grid2>
          <ActivityFeed cadence={cadence} />
          <WalletPanel walletState={walletState} signInState={signInState} onConnect={handleConnect} onScaffoldSignIn={handleScaffoldSignIn} />
        </Grid2>
      </PageWrap>
    );
  }

  function renderAchievements() {
    return <PageWrap><AchievementsPanel newAchievementIds={newAchievementIds} /></PageWrap>;
  }

  function renderLeaderboard() {
    return <PageWrap><LeaderboardPanel /></PageWrap>;
  }

  function renderQuests() {
    return <PageWrap><QuestsPanel newlyCompletedQuestIds={newQuestIds} /></PageWrap>;
  }

  function renderInventory() {
    return <PageWrap><InventoryPanel droppedItems={droppedItems} /></PageWrap>;
  }

  function renderProgression() {
    return <PageWrap><ProgressionPanel xpResult={xpResult} /></PageWrap>;
  }

  function renderVaultLedger() {
    return (
      <PageWrap>
        <Grid2>
          <VaultLedger vaultRecords={dashboard.vaultRecords} />
          <PermissionsPanel permissions={dashboard.permissions} />
        </Grid2>
      </PageWrap>
    );
  }

  const sections = {
    'Forge Deck':   renderForgeDeck,
    'Heat Chain':   renderHeatChain,
    'Artifacts':    renderArtifacts,
    'Season':       renderSeason,
    'Activity':     renderActivity,
    'Achievements': renderAchievements,
    'Leaderboard':  renderLeaderboard,
    'Quests':       renderQuests,
    'Inventory':    renderInventory,
    'Progression':  renderProgression,
    'Vault Ledger': renderVaultLedger,
  };

  /* ─── loading / error ─── */
  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.bg, flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 40, animation: 'ev-spin 2s linear infinite', display: 'block' }}>🔥</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.fire, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Heating EmberVault…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <p style={{ color: '#ef4444', fontSize: 15 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, overflow: 'hidden' }}>
      <Sidebar active={activeNav} onNav={setActiveNav} profile={profile} forge={forge} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar activeNav={activeNav} forge={forge} stage={stage} onConnect={handleConnect} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {(sections[activeNav] ?? renderForgeDeck)()}
        </main>
      </div>

      {/* Achievement toasts */}
      {achievementToasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 999 }}>
          {achievementToasts.map(toast => (
            <AchToast
              key={toast.id}
              toast={toast}
              onDismiss={() => setAchievementToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
